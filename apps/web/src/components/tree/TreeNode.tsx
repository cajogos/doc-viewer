import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import {
  useCreateDirectory,
  useDeleteDirectory,
  useDeleteDocument,
  usePatchDirectory,
  usePatchDocument
} from '../../api/queries.js';
import type { TreeNode } from '../../api/types.js';
import { FolderPicker } from '../move/FolderPicker.js';
import { TagChip } from '../tags/TagChip.js';

interface TreeNodeRowProps
{
  node: TreeNode;
  depth: number;
}

export function TreeNodeRow({ node, depth }: TreeNodeRowProps): React.JSX.Element
{
  return node.type === 'directory' ? (
    <DirectoryRow node={node} depth={depth} />
  ) : (
    <DocumentRow node={node} depth={depth} />
  );
}

function DirectoryRow({
  node,
  depth
}: {
  node: Extract<TreeNode, { type: 'directory' }>;
  depth: number;
}): React.JSX.Element
{
  const [open, setOpen] = useState(depth === 0);
  const [renaming, setRenaming] = useState(false);
  const [creatingChild, setCreatingChild] = useState(false);
  const patchDirectory = usePatchDirectory();
  const deleteDirectory = useDeleteDirectory();
  const createDirectory = useCreateDirectory();

  const { directory, children } = node;

  return (
    <li role="treeitem" aria-expanded={open}>
      <div className="tree-row" style={{ paddingLeft: depth * 14 }}>
        <button
          type="button"
          className="tree-row-main"
          onClick={() => setOpen((value) => !value)}
        >
          <motion.span
            className="tree-chevron"
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            aria-hidden="true"
          >
            ▸
          </motion.span>
          {renaming ? (
            <InlineInput
              initial={directory.name}
              onSubmit={(name) =>
              {
                if (name !== '' && name !== directory.name)
                {
                  patchDirectory.mutate({ id: directory.id, name });
                }
                setRenaming(false);
              }}
            />
          ) : (
            <span className="tree-label">{directory.name}</span>
          )}
        </button>
        <RowMenu
          items={[
            { label: 'New folder inside', onSelect: () => setCreatingChild(true) },
            { label: 'Rename', onSelect: () => setRenaming(true) },
            {
              label: 'Delete',
              danger: true,
              onSelect: () =>
              {
                if (window.confirm(`Delete "${directory.name}" and everything inside it?`))
                {
                  deleteDirectory.mutate(directory.id);
                }
              }
            }
          ]}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            className="tree-list"
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            {creatingChild && (
              <li style={{ paddingLeft: (depth + 1) * 14 }}>
                <InlineInput
                  initial=""
                  placeholder="Folder name"
                  onSubmit={(name) =>
                  {
                    if (name !== '')
                    {
                      createDirectory.mutate({ name, parentId: directory.id });
                    }
                    setCreatingChild(false);
                  }}
                />
              </li>
            )}
            {children.map((child) => (
              <TreeNodeRow
                key={child.type === 'directory' ? child.directory.id : child.document.id}
                node={child}
                depth={depth + 1}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function DocumentRow({
  node,
  depth
}: {
  node: Extract<TreeNode, { type: 'document' }>;
  depth: number;
}): React.JSX.Element
{
  const { document } = node;
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const patchDocument = usePatchDocument();
  const deleteDocument = useDeleteDocument();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();

  return (
    <li role="treeitem" data-missing={document.missing}>
      <div className="tree-row" style={{ paddingLeft: depth * 14 }}>
        {renaming ? (
          <span className="tree-row-main">
            <span className="tree-file-icon" aria-hidden="true">▪</span>
            <InlineInput
              initial={document.filename}
              onSubmit={(filename) =>
              {
                if (filename !== '' && filename !== document.filename)
                {
                  patchDocument.mutate({ id: document.id, filename });
                }
                setRenaming(false);
              }}
            />
          </span>
        ) : (
          <NavLink
            to={`/doc/${document.id}`}
            className={({ isActive }) => `tree-row-main tree-doc-link${isActive ? ' active' : ''}`}
            title={document.missing ? `${document.title} (file missing)` : document.title}
          >
            <span className="tree-file-icon" aria-hidden="true">▪</span>
            <span className="tree-label">{document.title}</span>
            {document.tags.slice(0, 2).map((tag) => (
              <TagChip key={tag.id} tag={tag} compact />
            ))}
          </NavLink>
        )}
        <RowMenu
          items={[
            { label: 'Rename file', onSelect: () => setRenaming(true) },
            { label: 'Move to folder', onSelect: () => setMoving(true) },
            {
              label: 'Delete',
              danger: true,
              onSelect: () =>
              {
                if (window.confirm(`Delete "${document.filename}"?`))
                {
                  deleteDocument.mutate(document.id, {
                    onSuccess: () =>
                    {
                      if (params.id === document.id)
                      {
                        void navigate('/');
                      }
                    }
                  });
                }
              }
            }
          ]}
        />
        <span className="row-menu">
          <FolderPicker document={document} open={moving} onClose={() => setMoving(false)} />
        </span>
      </div>
    </li>
  );
}

function InlineInput({
  initial,
  placeholder,
  onSubmit
}: {
  initial: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
}): React.JSX.Element
{
  const [value, setValue] = useState(initial);
  return (
    <input
      className="tree-inline-input"
      autoFocus
      placeholder={placeholder}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onBlur={() => onSubmit(value.trim())}
      onKeyDown={(event) =>
      {
        if (event.key === 'Enter')
        {
          onSubmit(value.trim());
        }
        if (event.key === 'Escape')
        {
          onSubmit('');
        }
      }}
    />
  );
}

interface MenuItem
{
  label: string;
  danger?: boolean;
  onSelect: () => void;
}

function RowMenu({ items }: { items: MenuItem[] }): React.JSX.Element
{
  const [open, setOpen] = useState(false);

  return (
    <span className="row-menu">
      <button
        type="button"
        className="icon-button row-menu-trigger"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      <AnimatePresence>
        {open && (
          <>
            <span className="row-menu-backdrop" onClick={() => setOpen(false)} />
            <motion.span
              className="row-menu-popover"
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`row-menu-item${item.danger ? ' danger' : ''}`}
                  onClick={() =>
                  {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
