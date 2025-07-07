import express from 'express';
import fetch from 'node-fetch';
import { getUserNotionKey } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/search', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const notionKey = await getUserNotionKey(userId);
  if (!notionKey) return res.status(403).json({ error: 'No Notion integration key' });

  const { query } = req.body;
  const notionRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query }),
  });
  const data = await notionRes.json();
  res.json(data);
});

export default router; 