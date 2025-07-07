import express from 'express';
import { getChatsForUser, saveChatForUser } from '../models/Chat';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const chats = await getChatsForUser(userId);
  res.json({ chats });
});

router.post('/', async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { prompt, files, response } = req.body;
  await saveChatForUser(userId, { prompt, files, response });
  res.json({ success: true });
});

export default router; 