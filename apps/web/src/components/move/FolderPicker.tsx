import { AnimatePresence, motion } from 'framer-motion';
import { usePatchDocument, useTree } from '../../api/queries.js';
import type { Directory, DocumentWithTags, TreeNode } from '../../api/types.js';

interface FolderOption
{
  directory: Directory;
  depth: number;
}

function flattenDirectories(nodes: TreeNode[], depth = 0): FolderOption[]
{
  const options: FolderOption[] = [];
  for (const node of nodes)
  {
    if (node.type === 'directory')
    {
      options.push({ directory: node.directory, depth });
      options.push(...flattenDirectories(node.children, depth + 1));
    }
  }
  return options;
}

/**
 * Popover listing every folder (plus the archive top level) as a move target
 * for a document. Anchor it inside a position: relative wrapper.
 */
export function FolderPicker({
  document,
  open,
  onClose
}: {
  document: DocumentWithTags;
  open: boolean;
  onClose: () => void;
}): React.JSX.Element
{
  const tree = useTree();
  const patchDocument = usePatchDocument();
  const options = tree.data ? flattenDirectories(tree.data) : [];

  const move = (directoryId: string | null): void =>
  {
    onClose();
    if (directoryId !== document.directoryId)
    {
      patchDocument.mutate({ id: document.id, directoryId });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <span className="row-menu-backdrop" onClick={onClose} />
          <motion.span
            className="row-menu-popover folder-picker"
            role="menu"
            aria-label="Move to folder"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <span className="folder-picker-title">Move to</span>
            <button
              type="button"
              role="menuitem"
              className="row-menu-item"
              disabled={document.directoryId === null}
              onClick={() => move(null)}
            >
              <span className="folder-picker-icon" aria-hidden="true">⌂</span>
              Top level
            </button>
            {options.map(({ directory, depth }) => (
              <button
                key={directory.id}
                type="button"
                role="menuitem"
                className="row-menu-item"
                style={{ paddingLeft: 10 + depth * 14 }}
                disabled={directory.id === document.directoryId}
                onClick={() => move(directory.id)}
              >
                <span className="folder-picker-icon" aria-hidden="true">▸</span>
                {directory.name}
              </button>
            ))}
            {options.length === 0 && (
              <span className="tag-picker-empty">
                No folders yet. Create one with "+ New folder" in the sidebar.
              </span>
            )}
          </motion.span>
        </>
      )}
    </AnimatePresence>
  );
}
