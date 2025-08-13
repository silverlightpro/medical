# VA Claim Assistant

Initial scaffold created. Includes:
- Backend: Express + Prisma (SQLite) with auth, claims, documents, checklists endpoints.
- Frontend: React (Vite) + Tailwind scaffold with auth pages, dashboard, documents page.

## Setup

Backend environment variables: see `backend/.env.example`.

### Install & Migrate

From repository root:

```
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

In a new terminal for frontend:
```
cd frontend
npm install
npm run dev
```

Frontend expects API at http://localhost:4000/api . Configure `VITE_API_URL` if different.

## Build for Production

From repository root:

```
cd frontend
npm run build
```

Then start backend (it will serve the built SPA if `frontend/dist` exists):

```
cd backend
npm run dev
```

Navigate to http://localhost:4000/ . API remains under /api/*.

## Next Steps
Roadmap / Backlog

Completed:
- ~~Admin prompt configuration dashboard (create/edit/delete prompt + model + API key)~~
- ~~Basic claim creation, description, setup, status management, AI placeholder endpoints, document association~~

In Progress / Planned:
- ~~Implement remaining claim flow UI pages (multi-step wizard for questions, events selection, final document review & VA form export)~~
	- Inline validation & character limits (done)
	- Autosave drafts for answers (done)
	- Diff view between regenerated questions (done)
- Integrate actual AI model calls (e.g. Gemini / OpenAI) using stored PromptConfig records.
- Add email notifications for analysis completion and final document generation (queue + background worker).
- Security hardening: ~~stricter CORS allow-list~~, ~~API key encryption at rest~~, ~~request ID + structured logging (pino)~~, per-endpoint rate limit tuning (partial: auth + AI endpoints done; refine + dynamic config pending).
- Accessibility audit & improvements (axe CI, keyboard navigation, semantic landmarks).
- Frontend global header/navigation with logout & admin link (done; expand with active state + responsive menu pending).
- API key masking UI: ~~encryption~~ + ~~mask last 4 display~~; add rotation UX & “last rotated” timestamp surfacing (pending UI part).
- Prompt versioning & history (separate PromptVersion table, rollback ability).
- Async job queue for AI tasks (BullMQ / in-memory fallback) to avoid blocking requests.
- Test suite: backend (supertest) & frontend (React Testing Library + vitest) covering auth, claims, admin prompts, users.
- Dockerfile & deployment guide (containerizing backend + built frontend, multi-stage build).
- Monitoring & error tracking integration (e.g., Sentry for frontend/backend).
- Performance: add indexes for frequently filtered fields (status, archived, updatedAt) and pagination on claims list.
- Internationalization scaffolding (i18n) for future localization.
