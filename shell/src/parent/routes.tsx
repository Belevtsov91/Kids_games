import { Route } from 'react-router';
import { ParentShell } from './ParentShell';
import { OverviewPage } from './pages/OverviewPage';
import { KidsPage } from './pages/KidsPage';
import { ChildNewPage } from './pages/ChildNewPage';
import { ChildHubPage } from './pages/ChildHubPage';
import { ChildProfilePage } from './pages/ChildProfilePage';
import { ChildTimePage } from './pages/ChildTimePage';
import { ChildGamesPage } from './pages/ChildGamesPage';
import { ChildStatsPage } from './pages/ChildStatsPage';
import { AccountPage } from './pages/AccountPage';
import { PasswordPage } from './pages/PasswordPage';
import { PinPage } from './pages/PinPage';
import { DataPage } from './pages/DataPage';
import { ChildSkillsPage } from './pages/ChildSkillsPage';
import { ChildComfortPage } from './pages/ChildComfortPage';
import { ChildGalleryPage } from './pages/ChildGalleryPage';
import { InboxPage } from './pages/InboxPage';
import { FamilyPage } from './pages/FamilyPage';

/** Маршруты /parent/*: каждая настройка и аналитика — отдельная страница. */
export const parentRoutes = (
  <>
    <Route index element={<OverviewPage />} />
    <Route path="kids" element={<KidsPage />} />
    <Route path="kids/new" element={<ChildNewPage />} />
    <Route path="kids/:id" element={<ChildHubPage />} />
    <Route path="kids/:id/profile" element={<ChildProfilePage />} />
    <Route path="kids/:id/time" element={<ChildTimePage />} />
    <Route path="kids/:id/games" element={<ChildGamesPage />} />
    <Route path="kids/:id/stats" element={<ChildStatsPage />} />
    <Route path="kids/:id/skills" element={<ChildSkillsPage />} />
    <Route path="kids/:id/comfort" element={<ChildComfortPage />} />
    <Route path="kids/:id/gallery" element={<ChildGalleryPage />} />
    <Route path="inbox" element={<InboxPage />} />
    <Route path="family" element={<FamilyPage />} />
    <Route path="account" element={<AccountPage />} />
    <Route path="account/password" element={<PasswordPage />} />
    <Route path="account/pin" element={<PinPage />} />
    <Route path="account/data" element={<DataPage />} />
  </>
);

export { ParentShell };
