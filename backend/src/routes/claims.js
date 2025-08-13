import express from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import xss from 'xss';

const jsonFields = [
  'claimSetupData',
  'analysisQuestions',
  'userAnswers',
  'potentialClaimEvents',
  'selectedClaims',
  'finalDocument',
  'vaFormData',
  'statusHistory'
];

function parseClaim(claim) {
  if (!claim) return claim;
  const copy = { ...claim };
  for (const f of jsonFields) {
    if (copy[f]) {
      try { copy[f] = JSON.parse(copy[f]); } catch { /* ignore */ }
    }
  }
  return copy;
}

function parseClaims(list) { return list.map(parseClaim); }

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const claims = await prisma.claim.findMany({ where: { userId: req.user.id }, orderBy: { updatedAt: 'desc' } });
    res.json(parseClaims(claims));
  } catch (e) { next(e); }
});

// Get single claim (parsed)
router.get('/:id', async (req, res, next) => {
  try {
    const claim = await prisma.claim.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!claim) return res.status(404).json({ error: 'Not found' });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const claim = await prisma.claim.create({ data: { userId: req.user.id } });
    res.status(201).json(parseClaim(claim));
  } catch (e) { next(e); }
});

const updateStatusSchema = z.object({ status: z.string().min(1) });
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
  const existing = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
  history.push({ status, at: new Date().toISOString() });
  const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { status, statusHistory: JSON.stringify(history) } });
  res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

const setupSchema = z.object({ claimSetupData: z.any() });
router.patch('/:id/setup', async (req, res, next) => {
  try {
    const { claimSetupData } = setupSchema.parse(req.body);
    const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { claimSetupData: JSON.stringify(claimSetupData) } });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

const descriptionSchema = z.object({ caseDescription: z.string().min(1) });
router.patch('/:id/description', async (req, res, next) => {
  try {
    const { caseDescription } = descriptionSchema.parse(req.body);
  const sanitized = xss(caseDescription);
  const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { caseDescription: sanitized } });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

// Placeholder AI endpoints
router.post('/:id/generate-questions', async (req, res, next) => {
  try {
    const questions = [{ id: 1, text: 'Describe the onset of symptoms.' }];
  const existing = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
  history.push({ status: 'Questions Generated', at: new Date().toISOString() });
  await prisma.claim.update({ where: { id: req.params.id }, data: { analysisQuestions: JSON.stringify(questions), status: 'Questions Generated', statusHistory: JSON.stringify(history) } });
    res.json({ questions });
  } catch (e) { next(e); }
});

router.post('/:id/identify-events', async (req, res, next) => {
  try {
    const events = [{ id: 'evt1', title: 'Service-connected injury' }];
  const existing = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
  history.push({ status: 'Events Identified', at: new Date().toISOString() });
  await prisma.claim.update({ where: { id: req.params.id }, data: { potentialClaimEvents: JSON.stringify(events), status: 'Events Identified', statusHistory: JSON.stringify(history) } });
    res.json({ events });
  } catch (e) { next(e); }
});

router.post('/:id/generate-final-doc', async (req, res, next) => {
  try {
    const finalDoc = { statement: 'Final lay statement content.' };
  const existing = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
  history.push({ status: 'Final Document Ready', at: new Date().toISOString() });
  await prisma.claim.update({ where: { id: req.params.id }, data: { finalDocument: JSON.stringify(finalDoc), status: 'Final Document Ready', statusHistory: JSON.stringify(history) } });
    res.json({ finalDocument: finalDoc });
  } catch (e) { next(e); }
});

router.post('/:id/generate-va-form', async (req, res, next) => {
  try {
    const vaFormData = { form: 'VA-21-526EZ', fields: {} };
    const existing = await prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
    history.push({ status: 'VA Form Data Generated', at: new Date().toISOString() });
    await prisma.claim.update({ where: { id: req.params.id }, data: { vaFormData: JSON.stringify(vaFormData), status: 'VA Form Data Generated', statusHistory: JSON.stringify(history) } });
    res.json({ vaFormData });
  } catch (e) { next(e); }
});

// Save user answers to analysis questions
const answersSchema = z.object({ userAnswers: z.any() });
router.patch('/:id/answers', async (req, res, next) => {
  try {
    const { userAnswers } = answersSchema.parse(req.body);
    const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { userAnswers: JSON.stringify(userAnswers) } });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

// Save selected claims (events chosen by user)
const selectedSchema = z.object({ selectedClaims: z.any() });
router.patch('/:id/selected-claims', async (req, res, next) => {
  try {
    const { selectedClaims } = selectedSchema.parse(req.body);
    const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { selectedClaims: JSON.stringify(selectedClaims) } });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

// Associate documents with a claim
const assocDocsSchema = z.object({ documentIds: z.array(z.string()).min(1) });
router.post('/:id/documents', async (req, res, next) => {
  try {
    const { documentIds } = assocDocsSchema.parse(req.body);
    // Ensure documents belong to user
    const docs = await prisma.document.findMany({ where: { id: { in: documentIds }, userId: req.user.id } });
    const foundIds = docs.map(d=>d.id);
    const updates = [];
    for (const id of foundIds) {
      updates.push(prisma.document.update({ where: { id }, data: { claimId: req.params.id } }));
    }
    await Promise.all(updates);
    res.json({ updated: foundIds.length });
  } catch (e) { next(e); }
});

// Archive or unarchive
const archiveSchema = z.object({ archived: z.boolean() });
router.patch('/:id/archive', async (req, res, next) => {
  try {
    const { archived } = archiveSchema.parse(req.body);
    const claim = await prisma.claim.update({ where: { id: req.params.id }, data: { archived } });
    res.json(parseClaim(claim));
  } catch (e) { next(e); }
});

// Delete claim
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.claim.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
