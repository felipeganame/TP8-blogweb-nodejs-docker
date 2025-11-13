import Comment from '../../models/Comment.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';

describe('Comment Model', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for comment author
    testUser = await User.create({
      username: 'testauthor',
      email: 'author@example.com',
      password: 'password123',
    });
  });

  describe('Comment Creation', () => {
    it('should create a valid comment', async () => {
      // Arrange
      const commentData = {
        content: 'This is a test comment',
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act
      const comment = await Comment.create(commentData);

      // Assert
      expect(comment._id).toBeDefined();
      expect(comment.content).toBe(commentData.content);
      expect(comment.author.toString()).toBe(testUser._id.toString());
      expect(comment.authorUsername).toBe(testUser.username);
      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
    });

    it('should trim comment content', async () => {
      // Arrange
      const commentData = {
        content: '  This has spaces around it  ',
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act
      const comment = await Comment.create(commentData);

      // Assert
      expect(comment.content).toBe('This has spaces around it');
    });

    it('should populate author reference', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act
      const comment = await Comment.create(commentData);
      const populatedComment = await Comment.findById(comment._id).populate('author');

      // Assert
      expect(populatedComment.author._id.toString()).toBe(testUser._id.toString());
      expect(populatedComment.author.username).toBe(testUser.username);
      expect(populatedComment.author.email).toBe(testUser.email);
    });
  });

  describe('Comment Validation', () => {
    it('should require content', async () => {
      // Arrange
      const commentData = {
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });

    it('should require author', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
        authorUsername: testUser.username,
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });

    it('should require authorUsername', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
        author: testUser._id,
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });

    it('should enforce maximum content length', async () => {
      // Arrange
      const longContent = 'a'.repeat(1001); // Exceeds 1000 character limit
      const commentData = {
        content: longContent,
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });

    it('should allow content at maximum length', async () => {
      // Arrange
      const maxContent = 'a'.repeat(1000); // Exactly 1000 characters
      const commentData = {
        content: maxContent,
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act
      const comment = await Comment.create(commentData);

      // Assert
      expect(comment.content).toBe(maxContent);
      expect(comment.content.length).toBe(1000);
    });

    it('should reject empty content after trim', async () => {
      // Arrange
      const commentData = {
        content: '   ', // Only whitespace
        author: testUser._id,
        authorUsername: testUser.username,
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });
  });

  describe('Comment Queries', () => {
    beforeEach(async () => {
      // Create multiple test comments
      await Comment.create({
        content: 'First comment',
        author: testUser._id,
        authorUsername: testUser.username,
      });

      await Comment.create({
        content: 'Second comment',
        author: testUser._id,
        authorUsername: testUser.username,
      });

      await Comment.create({
        content: 'Third comment',
        author: testUser._id,
        authorUsername: testUser.username,
      });
    });

    it('should find all comments', async () => {
      // Act
      const comments = await Comment.find();

      // Assert
      expect(comments).toHaveLength(3);
    });

    it('should find comments by author', async () => {
      // Act
      const comments = await Comment.find({ author: testUser._id });

      // Assert
      expect(comments).toHaveLength(3);
      comments.forEach(comment => {
        expect(comment.author.toString()).toBe(testUser._id.toString());
      });
    });

    it('should sort comments by creation date descending', async () => {
      // Act
      const comments = await Comment.find().sort({ _id: -1 });

      // Assert
      expect(comments[0].content).toBe('Third comment');
      expect(comments[1].content).toBe('Second comment');
      expect(comments[2].content).toBe('First comment');
    });
  });

  describe('Comment Update', () => {
    it('should update comment content', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'Original content',
        author: testUser._id,
        authorUsername: testUser.username,
      });

      // Act
      comment.content = 'Updated content';
      await comment.save();

      // Assert
      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.content).toBe('Updated content');
    });

    it('should update updatedAt timestamp on modification', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'Original content',
        author: testUser._id,
        authorUsername: testUser.username,
      });
      const originalUpdatedAt = comment.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      comment.content = 'Updated content';
      await comment.save();

      // Assert
      expect(comment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Comment Deletion', () => {
    it('should delete a comment', async () => {
      // Arrange
      const comment = await Comment.create({
        content: 'To be deleted',
        author: testUser._id,
        authorUsername: testUser.username,
      });

      // Act
      await Comment.findByIdAndDelete(comment._id);

      // Assert
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    it('should delete all comments by author', async () => {
      // Arrange
      await Comment.create({
        content: 'Comment 1',
        author: testUser._id,
        authorUsername: testUser.username,
      });
      await Comment.create({
        content: 'Comment 2',
        author: testUser._id,
        authorUsername: testUser.username,
      });

      // Act
      await Comment.deleteMany({ author: testUser._id });

      // Assert
      const remainingComments = await Comment.find({ author: testUser._id });
      expect(remainingComments).toHaveLength(0);
    });
  });

  describe('Author Reference Integrity', () => {
    it('should accept valid ObjectId for author', async () => {
      // Arrange
      const validObjectId = new mongoose.Types.ObjectId();
      const commentData = {
        content: 'Test comment',
        author: validObjectId,
        authorUsername: 'testuser',
      };

      // Act
      const comment = await Comment.create(commentData);

      // Assert
      expect(comment.author.toString()).toBe(validObjectId.toString());
    });

    it('should reject invalid ObjectId for author', async () => {
      // Arrange
      const commentData = {
        content: 'Test comment',
        author: 'invalid-id',
        authorUsername: 'testuser',
      };

      // Act & Assert
      await expect(Comment.create(commentData)).rejects.toThrow();
    });
  });
});
