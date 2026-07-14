import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout.js';
import { DocumentPage } from './pages/DocumentPage.js';
import { HomePage } from './pages/HomePage.js';
import { AppearanceSection } from './pages/settings/AppearanceSection.js';
import { GeneralSection } from './pages/settings/GeneralSection.js';
import { SettingsLayout } from './pages/settings/SettingsLayout.js';
import { TagsSection } from './pages/settings/TagsSection.js';

export function App(): React.JSX.Element
{
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="doc/:id" element={<DocumentPage />} />
        <Route path="settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<GeneralSection />} />
          <Route path="appearance" element={<AppearanceSection />} />
          <Route path="tags" element={<TagsSection />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
