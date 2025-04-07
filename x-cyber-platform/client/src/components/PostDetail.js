import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import { getPost, updatePost, deletePost, likePost, addComment, editComment, deleteComment } from '../services/api';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const socket = useSocket();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleteCommentConfirmOpen, setIsDeleteCommentConfirmOpen] = useState(null);
  const [isEditCommentOpen, setIsEditCommentOpen] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPost(id);
        setPost(data.post);
        setEditTitle(data.post.title || '');
        setEditContent(data.post.content || '');
      } catch (error) {
        setError(error.message);
        setPost(null);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('joinPost', id);

    socket.on('commentAdded', (newComment) => {
      setPost((prevPost) => ({
        ...prevPost,
        comments: [...prevPost.comments, newComment],
      }));
      toast.info('New comment added!');
    });

    socket.on('commentUpdated', ({ commentId, text }) => {
      setPost((prevPost) => ({
        ...prevPost,
        comments: prevPost.comments.map((comment) =>
          comment._id === commentId ? { ...comment, text } : comment
        ),
      }));
      toast.info('Comment updated!');
    });

    socket.on('likeUpdated', (updatedLikes) => {
      setPost((prevPost) => ({
        ...prevPost,
        likes: updatedLikes,
      }));
      toast.info('Likes updated!');
    });

    return () => {
      socket.off('commentAdded');
      socket.off('commentUpdated');
      socket.off('likeUpdated');
    };
  }, [socket, id]);

  const handleDelete = async () => {
    if (!user) {
      setError('Please log in to delete this post');
      toast.error('Please log in to delete this post');
      return;
    }

    try {
      await deletePost(id, token);
      navigate('/posts', { state: { message: 'Post deleted successfully' } });
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const handleEdit = async () => {
    if (!user) {
      setError('Please log in to edit this post');
      toast.error('Please log in to edit this post');
      return;
    }

    try {
      const data = await updatePost(id, editTitle, editContent, token);
      setPost(data.post);
      setIsEditing(false);
      setError(null);
      navigate('/posts', { state: { message: 'Post updated successfully' } });
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const handleLike = async () => {
    if (!user) {
      setError('Please log in to like this post');
      toast.error('Please log in to like this post');
      return;
    }

    try {
      const data = await likePost(id, token);
      setPost(data.post);
      setError(null);
      socket.emit('newLike', { postId: id, likes: data.post.likes });
      toast.success(data.message);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const handleComment = async () => {
    if (!user) {
      setError('Please log in to comment on this post');
      toast.error('Please log in to comment on this post');
      return;
    }

    if (!commentText.trim()) {
      setError('Comment cannot be empty');
      toast.error('Comment cannot be empty');
      return;
    }

    setCommentLoading(true);
    setError(null);
    try {
      const data = await addComment(id, commentText, token);
      setPost(data.post);
      const newComment = data.post.comments[data.post.comments.length - 1];
      socket.emit('newComment', { postId: id, comment: newComment });
      setCommentText('');
      setError(null);
      toast.success('Comment added successfully!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!user) {
      setError('Please log in to edit this comment');
      toast.error('Please log in to edit this comment');
      return;
    }

    if (!editCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const data = await editComment(id, commentId, editCommentText, token);
      setPost(data.post);
      socket.emit('commentUpdated', { postId: id, commentId, text: editCommentText });
      setIsEditCommentOpen(null);
      setEditCommentText('');
      toast.success('Comment updated successfully!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) {
      setError('Please log in to delete this comment');
      toast.error('Please log in to delete this comment');
      return;
    }

    try {
      const data = await deleteComment(id, commentId, token);
      setPost(data.post);
      setError(null);
      toast.success('Comment deleted successfully!');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading post...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!post) {
    return <p className="text-gray-600">Post not found.</p>;
  }

  const isAuthor = user && post.authorId && post.authorId._id === user.id;
  const hasLiked = user && post.likes && post.likes.includes(user.id);

  return (
    <div className="space-y-6">
      {isEditing ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800">Edit Post</h2>
          <div>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
          <p className="text-gray-700">{post.content}</p>
          <p className="text-gray-600">By: {post.authorId?.username || 'Unknown'}</p>
          <p className="text-gray-600">Posted on: {new Date(post.createdAt).toLocaleString()}</p>
          <p className="text-gray-600">Likes: {post.likes ? post.likes.length : 0}</p>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleLike}
              className={`px-4 py-2 rounded-lg text-white ${hasLiked ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {hasLiked ? 'Unlike' : 'Like'}
            </button>
            {isAuthor && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Edit Post
                </button>
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  Delete Post
                </button>
                {isDeleteConfirmOpen && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <p className="text-gray-800 mb-4">Are you sure you want to delete this post?</p>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleDelete}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setIsDeleteConfirmOpen(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <a href="/posts" className="text-blue-500 hover:underline">Back to Posts</a>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
            {post.comments && post.comments.length > 0 ? (
              <ul className="space-y-4 mt-4">
                {post.comments.map((comment) => (
                  <li key={comment._id} className="border-t border-gray-200 pt-4">
                    {isEditCommentOpen === comment._id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditComment(comment._id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setIsEditCommentOpen(null);
                              setEditCommentText('');
                            }}
                            className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700">{comment.text}</p>
                        <p className="text-gray-600 text-sm">By: {comment.authorId?.username || 'Unknown'}</p>
                        <p className="text-gray-600 text-sm">Posted on: {new Date(comment.createdAt).toLocaleString()}</p>
                        {user && comment.authorId && comment.authorId._id === user.id && (
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setIsEditCommentOpen(comment._id);
                                setEditCommentText(comment.text);
                              }}
                              className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 text-sm"
                            >
                              Edit Comment
                            </button>
                            <button
                              onClick={() => setIsDeleteCommentConfirmOpen(comment._id)}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
                            >
                              Delete Comment
                            </button>
                            {isDeleteCommentConfirmOpen === comment._id && (
                              <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                                <p className="text-gray-800 mb-2">Are you sure you want to delete this comment?</p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      handleDeleteComment(comment._id);
                                      setIsDeleteCommentConfirmOpen(null);
                                    }}
                                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                                  >
                                    Yes, Delete
                                  </button>
                                  <button
                                    onClick={() => setIsDeleteCommentConfirmOpen(null)}
                                    className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 mt-2">No comments yet.</p>
            )}
            {user && (
              <div className="mt-6">
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                  disabled={commentLoading}
                />
                <div className="mt-2">
                  <button
                    onClick={handleComment}
                    className={`bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 ${commentLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={commentLoading}
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PostDetail;