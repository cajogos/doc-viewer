export function MarkdownViewer({ html }: { html: string }): React.JSX.Element
{
  // The HTML is rendered and sanitised server-side by @doc-viewer/core.
  return <article className="doc-body" dangerouslySetInnerHTML={{ __html: html }} />;
}
