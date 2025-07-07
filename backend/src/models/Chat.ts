import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: String,
  files: Array,
  response: String,
  createdAt: { type: Date, default: Date.now },
});

export const Chat = mongoose.model('Chat', chatSchema);

export async function getChatsForUser(userId: string) {
  return Chat.find({ userId }).sort({ createdAt: -1 });
}

export async function saveChatForUser(userId: string, chat: any) {
  return Chat.create({ ...chat, userId });
} 