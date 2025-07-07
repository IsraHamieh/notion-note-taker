import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface ChatMeta {
  chat_id: string;
  prompt: string;
  timestamp: string;
}

const ChatsPage: React.FC = () => {
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/chats', { credentials: 'include' });
        const data = await resp.json();
        if (data.chats) {
          setChats(data.chats);
        } else {
          setChats([]);
        }
      } catch (err) {
        setError('Failed to load chats.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Your Chats</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <ul className="divide-y divide-gray-200">
          {chats.length === 0 && <li className="py-4 text-gray-500">No chats found.</li>}
          {chats.map(chat => (
            <li key={chat.chat_id} className="py-4 flex items-center justify-between">
              <Link to={`/chats/${chat.chat_id}`} className="text-indigo-600 hover:underline">
                <span className="font-medium">{chat.prompt.slice(0, 60)}{chat.prompt.length > 60 ? '...' : ''}</span>
              </Link>
              <span className="text-xs text-gray-500 ml-4">{new Date(chat.timestamp).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatsPage; 