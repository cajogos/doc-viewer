import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { usePatchDocument, useTags } from '../../api/queries.js';
import type { DocumentWithTags } from '../../api/types.js';

export function TagPicker({ document }: { document: DocumentWithTags }): React.JSX.Element
{
  const [open, setOpen] = useState(false);
  const tags = useTags();
  const patchDocument = usePatchDocument();
  const selected = new Set(document.tags.map((tag) => tag.id));

  const toggle = (tagId: string): void =>
  {
    const next = new Set(selected);
    if (next.has(tagId))
    {
      next.delete(tagId);
    }
    else
    {
      next.add(tagId);
    }
    patchDocument.mutate({ id: document.id, tagIds: [...next] });
  };

  return (
    <span className="tag-picker">
      <button
        type="button"
        className="toolbar-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        + Tag
      </button>
      <AnimatePresence>
        {open && (
          <>
            <span className="row-menu-backdrop" onClick={() => setOpen(false)} />
            <motion.span
              className="tag-picker-popover"
              role="menu"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {tags.data?.length === 0 && (
                <span className="tag-picker-empty">
                  No tags yet. Create them in <NavLink to="/settings/tags">Settings → Tags</NavLink>.
                </span>
              )}
              {tags.data?.map((tag) => (
                <label key={tag.id} className="tag-picker-item">
                  <input
                    type="checkbox"
                    checked={selected.has(tag.id)}
                    onChange={() => toggle(tag.id)}
                  />
                  <span className="tag-chip-dot" style={{ '--tag-color': tag.color } as React.CSSProperties} />
                  {tag.name}
                </label>
              ))}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
