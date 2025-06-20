import express from 'express';
import passport from 'passport';
import { register, login, verifyEmail, googleCallback } from '../controllers/auth';
import { protect } from '../middleware/auth';

const router = express.Router();

// Email authentication routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  googleCallback
);

// Protected route example
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

export default router; 