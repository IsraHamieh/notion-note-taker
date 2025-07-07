import express from 'express';
import fetch from 'node-fetch';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Forward to Python AI backend
  const aiRes = await fetch('http://localhost:5000/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  const data = await aiRes.json();
  res.json(data);
});

export default router; 