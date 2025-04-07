import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPosts } from '../services/api';

function Profile() {
  const { user } = useContext(AuthContext) || {};
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.id) {
      return;
    }

    const fetchUserPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPosts();
        const userPosts = data.posts.filter(post => post.authorId && post.authorId._id === user.id);
        setPosts(userPosts);
      } catch (error) {
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  if (!user) {
    return <p className="text-gray-600">Please log in to view your profile.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{user.username}'s Profile</h2>
      <h3 className="text-xl font-semibold text-gray-800">Your Posts</h3>
      {loading && <p className="text-gray-600">Loading posts...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {posts.length === 0 && !loading ? (
        <p className="text-gray-600">You haven't created any posts yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post._id} className="p-4 bg-white rounded-lg shadow-md">
              <Link to={`/posts/${post._id}`} className="block">
                <h4 className="text-lg font-semibold text-gray-800">{post.title}</h4>
                <p className="text-gray-700 mt-1">{post.content}</p>
                <p className="text-gray-600 text-sm mt-2">Posted on: {new Date(post.createdAt).toLocaleString()}</p>
                <p className="text-gray-600 text-sm">Likes: {post.likes ? post.likes.length : 0}</p>
                <p className="text-gray-600 text-sm">Comments: {post.comments ? post.comments.length : 0}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Profile;