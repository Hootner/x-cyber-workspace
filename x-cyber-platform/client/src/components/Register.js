import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { registerUser } from '../services/api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Username and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser(username, password);
      login(data.user, data.token);
      toast.success('Registration successful!');
      setUsername('');
      setPassword('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Register</h2>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </div>
  );
}

export default Register;