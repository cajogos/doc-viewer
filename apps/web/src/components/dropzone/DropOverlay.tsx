import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth, useUploadDocuments } from '../../api/queries.js';

interface UploadCard
{
  name: string;
  status: 'uploading' | 'done' | 'rejected' | 'failed';
}

function hasFiles(event: DragEvent): boolean
{
  return [...(event.dataTransfer?.types ?? [])].includes('Files');
}

/**
 * Full-window drop target. A drag anywhere over the app raises the overlay;
 * dropping .md files uploads them and shows per-file result cards.
 */
export function DropOverlay(): React.JSX.Element
{
  const [dragging, setDragging] = useState(false);
  const [cards, setCards] = useState<UploadCard[]>([]);
  const depth = useRef(0);
  const upload = useUploadDocuments();
  const auth = useAuth();
  const canEdit = auth.data?.authenticated === true;

  useEffect(() =>
  {
    if (!canEdit)
    {
      return;
    }
    const onDragEnter = (event: DragEvent): void =>
    {
      if (!hasFiles(event))
      {
        return;
      }
      depth.current += 1;
      setDragging(true);
    };
    const onDragLeave = (): void =>
    {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0)
      {
        setDragging(false);
      }
    };
    const onDragOver = (event: DragEvent): void =>
    {
      if (hasFiles(event))
      {
        event.preventDefault();
      }
    };
    const onDrop = (event: DragEvent): void =>
    {
      if (!hasFiles(event))
      {
        return;
      }
      event.preventDefault();
      depth.current = 0;
      setDragging(false);

      const files = [...(event.dataTransfer?.files ?? [])];
      const markdown = files.filter((file) => file.name.toLowerCase().endsWith('.md'));
      const rejected = files.filter((file) => !file.name.toLowerCase().endsWith('.md'));

      setCards([
        ...markdown.map<UploadCard>((file) => ({ name: file.name, status: 'uploading' })),
        ...rejected.map<UploadCard>((file) => ({ name: file.name, status: 'rejected' }))
      ]);

      if (markdown.length > 0)
      {
        upload.mutate(
          { files: markdown },
          {
            onSuccess: () =>
            {
              setCards((current) =>
                current.map((card) =>
                  card.status === 'uploading' ? { ...card, status: 'done' } : card
                )
              );
            },
            onError: () =>
            {
              setCards((current) =>
                current.map((card) =>
                  card.status === 'uploading' ? { ...card, status: 'failed' } : card
                )
              );
            }
          }
        );
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () =>
    {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [upload, canEdit]);

  // Result cards dismiss themselves shortly after every upload settles.
  useEffect(() =>
  {
    if (cards.length > 0 && cards.every((card) => card.status !== 'uploading'))
    {
      const timer = window.setTimeout(() => setCards([]), 2200);
      return () => window.clearTimeout(timer);
    }
  }, [cards]);

  return (
    <>
      <AnimatePresence>
        {dragging && (
          <motion.div
            className="drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="drop-frame"
              initial={{ scale: 0.96 }}
              animate={{ scale: [0.98, 1, 0.98] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="drop-glyph" aria-hidden="true">
                M<span className="drop-glyph-arrow">↓</span>
              </div>
              <div className="drop-title">Drop markdown files</div>
              <div className="drop-hint">.md files land in your archive</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="upload-cards" role="status">
        <AnimatePresence>
          {cards.map((card, index) => (
            <motion.div
              key={`${card.name}-${index}`}
              className="upload-card"
              data-status={card.status}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ delay: index * 0.05, duration: 0.18 }}
            >
              <span className="upload-card-status" aria-hidden="true">
                {card.status === 'uploading' && <span className="upload-spinner" />}
                {card.status === 'done' && '✓'}
                {card.status === 'rejected' && '✕'}
                {card.status === 'failed' && '!'}
              </span>
              <span className="upload-card-name">{card.name}</span>
              <span className="upload-card-note">
                {card.status === 'uploading' && 'Uploading'}
                {card.status === 'done' && 'Added to archive'}
                {card.status === 'rejected' && 'Only .md files are supported'}
                {card.status === 'failed' && 'Upload failed'}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
