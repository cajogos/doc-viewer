import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useLogin } from '../../api/queries.js';

export function LoginDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element
{
  const login = useLogin();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');

  const submit = (event: React.FormEvent): void =>
  {
    event.preventDefault();
    login.mutate(
      { username, password },
      {
        onSuccess: () =>
        {
          setPassword('');
          onClose();
        }
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="dialog"
            role="dialog"
            aria-label="Sign in"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="dialog-title">Sign in</h2>
            <p className="settings-note">
              Editing is limited to the admin user. Reading works without signing in.
            </p>
            <form className="dialog-form" onSubmit={submit}>
              <label className="dialog-field">
                Username
                <input
                  className="text-input"
                  value={username}
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="dialog-field">
                Password
                <input
                  className="text-input"
                  type="password"
                  value={password}
                  autoFocus
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {login.isError && (
                <p className="settings-error" role="alert">
                  {login.error.message}
                </p>
              )}
              <div className="dialog-actions">
                <button type="button" className="toolbar-button" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="toolbar-button primary"
                  disabled={login.isPending || password === ''}
                >
                  {login.isPending ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
