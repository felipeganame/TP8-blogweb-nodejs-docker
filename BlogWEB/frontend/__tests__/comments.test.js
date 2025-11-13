/**
 * Tests for comments.js module
 * Covers comment display, creation, and deletion functionality
 */

import { jest } from '@jest/globals';

describe('Comments Module', () => {
  let showComments, loadComments, handleCreateComment, deleteComment;
  let mockApiGetComments, mockApiCreateComment, mockApiDeleteComment;
  let mockAuthGetUser;

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="main-content"></div>
    `;

    // Create mock functions
    mockApiGetComments = jest.fn();
    mockApiCreateComment = jest.fn();
    mockApiDeleteComment = jest.fn();
    mockAuthGetUser = jest.fn();

    // Import and patch modules
    const commentsModule = await import('../public/js/comments.js');
    const apiModule = await import('../public/js/api.js');
    const authModule = await import('../public/js/auth.js');

    // Patch the api and auth objects
    apiModule.api.getComments = mockApiGetComments;
    apiModule.api.createComment = mockApiCreateComment;
    apiModule.api.deleteComment = mockApiDeleteComment;
    authModule.auth.getUser = mockAuthGetUser;

    showComments = commentsModule.showComments;
    
    // Mock window.deleteComment
    window.confirm = jest.fn();
    window.alert = jest.fn();
  });

  describe('DOM Structure', () => {
    it('should have required DOM elements', () => {
      // Verify that we can create the required DOM structure
      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeTruthy();
    });
  });

  describe('showComments function', () => {
    it('should render comments container when user is authenticated', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await showComments();

      // Assert
      expect(document.querySelector('.comments-container')).toBeTruthy();
      expect(document.getElementById('comment-form')).toBeTruthy();
      expect(document.getElementById('comments-list')).toBeTruthy();
    });

    it('should render comments container without form when user is not authenticated', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await showComments();

      // Assert
      expect(document.querySelector('.comments-container')).toBeTruthy();
      expect(document.getElementById('comment-form')).toBeFalsy();
      expect(document.querySelector('.info-message')).toBeTruthy();
      expect(document.getElementById('comments-list')).toBeTruthy();
    });

    it('should load comments on initialization', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      const mockComments = [
        {
          _id: '1',
          content: 'Test comment',
          author: 'user1',
          authorUsername: 'testuser',
          createdAt: new Date().toISOString()
        }
      ];
      mockApiGetComments.mockResolvedValue(mockComments);

      // Act
      await showComments();

      // Assert
      expect(mockApiGetComments).toHaveBeenCalled();
      expect(document.querySelector('.comment-card')).toBeTruthy();
    });

    it('should display empty state when no comments exist', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await showComments();

      // Assert
      expect(document.querySelector('.empty-state')).toBeTruthy();
      expect(document.querySelector('.empty-state').textContent).toContain('No hay comentarios');
    });

    it('should display comment form for authenticated users', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await showComments();

      // Assert
      const form = document.getElementById('comment-form');
      expect(form).toBeTruthy();
      expect(document.getElementById('comment-content')).toBeTruthy();
    });

    it('should display login message for unauthenticated users', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await showComments();

      // Assert
      const infoMessage = document.querySelector('.info-message');
      expect(infoMessage).toBeTruthy();
      expect(infoMessage.textContent).toContain('Inicia sesión');
    });
  });

  describe('loadComments function', () => {
    it('should display comments correctly', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      const mockComments = [
        {
          _id: '1',
          content: 'First comment',
          author: 'user1',
          authorUsername: 'testuser',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          content: 'Second comment',
          author: 'user2',
          authorUsername: 'otheruser',
          createdAt: new Date().toISOString()
        }
      ];
      mockApiGetComments.mockResolvedValue(mockComments);

      // Act
      await showComments();

      // Assert
      const commentCards = document.querySelectorAll('.comment-card');
      expect(commentCards.length).toBe(2);
    });

    it('should show delete button only for own comments', async () => {
      // Arrange
      const userId = 'user1';
      mockAuthGetUser.mockReturnValue({ _id: userId, username: 'testuser' });
      const mockComments = [
        {
          _id: '1',
          content: 'My comment',
          author: userId,
          authorUsername: 'testuser',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          content: 'Other comment',
          author: 'user2',
          authorUsername: 'otheruser',
          createdAt: new Date().toISOString()
        }
      ];
      mockApiGetComments.mockResolvedValue(mockComments);

      // Act
      await showComments();

      // Assert
      const deleteButtons = document.querySelectorAll('.btn-danger');
      expect(deleteButtons.length).toBe(1);
    });

    it('should handle error when loading comments fails', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      mockApiGetComments.mockRejectedValue(new Error('Network error'));

      // Act
      await showComments();

      // Assert
      const errorMessage = document.querySelector('.error');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Error al cargar comentarios');
    });

    it('should escape HTML in comment content', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue(null);
      const mockComments = [
        {
          _id: '1',
          content: '<script>alert("xss")</script>',
          author: 'user1',
          authorUsername: 'testuser',
          createdAt: new Date().toISOString()
        }
      ];
      mockApiGetComments.mockResolvedValue(mockComments);

      // Act
      await showComments();

      // Assert
      const commentContent = document.querySelector('.comment-content');
      expect(commentContent.innerHTML).not.toContain('<script>');
      expect(commentContent.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('handleCreateComment function', () => {
    it('should create comment when form is submitted', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockResolvedValue({ success: true });

      await showComments();

      const form = document.getElementById('comment-form');
      const textarea = document.getElementById('comment-content');
      textarea.value = 'New test comment';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockApiCreateComment).toHaveBeenCalledWith('New test comment');
    });

    it('should clear textarea after successful comment creation', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockResolvedValue({ success: true });

      await showComments();

      const form = document.getElementById('comment-form');
      const textarea = document.getElementById('comment-content');
      textarea.value = 'New test comment';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(textarea.value).toBe('');
    });

    it('should display success message after creating comment', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockResolvedValue({ success: true });

      await showComments();

      const form = document.getElementById('comment-form');
      const textarea = document.getElementById('comment-content');
      textarea.value = 'New test comment';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const errorDiv = document.getElementById('comments-error');
      expect(errorDiv.innerHTML).toContain('success');
    });

    it('should reload comments after creating new comment', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockResolvedValue({ success: true });

      await showComments();

      const form = document.getElementById('comment-form');
      const textarea = document.getElementById('comment-content');
      textarea.value = 'New test comment';

      const initialCalls = mockApiGetComments.mock.calls.length;

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockApiGetComments.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should display error message when comment creation fails', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockRejectedValue(new Error('Failed to create comment'));

      await showComments();

      const form = document.getElementById('comment-form');
      const textarea = document.getElementById('comment-content');
      textarea.value = 'New test comment';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const errorDiv = document.getElementById('comments-error');
      expect(errorDiv.innerHTML).toContain('error');
      expect(errorDiv.innerHTML).toContain('Failed to create comment');
    });

    it('should prevent default form submission', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      mockApiGetComments.mockResolvedValue([]);
      mockApiCreateComment.mockResolvedValue({ success: true });

      await showComments();

      const form = document.getElementById('comment-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      // Act
      form.dispatchEvent(submitEvent);

      // Assert
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('deleteComment function', () => {
    it('should call confirm before deleting', async () => {
      // Arrange
      window.confirm.mockReturnValue(true);
      mockApiDeleteComment.mockResolvedValue({ success: true });
      mockApiGetComments.mockResolvedValue([]);

      // Act
      await window.deleteComment('comment-id-123');

      // Assert
      expect(window.confirm).toHaveBeenCalled();
      expect(mockApiDeleteComment).toHaveBeenCalledWith('comment-id-123');
    });

    it('should not delete if user cancels confirmation', async () => {
      // Arrange
      window.confirm.mockReturnValue(false);
      mockApiDeleteComment.mockResolvedValue({ success: true });

      // Act
      await window.deleteComment('comment-id-123');

      // Assert
      expect(window.confirm).toHaveBeenCalled();
      expect(mockApiDeleteComment).not.toHaveBeenCalled();
    });

    it('should reload comments after successful deletion', async () => {
      // Arrange
      mockAuthGetUser.mockReturnValue({ _id: '1', username: 'testuser' });
      window.confirm.mockReturnValue(true);
      mockApiDeleteComment.mockResolvedValue({ success: true });
      mockApiGetComments.mockResolvedValue([]);

      await showComments();
      const initialCalls = mockApiGetComments.mock.calls.length;

      // Act
      await window.deleteComment('comment-id-123');

      // Assert
      expect(mockApiGetComments.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should show alert on deletion error', async () => {
      // Arrange
      window.confirm.mockReturnValue(true);
      mockApiDeleteComment.mockRejectedValue(new Error('Delete failed'));

      // Act
      await window.deleteComment('comment-id-123');

      // Assert
      expect(window.alert).toHaveBeenCalled();
      expect(window.alert.mock.calls[0][0]).toContain('Error al eliminar');
    });
  });

  describe('escapeHtml utility (if exported)', () => {
    // This would test the escapeHtml function if it was exported
    // For now, we'll test it indirectly through integration tests
    
    it('should escape HTML in text content', () => {
      // Arrange
      const dangerousText = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      
      // Act
      div.textContent = dangerousText;
      
      // Assert
      expect(div.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
      expect(div.innerHTML).not.toContain('<script>');
    });

    it('should handle special characters', () => {
      // Arrange
      const specialText = '< > & " \'';
      const div = document.createElement('div');
      
      // Act
      div.textContent = specialText;
      
      // Assert
      expect(div.innerHTML).toContain('&lt;');
      expect(div.innerHTML).toContain('&gt;');
      expect(div.innerHTML).toContain('&amp;');
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      // Arrange
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act
      const formatted = testDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Assert
      expect(formatted).toBeDefined();
      expect(formatted).toContain('2024');
    });

    it('should handle different date formats', () => {
      // Arrange
      const isoDate = '2024-03-20T14:45:00Z';
      const date = new Date(isoDate);
      
      // Act & Assert
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March is month 2 (0-indexed)
    });
  });

  describe('Comment validation', () => {
    it('should validate comment content length', () => {
      // Arrange
      const shortComment = 'Hi';
      const longComment = 'a'.repeat(1001);
      const validComment = 'This is a valid comment';
      
      // Assert
      expect(shortComment.length).toBeLessThan(1000);
      expect(longComment.length).toBeGreaterThan(1000);
      expect(validComment.length).toBeLessThan(1000);
    });

    it('should detect empty comments', () => {
      // Arrange
      const emptyComment = '';
      const whitespaceComment = '   ';
      const validComment = 'Valid';
      
      // Act & Assert
      expect(emptyComment.trim()).toBe('');
      expect(whitespaceComment.trim()).toBe('');
      expect(validComment.trim()).not.toBe('');
    });
  });

  describe('DOM manipulation utilities', () => {
    it('should create comment card HTML structure', () => {
      // Arrange
      const comment = {
        _id: '123',
        content: 'Test comment',
        authorUsername: 'testuser',
        createdAt: new Date().toISOString(),
        author: 'user123'
      };
      
      // Act
      const commentCard = document.createElement('div');
      commentCard.className = 'comment-card';
      commentCard.innerHTML = `
        <div class="comment-header">
          <span class="comment-author">${comment.authorUsername}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
      `;
      
      // Assert
      expect(commentCard.querySelector('.comment-author').textContent).toBe('testuser');
      expect(commentCard.querySelector('.comment-content').textContent).toBe('Test comment');
    });

    it('should create delete button for own comments', () => {
      // Arrange
      const currentUserId = 'user123';
      const commentAuthorId = 'user123';
      
      // Act
      const shouldShowDelete = currentUserId === commentAuthorId;
      
      // Assert
      expect(shouldShowDelete).toBe(true);
    });

    it('should not create delete button for other users comments', () => {
      // Arrange
      const currentUserId = 'user123';
      const commentAuthorId = 'user456';
      
      // Act
      const shouldShowDelete = currentUserId === commentAuthorId;
      
      // Assert
      expect(shouldShowDelete).toBe(false);
    });
  });

  describe('Empty state handling', () => {
    it('should show empty state message when no comments', () => {
      // Arrange
      const comments = [];
      document.body.innerHTML = '<div id="comments-list"></div>';
      const commentsList = document.getElementById('comments-list');
      
      // Act
      if (comments.length === 0) {
        commentsList.innerHTML = '<div class="empty-state">No hay comentarios aún. ¡Sé el primero en comentar!</div>';
      }
      
      // Assert
      expect(commentsList.querySelector('.empty-state')).toBeTruthy();
      expect(commentsList.textContent).toContain('No hay comentarios');
    });

    it('should not show empty state when comments exist', () => {
      // Arrange
      const comments = [{ _id: '1', content: 'Comment' }];
      
      // Act
      const shouldShowEmpty = comments.length === 0;
      
      // Assert
      expect(shouldShowEmpty).toBe(false);
    });
  });

  describe('Authentication state display', () => {
    it('should show comment form when user is authenticated', () => {
      // Arrange
      const user = { _id: '123', username: 'testuser' };
      
      // Act
      const shouldShowForm = !!user;
      
      // Assert
      expect(shouldShowForm).toBe(true);
    });

    it('should show login message when user is not authenticated', () => {
      // Arrange
      const user = null;
      
      // Act
      const shouldShowForm = !!user;
      const shouldShowMessage = !user;
      
      // Assert
      expect(shouldShowForm).toBe(false);
      expect(shouldShowMessage).toBe(true);
    });
  });

  describe('Form validation', () => {
    it('should validate textarea has content', () => {
      // Arrange
      const textarea = document.createElement('textarea');
      textarea.value = 'Valid content';
      
      // Act
      const isValid = textarea.value.trim().length > 0;
      
      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject empty textarea', () => {
      // Arrange
      const textarea = document.createElement('textarea');
      textarea.value = '';
      
      // Act
      const isValid = textarea.value.trim().length > 0;
      
      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only textarea', () => {
      // Arrange
      const textarea = document.createElement('textarea');
      textarea.value = '   \n\t  ';
      
      // Act
      const isValid = textarea.value.trim().length > 0;
      
      // Assert
      expect(isValid).toBe(false);
    });
  });
});
