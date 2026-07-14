import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDeleteDocument } from '../../api/queries.js';
import type { DocumentWithTags } from '../../api/types.js';
import { FolderPicker } from '../move/FolderPicker.js';
import { TagChip } from '../tags/TagChip.js';
import { TagPicker } from '../tags/TagPicker.js';
import { ExportButtons } from './ExportButtons.js';

export function DocToolbar({ document }: { document: DocumentWithTags }): React.JSX.Element
{
  const deleteDocument = useDeleteDocument();
  const navigate = useNavigate();
  const [moving, setMoving] = useState(false);

  return (
    <header className="doc-toolbar">
      <div className="doc-toolbar-info">
        <span className="doc-toolbar-filename">{document.relPath}</span>
        <span className="doc-toolbar-tags">
          {document.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
          <TagPicker document={document} />
        </span>
      </div>
      <div className="doc-toolbar-actions">
        <span className="row-menu">
          <button
            type="button"
            className="toolbar-button"
            aria-haspopup="menu"
            aria-expanded={moving}
            onClick={() => setMoving((value) => !value)}
          >
            Move
          </button>
          <FolderPicker document={document} open={moving} onClose={() => setMoving(false)} />
        </span>
        <ExportButtons documentId={document.id} />
        <button
          type="button"
          className="toolbar-button danger"
          onClick={() =>
          {
            if (window.confirm(`Delete "${document.filename}"?`))
            {
              deleteDocument.mutate(document.id, {
                onSuccess: () => void navigate('/')
              });
            }
          }}
        >
          Delete
        </button>
      </div>
    </header>
  );
}
