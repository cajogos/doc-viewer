import { motion } from 'framer-motion';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useDocument } from '../api/queries.js';
import { DocToolbar } from '../components/viewer/DocToolbar.js';
import { MarkdownViewer } from '../components/viewer/MarkdownViewer.js';

export function DocumentPage(): React.JSX.Element
{
  const { id } = useParams<{ id: string }>();
  const query = useDocument(id);
  const [expanded, setExpanded] = useState(() => localStorage.getItem('dv-expanded') === 'true');

  const toggleExpanded = (): void =>
  {
    setExpanded((value) =>
    {
      localStorage.setItem('dv-expanded', String(!value));
      return !value;
    });
  };

  if (query.isLoading)
  {
    return <div className="page-status">Loading…</div>;
  }
  if (query.isError || !query.data)
  {
    return (
      <div className="page-status">
        This document could not be loaded. It may have been removed from the archive.
      </div>
    );
  }

  return (
    <div className="doc-page">
      <DocToolbar
        document={query.data.document}
        expanded={expanded}
        onToggleExpanded={toggleExpanded}
      />
      <motion.div
        key={id}
        className="doc-scroll"
        data-expanded={expanded}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <MarkdownViewer html={query.data.html} />
      </motion.div>
    </div>
  );
}
