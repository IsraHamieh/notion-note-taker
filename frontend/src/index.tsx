import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import KeysPage from './pages/KeysPage';
import ChatsPage from './pages/ChatsPage';
import ChatViewPage from './pages/ChatViewPage';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

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

function LoginPage() {
  return <Login />;
}

function RegisterPage() {
  return <Register />;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/keys"
                element={
                  <ProtectedRoute>
                    <KeysPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
              <Route path="/chats/:chat_id" element={<ProtectedRoute><ChatViewPage /></ProtectedRoute>} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();