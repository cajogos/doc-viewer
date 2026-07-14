import { motion } from 'framer-motion';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth, useLogout } from '../../api/queries.js';
import { LoginDialog } from '../auth/LoginDialog.js';
import { DocTree } from '../tree/DocTree.js';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 52;

export function Sidebar(): React.JSX.Element
{
  const [collapsed, setCollapsed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const auth = useAuth();
  const logout = useLogout();
  const authenticated = auth.data?.authenticated === true;

  return (
    <motion.aside
      className="sidebar"
      data-collapsed={collapsed}
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo" title="doc-viewer home">
          <span className="sidebar-logo-mark">md</span>
          {!collapsed && <span className="sidebar-logo-name">doc-viewer</span>}
        </NavLink>
        <button
          type="button"
          className="icon-button sidebar-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-body">
          <div className="sidebar-section-label">Archive</div>
          <DocTree />
        </div>
      )}

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
          title="Settings"
        >
          <span aria-hidden="true">⚙</span>
          {!collapsed && <span>Settings</span>}
        </NavLink>
        {authenticated ? (
          <button
            type="button"
            className="sidebar-nav-link sidebar-auth-button"
            title="Sign out"
            onClick={() => logout.mutate()}
          >
            <span aria-hidden="true">⏻</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-nav-link sidebar-auth-button"
            title="Sign in to edit"
            onClick={() => setSigningIn(true)}
          >
            <span aria-hidden="true">🔑</span>
            {!collapsed && <span>Sign in</span>}
          </button>
        )}
      </div>
      <LoginDialog open={signingIn} onClose={() => setSigningIn(false)} />
    </motion.aside>
  );
}
