import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { OrganizationDetailPage } from '@/pages/OrganizationDetailPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { ChannelPage } from '@/pages/ChannelPage';
import { KanbanPage } from '@/pages/KanbanPage';
import { MeetingsPage } from '@/pages/MeetingsPage';
import { MeetingRoomPage } from '@/pages/MeetingRoomPage';
import { SearchPage } from '@/pages/SearchPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { LandingPage } from '@/pages/LandingPage';
import { OrganizationInvites } from '@/pages/organizations/OrganizationInvites';

export const AppRouter = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/auth/callback" element={<OAuthCallbackPage />} />

    {/* Protected app shell */}
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShell />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/organizations" element={<OrganizationsPage />} />
        <Route path="/app/organizations/invites" element={<OrganizationInvites />} />
        <Route path="/app/organizations/:orgId" element={<OrganizationDetailPage />} />
        <Route path="/app/teams" element={<TeamsPage />} />
        <Route path="/app/channels/:channelId" element={<ChannelPage />} />
        <Route path="/app/teams/:teamId/kanban" element={<KanbanPage />} />
        <Route path="/app/meetings" element={<MeetingsPage />} />
        <Route path="/app/meetings/:roomCode" element={<MeetingRoomPage />} />
        <Route path="/app/search" element={<SearchPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
