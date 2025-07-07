import express from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // Forward to Python AI backend
  try {
    const aiRes = await axios.post('http://localhost:5000/api/process', req.body, {
      headers: { 'Content-Type': 'application/json' },
    });
    res.json(aiRes.data);
  } catch (err: any) {
    res.status(500).json({ error: 'AI backend error', details: err.message });
  }
});

export default router; 