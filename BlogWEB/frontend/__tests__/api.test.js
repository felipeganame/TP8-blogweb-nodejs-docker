import { api } from '../public/js/api.js';

describe('API Module', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Reset fetch mock
    global.fetch = undefined;
  });

  describe('register', () => {
    it('should make POST request to register endpoint', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      };
      const mockResponse = {
        _id: '123',
        username: 'newuser',
        email: 'new@example.com',
        token: 'fake-token'
      };

      global.fetch = async (url, options) => ({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await api.register(userData);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed registration', async () => {
      // Arrange
      const userData = {
        username: 'user',
        email: 'user@example.com',
        password: 'pass'
      };
      const errorMessage = 'El usuario debe tener al menos 3 caracteres';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.register(userData)).rejects.toThrow(errorMessage);
    });

    it('should send correct headers and body', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      let capturedUrl, capturedOptions;

      global.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.register(userData);

      // Assert
      expect(capturedUrl).toContain('/auth/register');
      expect(capturedOptions.method).toBe('POST');
      expect(capturedOptions.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(capturedOptions.body)).toEqual(userData);
    });
  });

  describe('login', () => {
    it('should make POST request to login endpoint', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockResponse = {
        _id: '456',
        username: 'testuser',
        email: 'test@example.com',
        token: 'auth-token'
      };

      global.fetch = async () => ({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await api.login(credentials);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpass'
      };
      const errorMessage = 'Credenciales inválidas';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.login(credentials)).rejects.toThrow(errorMessage);
    });

    it('should send correct data to login endpoint', async () => {
      // Arrange
      const credentials = {
        email: 'user@example.com',
        password: 'userpass'
      };
      let capturedOptions;

      global.fetch = async (url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.login(credentials);

      // Assert
      expect(capturedOptions.method).toBe('POST');
      expect(JSON.parse(capturedOptions.body)).toEqual(credentials);
    });
  });

  describe('getComments', () => {
    it('should fetch all comments', async () => {
      // Arrange
      const mockComments = [
        {
          _id: '1',
          content: 'First comment',
          author: 'user1',
          authorUsername: 'User One'
        },
        {
          _id: '2',
          content: 'Second comment',
          author: 'user2',
          authorUsername: 'User Two'
        }
      ];

      global.fetch = async () => ({
        ok: true,
        json: async () => mockComments
      });

      // Act
      const result = await api.getComments();

      // Assert
      expect(result).toEqual(mockComments);
      expect(result).toHaveLength(2);
    });

    it('should make GET request to comments endpoint', async () => {
      // Arrange
      let capturedUrl, capturedOptions;

      global.fetch = async (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
        return {
          ok: true,
          json: async () => []
        };
      };

      // Act
      await api.getComments();

      // Assert
      expect(capturedUrl).toContain('/comments');
      expect(capturedOptions).toBeUndefined(); // GET request has no options
    });

    it('should throw error when fetch fails', async () => {
      // Arrange
      const errorMessage = 'Error al obtener comentarios';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.getComments()).rejects.toThrow(errorMessage);
    });
  });

  describe('createComment', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token-123');
    });

    it('should create a comment with authentication', async () => {
      // Arrange
      const content = 'New test comment';
      const mockResponse = {
        _id: '999',
        content: content,
        author: 'user123',
        authorUsername: 'Test User'
      };

      global.fetch = async () => ({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await api.createComment(content);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    it('should include authorization header', async () => {
      // Arrange
      const content = 'Comment with auth';
      const token = 'my-auth-token';
      localStorage.setItem('token', token);
      let capturedOptions;

      global.fetch = async (url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.createComment(content);

      // Assert
      expect(capturedOptions.headers['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should send content in request body', async () => {
      // Arrange
      const content = 'My comment content';
      let capturedOptions;

      global.fetch = async (url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.createComment(content);

      // Assert
      expect(capturedOptions.method).toBe('POST');
      expect(JSON.parse(capturedOptions.body)).toEqual({ content });
    });

    it('should throw error when unauthorized', async () => {
      // Arrange
      const content = 'Unauthorized comment';
      const errorMessage = 'No autorizado';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.createComment(content)).rejects.toThrow(errorMessage);
    });
  });

  describe('deleteComment', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token-456');
    });

    it('should delete a comment by ID', async () => {
      // Arrange
      const commentId = 'comment-123';
      const mockResponse = {
        message: 'Comentario eliminado'
      };

      global.fetch = async () => ({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await api.deleteComment(commentId);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    it('should include comment ID in URL', async () => {
      // Arrange
      const commentId = 'specific-comment-id';
      let capturedUrl;

      global.fetch = async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.deleteComment(commentId);

      // Assert
      expect(capturedUrl).toContain(`/comments/${commentId}`);
    });

    it('should include authorization header', async () => {
      // Arrange
      const commentId = 'comment-789';
      const token = 'delete-auth-token';
      localStorage.setItem('token', token);
      let capturedOptions;

      global.fetch = async (url, options) => {
        capturedOptions = options;
        return {
          ok: true,
          json: async () => ({})
        };
      };

      // Act
      await api.deleteComment(commentId);

      // Assert
      expect(capturedOptions.method).toBe('DELETE');
      expect(capturedOptions.headers['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should throw error when deletion fails', async () => {
      // Arrange
      const commentId = 'non-existent';
      const errorMessage = 'Comentario no encontrado';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.deleteComment(commentId)).rejects.toThrow(errorMessage);
    });

    it('should throw error when user not authorized to delete', async () => {
      // Arrange
      const commentId = 'other-user-comment';
      const errorMessage = 'No autorizado para eliminar este comentario';

      global.fetch = async () => ({
        ok: false,
        json: async () => ({ message: errorMessage })
      });

      // Act & Assert
      await expect(api.deleteComment(commentId)).rejects.toThrow(errorMessage);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      global.fetch = async () => {
        throw new Error('Network error');
      };

      // Act & Assert
      await expect(api.getComments()).rejects.toThrow();
    });

    it('should handle response without message', async () => {
      // Arrange
      global.fetch = async () => ({
        ok: false,
        json: async () => ({})
      });

      // Act & Assert
      await expect(api.login({ email: 'test', password: 'test' }))
        .rejects.toThrow('Error en la petición');
    });

    it('should handle invalid JSON response', async () => {
      // Arrange
      global.fetch = async () => ({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      // Act & Assert
      await expect(api.getComments()).rejects.toThrow('Invalid JSON');
    });
  });
});
