# Atlas AI Security Hardening

## Overview
This branch focuses on SEV-1 mitigations for Atlas AI by securing file workflows and tightening access to premium features. Key updates include authenticated file access with per-user ownership checks, rate-limited upload/download endpoints, a guarded file storage abstraction, and removal of hard-coded Pro plan fallbacks. It now also introduces release management so administrators can bundle and publish coordinated updates across system prompts, experts, templates, output templates, and tool policies.

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Environment Variables
Copy `.env.example` to `.env` and provide real values:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connection string for PostgreSQL. |
| `SESSION_SECRET` | Secret used to sign Express sessions. |
| `API_KEY_ENCRYPTION_KEY` | 32+ byte secret used to encrypt user provided API keys. |
| `ADMIN_ENROLLMENT_SECRET` | One-time secret required to create or reset administrator accounts once one exists. Leave empty to allow the first admin to enroll without a temporary password. |
| `PRO_ACCESS_CODE` | Optional temporary Pro upgrade code (will be replaced by Stripe webhooks). Leave empty to disable the manual upgrade flow. |
| `GROQ_API_KEY` | Optional platform-managed Groq API key used when users have not provided their own. |
| `KNOWLEDGE_FETCH_HOST_ALLOWLIST` | Optional comma-separated list of hostnames or wildcard patterns (e.g. `*.example.com`) allowed for URL ingestion. |
| `STRIPE_PRICE_PLAN_MAP` | Optional JSON or comma-delimited map of Stripe price IDs to plan slugs (e.g. `{ "price_123": "pro" }`). |
| `N8N_BASE_URL` | Base URL for the shared n8n workspace (defaults to `https://zap.c4saas.com`). |
| `FILE_STORAGE_TTL_MS` | (Optional) Time-to-live for in-memory file storage fallback. |
| `FILE_STORAGE_QUOTA_BYTES` | (Optional) Per-user quota for file storage fallback. |
| `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Reserved for future S3/R2 adapter wiring. |

## Setup
```bash
npm install
```

## Development
Start the API locally:
```bash
npm run dev
```

The server automatically runs pending Drizzle migrations on startup. Set `SKIP_DB_MIGRATIONS=true` in your environment if you need
to disable this behaviour for ephemeral environments.

### Plan alignment & migrations

- Run `./scripts/migrate-legacy-plans.ts --dry-run` to review which users require plan metadata fixes. Re-run with `--apply` once
  the output looks correct; use `--json` for machine readable summaries in ops automation.
- The script normalizes each user's `planId` and `plan` slug, falling back to the Free plan for unknown assignments. Existing
  billing automations should reference plan slugs from the admin UI and keep the slug consistent with the Stripe price mapping in
  `STRIPE_PRICE_PLAN_MAP`.
- Deployment runbooks should note both the plan slug and database `planId` when provisioning integrations (e.g. coupons, price
  IDs, or admin overrides) so migrations remain deterministic across environments.

## Authentication
- Existing users can sign in with either their email address or their legacy username; both identifiers now resolve to the same login endpoint.
- To create the first administrator, submit the admin enrollment form without configuring `ADMIN_ENROLLMENT_SECRET`. Configure the secret afterwards to require the temporary password for future admin enrollment or password resets.

## Testing
Run unit tests covering the security changes:
```bash
npm test
```

## Notes
- File uploads and downloads require an authenticated session, validate ownership before serving content, and now enforce tighter file-size limits to protect memory.
- Upload-heavy routes are protected by rate limiting, per-user quotas, and CSRF validation to reduce abuse and cross-site attacks.
- The Pro upgrade flow reads its access code from `PRO_ACCESS_CODE` and uses constant-time comparisons to avoid timing leaks; leave the variable blank to disable manual upgrades entirely.
- Atlas will fall back to deriving the encryption key from `SESSION_SECRET` if `API_KEY_ENCRYPTION_KEY` is missing, but you should configure a dedicated 32+ character secret in production and rotate it separately from session cookies.
- Administrators can create, update, and revoke Pro access coupons from the admin portal; redemptions are tracked per user and automatically enforce expiration, activation state, and redemption limits.
- The Atlas AI Control Center now includes System Prompt and Release managers so admins can version global instructions, bundle compatible experts/templates/tools, review activation history, and promote or roll back releases without redeploying the service.
- Plan assignments and analytics reference plan slugs/IDs; define a unique slug when editing plans in the admin form and use that slug when triggering upgrades or billing workflows.
- Knowledge URL ingestion resolves DNS, blocks private networks (including redirects), optionally enforces an allowlist to mitigate SSRF, and now rejects responses that exceed safe size thresholds.
- The Agents panel in the sidebar now lists connected N8N agents and directs teammates to Settings → Integrations to manage API keys and import additional workflows.
- Administrator accounts are provisioned through the `/api/auth/admin/enroll` endpoint using `ADMIN_ENROLLMENT_SECRET`; no admin email is hard-coded in the repository.
- Users can connect their Notion workspace by providing a Notion API key from either the chat integrations menu or Settings → Integrations. Atlas verifies credentials on save and reuses the encrypted key across the app for database/page lookups.
- The usage dashboard now includes a manual refresh action so admins can invalidate cached analytics and pull the latest usage stats without reloading the page.
- Chat UX improvements: the Atlas logo acts as a "scroll to top" shortcut, code blocks always render on a dark theme, the message pane retains a fixed viewport that auto-scrolls, and a floating new-chat button appears whenever the sidebar is collapsed.
