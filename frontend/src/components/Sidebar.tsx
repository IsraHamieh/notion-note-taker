import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface Chat {
  chat_id: string;
  prompt: string;
  timestamp: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const resp = await fetch('/api/chats', { credentials: 'include' });
        const data = await resp.json();
        setChats(data.chats || []);
      } catch {
        setChats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [location]);

  return (
    <aside className={isOpen ? '' : 'collapsed'}>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        type="button"
      >
        {isOpen ? (
          <span aria-hidden="true">&#x25C0;</span> // ◀
        ) : (
          <span aria-hidden="true">&#x25B6;</span> // ▶
        )}
      </button>
      {isOpen && (
        <div>
          <h2>Chats</h2>
          {loading ? (
            <div>Loading...</div>
          ) : chats.length > 0 ? (
            <ul>
              {chats.map(chat => (
                <li key={chat.chat_id}>
                  <Link
                    to={`/chats/${chat.chat_id}`}
                    title={chat.prompt}
                  >
                    {chat.prompt.slice(0, 32)}{chat.prompt.length > 32 ? '...' : ''}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              to="/"
            >
              New Chat
            </Link>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;