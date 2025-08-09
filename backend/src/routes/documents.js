import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'_')); }
});

const upload = multer({ storage });

export const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(docs);
  } catch (e) { next(e); }
});

router.post('/', upload.array('files'), async (req, res, next) => {
  try {
    const results = [];
    for (const file of req.files) {
      const dataBuffer = fs.readFileSync(file.path);
      let extractedText = '';
      try {
        const pdfParse = (await import('pdf-parse')).default;
        extractedText = (await pdfParse(dataBuffer)).text;
      } catch (e) { console.warn('PDF parse failed', e.message); }
      const doc = await prisma.document.create({ data: { userId: req.user.id, fileName: file.originalname, storagePath: file.path, extractedText } });
      results.push(doc);
    }
    res.status(201).json(results);
  } catch (e) { next(e); }
});
