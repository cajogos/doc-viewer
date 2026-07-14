import { useState } from 'react';
import { useAuth, useSync } from '../../api/queries.js';
import { api } from '../../api/client.js';
import { SignInPrompt } from './SignInPrompt.js';

export function GeneralSection(): React.JSX.Element
{
  const sync = useSync();
  const auth = useAuth();
  const [pruned, setPruned] = useState<number | null>(null);

  if (auth.data && !auth.data.authenticated)
  {
    return (
      <section>
        <h1 className="settings-title">General</h1>
        <SignInPrompt what="sync the archive and prune missing entries" />
        <div className="settings-group">
          <h2>About</h2>
          <p className="settings-note">
            doc-viewer is an open source local-first markdown reader. Files stay on your machine.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1 className="settings-title">General</h1>

      <div className="settings-group">
        <h2>Archive</h2>
        <p className="settings-note">
          Documents live as plain <code>.md</code> files in the <code>archive/</code> folder next
          to the app data. You can delete or edit that folder freely; run a sync afterwards to
          bring the library back in line.
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="toolbar-button"
            disabled={sync.isPending}
            onClick={() => sync.mutate()}
          >
            {sync.isPending ? 'Syncing…' : 'Sync archive now'}
          </button>
          {sync.data && (
            <span className="settings-result" role="status">
              Added {sync.data.added}, restored {sync.data.restored}, missing{' '}
              {sync.data.markedMissing}
            </span>
          )}
        </div>
      </div>

      <div className="settings-group">
        <h2>Missing files</h2>
        <p className="settings-note">
          Documents whose file has disappeared from the archive are kept in the tree, greyed out.
          Pruning removes those entries for good.
        </p>
        <div className="settings-actions">
          <button
            type="button"
            className="toolbar-button danger"
            onClick={async () =>
            {
              const result = await api.post<{ pruned: number }>('/api/prune', {});
              setPruned(result.pruned);
            }}
          >
            Prune missing entries
          </button>
          {pruned !== null && (
            <span className="settings-result" role="status">
              Removed {pruned} entr{pruned === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>
      </div>

      <div className="settings-group">
        <h2>About</h2>
        <p className="settings-note">
          doc-viewer is an open source local-first markdown reader. Files stay on your machine.
        </p>
      </div>
    </section>
  );
}
