import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.js';
import User from '../../models/User.js';

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('username', userData.username);
      expect(response.body).toHaveProperty('email', userData.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body).not.toHaveProperty('password');

      // Verify user was created in database
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).toBeDefined();
      expect(userInDb.username).toBe(userData.username);
    });

    it('should return validation error for short username', async () => {
      // Arrange
      const userData = {
        username: 'ab', // Less than 3 characters
        email: 'test@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors[0].msg).toContain('al menos 3 caracteres');
    });

    it('should return validation error for invalid email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('Email inválido');
    });

    it('should return validation error for short password', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('al menos 6 caracteres');
    });

    it('should return error for duplicate email', async () => {
      // Arrange
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData);

      // Try to create second user with same email
      const duplicateData = {
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Usuario o email ya existe');
    });

    it('should return error for duplicate username', async () => {
      // Arrange
      const userData = {
        username: 'sameusername',
        email: 'user1@example.com',
        password: 'password123',
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData);

      // Try to create second user with same username
      const duplicateData = {
        username: 'sameusername',
        email: 'user2@example.com',
        password: 'password456',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Usuario o email ya existe');
    });

    it('should trim and lowercase email on registration', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'TEST@EXAMPLE.COM', // Uppercase but valid email format
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return all validation errors at once', async () => {
      // Arrange
      const userData = {
        username: 'ab', // Too short
        email: 'invalid', // Invalid email
        password: '123', // Too short
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveLength(3);
    });

    it('should require all fields', async () => {
      // Arrange
      const userData = {};

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await User.create({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should login successfully with correct credentials', async () => {
      // Arrange
      const credentials = {
        email: 'login@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('username', 'loginuser');
      expect(response.body).toHaveProperty('email', 'login@example.com');
      expect(response.body).toHaveProperty('token');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return error for non-existent email', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
    });

    it('should return error for incorrect password', async () => {
      // Arrange
      const credentials = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Credenciales inválidas');
    });

    it('should return validation error for invalid email format', async () => {
      // Arrange
      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('Email inválido');
    });

    it('should return validation error for empty password', async () => {
      // Arrange
      const credentials = {
        email: 'login@example.com',
        password: '',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle case-insensitive email login', async () => {
      // Arrange
      const credentials = {
        email: 'LOGIN@EXAMPLE.COM', // Uppercase
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('login@example.com');
    });

    it('should return JWT token on successful login', async () => {
      // Arrange
      const credentials = {
        email: 'login@example.com',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should require both email and password', async () => {
      // Arrange
      const credentials = {
        email: 'login@example.com',
      };

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
