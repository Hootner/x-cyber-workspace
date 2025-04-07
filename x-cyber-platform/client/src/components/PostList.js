import React from 'react';
import { Link } from 'react-router-dom';

function PostList({ posts }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">All Posts</h3>
      {posts.length === 0 ? (
        <p className="text-gray-600">No posts available.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post._id} className="p-4 bg-white rounded-lg shadow-md">
              <Link to={`/posts/${post._id}`} className="block">
                <h4 className="text-lg font-semibold text-gray-800">{post.title}</h4>
                <p className="text-gray-700 mt-1">{post.content}</p>
                <p className="text-gray-600 text-sm mt-2">By: {post.authorId?.username || 'Unknown'}</p>
                <p className="text-gray-600 text-sm">Posted on: {new Date(post.createdAt).toLocaleString()}</p>
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

export default PostList;