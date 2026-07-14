import { useTheme } from '../../theme/ThemeProvider.js';

/**
 * Download links for the export endpoint. Exports use the theme currently
 * active in the app so what you see is what you save.
 */
export function ExportButtons({ documentId }: { documentId: string }): React.JSX.Element
{
  const { resolved } = useTheme();

  const href = (format: 'html' | 'pdf'): string =>
    `/api/documents/${documentId}/export?format=${format}&theme=${resolved}`;

  return (
    <span className="export-buttons">
      <a className="toolbar-button" href={href('html')} download>
        HTML
      </a>
      <a className="toolbar-button" href={href('pdf')} download>
        PDF
      </a>
    </span>
  );
}
