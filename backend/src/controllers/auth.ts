import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../models/User';

// Generate JWT Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send verification email
const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your email',
    html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`,
  });
};

// Register with email
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      email,
      password,
      verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);

    const token = generateToken(user._id);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login with email
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    const token = generateToken(user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// Google OAuth callback
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { profile } = req.user as any;
    
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        email: profile.emails[0].value,
        googleId: profile.id,
        isVerified: true,
      });
    }

    const token = generateToken(user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
  }
}; 