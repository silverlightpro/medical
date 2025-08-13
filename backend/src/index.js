import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { router as authRouter } from './routes/auth.js';
import { router as claimRouter } from './routes/claims.js';
import { router as checklistRouter } from './routes/checklists.js';
import { router as documentRouter } from './routes/documents.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { adminMiddleware } from './middleware/adminMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

// Structured logger with redaction for potential sensitive headers
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true
  }
});
// Async local storage to access request context (id) anywhere
export const reqContext = new AsyncLocalStorage();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../frontend/dist');

// Helmet with relaxed connect-src in dev to allow frontend (Vite) -> backend API calls across ports
const isDev = process.env.NODE_ENV !== 'production';
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    "connect-src": ["'self'", ...(isDev ? ["http://localhost:4000", "http://localhost:5173", "ws://localhost:5173"] : [])]
  }
}));
const allowed = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // non-browser or same-origin
    if (!allowed.length || allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true
}));
// Request ID + logging middleware with AsyncLocalStorage binding
app.use((req, res, next) => {
  const id = crypto.randomBytes(6).toString('hex');
  req.id = id;
  reqContext.run({ id }, () => next());
});
app.use(pinoHttp({
  logger,
  genReqId: req => req.id,
  customProps: req => ({ reqId: req.id })
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Rate limiting: general + targeted stricter limits for sensitive endpoints
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);
app.use(['/api/claims/:id/generate-questions','/api/claims/:id/identify-events','/api/claims/:id/generate-final-doc','/api/claims/:id/generate-va-form'], aiLimiter);
app.use('/api/', generalLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/checklists', checklistRouter);
app.use('/api/admin/prompts', authMiddleware, adminMiddleware, (await import('./routes/adminPrompts.js')).router);
app.use('/api/admin/users', authMiddleware, adminMiddleware, (await import('./routes/adminUsers.js')).router);
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

if (!process.env.VITEST) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API listening');
  });
}

export default app;
