import request from 'supertest';
import express from 'express';
import commentRoutes from '../../routes/comments.js';
import User from '../../models/User.js';
import Comment from '../../models/Comment.js';
import { createAuthenticatedUser } from '../helpers.js';

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api/comments', commentRoutes);

describe('Comment Routes', () => {
  describe('GET /api/comments', () => {
    it('should return empty array when no comments exist', async () => {
      // Act
      const response = await request(app).get('/api/comments');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should return all comments', async () => {
      // Arrange
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      await Comment.create({
        content: 'First comment',
        author: user._id,
        authorUsername: user.username,
      });

      await Comment.create({
        content: 'Second comment',
        author: user._id,
        authorUsername: user.username,
      });

      // Act
      const response = await request(app).get('/api/comments');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('author');
      expect(response.body[0]).toHaveProperty('authorUsername');
    });

    it('should return comments sorted by _id descending (newest first)', async () => {
      // Arrange
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const comment1 = await Comment.create({
        content: 'First comment',
        author: user._id,
        authorUsername: user.username,
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const comment2 = await Comment.create({
        content: 'Second comment',
        author: user._id,
        authorUsername: user.username,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const comment3 = await Comment.create({
        content: 'Third comment',
        author: user._id,
        authorUsername: user.username,
      });

      // Act
      const response = await request(app).get('/api/comments');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body[0].content).toBe('Third comment');
      expect(response.body[1].content).toBe('Second comment');
      expect(response.body[2].content).toBe('First comment');
    });

    it('should not require authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/comments')
        .set('Authorization', ''); // No token

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/comments', () => {
    let authUser;
    let authToken;

    beforeEach(async () => {
      const auth = await createAuthenticatedUser({
        username: 'commentauthor',
        email: 'author@example.com',
        password: 'password123',
      });
      authUser = auth.user;
      authToken = auth.token;
    });

    it('should create a comment with valid authentication', async () => {
      // Arrange
      const commentData = {
        content: 'This is a test comment',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.author).toBe(authUser._id.toString());
      expect(response.body.authorUsername).toBe(authUser.username);

      // Verify comment was created in database
      const commentInDb = await Comment.findById(response.body._id);
      expect(commentInDb).toBeDefined();
      expect(commentInDb.content).toBe(commentData.content);
    });

    it('should return 401 without authentication token', async () => {
      // Arrange
      const commentData = {
        content: 'This is a test comment',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .send(commentData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return validation error for empty content', async () => {
      // Arrange
      const commentData = {
        content: '',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('contenido es requerido');
    });

    it('should return validation error for content exceeding 1000 characters', async () => {
      // Arrange
      const commentData = {
        content: 'a'.repeat(1001),
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0].msg).toContain('1000 caracteres');
    });

    it('should trim whitespace from content', async () => {
      // Arrange
      const commentData = {
        content: '  Test comment with spaces  ',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Test comment with spaces');
    });

    it('should reject content with only whitespace', async () => {
      // Arrange
      const commentData = {
        content: '     ',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should automatically set author from authenticated user', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      // Assert
      expect(response.body.author).toBe(authUser._id.toString());
      expect(response.body.authorUsername).toBe(authUser.username);
    });

    it('should reject request with invalid token', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
      };

      // Act
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', 'Bearer invalid.token.here')
        .send(commentData);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let authUser;
    let authToken;
    let otherUser;
    let otherToken;

    beforeEach(async () => {
      const auth1 = await createAuthenticatedUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123',
      });
      authUser = auth1.user;
      authToken = auth1.token;

      const auth2 = await createAuthenticatedUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123',
      });
      otherUser = auth2.user;
      otherToken = auth2.token;
    });

    it('should delete own comment', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'My comment to delete',
        author: authUser._id,
        authorUsername: authUser.username,
      });

      // Act
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Comentario eliminado');

      // Verify comment was deleted from database
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'Test comment',
        author: authUser._id,
        authorUsername: authUser.username,
      });

      // Act
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`);

      // Assert
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent comment', async () => {
      // Arrange
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      // Act
      const response = await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comentario no encontrado');
    });

    it('should return 403 when trying to delete another user\'s comment', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'Other user comment',
        author: otherUser._id,
        authorUsername: otherUser.username,
      });

      // Act
      const response = await request(app)
        .delete(`/api/comments/${comment._id}`)
        .set('Authorization', `Bearer ${authToken}`); // Using authUser token

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No autorizado');

      // Verify comment was NOT deleted
      const stillExists = await Comment.findById(comment._id);
      expect(stillExists).toBeDefined();
    });

    it('should return 500 for invalid comment ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format';

      // Act
      const response = await request(app)
        .delete(`/api/comments/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(500);
    });

    it('should allow user to delete their own comment even if others exist', async () => {
      // Arrange
      const myComment = await Comment.create({
        content: 'My comment',
        author: authUser._id,
        authorUsername: authUser.username,
      });

      await Comment.create({
        content: 'Other comment',
        author: otherUser._id,
        authorUsername: otherUser.username,
      });

      // Act
      const response = await request(app)
        .delete(`/api/comments/${myComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);

      // Verify only the correct comment was deleted
      const deletedComment = await Comment.findById(myComment._id);
      expect(deletedComment).toBeNull();

      const remainingComments = await Comment.find();
      expect(remainingComments).toHaveLength(1);
    });
  });
});
