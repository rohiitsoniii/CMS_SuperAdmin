# CMS Super Admin (`cmssuperadmin`)

Platform control plane for the Headless CMS — multi-tenant SaaS administration:
tenants, subscriptions & billing, marketing email campaigns, system email
templates, platform API keys (ChatGPT / SendGrid / AWS / Stripe), per-tenant
token-usage analytics, system health, platform audit logs, platform users and
platform settings (SMTP, storage, feature flags).

## Stack

- React 19 + TypeScript + Vite 7, React Router 6
- Material UI (MUI) v7 + MUI X DataGrid — admin-dense UI
  (see Minimal UI / minimals.cc evaluation in `docs/MINIMAL-UI-EVALUATION.md`)
- Zustand (auth/session) + TanStack Query (server state)
- React Hook Form + Zod, Recharts
- Vitest + React Testing Library, Playwright

## UI/UX rules

`.agents/` is copied from the Headless CMS repo and is the source of truth when
writing UI code. Super-admin-specific rules:
`.agents/skills/ui-ux-pro-max/references/super-admin-rules.md`

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if needed
npm run dev             # http://localhost:5175 (proxies /api → :5000)
```

The portal talks to the Headless CMS backend (`backend/` in the CMS repo).
Super-admin endpoints live under `/api/v1/system/*` (tenant, subscription,
campaign, template, key, usage, health, audit, settings, users).

## Scripts

| Script              | Purpose                              |
|---------------------|--------------------------------------|
| `npm run dev`       | Vite dev server (:5175)              |
| `npm run build`     | `tsc -b && vite build`               |
| `npm run preview`   | Serve production build               |
| `npm run typecheck` | `tsc --noEmit`                       |
| `npm run lint`      | ESLint                               |
| `npm test`          | Vitest unit tests                    |
| `npm run test:e2e`  | Playwright smoke (needs preview)     |

## Project layout

```
src/
  app/layout/        AdminLayout (sidebar/header/impersonation), AuthLayout
  features/          auth, dashboard, tenants, subscriptions, campaigns,
                     email-templates, api-keys, token-usage, system-health,
                     audit-logs, settings, users
  shared/            api client + endpoint modules, hooks, components,
                     styles/theme, utils, constants
  test/              vitest setup
tests/               Playwright specs
```

## Backend contract (to implement in CMS backend)

New `/api/v1/system/*` endpoints required (super-admin only,
`isSuperAdmin` + MFA enforced):

- `GET/POST/PUT/DELETE /system/tenants`, `/suspend`, `/activate`,
  `/impersonate`, `/:id/usage`, `/:id/audit-logs`
- `GET/POST/PUT/DELETE /system/subscriptions`, `/system/coupons`
- `GET /system/analytics/revenue`
- `GET/POST/PUT/DELETE /system/campaigns`, `/send`, `/schedule`, `/stats`
- `GET/POST/PUT/DELETE /system/email-templates`, `/preview`, `/test`
- `GET/POST/PUT/DELETE /system/api-keys`, `/rotate`, `/:id/usage`
- `GET /system/analytics/token-usage*` (+ alerts)
- `GET /system/health`, `/system/metrics`, `/system/errors`, `/system/queues/status`
- `GET /system/audit-logs`, `/system/audit-logs/export`
- `GET/PUT /system/settings`, `/system/settings/feature-flags*`
- `GET/POST/PUT/DELETE /system/users`, `/reset-mfa`, `/resend-invite`

## Minimal UI (minimals.cc) evaluation

See `docs/MINIMAL-UI-EVALUATION.md` for the full build-vs-buy analysis.
Decision: **build on MUI directly using Minimal's page patterns**
(DataGrid Pro layouts, billing/settings/audit page structures) rather than
forking the template, to keep the Vite 7 + React 19 + TS toolchain aligned
with the CMS frontend.

## CI

`.github/workflows/ci.yml` — typecheck, lint, unit tests, build,
`npm audit` (high+), Playwright smoke on preview build.
