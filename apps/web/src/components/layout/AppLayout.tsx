import { Outlet } from 'react-router';
import { DropOverlay } from '../dropzone/DropOverlay.js';
import { Sidebar } from './Sidebar.js';

export function AppLayout(): React.JSX.Element
{
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <DropOverlay />
    </div>
  );
}
