import { motion } from 'framer-motion';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { DocTree } from '../tree/DocTree.js';

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 52;

export function Sidebar(): React.JSX.Element
{
  const [collapsed, setCollapsed] = useState(false);

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
      </div>
    </motion.aside>
  );
}
