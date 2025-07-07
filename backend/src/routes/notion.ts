import express from 'express';
import { Client } from '@notionhq/client';
import { getUserNotionKey } from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post('/search', authenticateJWT, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const notionKey = await getUserNotionKey(userId);
  if (!notionKey) return res.status(403).json({ error: 'No Notion integration key' });

  const { query } = req.body;
  const notion = new Client({ auth: notionKey });

  try {
    const response = await notion.search({
      query,
      sort: {
        direction: 'ascending',
        timestamp: 'last_edited_time'
      },
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Notion API error', details: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router; 