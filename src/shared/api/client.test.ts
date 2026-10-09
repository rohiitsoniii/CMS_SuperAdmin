import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  api,
  tenantsAPI,
  subscriptionsAPI,
  campaignsAPI,
  emailTemplatesAPI,
  apiKeysAPI,
  tokenUsageAPI,
  systemHealthAPI,
  workersAPI,
  opsAPI,
  auditLogsAPI,
  settingsAPI,
  usersAPI,
  twoFactorAPI,
  supportAPI,
} from '@/shared/api/client';

// Guards the portal↔backend contract: every client method must call the
// exact verb + path that backend/src/routes/systemRoutes.ts serves.
// If the backend moves a route, this test fails first — update both sides.
describe('api client contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'get').mockResolvedValue({ data: {} });
    vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    vi.spyOn(api, 'put').mockResolvedValue({ data: {} });
    vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });
    vi.spyOn(api, 'delete').mockResolvedValue({ data: {} });
  });

  it('tenants module hits real routes', async () => {
    await tenantsAPI.list({ page: 1 });
    expect(api.get).toHaveBeenCalledWith('/system/tenants', { params: { page: 1 } });
    await tenantsAPI.summary();
    expect(api.get).toHaveBeenCalledWith('/system/tenants/summary');
    await tenantsAPI.get('abc');
    expect(api.get).toHaveBeenCalledWith('/system/tenants/abc');
    await tenantsAPI.suspend('abc', 'abuse');
    expect(api.patch).toHaveBeenCalledWith('/system/tenants/abc/suspend', { reason: 'abuse' });
    await tenantsAPI.activate('abc');
    expect(api.patch).toHaveBeenCalledWith('/system/tenants/abc/activate');
    await tenantsAPI.updatePlan('abc', { plan: 'pro' });
    expect(api.patch).toHaveBeenCalledWith('/system/tenants/abc/plan', { plan: 'pro' });
    await tenantsAPI.resetQuota('abc');
    expect(api.post).toHaveBeenCalledWith('/system/tenants/abc/reset-quota');
    await tenantsAPI.impersonate('abc');
    expect(api.post).toHaveBeenCalledWith('/system/tenants/abc/impersonate');
    await tenantsAPI.delete('abc');
    expect(api.delete).toHaveBeenCalledWith('/system/tenants/abc');
  });

  it('billing module hits real routes', async () => {
    await subscriptionsAPI.plans.list();
    expect(api.get).toHaveBeenCalledWith('/system/plans', { params: undefined });
    await subscriptionsAPI.plans.get('p1');
    expect(api.get).toHaveBeenCalledWith('/system/plans/p1');
    await subscriptionsAPI.plans.create({ name: 'x' });
    expect(api.post).toHaveBeenCalledWith('/system/plans', { name: 'x' });
    await subscriptionsAPI.plans.update('p1', { name: 'y' });
    expect(api.put).toHaveBeenCalledWith('/system/plans/p1', { name: 'y' });
    await subscriptionsAPI.plans.delete('p1');
    expect(api.delete).toHaveBeenCalledWith('/system/plans/p1');
    await subscriptionsAPI.coupons.list();
    expect(api.get).toHaveBeenCalledWith('/system/coupons');
    await subscriptionsAPI.subscriptions.list({ status: 'active' });
    expect(api.get).toHaveBeenCalledWith('/system/subscriptions', { params: { status: 'active' } });
    await subscriptionsAPI.revenue.get();
    expect(api.get).toHaveBeenCalledWith('/system/revenue', { params: undefined });
    await subscriptionsAPI.revenue.getChurn();
    expect(api.get).toHaveBeenCalledWith('/system/churn', { params: undefined });
    await subscriptionsAPI.revenue.getTrialsFunnel();
    expect(api.get).toHaveBeenCalledWith('/system/trials/funnel', { params: undefined });
    await subscriptionsAPI.invoices.refund('i1', 10);
    expect(api.post).toHaveBeenCalledWith('/system/invoices/i1/refund', { amount: 10 });
    await subscriptionsAPI.invoices.void('i1');
    expect(api.post).toHaveBeenCalledWith('/system/invoices/i1/void');
  });

  it('campaigns + templates hit real routes', async () => {
    await campaignsAPI.overview();
    expect(api.get).toHaveBeenCalledWith('/system/email/overview', { params: undefined });
    await campaignsAPI.list({ status: 'sending' });
    expect(api.get).toHaveBeenCalledWith('/system/email/campaigns', { params: { status: 'sending' } });
    await campaignsAPI.get('c1');
    expect(api.get).toHaveBeenCalledWith('/system/email/campaigns/c1');
    await campaignsAPI.create({ projectId: 'p', name: 'n' });
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns', expect.objectContaining({ projectId: 'p' }));
    await campaignsAPI.pause('c1');
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns/c1/pause');
    await campaignsAPI.resume('c1');
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns/c1/resume');
    await campaignsAPI.cancel('c1');
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns/c1/cancel');
    await campaignsAPI.send('c1');
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns/c1/send');
    await campaignsAPI.schedule('c1', 'tomorrow');
    expect(api.post).toHaveBeenCalledWith('/system/email/campaigns/c1/schedule', { scheduledFor: 'tomorrow' });
    await campaignsAPI.tickWorker();
    expect(api.post).toHaveBeenCalledWith('/system/email/worker/tick');
    await campaignsAPI.suppressions.list();
    expect(api.get).toHaveBeenCalledWith('/system/email/suppressions', { params: undefined });
    await campaignsAPI.suppressions.suppress('a@b.com');
    expect(api.post).toHaveBeenCalledWith('/system/email/suppressions', { email: 'a@b.com', reason: undefined });
    await campaignsAPI.suppressions.unsuppress('a@b.com');
    expect(api.delete).toHaveBeenCalledWith('/system/email/suppressions/a%40b.com');
    await campaignsAPI.updateSmtpLimits('p1', { dailyLimit: 5 });
    expect(api.patch).toHaveBeenCalledWith('/system/email/throttle/p1', { dailyLimit: 5 });

    await emailTemplatesAPI.list({ search: 'wel' });
    expect(api.get).toHaveBeenCalledWith('/system/email/templates', { params: { search: 'wel' } });
    await emailTemplatesAPI.preview('t1', { name: 'x' });
    expect(api.post).toHaveBeenCalledWith('/system/email/templates/t1/preview', { variables: { name: 'x' } });
    await emailTemplatesAPI.testSend('t1', 'a@b.com');
    expect(api.post).toHaveBeenCalledWith('/system/email/templates/t1/test', { to: 'a@b.com' });
  });

  it('keys + AI usage hit real routes', async () => {
    await apiKeysAPI.list({ service: 'openai' });
    expect(api.get).toHaveBeenCalledWith('/system/api-keys', { params: { service: 'openai' } });
    await apiKeysAPI.create({ name: 'n', service: 'openai', keyValue: 'sk-12345678' });
    expect(api.post).toHaveBeenCalledWith('/system/api-keys', expect.objectContaining({ service: 'openai' }));
    await apiKeysAPI.reveal('k1');
    expect(api.post).toHaveBeenCalledWith('/system/api-keys/k1/reveal');
    await apiKeysAPI.rotate('k1', 'sk-new-value-1');
    expect(api.post).toHaveBeenCalledWith('/system/api-keys/k1/rotate', { keyValue: 'sk-new-value-1' });
    await apiKeysAPI.delete('k1');
    expect(api.delete).toHaveBeenCalledWith('/system/api-keys/k1');
    await apiKeysAPI.getUsage('k1');
    expect(api.get).toHaveBeenCalledWith('/system/api-keys/k1/usage');
    await apiKeysAPI.expiring(7);
    expect(api.get).toHaveBeenCalledWith('/system/api-keys/expiring', { params: { days: 7 } });

    await tokenUsageAPI.getUsage({ tenantId: 't1' });
    expect(api.get).toHaveBeenCalledWith('/system/ai/usage', { params: { tenantId: 't1' } });
    await tokenUsageAPI.getTopConsumers({ month: '2026-01' });
    expect(api.get).toHaveBeenCalledWith('/system/ai/top-consumers', { params: { month: '2026-01' } });
    await tokenUsageAPI.getProjection(3);
    expect(api.get).toHaveBeenCalledWith('/system/ai/usage/projection', { params: { months: 3 } });
    await tokenUsageAPI.listAlerts();
    expect(api.get).toHaveBeenCalledWith('/system/ai/alerts');
    await tokenUsageAPI.createAlert({ metric: 'aiTokens', threshold: 1, period: 'daily' });
    expect(api.post).toHaveBeenCalledWith('/system/ai/alerts', expect.objectContaining({ metric: 'aiTokens' }));
    await tokenUsageAPI.deleteAlert('a1');
    expect(api.delete).toHaveBeenCalledWith('/system/ai/alerts/a1');
    await tokenUsageAPI.evaluateAlerts();
    expect(api.post).toHaveBeenCalledWith('/system/ai/alerts/evaluate');
  });

  it('health + workers + ops hit real routes', async () => {
    await systemHealthAPI.getHealthDetail();
    expect(api.get).toHaveBeenCalledWith('/system/health/detail');
    await systemHealthAPI.getPerformance({ limit: 5 });
    expect(api.get).toHaveBeenCalledWith('/system/performance', { params: { limit: 5 } });
    await systemHealthAPI.getErrors({ severity: 'high' });
    expect(api.get).toHaveBeenCalledWith('/system/errors', { params: { severity: 'high' } });
    await systemHealthAPI.fixError('e1');
    expect(api.patch).toHaveBeenCalledWith('/system/errors/e1/fix');
    await systemHealthAPI.listIncidents();
    expect(api.get).toHaveBeenCalledWith('/system/incidents', { params: undefined });
    await systemHealthAPI.createIncident({ title: 't' });
    expect(api.post).toHaveBeenCalledWith('/system/incidents', { title: 't' });
    await systemHealthAPI.updateIncident('i1', { status: 'resolved' });
    expect(api.patch).toHaveBeenCalledWith('/system/incidents/i1', { status: 'resolved' });

    await workersAPI.getQueues();
    expect(api.get).toHaveBeenCalledWith('/system/queues');
    await workersAPI.tickWorker('email-campaigns');
    expect(api.post).toHaveBeenCalledWith('/system/workers/email-campaigns/tick');
    await workersAPI.replayDeadWebhooks({ limit: 5 });
    expect(api.post).toHaveBeenCalledWith('/system/webhooks/replay-dead', { limit: 5 });
    await workersAPI.getTranslationJob('j1');
    expect(api.get).toHaveBeenCalledWith('/system/translation/jobs/j1');
    await workersAPI.retryTranslationJob('j1');
    expect(api.post).toHaveBeenCalledWith('/system/translation/jobs/j1/retry');
    await workersAPI.cancelTranslationJob('j1');
    expect(api.delete).toHaveBeenCalledWith('/system/translation/jobs/j1');

    await opsAPI.purgeCache({ projectSlug: 'p' });
    expect(api.delete).toHaveBeenCalledWith('/system/cache', { params: { projectSlug: 'p' } });
    await opsAPI.cacheStats();
    expect(api.get).toHaveBeenCalledWith('/system/cache/stats');
    await opsAPI.listBackups({ type: 'full' });
    expect(api.get).toHaveBeenCalledWith('/system/backups', { params: { type: 'full' } });
    await opsAPI.verifyBackup('f.json');
    expect(api.post).toHaveBeenCalledWith('/system/backups/verify', { filename: 'f.json' });
    await opsAPI.restoreBackupFor('f.json', 't1');
    expect(api.post).toHaveBeenCalledWith('/system/backups/f.json/restore-for/t1');
    await opsAPI.cleanupBackups({ daysToKeep: 7 });
    expect(api.post).toHaveBeenCalledWith('/system/backups/cleanup', { daysToKeep: 7 });
    await opsAPI.getStorage(5);
    expect(api.get).toHaveBeenCalledWith('/system/storage', { params: { limit: 5 } });
  });

  it('audit + settings + users + 2fa hit real routes', async () => {
    await auditLogsAPI.list({ action: 'x' });
    expect(api.get).toHaveBeenCalledWith('/system/audit-logs', { params: { action: 'x' } });
    await auditLogsAPI.export({ tenantId: 't1' });
    expect(api.get).toHaveBeenCalledWith('/system/audit-logs/export', expect.objectContaining({ responseType: 'blob' }));
    await auditLogsAPI.getStats({ from: 'a' });
    expect(api.get).toHaveBeenCalledWith('/system/audit-logs/stats', { params: { from: 'a' } });

    await settingsAPI.list();
    expect(api.get).toHaveBeenCalledWith('/system/settings');
    await settingsAPI.set('ai.model', 'x');
    expect(api.put).toHaveBeenCalledWith('/system/settings/ai.model', { value: 'x' });
    await settingsAPI.remove('ai.model');
    expect(api.delete).toHaveBeenCalledWith('/system/settings/ai.model');
    await settingsAPI.listFlags();
    expect(api.get).toHaveBeenCalledWith('/system/feature-flags');
    await settingsAPI.createFlag({ key: 'k' });
    expect(api.post).toHaveBeenCalledWith('/system/feature-flags', { key: 'k' });
    await settingsAPI.updateFlag('k', { enabled: true });
    expect(api.patch).toHaveBeenCalledWith('/system/feature-flags/k', { enabled: true });
    await settingsAPI.deleteFlag('k');
    expect(api.delete).toHaveBeenCalledWith('/system/feature-flags/k');

    await usersAPI.list({ search: 'x' });
    expect(api.get).toHaveBeenCalledWith('/system/users', { params: { search: 'x' } });    await usersAPI.invite({ email: 'e', tenantId: 't', firstName: 'f', password: 'Password123' });
    expect(api.post).toHaveBeenCalledWith('/system/users', expect.objectContaining({ email: 'e' }));
    await usersAPI.update('u1', { role: 'viewer' });
    expect(api.put).toHaveBeenCalledWith('/system/users/u1', { role: 'viewer' });
    await usersAPI.delete('u1');
    expect(api.delete).toHaveBeenCalledWith('/system/users/u1');
    await usersAPI.resetPassword('u1');
    expect(api.post).toHaveBeenCalledWith('/system/users/u1/reset-password');
    await usersAPI.revokeSessions('u1');
    expect(api.post).toHaveBeenCalledWith('/system/users/u1/revoke-sessions');

    await twoFactorAPI.setup();
    expect(api.post).toHaveBeenCalledWith('/two-factor/setup');
    await twoFactorAPI.enable('123456');
    expect(api.post).toHaveBeenCalledWith('/two-factor/enable', { token: '123456' });
    await twoFactorAPI.verify('123456', 'temp');
    expect(api.post).toHaveBeenCalledWith('/two-factor/verify', { token: '123456' }, expect.objectContaining({}));
    await twoFactorAPI.status();
    expect(api.get).toHaveBeenCalledWith('/two-factor/status');
  });

  it('support + ops hit real routes', async () => {
    await supportAPI.listTickets({ status: 'open' });
    expect(api.get).toHaveBeenCalledWith('/system/support/tickets', { params: { status: 'open' } });
    await supportAPI.updateTicket('t1', { priority: 'urgent' });
    expect(api.patch).toHaveBeenCalledWith('/system/support/tickets/t1', { priority: 'urgent' });
    await supportAPI.replyTicket('t1', 'hello');
    expect(api.post).toHaveBeenCalledWith('/system/support/tickets/t1/reply', { message: 'hello' });
    await supportAPI.getSla();
    expect(api.get).toHaveBeenCalledWith('/system/support/sla', { params: undefined });
    await opsAPI.purgeCache({ tenantId: 'x' });
    expect(api.delete).toHaveBeenCalledWith('/system/cache', { params: { tenantId: 'x' } });
    await opsAPI.verifyBackup('f.json');
    expect(api.post).toHaveBeenCalledWith('/system/backups/verify', { filename: 'f.json' });
  });
});
