import express from 'express';

export const router = express.Router();

const checklists = {
  'urgent-1151': {
    id: 'urgent-1151',
    title: 'Urgent 1151 Claim Checklist',
    items: [
      'Gather medical records',
      'Obtain service treatment records',
      'Document current symptoms',
      'Collect supporting statements'
    ]
  }
};

router.get('/:id', (req, res) => {
  const list = checklists[req.params.id];
  if (!list) return res.status(404).json({ error: 'Checklist not found' });
  res.json(list);
});
