import { useState } from 'react';
import { useCreateDirectory, useTree } from '../../api/queries.js';
import { TreeNodeRow } from './TreeNode.js';

export function DocTree(): React.JSX.Element
{
  const tree = useTree();
  const createDirectory = useCreateDirectory();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const submitNewDirectory = (): void =>
  {
    const trimmed = name.trim();
    if (trimmed !== '')
    {
      createDirectory.mutate({ name: trimmed, parentId: null });
    }
    setCreating(false);
    setName('');
  };

  if (tree.isLoading)
  {
    return <div className="tree-status">Loading…</div>;
  }
  if (tree.isError)
  {
    return <div className="tree-status">Could not load the archive. Is the server running?</div>;
  }

  return (
    <div className="doc-tree">
      <ul className="tree-list" role="tree">
        {tree.data!.map((node) => (
          <TreeNodeRow
            key={node.type === 'directory' ? node.directory.id : node.document.id}
            node={node}
            depth={0}
          />
        ))}
      </ul>

      {tree.data!.length === 0 && !creating && (
        <div className="tree-empty">Drop .md files anywhere to add them.</div>
      )}

      {creating ? (
        <input
          className="tree-inline-input"
          autoFocus
          placeholder="Folder name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={submitNewDirectory}
          onKeyDown={(event) =>
          {
            if (event.key === 'Enter')
            {
              submitNewDirectory();
            }
            if (event.key === 'Escape')
            {
              setCreating(false);
              setName('');
            }
          }}
        />
      ) : (
        <button type="button" className="tree-add-button" onClick={() => setCreating(true)}>
          + New folder
        </button>
      )}
    </div>
  );
}
