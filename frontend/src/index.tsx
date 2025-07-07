import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import KeysPage from './pages/KeysPage';
import ChatsPage from './pages/ChatsPage';
import ChatViewPage from './pages/ChatViewPage';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const showSidebar =
    location.pathname === '/' ||
    location.pathname === '/chats' ||
    location.pathname.startsWith('/chats/');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <Navbar />
      <div className="flex">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(open => !open)} />
        )}
        <div
          className={`min-h-screen bg-gray-50 pt-8 px-4`}
          style={{
            width: showSidebar ? `calc(100vw - ${sidebarOpen ? '14rem' : '3rem'})` : '100vw',
            marginLeft: showSidebar ? (sidebarOpen ? '14rem' : '3rem') : 0,
            marginTop: '4rem',
            transition: 'margin-left 0.2s cubic-bezier(0.4,0,0.2,1), width 0.2s cubic-bezier(0.4,0,0.2,1)',
            overflowX: 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/keys" element={<KeysPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/chats/:chat_id" element={<ChatViewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();