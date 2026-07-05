# DevMeet

> A production-quality Slack/Discord-style collaboration platform for engineering teams.
> Modular monolith · TypeScript everywhere · PostgreSQL · WebRTC · Socket.io.

<p align="center">
  <img src="https://img.shields.io/badge/node-20+-brightgreen"/>
  <img src="https://img.shields.io/badge/react-19-blue"/>
  <img src="https://img.shields.io/badge/postgres-16-336791"/>
  <img src="https://img.shields.io/badge/prisma-5-2D3748"/>
  <img src="https://img.shields.io/badge/architecture-modular_monolith-orange"/>
</p>

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Folder Structure](#folder-structure)
5. [Quick Start (Docker)](#quick-start-docker)
6. [Local Development (No Docker)](#local-development-no-docker)
7. [Environment Variables](#environment-variables)
8. [Database Migrations](#database-migrations)
9. [Seed Data & Test Credentials](#seed-data--test-credentials)
10. [API Reference](#api-reference)
11. [Real-time Events](#real-time-events)
12. [Design Principles](#design-principles)
13. [Scripts Cheatsheet](#scripts-cheatsheet)
14. [Roadmap](#roadmap)

---

## Features

| Domain            | Capabilities                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Auth**          | Register · Login · JWT · bcrypt · Forgot/Reset password · Google OAuth (graceful fallback when creds are missing) |
| **Users**         | Profile · Avatar upload · Update profile · Search                                                                 |
| **Organizations** | Create · Invite by email · Accept invite · Roles (Owner/Admin/Member) · Update member role · Remove member        |
| **Teams**         | Create · Join · Leave · Members · Team lead role · Delete                                                         |
| **Channels**      | Public + Private · Team-scoped · Members list · Add/remove members · Delete                                       |
| **Chat**          | Realtime via Socket.io · Typing indicators · Emoji reactions · Soft delete · File attachments                     |
| **Meetings**      | Instant WebRTC rooms · Audio · Video · Screen-share (mesh topology) · Signalling via Socket.io                    |
| **Kanban**        | Boards per team · Cards with assignee/due-date/description · Drag-and-drop between TODO / IN_PROGRESS / DONE      |
| **Search**        | PostgreSQL ILIKE + parameterised queries across messages, channels, teams, users                                  |
| **Uploads**       | Local disk today · Storage layer abstracted for Cloudinary/S3 tomorrow                                            |
| **UI**            | Responsive · Dark mode · Shadcn UI · Distinctive design tokens (not the usual purple gradient)                    |

---

## Architecture

**Modular Monolith.** A single Node process boots one Express app. All routes are wired
under `/api`. Each business capability lives in its own **feature module** with a
`repository → service → controller → routes` boundary. Domain models are shared via Prisma.

```
                    ┌────────────────────────────────────────────┐
                    │            Express + Socket.io             │
                    │                                            │
   ┌──────────┐    │  /api/auth   /api/users   /api/orgs        │    ┌──────────────┐
   │  React   │────┤  /api/teams  /api/channels                 ├────│  PostgreSQL  │
   │  Vite    │    │  /api/messages   /api/meetings             │    │  (Prisma)    │
   └──────────┘    │  /api/kanban   /api/search   /api/uploads  │    └──────────────┘
        │           │                                            │
        │  ws       │           Realtime namespace               │
        └──────────►│  message:new / :updated / :deleted         │
                    │  typing:start/stop · meeting:signal        │
                    └────────────────────────────────────────────┘
```

Each module can, without refactor, be lifted into its own process later — the repository
and service layers do not depend on Express, only on Prisma and other services via
explicit interfaces.

### Layers

- **Repository** (`*.repository.ts`) — the only place that talks to Prisma. Pure data access.
- **Service** (`*.service.ts`) — business logic, authorisation checks, orchestration between repositories & the Socket.io hub. No HTTP concerns.
- **Controller** (`*.controller.ts`) — thin request/response glue.
- **DTO** (`*.dto.ts`) — Zod schemas + inferred TS types. Validation and shape.
- **Routes** (`*.routes.ts`) — HTTP wiring. `requireAuth` and role middleware live here.
- **Core** (`src/core/*`) — cross-cutting middleware (auth, error, validation), utils (jwt, password, response), and the socket hub.

---

## Tech Stack

**Frontend**

- React 19 + TypeScript + Vite
- Tailwind CSS + Shadcn UI (Radix) + `lucide-react`
- React Router 6
- TanStack Query (React Query)
- Socket.io client
- Zustand for auth/workspace state
- `@hello-pangea/dnd` for kanban drag-and-drop
- `react-hook-form` + `zod` + `@hookform/resolvers`

**Backend**

- Node 20 + Express 4 + TypeScript
- Prisma 5 ORM (`@prisma/client`)
- Socket.io 4
- JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- Passport (Google OAuth 2.0)
- Zod for validation
- Multer for uploads
- Helmet + CORS + Morgan

**Database**

- PostgreSQL 16

**Tooling**

- ESLint + Prettier + Husky + lint-staged
- Docker + Docker Compose

---

## Folder Structure

```
/app
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma        # single source of truth for data model
│  │  ├─ seed.ts              # dev seed (users, org, team, channel, board)
│  │  └─ migrations/          # generated
│  ├─ src/
│  │  ├─ config/              # env, prisma client
│  │  ├─ core/
│  │  │  ├─ errors/           # AppError hierarchy
│  │  │  ├─ middleware/       # auth, error, validate, asyncHandler
│  │  │  ├─ socket/           # socket.io hub
│  │  │  └─ utils/            # jwt, password, response
│  │  ├─ modules/
│  │  │  ├─ auth/             # register, login, jwt, oauth
│  │  │  ├─ users/
│  │  │  ├─ organizations/
│  │  │  ├─ teams/
│  │  │  ├─ channels/
│  │  │  ├─ messages/
│  │  │  ├─ meetings/
│  │  │  ├─ kanban/
│  │  │  ├─ search/
│  │  │  └─ uploads/          # storage.provider.ts abstraction
│  │  ├─ app.ts               # express app factory
│  │  ├─ routes.ts            # aggregates module routers under /api
│  │  └─ index.ts             # bootstrap + socket.io + graceful shutdown
│  ├─ .env.example
│  ├─ Dockerfile
│  ├─ package.json
│  └─ tsconfig.json
│
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ ui/               # shadcn primitives (button, input, dialog, …)
│  │  │  ├─ layout/AppShell   # sidebar shell
│  │  │  └─ auth/AuthShell    # brand + form split layout
│  │  ├─ contexts/            # zustand stores + ThemeProvider
│  │  ├─ features/            # api clients: auth, orgs, teams, channels, …
│  │  ├─ hooks/               # useSocket
│  │  ├─ lib/                 # api client, socket client, env, cn()
│  │  ├─ pages/               # Landing, Login, Register, Dashboard, Chat, Kanban, …
│  │  ├─ routes/              # AppRouter, ProtectedRoute
│  │  ├─ types/               # shared domain types
│  │  ├─ App.tsx              # providers (QueryClient, Theme, Router)
│  │  ├─ main.tsx             # entry
│  │  └─ index.css            # tailwind + design tokens (light + dark)
│  ├─ .env.example
│  ├─ Dockerfile
│  ├─ index.html
│  ├─ package.json
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  └─ vite.config.ts
│
├─ docker-compose.yml         # postgres + backend + frontend
├─ package.json               # root scripts (dev, install:all, format, husky)
├─ .prettierrc
├─ .prettierignore
├─ .editorconfig
├─ .gitignore
└─ README.md
```

---

## Quick Start (Docker)

The fastest way to get running:

```bash
docker compose up --build
```

This starts:

- **PostgreSQL** on `localhost:5432` (user `devmeet`, db `devmeet`)
- **Backend** on `http://localhost:8001` (auto migrate + seed on first boot)
- **Frontend** on `http://localhost:5173`

Open http://localhost:5173 and log in with the seeded credentials below.

---

## Local Development (No Docker)

### Prerequisites

- Node.js 20+
- Yarn 1.22+ (`npm i -g yarn`)
- PostgreSQL 15+ running locally

### Setup

```bash
# 1. Provision the database (example — use your PG tooling)
sudo -u postgres psql -c "CREATE USER devmeet WITH PASSWORD 'devmeet_password' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE devmeet OWNER devmeet;"

# 2. Install deps
cd backend && yarn install
cd ../frontend && yarn install

# 3. Configure env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit as needed

# 4. Migrate + seed
cd backend
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# 5. Start dev servers (two terminals)
cd backend && yarn dev          # http://localhost:8001
cd frontend && yarn dev         # http://localhost:5173
```

Or, from the repo root:

```bash
yarn install:all
yarn dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable               | Purpose                          | Required                 |
| ---------------------- | -------------------------------- | ------------------------ |
| `NODE_ENV`             | `development` \| `production`    | ✅                       |
| `PORT`                 | Server port                      | ✅ (default `8001`)      |
| `DATABASE_URL`         | Postgres connection string       | ✅                       |
| `JWT_SECRET`           | Signing secret for access tokens | ✅                       |
| `JWT_EXPIRES_IN`       | e.g. `7d`, `24h`                 | ✅ (default `7d`)        |
| `BCRYPT_ROUNDS`        | Cost factor                      | ✅ (default `10`)        |
| `CORS_ORIGIN`          | Comma-separated allow-list       | ✅                       |
| `UPLOAD_DIR`           | Where local uploads land         | ✅ (default `./uploads`) |
| `MAX_UPLOAD_SIZE_MB`   | Multer limit                     | ✅ (default `25`)        |
| `GOOGLE_CLIENT_ID`     | OAuth Client ID                  | optional                 |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret              | optional                 |
| `GOOGLE_CALLBACK_URL`  | OAuth redirect                   | optional                 |
| `FRONTEND_URL`         | Post-OAuth redirect target       | optional                 |

When Google OAuth env vars are absent, the `/api/auth/google` endpoints return `503 OAUTH_DISABLED` instead of crashing.

### Frontend (`frontend/.env`)

| Variable          | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `VITE_API_URL`    | REST base URL, e.g. `http://localhost:8001` |
| `VITE_SOCKET_URL` | Socket.io URL, usually same host as API     |

---

## Database Migrations

```bash
cd backend

# Create a new migration from the current schema.prisma diff
npx prisma migrate dev --name <descriptive-name>

# Apply pending migrations (production)
npx prisma migrate deploy

# Regenerate the Prisma client after schema edits
npx prisma generate

# Inspect data in a GUI
npx prisma studio
```

---

## Seed Data & Test Credentials

After running `npx tsx prisma/seed.ts`:

| User         | Email              | Password       | Role       |
| ------------ | ------------------ | -------------- | ---------- |
| Ada Lovelace | `owner@devmeet.io` | `Password123!` | Org OWNER  |
| Alice Turing | `alice@devmeet.io` | `Password123!` | Org ADMIN  |
| Bob Hopper   | `bob@devmeet.io`   | `Password123!` | Org MEMBER |

Includes: `DevMeet HQ` org, `Engineering` team, `#general` + `#random` channels, `Sprint 1` kanban board with 3 cards.

---

## API Reference

All endpoints are prefixed with `/api`. Responses are wrapped:

```json
{ "success": true, "data": { … } }
```

Errors return:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "…" } }
```

Auth: send `Authorization: Bearer <jwt>` on all protected routes.

### Auth

| Method | Path                    | Description                                                          |
| ------ | ----------------------- | -------------------------------------------------------------------- |
| POST   | `/auth/register`        | `{email, username, name, password}` → `{token, user}`                |
| POST   | `/auth/login`           | `{email, password}` → `{token, user}`                                |
| GET    | `/auth/me`              | Current user                                                         |
| POST   | `/auth/forgot-password` | `{email}` → `{sent, resetToken}` (token returned in dev for testing) |
| POST   | `/auth/reset-password`  | `{token, password}`                                                  |
| GET    | `/auth/google`          | OAuth start (503 if disabled)                                        |
| GET    | `/auth/google/callback` | OAuth callback                                                       |

### Users

| Method | Path               | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/users/:id`       | Public profile    |
| PATCH  | `/users/me`        | Update profile    |
| GET    | `/users/search?q=` | Fuzzy user search |

### Organizations

| Method | Path                                 | Description                   |
| ------ | ------------------------------------ | ----------------------------- |
| GET    | `/organizations`                     | My workspaces                 |
| POST   | `/organizations`                     | Create                        |
| GET    | `/organizations/:id`                 | Detail with `myRole`          |
| GET    | `/organizations/:id/members`         | Members                       |
| POST   | `/organizations/:id/invites`         | Invite by email (Admin/Owner) |
| GET    | `/organizations/:id/invites`         | Pending invites               |
| POST   | `/organizations/invites/accept`      | Accept invite `{token}`       |
| PATCH  | `/organizations/:id/members/:userId` | Change role (Owner)           |
| DELETE | `/organizations/:id/members/:userId` | Remove member                 |

### Teams

| Method | Path                             | Description                 |
| ------ | -------------------------------- | --------------------------- |
| GET    | `/teams?organizationId=`         | List for org                |
| GET    | `/teams/mine`                    | My teams                    |
| POST   | `/teams`                         | Create                      |
| GET    | `/teams/:teamId`                 | Detail                      |
| PATCH  | `/teams/:teamId`                 | Update (Lead/Admin)         |
| DELETE | `/teams/:teamId`                 | Delete (Lead/Admin)         |
| POST   | `/teams/:teamId/join`            | Join                        |
| POST   | `/teams/:teamId/leave`           | Leave                       |
| GET    | `/teams/:teamId/members`         | Members                     |
| POST   | `/teams/:teamId/members`         | Add member `{userId, role}` |
| DELETE | `/teams/:teamId/members/:userId` | Remove                      |

### Channels

| Method | Path                                   | Description                                            |
| ------ | -------------------------------------- | ------------------------------------------------------ |
| GET    | `/channels?organizationId=`            | List visible channels                                  |
| POST   | `/channels`                            | Create `{organizationId, teamId?, name, topic?, type}` |
| GET    | `/channels/:channelId`                 | Detail                                                 |
| PATCH  | `/channels/:channelId`                 | Update                                                 |
| DELETE | `/channels/:channelId`                 | Delete                                                 |
| POST   | `/channels/:channelId/join`            | Join (public only)                                     |
| POST   | `/channels/:channelId/leave`           | Leave                                                  |
| GET    | `/channels/:channelId/members`         | Members                                                |
| POST   | `/channels/:channelId/members`         | Add member `{userId}`                                  |
| DELETE | `/channels/:channelId/members/:userId` | Remove                                                 |

### Messages

| Method | Path                                    | Description                                            |
| ------ | --------------------------------------- | ------------------------------------------------------ |
| GET    | `/messages?channelId=&cursor=&limit=`   | Paginated (newest last)                                |
| POST   | `/messages`                             | `{channelId, content, fileUrl?, fileName?, fileSize?}` |
| DELETE | `/messages/:messageId`                  | Soft delete                                            |
| POST   | `/messages/:messageId/reactions`        | `{emoji}`                                              |
| DELETE | `/messages/:messageId/reactions/:emoji` | Remove reaction                                        |

### Kanban

| Method | Path                         | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/kanban/boards?teamId=`     | Boards for team                |
| POST   | `/kanban/boards`             | `{teamId, name, description?}` |
| GET    | `/kanban/boards/:boardId`    | Board with cards               |
| DELETE | `/kanban/boards/:boardId`    | Delete                         |
| POST   | `/kanban/cards`              | Create card                    |
| PATCH  | `/kanban/cards/:cardId`      | Update card                    |
| POST   | `/kanban/cards/:cardId/move` | `{status, position}`           |
| DELETE | `/kanban/cards/:cardId`      | Delete                         |

### Meetings

| Method | Path                        | Description             |
| ------ | --------------------------- | ----------------------- |
| GET    | `/meetings?organizationId=` | List                    |
| POST   | `/meetings`                 | Create instant room     |
| GET    | `/meetings/:roomCode`       | Detail w/ participants  |
| POST   | `/meetings/:roomCode/join`  | Record participant join |
| POST   | `/meetings/:roomCode/leave` | Record leave            |
| POST   | `/meetings/:roomCode/end`   | End (host/admin)        |

### Search

| Method | Path                         | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/search?organizationId=&q=` | Cross-domain fuzzy search |

### Uploads

| Method | Path                  | Description                                 |
| ------ | --------------------- | ------------------------------------------- |
| POST   | `/uploads/attachment` | multipart `file` — generic                  |
| POST   | `/uploads/avatar`     | multipart `file` — updates `user.avatarUrl` |

Static files are served under `/uploads/<purpose>/<stored-name>`.

---

## Real-time Events

Client authenticates on handshake:

```ts
io(SOCKET_URL, { auth: { token: '<jwt>' } });
```

### Channel presence

| Event                          | Direction       | Payload                             |
| ------------------------------ | --------------- | ----------------------------------- |
| `channel:join`                 | client → server | `channelId`                         |
| `channel:leave`                | client → server | `channelId`                         |
| `typing:start` / `typing:stop` | bidirectional   | `channelId` \| `{channelId,userId}` |

### Messages

| Event             | Direction                   | Payload                               |
| ----------------- | --------------------------- | ------------------------------------- |
| `message:new`     | server → clients in channel | full Message                          |
| `message:updated` | server → clients in channel | full Message (e.g. reactions changed) |
| `message:deleted` | server → clients in channel | `{id, channelId}`                     |

### Meetings (WebRTC signalling)

| Event                 | Direction        | Payload                               |
| --------------------- | ---------------- | ------------------------------------- |
| `meeting:join`        | client → server  | `roomCode`                            |
| `meeting:leave`       | client → server  | `roomCode`                            |
| `meeting:peer-joined` | server → clients | `{userId, socketId}`                  |
| `meeting:peer-left`   | server → clients | `{userId, socketId}`                  |
| `meeting:signal`      | bidirectional    | `{to, roomCode, signal}` — SDP or ICE |

---

## Design Principles

- **Clean Architecture.** Repositories know Prisma. Services know business rules. Controllers know Express. Routes know URLs. Nothing crosses those lines.
- **SOLID.** Services depend on repository _interfaces_, not concrete instances (constructor injection). Storage is swappable via `StorageProvider`.
- **Feature-first folders.** All code for a feature lives under `modules/<feature>/`. Adding a domain = adding a folder.
- **DTO validation everywhere.** Zod schemas are the single source of truth for request shape and downstream TS types.
- **Central error middleware.** Domain errors, Zod errors, Prisma known errors — all mapped to consistent HTTP envelopes.
- **Environment fails fast.** `src/config/env.ts` uses Zod to validate `process.env` on boot.
- **Optional integrations degrade gracefully.** Google OAuth is guarded by `env.googleOAuthEnabled` — missing creds yield a `503`, not a crash.

---

## Scripts Cheatsheet

Root:

```bash
yarn install:all      # install backend + frontend
yarn dev              # start both (concurrently)
yarn format           # prettier across the tree
```

Backend:

```bash
yarn dev              # hot-reload with tsx
yarn build            # tsc → dist/
yarn start            # node dist/index.js
yarn lint             # eslint
yarn prisma:migrate   # dev migrate
yarn prisma:deploy    # prod migrate
yarn prisma:studio    # GUI
yarn seed             # tsx prisma/seed.ts
```

Frontend:

```bash
yarn dev              # vite
yarn build            # typecheck + vite build
yarn preview          # serve production build
yarn lint             # eslint
```

---

## Roadmap

- [ ] Threaded replies
- [ ] Presence (online/away/dnd)
- [ ] Push notifications (web + email)
- [ ] Meeting recording
- [ ] File search + previews
- [ ] Slash commands
- [ ] Cloudinary / S3 storage provider (interface already defined)
- [ ] Rate limiting per user
- [ ] Audit log
- [ ] End-to-end tests (Playwright)

---

## License

MIT. Built as a reference implementation of a modular monolith.
