import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as authRouter } from './routes/auth.js';
import { router as claimRouter } from './routes/claims.js';
import { router as checklistRouter } from './routes/checklists.js';
import { router as documentRouter } from './routes/documents.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../frontend/dist');

app.use(helmet());
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/checklists', checklistRouter);
app.use('/api/documents', authMiddleware, documentRouter);
app.use('/api/claims', authMiddleware, claimRouter);

// Serve frontend (built) with SPA fallback (if build exists)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});
