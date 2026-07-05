# DevMeet — PRD

## Original Problem Statement

Build a production-quality Slack/Discord/MS-Teams-style collaboration platform (`DevMeet`) as a **modular monolith** with:

- Frontend: React 19 + TypeScript + Vite + Tailwind + Shadcn + React Router + TanStack Query + Socket.io client
- Backend: Node.js + Express + TypeScript + Prisma
- Database: PostgreSQL
- Auth: JWT + bcrypt + Google OAuth
- Realtime: Socket.io
- Architecture: Clean architecture, feature-first folders, SOLID, Repository pattern, Service layer, Controllers, DTO validation, Error middleware, ESLint, Prettier, Husky, Docker.

## User Choices (Explicit)

- Runtime: build exactly as specified — Node/Express/TS + PostgreSQL + Prisma + Vite React. Docker Compose for local dev. Preview URL not required.
- Google OAuth: JWT/bcrypt for Phase 1, OAuth wired but disabled gracefully if creds missing.
- File uploads: local disk with storage abstraction (Cloudinary/S3-ready).
- GitHub: user will push via `Save to Github` themselves.
- Scope: full working MVP of all listed features (auth, users, orgs, teams, channels, chat, meetings with A/V/screen-share, kanban, dashboard, search, uploads).

## Architecture

Modular monolith:

```
Client (Vite React)  ─►  Node/Express (single process)  ─►  PostgreSQL
                             │
                             └── Socket.io (chat + WebRTC signalling)
```

Each capability = a self-contained module in `backend/src/modules/<feature>/` with:

- `*.repository.ts` — Prisma access only
- `*.service.ts` — business logic + authz
- `*.controller.ts` — HTTP glue
- `*.routes.ts` — Express router
- `*.dto.ts` — Zod schemas

Frontend mirrors this with per-feature api clients in `src/features/<feature>/*.api.ts` and screens in `src/pages/`.

## Personas

| Persona         | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| Engineering IC  | Chats in team channels, joins standup rooms, updates kanban cards. |
| Team Lead       | Manages boards, invites members to teams, moderates messages.      |
| Workspace Owner | Creates orgs, invites members, promotes admins.                    |

## Core Requirements (static)

### Auth

- Register, login, JWT session, forgot/reset password.
- Google OAuth (graceful `503` when disabled).
- Protected routes on the frontend, `requireAuth` middleware on the backend.

### Users

- Profile view/edit, avatar upload (multipart → local disk), user search.

### Organizations

- Create, invite by email (token issued), accept invite, roles (Owner/Admin/Member), update roles (Owner), remove member.

### Teams

- Create, join, leave, add/remove members, team lead role, delete.

### Channels

- Public + private, team-scoped, per-channel membership, add/remove members, delete.

### Chat

- Realtime via Socket.io rooms `channel:<id>`.
- Emoji reactions (idempotent), soft-deletable, file attachments.
- Typing indicators.

### Meetings

- Instant WebRTC rooms with room code, participant tracking.
- Audio, video, screen-share; SFU-less mesh via Socket.io signalling.

### Kanban

- Boards per team, cards with status/position/assignee/due-date.
- Drag-and-drop between TODO / IN_PROGRESS / DONE.

### Dashboard

- Recent teams, activity feed (meetings), stats.

### Search

- Postgres `ILIKE` full-text across messages, channels, teams, users. Scoped to organization.

### Uploads

- Local disk `uploads/<purpose>/*`, storage abstracted behind `StorageProvider` interface for future Cloudinary/S3.

## What's Been Implemented (2026-07-05)

- Root workspace with concurrently, husky, lint-staged, prettier.
- `docker-compose.yml` (postgres + backend + frontend).
- Backend:
  - Full Prisma schema (14 models, all relations, indices, cascade delete).
  - Seed script with 3 users, 1 org, 1 team, 2 channels, 1 board, 3 cards.
  - Env validation via Zod, Prisma singleton with dev HMR cache.
  - AppError hierarchy + central error middleware (handles Zod, Prisma P2002/P2025).
  - Async handler + validate middleware.
  - JWT + bcrypt utils; requireAuth + requireOrgRole middleware.
  - Socket.io hub with JWT handshake, channel + typing + meeting signalling events.
  - Modules: auth (register/login/me/forgot/reset/google), users, organizations (invite/accept/roles), teams (join/leave), channels, messages (realtime, reactions, delete), meetings (create/join/leave/end), kanban (boards + cards + move), search (multi-domain), uploads (local + abstraction).
  - Docker + ESLint + Prettier + `.env.example`.
  - Verified: `npx tsc --noEmit` clean; `yarn build` produces `dist/`; live end-to-end curl smoke test passes (login → orgs → channels → messages → kanban → search → meeting).
- Frontend:
  - Vite + React 19 + TS + Tailwind + Shadcn primitives.
  - Design tokens: parchment-on-ink light theme, near-black dark theme, iridescent green primary + orange accent — deliberately not the purple-gradient AI aesthetic.
  - Font stack: Space Grotesk + Inter + JetBrains Mono.
  - Providers: TanStack Query + Theme + Tooltip + Sonner.
  - Zustand stores: auth (persist), workspace (persist).
  - Routes: protected shell + public landing/login/register/forgot/oauth-callback.
  - Pages: Landing, Login, Register, ForgotPassword, OAuthCallback, Dashboard, Organizations, OrganizationDetail, Teams, Channel (realtime chat w/ reactions, attachments, delete, typing), Kanban (dnd), Meetings, MeetingRoom (WebRTC mesh), Search, Profile.
  - `data-testid` on every interactive/critical element.
  - Verified: `tsc --noEmit` clean; `yarn build` succeeds; live browser: landing renders, login+dashboard+chat all work end-to-end.
- Documentation: comprehensive `README.md` with folder tree, quick start (Docker + local), env reference, API reference, socket events, and design principles.

## Prioritized Backlog

### P1

- Presence system (online/idle/dnd).
- Threaded replies.
- Push notifications (email via SendGrid or web push).

### P2

- Meeting recording (Phase 2 per user).
- Slash commands (`/giphy`, `/remind`, `/poll`).
- Cloudinary provider concrete implementation.
- Rate limiting per user (auth + messages).
- Audit log.
- Playwright end-to-end suite.

### P3

- Message search: switch to `tsvector` + GIN index for scale.
- File previews (images/PDF inline).
- Public API + webhooks.

## Next Tasks (post-review)

1. User pushes to GitHub via `Save to Github`.
2. Once feedback lands, tackle P1 items in order.
3. Add Playwright suite covering: auth, invite flow, message realtime, kanban drag, meeting join.
