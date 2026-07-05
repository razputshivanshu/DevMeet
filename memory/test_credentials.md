# DevMeet — Test Credentials

All users share the same password for dev convenience.

| Role             | Email              | Password       | Notes                   |
| ---------------- | ------------------ | -------------- | ----------------------- |
| Workspace Owner  | `owner@devmeet.io` | `Password123!` | Ada Lovelace, org OWNER |
| Workspace Admin  | `alice@devmeet.io` | `Password123!` | Alice Turing, org ADMIN |
| Workspace Member | `bob@devmeet.io`   | `Password123!` | Bob Hopper, org MEMBER  |

## Seeded Data

- Organization: **DevMeet HQ** (`devmeet-hq`)
- Team: **Engineering**
- Channels: `#general`, `#random` (both PUBLIC, all 3 users are members)
- Kanban board: **Sprint 1** on the Engineering team (3 cards across TODO / IN_PROGRESS / DONE)

## Re-seed

```bash
cd backend
npx prisma migrate reset --force   # wipes and re-migrates
# or, without reset:
npx tsx prisma/seed.ts
```

## Database

- URL: `postgresql://devmeet:devmeet_password@localhost:5432/devmeet?schema=public`
- Superuser: `postgres` (peer auth via `sudo -u postgres psql`)
- App user: `devmeet` (password `devmeet_password`, `CREATEDB` granted for shadow db)
