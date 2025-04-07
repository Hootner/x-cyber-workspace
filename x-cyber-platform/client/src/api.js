const API_URL = 'http://localhost:3000/api';

const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (response.status === 401) {
    // Token expired or invalid, trigger logout
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(data.message || `Failed to ${method.toLowerCase()} ${endpoint}`);
  }

  return data;
};

export const registerUser = (username, password) =>
  apiRequest('/auth/register', 'POST', { username, password });

export const loginUser = (username, password) =>
  apiRequest('/auth/login', 'POST', { username, password });

export const getPosts = (page = 1, limit = 10) =>
  apiRequest(`/posts?page=${page}&limit=${limit}`);

export const getPost = (id) => apiRequest(`/posts/${id}`);

export const createPost = (title, content, token) =>
  apiRequest('/posts', 'POST', { title, content }, token);

export const updatePost = (id, title, content, token) =>
  apiRequest(`/posts/${id}`, 'PUT', { title, content }, token);

export const deletePost = (id, token) =>
  apiRequest(`/posts/${id}`, 'DELETE', null, token);

export const likePost = (id, token) =>
  apiRequest(`/posts/${id}/like`, 'POST', null, token);

export const addComment = (id, text, token) =>
  apiRequest(`/posts/${id}/comment`, 'POST', { text }, token);

export const editComment = (id, commentId, text, token) =>
  apiRequest(`/posts/${id}/comment/${commentId}`, 'PUT', { text }, token);

export const deleteComment = (id, commentId, token) =>
  apiRequest(`/posts/${id}/comment/${commentId}`, 'DELETE', null, token);