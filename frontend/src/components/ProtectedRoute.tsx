import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Commenting out auth check for testing
  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  // if (!user) {
  //   return <Navigate to="/auth" />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute; 