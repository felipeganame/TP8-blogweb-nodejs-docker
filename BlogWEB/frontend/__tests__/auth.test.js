import { auth } from '../public/js/auth.js';

describe('Auth Module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getUser', () => {
    it('should return null when no user is stored', () => {
      // Act
      const user = auth.getUser();

      // Assert
      // ⚠️ TEST INTENCIONALMENTE ROTO PARA DEMOSTRAR FALLO EN PIPELINE
      expect(user).toBe('este test debe fallar intencionalmente');
    });

    it('should return user object when user is stored', () => {
      // Arrange
      const userData = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        token: 'fake-token'
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Act
      const user = auth.getUser();

      // Assert
      expect(user).toEqual(userData);
      expect(user._id).toBe('123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should handle malformed JSON in localStorage gracefully', () => {
      // Arrange
      localStorage.setItem('user', 'invalid-json{');

      // Act & Assert
      expect(() => auth.getUser()).toThrow();
    });
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      // Act
      const token = auth.getToken();

      // Assert
      expect(token).toBeNull();
    });

    it('should return token when token is stored', () => {
      // Arrange
      const testToken = 'test-jwt-token-123';
      localStorage.setItem('token', testToken);

      // Act
      const token = auth.getToken();

      // Assert
      expect(token).toBe(testToken);
    });
  });

  describe('setUser', () => {
    it('should store user data in localStorage', () => {
      // Arrange
      const userData = {
        _id: '456',
        username: 'newuser',
        email: 'new@example.com',
        token: 'new-token-789'
      };

      // Act
      auth.setUser(userData);

      // Assert
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const storedToken = localStorage.getItem('token');
      
      expect(storedUser).toEqual(userData);
      expect(storedToken).toBe('new-token-789');
    });

    it('should store user and token separately', () => {
      // Arrange
      const userData = {
        _id: '789',
        username: 'testuser',
        email: 'test@example.com',
        token: 'separate-token'
      };

      // Act
      auth.setUser(userData);

      // Assert
      expect(localStorage.getItem('user')).toBe(JSON.stringify(userData));
      expect(localStorage.getItem('token')).toBe('separate-token');
    });

    it('should overwrite existing user data', () => {
      // Arrange
      const oldUserData = {
        _id: '111',
        username: 'olduser',
        email: 'old@example.com',
        token: 'old-token'
      };
      const newUserData = {
        _id: '222',
        username: 'newuser',
        email: 'new@example.com',
        token: 'new-token'
      };

      // Act
      auth.setUser(oldUserData);
      auth.setUser(newUserData);

      // Assert
      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser).toEqual(newUserData);
      expect(storedUser._id).toBe('222');
    });
  });

  describe('logout', () => {
    it('should remove user and token from localStorage', () => {
      // Arrange
      const userData = {
        _id: '999',
        username: 'testuser',
        email: 'test@example.com',
        token: 'test-token'
      };
      auth.setUser(userData);

      // Act
      auth.logout();

      // Assert
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should not throw error when no data exists', () => {
      // Arrange - nothing in localStorage

      // Act & Assert
      expect(() => auth.logout()).not.toThrow();
    });

    it('should remove only user and token, not other localStorage items', () => {
      // Arrange
      localStorage.setItem('user', JSON.stringify({ id: '1' }));
      localStorage.setItem('token', 'token');
      localStorage.setItem('otherData', 'should-remain');

      // Act
      auth.logout();

      // Assert
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('otherData')).toBe('should-remain');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      // Act
      const isAuth = auth.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });

    it('should return true when token exists', () => {
      // Arrange
      localStorage.setItem('token', 'valid-token');

      // Act
      const isAuth = auth.isAuthenticated();

      // Assert
      expect(isAuth).toBe(true);
    });

    it('should return false when token is removed', () => {
      // Arrange
      localStorage.removeItem('token');

      // Act
      const isAuth = auth.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });

    it('should return false when token is empty string', () => {
      // Arrange
      localStorage.setItem('token', '');

      // Act
      const isAuth = auth.isAuthenticated();

      // Assert
      expect(isAuth).toBe(false);
    });

    it('should return true for any non-empty token', () => {
      // Arrange
      localStorage.setItem('token', 'any-string-value');

      // Act
      const isAuth = auth.isAuthenticated();

      // Assert
      expect(isAuth).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete login flow', () => {
      // Arrange
      const loginResponse = {
        _id: 'user-123',
        username: 'integrationuser',
        email: 'integration@example.com',
        token: 'integration-token'
      };

      // Act
      auth.setUser(loginResponse);

      // Assert
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getUser()._id).toBe('user-123');
      expect(auth.getToken()).toBe('integration-token');
    });

    it('should handle complete logout flow', () => {
      // Arrange
      const userData = {
        _id: 'user-456',
        username: 'logoutuser',
        email: 'logout@example.com',
        token: 'logout-token'
      };
      auth.setUser(userData);
      expect(auth.isAuthenticated()).toBe(true);

      // Act
      auth.logout();

      // Assert
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getUser()).toBeNull();
      expect(auth.getToken()).toBeNull();
    });

    it('should persist data across function calls', () => {
      // Arrange
      const userData = {
        _id: 'persist-123',
        username: 'persistuser',
        email: 'persist@example.com',
        token: 'persist-token'
      };

      // Act
      auth.setUser(userData);
      const user1 = auth.getUser();
      const token1 = auth.getToken();
      const isAuth1 = auth.isAuthenticated();

      const user2 = auth.getUser();
      const token2 = auth.getToken();
      const isAuth2 = auth.isAuthenticated();

      // Assert
      expect(user1).toEqual(user2);
      expect(token1).toBe(token2);
      expect(isAuth1).toBe(isAuth2);
      expect(isAuth1).toBe(true);
    });
  });
});
