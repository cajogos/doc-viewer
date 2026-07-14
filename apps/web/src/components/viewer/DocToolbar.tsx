import { useNavigate } from 'react-router';
import { useDeleteDocument } from '../../api/queries.js';
import type { DocumentWithTags } from '../../api/types.js';
import { TagChip } from '../tags/TagChip.js';
import { TagPicker } from '../tags/TagPicker.js';
import { ExportButtons } from './ExportButtons.js';

export function DocToolbar({ document }: { document: DocumentWithTags }): React.JSX.Element
{
  const deleteDocument = useDeleteDocument();
  const navigate = useNavigate();

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
