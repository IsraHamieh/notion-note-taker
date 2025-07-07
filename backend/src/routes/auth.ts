import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /register - create user and return JWT
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// POST /login - check credentials and return JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// GET /me - get user profile info
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ email: user.email });
});

// GET /keys - get user's API keys
router.get('/keys', authenticateJWT, async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    anthropicKey: user.anthropicKey || '',
    tavilyKey: user.tavilyKey || '',
    notionKey: user.notionKey || '',
    llamaKey: user.llamaKey || '',
  });
});

// POST /keys - update user's API keys
router.post('/keys', authenticateJWT, async (req: AuthRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { anthropicKey, tavilyKey, notionKey, llamaKey } = req.body;
  if (anthropicKey !== undefined) user.anthropicKey = anthropicKey;
  if (tavilyKey !== undefined) user.tavilyKey = tavilyKey;
  if (notionKey !== undefined) user.notionKey = notionKey;
  if (llamaKey !== undefined) user.llamaKey = llamaKey;
  await user.save();
  res.json({ success: true });
});

// POST /logout - logout user
router.post('/logout', authenticateJWT, async (req: AuthRequest, res) => {
  // For JWT-based auth, we don't need to invalidate the token on the server
  // The client will remove the token from localStorage
  // In a production app, you might want to implement a blacklist or use refresh tokens
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router; 