## Copilot Agent Instructions – VA Claim Assistant

Architecture: Express backend (`backend/src`) exposes REST under `/api/*`. React + Vite frontend (`frontend/src`). SQLite via Prisma. In dev run both servers; in production Express can serve built SPA from `frontend/dist`.

Prisma & JSON: SQLite lacks native JSON. Claim JSON-like fields are STRING columns storing serialized JSON (see comments in `prisma/schema.prisma`). Always `JSON.stringify` before saving and `JSON.parse` when returning. Helpers: `jsonFields`, `parseClaim`, `parseClaims` in `routes/claims.js`—extend `jsonFields` when adding new serialized fields.

Models: `User` (auth), `Claim` (workflow/status), `Document` (uploaded PDFs). Extra fields: `statusHistory` (stringified array of `{status, at}`), `archived` flag.

Auth: Register -> bcrypt hash password. Login -> JWT (7d) returned + HttpOnly cookie (`token`). Frontend stores token in localStorage and sets `Authorization: Bearer <token>` (see `AuthContext.jsx`). Protected endpoints use `authMiddleware` (checks header or cookie). Keep all new protected endpoints behind this middleware.

Security: `helmet`, `express-rate-limit` on `/api/`. Validation with Zod per body; XSS sanitization using `xss` (currently for `caseDescription`). Extend sanitization if adding rich text inputs. File uploads via `multer` to `uploads/`. Heavy deps (`pdf-parse`) lazy imported.

Claim Workflow Endpoints (placeholders for AI):
- `/api/claims/:id/generate-questions`
- `/api/claims/:id/identify-events`
- `/api/claims/:id/generate-final-doc` (sets status to "Final Document Ready")
- `/api/claims/:id/generate-va-form`
Each stores a JSON string and returns parsed data.

Status & Archiving: `PATCH /api/claims/:id/status` appends to `statusHistory`. Archive/unarchive via `PATCH /api/claims/:id/archive`.

Documents: Upload `POST /api/documents` (multipart `files`). Extracted text stored in `extractedText`. Associate docs to a claim: `POST /api/claims/:id/documents` with `{ documentIds: [] }`.

Static SPA: If `frontend/dist` exists Express serves it and a non-`/api/` catch-all returns `index.html`. Always put API endpoints under `/api/`.

Frontend Patterns: Auth context, `<PrivateRoute>` wrapper, Axios baseURL (`VITE_API_URL` or default). New UI modules under `frontend/src/modules/<area>/`. Use relative Axios paths (`/claims`, `/documents`).

Schema/Migration Workflow: Edit `prisma/schema.prisma` -> `npx prisma migrate dev --name <change>` -> add new serialized field names to `jsonFields`.

Adding a New Claim Step:
1. Add STRING column (e.g. `evidenceSummary String? // JSON string`).
2. Migrate.
3. Add field to `jsonFields`.
4. Implement endpoint: compute, `JSON.stringify` result, return parsed.

Environment: `backend/.env.example` lists vars. Email welcome uses SMTP if provided; missing config is a no-op.

Avoid: Returning raw JSON strings; routes outside `/api/` that should be API; storing unsanitized user HTML.

Pending: Real AI integration, comprehensive validation/sanitization, accessibility audit, additional claim UI steps, notification emails, tests (suggest supertest + temp SQLite), PDF export.
