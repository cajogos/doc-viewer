import { motion } from 'framer-motion';
import { NavLink } from 'react-router';
import { useTree } from '../api/queries.js';
import type { DocumentWithTags, TreeNode } from '../api/types.js';

function flattenDocuments(nodes: TreeNode[]): DocumentWithTags[]
{
  const documents: DocumentWithTags[] = [];
  for (const node of nodes)
  {
    if (node.type === 'document')
    {
      documents.push(node.document);
    }
    else
    {
      documents.push(...flattenDocuments(node.children));
    }
  }
  return documents;
}

export function HomePage(): React.JSX.Element
{
  const tree = useTree();
  const documents = tree.data ? flattenDocuments(tree.data) : [];
  const recent = [...documents]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8);

  return (
    <div className="home-page">
      <motion.div
        className="home-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="home-glyph" aria-hidden="true">
          M<span className="drop-glyph-arrow">↓</span>
        </div>
        <h1>Your markdown, readable.</h1>
        <p>
          Drop <code>.md</code> files anywhere in this window. They are stored in the archive
          folder, organised in the tree, and rendered for reading.
        </p>
      </motion.div>

      {recent.length > 0 && (
        <section className="home-recent">
          <h2 className="sidebar-section-label">Recently updated</h2>
          <ul className="home-recent-list">
            {recent.map((document) => (
              <li key={document.id}>
                <NavLink to={`/doc/${document.id}`} className="home-recent-link">
                  <span className="home-recent-title">{document.title}</span>
                  <span className="home-recent-path">{document.relPath}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
