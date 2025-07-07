import React from 'react';
import { Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  // TODO: Replace with real user info from context/auth
  const user = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="mb-4">
        <div className="font-semibold">Name:</div>
        <div className="mb-2">{user.name}</div>
        <div className="font-semibold">Email:</div>
        <div>{user.email}</div>
      </div>
      <Link
        to="/keys"
        className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Manage API Keys
      </Link>
    </div>
  );
};

export default ProfilePage; 