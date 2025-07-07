import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Chat {
  chat_id: string;
  prompt: string;
  files: { name: string; url?: string }[];
  response: string;
  timestamp: string;
}

const ChatViewPage: React.FC = () => {
  const { chat_id } = useParams<{ chat_id: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/chats/${chat_id}`, { credentials: 'include' });
        const data = await resp.json();
        if (data.error) {
          setError(data.error);
        } else {
          setChat(data);
        }
      } catch (err) {
        setError('Failed to load chat.');
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [chat_id]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <Link to="/chats" className="text-indigo-600 hover:underline text-sm">&larr; Back to Chats</Link>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {chat && !loading && !error && (
        <div>
          <h2 className="text-xl font-bold mb-2">Prompt</h2>
          <div className="mb-4 whitespace-pre-line">{chat.prompt}</div>
          <h3 className="font-semibold mb-1">Files</h3>
          <ul className="mb-4 list-disc list-inside">
            {chat.files && chat.files.length > 0 ? (
              chat.files.map((file, idx) => (
                <li key={idx}>
                  {file.url ? (
                    <a href={file.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{file.name}</a>
                  ) : (
                    <span>{file.name}</span>
                  )}
                </li>
              ))
            ) : (
              <li className="text-gray-500">No files uploaded.</li>
            )}
          </ul>
          <h3 className="font-semibold mb-1">Response</h3>
          <div className="whitespace-pre-line bg-gray-100 p-3 rounded text-gray-800">{chat.response}</div>
          <div className="mt-4 text-xs text-gray-500">{new Date(chat.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
};

export default ChatViewPage; 