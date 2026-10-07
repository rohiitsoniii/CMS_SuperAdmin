# Minimal UI (minimals.cc) — Evaluation for `cmssuperadmin`

Evaluated 2026-10-07. Sources: minimals.cc/components, MUI Store listing,
`minimal-ui-kit/material-kit-react` (MIT, free).

## What Minimal UI is

React admin-dashboard UI kit built on Material UI + Vite (free version) with a
paid Pro version (70+ pages). Free pages: Dashboard, Users, Products, Blog,
Sign in, 404. Pro adds: billing/subscriptions, settings, audit-style tables,
auth variants (JWT/Firebase/Auth0/Amplify/Supabase), light/dark + RTL, form
wizards, rich-text editor, upload/dropzone, charts (ApexCharts), calendar,
kanban, file manager, multi-language.

Key components we would reuse: MUI X DataGrid (MUI X license required for Pro
features — separate purchase), Date Pickers, Dialog/Drawer, Timeline, Chart,
Editor, Upload, Form wizard, Snackbar, Mega menu, Organization chart.

## Fit for the Super Admin portal

| Need | Minimal UI coverage |
|------|---------------------|
| Tenant/user tables | ✅ DataGrid patterns, filters, export |
| Subscriptions/billing | ✅ Billing pages (invoices, rows, cards) |
| Campaigns + reports | ⚠️ Custom (wizard + editor + scheduler compose from primitives) |
| Email templates | ⚠️ Custom (editor + preview + test-send modal) |
| API key vault | ⚠️ Custom (masked input, reveal, rotation flow) |
| Token-usage analytics | ✅ Chart + table patterns |
| System health | ⚠️ Custom (uptime/error cards + sparklines) |
| Audit logs | ✅ Table + filter + export patterns |
| Settings/feature flags | ✅ Settings page patterns |
| Auth (login/MFA/SSO) | ✅ Auth layouts (we keep our JWT + httpOnly-cookie flow) |
| Dark mode / density | ✅ Theme + toggle patterns |

## Decision: build, borrowing patterns (no fork)

1. **Do not fork the template.** Forking couples us to Minimal's release line,
   its Vite/MUI version pins, and its license tiers (MUI X Pro is a separate
   license). Our toolchain (Vite 7 + React 19 + TS strict + ESLint 9 flat) must
   stay aligned with the CMS `frontend/`.
2. **Do borrow page patterns**: DataGrid list pages with filter bars and row
   actions; billing cards + invoice tables; settings tab layouts; audit filter
   bars; auth card layouts. These are re-implemented here with our theme
   tokens.
3. **Reconsider Pro purchase ($69–$299)** if we want the Figma kit or the
   ready-made kanban/calendar/file-manager pages later — not needed for MVP.

## What this means for other portals

- The tenant-facing CMS `frontend/` stays Radix + Tailwind (no change).
- If a future customer-facing portal needs marketing pages + shop/checkout
  flows, Minimal Pro's landing/pricing/checkout/blog pages become a stronger
  buy case. Re-evaluate then.
