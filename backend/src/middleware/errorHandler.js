import { logger, reqContext } from '../index.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line
  const ctx = reqContext.getStore();
  logger.error({ err, reqId: ctx?.id, path: req.path }, err.message);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: err.message || 'Server error', requestId: ctx?.id });
}
