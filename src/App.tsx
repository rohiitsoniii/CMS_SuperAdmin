import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './app/layout/AdminLayout';
import { AuthLayout } from './app/layout/AuthLayout';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { TenantsPage } from './features/tenants/pages/TenantsPage';
import { TenantDetailPage } from './features/tenants/pages/TenantDetailPage';
import { SubscriptionsPage } from './features/subscriptions/pages/SubscriptionsPage';
import { CampaignsPage } from './features/campaigns/pages/CampaignsPage';
import { CampaignDetailPage } from './features/campaigns/pages/CampaignDetailPage';
import { EmailTemplatesPage } from './features/email-templates/pages/EmailTemplatesPage';
import { ApiKeysPage } from './features/api-keys/pages/ApiKeysPage';
import { TokenUsagePage } from './features/token-usage/pages/TokenUsagePage';
import { SystemHealthPage } from './features/system-health/pages/SystemHealthPage';
import { AuditLogsPage } from './features/audit-logs/pages/AuditLogsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected admin routes */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Tenants */}
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />

        {/* Subscriptions */}
        <Route path="/subscriptions" element={<SubscriptionsPage />} />

        {/* Campaigns */}
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

        {/* Email Templates */}
        <Route path="/email-templates" element={<EmailTemplatesPage />} />

        {/* API Keys */}
        <Route path="/api-keys" element={<ApiKeysPage />} />

        {/* Token Usage */}
        <Route path="/token-usage" element={<TokenUsagePage />} />

        {/* System Health */}
        <Route path="/system-health" element={<SystemHealthPage />} />

        {/* Audit Logs */}
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Users */}
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}