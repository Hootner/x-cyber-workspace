import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800">Welcome to X-Cyber</h2>
      {user ? (
        <p className="text-gray-700">
          Hello, {user.username}! Explore the <a href="/posts" className="text-blue-500 hover:underline">Posts</a> page to see and create posts.
        </p>
      ) : (
        <p className="text-gray-700">
          Please <a href="/login" className="text-blue-500 hover:underline">log in</a> or <a href="/register" className="text-blue-500 hover:underline">register</a> to get started.
        </p>
      )}
    </div>
  );
}

export default Home;