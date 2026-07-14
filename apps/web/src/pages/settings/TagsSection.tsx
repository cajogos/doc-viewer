import { useState } from 'react';
import { useAuth, useCreateTag, useDeleteTag, useTags, useUpdateTag } from '../../api/queries.js';
import type { Tag } from '../../api/types.js';
import { SignInPrompt } from './SignInPrompt.js';

const DEFAULT_COLOR = '#0969da';

export function TagsSection(): React.JSX.Element
{
  const tags = useTags();
  const auth = useAuth();
  const createTag = useCreateTag();
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);

  if (auth.data && !auth.data.authenticated)
  {
    return (
      <section>
        <h1 className="settings-title">Tags</h1>
        <SignInPrompt what="manage tags" />
      </section>
    );
  }

  const submit = (event: React.FormEvent): void =>
  {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '')
    {
      return;
    }
    createTag.mutate(
      { name: trimmed, color },
      {
        onSuccess: () =>
        {
          setName('');
          setColor(DEFAULT_COLOR);
        }
      }
    );
  };

  return (
    <section>
      <h1 className="settings-title">Tags</h1>

      <div className="settings-group">
        <h2>Create tag</h2>
        <form className="tag-form" onSubmit={submit}>
          <input
            className="text-input"
            placeholder="Tag name"
            value={name}
            aria-label="Tag name"
            maxLength={50}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="color"
            className="color-input"
            value={color}
            aria-label="Tag colour"
            onChange={(event) => setColor(event.target.value)}
          />
          <button type="submit" className="toolbar-button" disabled={createTag.isPending}>
            Add tag
          </button>
        </form>
        {createTag.isError && (
          <p className="settings-error" role="alert">
            {createTag.error.message}
          </p>
        )}
      </div>

      <div className="settings-group">
        <h2>Your tags</h2>
        {tags.data?.length === 0 && (
          <p className="settings-note">No tags yet. Tags added here can be applied to any document.</p>
        )}
        <ul className="tag-table">
          {tags.data?.map((tag) => <TagRow key={tag.id} tag={tag} />)}
        </ul>
      </div>
    </section>
  );
}

function TagRow({ tag }: { tag: Tag }): React.JSX.Element
{
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);

  const submitRename = (): void =>
  {
    const trimmed = name.trim();
    if (trimmed !== '' && trimmed !== tag.name)
    {
      updateTag.mutate({ id: tag.id, name: trimmed });
    }
    setEditing(false);
  };

  return (
    <li className="tag-table-row">
      <input
        type="color"
        className="color-input"
        value={tag.color}
        aria-label={`Colour for ${tag.name}`}
        onChange={(event) => updateTag.mutate({ id: tag.id, color: event.target.value })}
      />
      {editing ? (
        <input
          className="text-input"
          autoFocus
          value={name}
          aria-label={`Rename ${tag.name}`}
          onChange={(event) => setName(event.target.value)}
          onBlur={submitRename}
          onKeyDown={(event) =>
          {
            if (event.key === 'Enter')
            {
              submitRename();
            }
            if (event.key === 'Escape')
            {
              setName(tag.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className="tag-table-name">{tag.name}</span>
      )}
      <span className="tag-table-actions">
        <button type="button" className="toolbar-button" onClick={() => setEditing(true)}>
          Rename
        </button>
        <button
          type="button"
          className="toolbar-button danger"
          onClick={() =>
          {
            if (window.confirm(`Delete tag "${tag.name}"? It will be removed from all documents.`))
            {
              deleteTag.mutate(tag.id);
            }
          }}
        >
          Delete
        </button>
      </span>
    </li>
  );
}
