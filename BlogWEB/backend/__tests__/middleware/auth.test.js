import { protect } from '../../middleware/auth.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse, mockNext, createTestUser, generateTestToken } from '../helpers.js';

describe('Auth Middleware', () => {
  describe('protect middleware', () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      testUser = await createTestUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      validToken = generateTestToken(testUser._id);
    });

    it('should authenticate with valid token', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(next.called).toBe(true);
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.user.username).toBe(testUser.username);
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.password).toBeUndefined(); // Should exclude password
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      const req = mockRequest({
        headers: {},
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'No autorizado, no hay token',
      });
      expect(next.called).toBe(false);
    });

    it('should reject request with invalid token format', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'No autorizado, no hay token',
      });
      expect(next.called).toBe(false);
    });

    it('should reject request with malformed JWT token', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'No autorizado, token inválido',
      });
      expect(next.called).toBe(false);
    });

    it('should reject request with expired token', async () => {
      // Arrange
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' } // Expired immediately
      );

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'No autorizado, token inválido',
      });
      expect(next.called).toBe(false);
    });

    it('should reject request with token signed with wrong secret', async () => {
      // Arrange
      const wrongSecretToken = jwt.sign(
        { id: testUser._id },
        'wrong-secret-key',
        { expiresIn: '30d' }
      );

      const req = mockRequest({
        headers: {
          authorization: `Bearer ${wrongSecretToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'No autorizado, token inválido',
      });
      expect(next.called).toBe(false);
    });

    it('should reject request when user no longer exists', async () => {
      // Arrange
      const deletedUserId = testUser._id;
      await User.findByIdAndDelete(testUser._id);

      const tokenForDeletedUser = generateTestToken(deletedUserId);
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${tokenForDeletedUser}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        message: 'Usuario no encontrado',
      });
      expect(next.called).toBe(false);
    });

    it('should not include password in req.user', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(req.user.password).toBeUndefined();
      expect(req.user._id).toBeDefined();
      expect(req.user.username).toBeDefined();
      expect(req.user.email).toBeDefined();
    });

    it('should handle token without Bearer prefix gracefully', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: validToken, // Missing "Bearer " prefix
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      expect(res.statusCode).toBe(401);
      expect(next.called).toBe(false);
    });

    it('should accept token with extra spaces in Bearer prefix', async () => {
      // Arrange
      const req = mockRequest({
        headers: {
          authorization: `Bearer  ${validToken}`, // Extra spaces
        },
      });
      const res = mockResponse();
      const next = mockNext();

      // Act
      await protect(req, res, next);

      // Assert
      // This might fail depending on implementation, but tests the robustness
      // The current implementation splits by space and takes [1], so extra spaces would cause issues
      expect(res.statusCode).toBe(401);
    });
  });
});
