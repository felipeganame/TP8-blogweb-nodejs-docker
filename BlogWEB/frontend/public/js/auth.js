export const auth = {
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  setUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.token);
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!auth.getToken();
  }
};
