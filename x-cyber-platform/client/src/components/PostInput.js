import React, { useState } from 'react';

function PostInput({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required');
      return;
    }
    onSubmit({ title, content, image });
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Create a New Post</h3>
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
        />
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={loading}
          className="w-full border border-gray-300 rounded-lg px-4 py-2"
        />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
        )}
      </div>
      <div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </div>
    </div>
  );
}

export default PostInput;