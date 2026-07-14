import type { Tag } from '../../api/types.js';

export function TagChip({ tag, compact = false }: { tag: Tag; compact?: boolean }): React.JSX.Element
{
  return (
    <span
      className={`tag-chip${compact ? ' compact' : ''}`}
      style={{ '--tag-color': tag.color } as React.CSSProperties}
      title={tag.name}
    >
      <span className="tag-chip-dot" aria-hidden="true" />
      {!compact && tag.name}
    </span>
  );
}
