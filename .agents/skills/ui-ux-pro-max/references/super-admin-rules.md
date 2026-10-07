# Super Admin Portal — UI/UX Rules

These rules extend the base `ui-ux-pro` / `ui-ux-pro-max` guidance and apply to
every page in `cmssuperadmin`. Follow priority order 1 → 8.

## 1. Multi-Tenant Context (CRITICAL)
- Every data view MUST support tenant filtering (global select in header).
- "All Tenants" is the default; persist selection in URL query + localStorage.
- Impersonation flow: show a persistent banner `Acting as Tenant X` with an
  `Exit` button. Never allow destructive actions while impersonating without a
  typed confirmation.

## 2. Data Density (HIGH)
- Default: comfortable density (row height ~48px, `p-3` cards).
- Power-user toggle: compact density (~36px rows). Persist per user.
- DataGrid: virtualized, 20 rows/page default, column pinning for ID + actions,
  server-side sorting/filtering for lists over 500 rows.

## 3. Security-First Patterns (CRITICAL)
- Encrypted fields (API keys, SMTP passwords, secrets): masked by default,
  reveal only after explicit click, copy-to-clipboard with toast, rotation
  workflow with confirm dialog.
- Destructive actions (delete tenant, revoke key, cancel campaign): use a
  confirm dialog with typed confirmation for irreversible actions.
- Every mutation logs actor, tenant, action, before/after diff (audit trail).

## 4. Responsive Breakpoints (HIGH)
- Desktop (≥1280px): full sidebar (280px) + data grid.
- Tablet (768–1279px): collapsible sidebar, stacked cards.
- Mobile (<768px): temporary drawer + bottom-safe actions, lists over grids.
- Never introduce horizontal page scroll; tables scroll inside containers.

## 5. Dark Mode (MEDIUM)
- Full support via MUI `CssBaseline` + `data-color-scheme` attribute.
- Charts adapt to theme (use palette tokens, never raw hex in components).
- Persist choice in localStorage; respect `prefers-color-scheme` on first run.

## 6. Accessibility — WCAG 2.2 AA (CRITICAL)
- Skip link to `#main-content` on every layout.
- Focus trapping + `role="dialog"` + `aria-modal` + `aria-labelledby` on modals;
  restore focus on close; `Escape` cancels.
- Icon-only buttons MUST have `aria-label`.
- Form inputs MUST have visible `<label>` (no placeholder-only labels); errors
  adjacent to the field with `role="alert"`.
- Contrast ≥ 4.5:1 for body text; never remove focus rings without replacement
  (`focus-visible` ring on all interactive elements).

## 7. Loading & Empty States (MEDIUM)
- Skeleton loaders for all async data; never blank screens.
- Empty states: illustration/message + primary action (e.g. "Create campaign").
- Per-route error boundaries; failed queries show retry, not crashes.

## 8. Theming Tokens (MEDIUM)
- Base font 16px (`0.875rem` body), line-height ≥ 1.5.
- Border radius: 8px base, 12px cards; transitions 200ms standard.
- Semantic color tokens only (`primary`, `success`, `warning`, `error`).
- No emojis as icons — MUI icons only.
