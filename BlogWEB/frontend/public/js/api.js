// API Configuration
const API_URL = window.APP_CONFIG?.API_URL 
  ? `${window.APP_CONFIG.API_URL}/api`
  : (window.location.hostname === 'localhost' 
      ? 'http://localhost:8080/api'
      : `${window.location.origin}/api`);

export const api = {
  // Auth endpoints
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(response);
  },

  // Comments endpoints
  getComments: async () => {
    const response = await fetch(`${API_URL}/comments`);
    return handleResponse(response);
  },

  createComment: async (content) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    return handleResponse(response);
  },

  deleteComment: async (commentId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  }
};

async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }
  
  return data;
}
