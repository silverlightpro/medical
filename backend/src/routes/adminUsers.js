import express from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import bcrypt from 'bcrypt';

export const router = express.Router();

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  isAdmin: z.boolean().optional(),
  notes: z.string().optional()
});

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  isAdmin: z.boolean().optional(),
  password: z.string().min(8).optional(),
  notes: z.string().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map(({ passwordHash, ...u }) => u));
  } catch(e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ data: { email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName, isAdmin: !!data.isAdmin, notes: data.notes } });
    const { passwordHash: _, ...rest } = user;
    res.status(201).json(rest);
  } catch(e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { passwordHash, ...rest } = user;
    res.json(rest);
  } catch(e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const updates = { ...data };
    if (data.password) {
      updates.passwordHash = await bcrypt.hash(data.password, 10);
      delete updates.password;
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updates });
    const { passwordHash, ...rest } = user;
    res.json(rest);
  } catch(e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch(e) { next(e); }
});
