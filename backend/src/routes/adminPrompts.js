import express from 'express';
import { prisma } from '../lib/prisma.js';
import { encrypt } from '../lib/crypto.js';
import { z } from 'zod';

export const router = express.Router();

const upsertSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  apiKey: z.string().optional()
});

function maskFromLast4(last4) {
  if (!last4) return null;
  return '****' + last4;
}

router.get('/', async (req, res, next) => {
  try {
  const list = await prisma.promptConfig.findMany({ orderBy: { name: 'asc' } });
  res.json(list.map(({ apiKey, apiKeyLast4, ...rest }) => ({ ...rest, maskedKey: maskFromLast4(apiKeyLast4), hasApiKey: !!apiKeyLast4 })));
  } catch (e) { next(e); }
});

router.get('/:name', async (req, res, next) => {
  try {
  const item = await prisma.promptConfig.findUnique({ where: { name: req.params.name } });
    if (!item) return res.status(404).json({ error: 'Not found' });
  const { apiKey, apiKeyLast4, ...rest } = item;
  res.json({ ...rest, hasApiKey: !!apiKeyLast4, maskedKey: maskFromLast4(apiKeyLast4) });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
  const { apiKey: rawKeyCreate, ...restData } = data;
  const created = await prisma.promptConfig.create({ data: { ...restData, apiKey: rawKeyCreate ? encrypt(rawKeyCreate) : undefined, apiKeyLast4: rawKeyCreate ? rawKeyCreate.slice(-4) : undefined, apiKeyUpdatedAt: rawKeyCreate ? new Date() : undefined } });
  const { apiKey: storedKeyCreate, apiKeyLast4, ...rest } = created;
  res.status(201).json({ ...rest, hasApiKey: !!apiKeyLast4, maskedKey: maskFromLast4(apiKeyLast4) });
  } catch (e) { next(e); }
});

router.put('/:name', async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const existing = await prisma.promptConfig.findUnique({ where: { name: req.params.name } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
  const { apiKey: rawKeyUpdate, ...restData } = data;
  const updateData = { ...restData };
  if (rawKeyUpdate) {
    updateData.apiKey = encrypt(rawKeyUpdate);
    updateData.apiKeyLast4 = rawKeyUpdate.slice(-4);
    updateData.apiKeyUpdatedAt = new Date();
  }
  const updated = await prisma.promptConfig.update({ where: { name: req.params.name }, data: updateData });
  const { apiKey: storedKeyUpdate, apiKeyLast4, ...rest } = updated;
  res.json({ ...rest, hasApiKey: !!apiKeyLast4, maskedKey: maskFromLast4(apiKeyLast4) });
  } catch (e) { next(e); }
});

router.delete('/:name', async (req, res, next) => {
  try {
    await prisma.promptConfig.delete({ where: { name: req.params.name } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
