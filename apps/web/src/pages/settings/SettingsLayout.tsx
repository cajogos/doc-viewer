import { NavLink, Outlet } from 'react-router';

const SECTIONS = [
  { path: 'general', label: 'General' },
  { path: 'appearance', label: 'Appearance' },
  { path: 'tags', label: 'Tags' }
];

export function SettingsLayout(): React.JSX.Element
{
  return (
    <div className="settings-page">
      <nav className="settings-nav" aria-label="Settings sections">
        <div className="sidebar-section-label">Settings</div>
        {SECTIONS.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) => `settings-nav-link${isActive ? ' active' : ''}`}
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <div className="settings-content">
        <Outlet />
      </div>
    </div>
  );
}
