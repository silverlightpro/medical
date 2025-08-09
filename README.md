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

## Next Steps
- Implement remaining claim flow UI pages.
- Integrate actual Gemini API calls in backend AI endpoints.
- Add email notifications for analysis completion and final document generation.
- Enhance security (input sanitization layers, stricter CORS origins, production logging).
- Add accessibility audit pass and improvements.
