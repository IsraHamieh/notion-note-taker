import mongoose from 'mongoose';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(32); // 32 bytes for AES-256
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  if (!text) return '';
  const [ivHex, tagHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  anthropicKey: { type: String, get: decrypt, set: encrypt },
  notionKey: { type: String, get: decrypt, set: encrypt },
  llamaKey: { type: String, get: decrypt, set: encrypt },
  tavilyKey: { type: String, get: decrypt, set: encrypt },
});

// Ensure getters are used when converting to objects/JSON
userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

export const User = mongoose.model('User', userSchema);

export async function getUserNotionKey(userId: string) {
  const user = await User.findById(userId);
  return user?.notionKey;
} 