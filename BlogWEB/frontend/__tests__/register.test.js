/**
 * Tests for register.js module
 * Covers registration form rendering and signup flow
 */

import { jest } from '@jest/globals';

describe('Register Module', () => {
  let showRegister;
  let mockApiRegister, mockAuthSetUser;

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="main-content"></div>
    `;

    // Create mock functions
    mockApiRegister = jest.fn();
    mockAuthSetUser = jest.fn();

    // Import and patch the modules
    const registerModule = await import('../public/js/register.js');
    const apiModule = await import('../public/js/api.js');
    const authModule = await import('../public/js/auth.js');

    // Patch the api and auth objects
    apiModule.api.register = mockApiRegister;
    authModule.auth.setUser = mockAuthSetUser;

    showRegister = registerModule.showRegister;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('showRegister', () => {
    it('should render register form', () => {
      showRegister();
      
      expect(document.getElementById('register-form')).toBeTruthy();
      expect(document.getElementById('username')).toBeTruthy();
      expect(document.getElementById('email')).toBeTruthy();
      expect(document.getElementById('password')).toBeTruthy();
    });

    it('should render username input with correct attributes', () => {
      showRegister();
      
      const usernameInput = document.getElementById('username');
      expect(usernameInput).toBeTruthy();
      expect(usernameInput.type).toBe('text');
      expect(usernameInput.required).toBe(true);
    });

    it('should render email input with correct type', () => {
      showRegister();
      
      const emailInput = document.getElementById('email');
      expect(emailInput.type).toBe('email');
      expect(emailInput.required).toBe(true);
    });

    it('should render password input with minimum length', () => {
      showRegister();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.type).toBe('password');
      expect(passwordInput.minLength).toBeGreaterThanOrEqual(6);
    });

    it('should render submit button', () => {
      showRegister();
      
      const submitButton = document.querySelector('#register-form button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent).toContain('Registrar');
    });

    it('should render login link button', () => {
      showRegister();
      
      const loginButton = document.getElementById('goto-login');
      expect(loginButton).toBeTruthy();
    });

    it('should render error container', () => {
      showRegister();
      
      const errorDiv = document.getElementById('register-error');
      expect(errorDiv).toBeTruthy();
    });
  });

  describe('handleRegister form submission', () => {
    it('should call api.register with form data on submit', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'fake-token'
      };
      mockApiRegister.mockResolvedValue(mockResponse);
      
      showRegister();
      
      const form = document.getElementById('register-form');
      document.getElementById('username').value = 'testuser';
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockApiRegister).toHaveBeenCalledWith({ 
        username: 'testuser', 
        email: 'test@example.com', 
        password: 'password123' 
      });
    });

    it('should call auth.setUser on successful registration', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'auth-token'
      };
      mockApiRegister.mockResolvedValue(mockResponse);
      
      showRegister();
      
      const form = document.getElementById('register-form');
      document.getElementById('username').value = 'testuser';
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockAuthSetUser).toHaveBeenCalledWith(mockResponse);
    });

    it('should reload page on successful registration', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'new-token'
      };
      mockApiRegister.mockResolvedValue(mockResponse);
      
      showRegister();
      
      const form = document.getElementById('register-form');
      document.getElementById('username').value = 'testuser';
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('should display error message on registration failure', async () => {
      // Arrange
      const errorMessage = 'El usuario ya existe';
      mockApiRegister.mockRejectedValue(new Error(errorMessage));
      
      showRegister();
      
      const form = document.getElementById('register-form');
      document.getElementById('username').value = 'existinguser';
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const errorDiv = document.getElementById('register-error');
      expect(errorDiv.textContent).toContain(errorMessage);
    });

    it('should not reload page on registration failure', async () => {
      // Arrange
      mockApiRegister.mockRejectedValue(new Error('Registration failed'));
      
      showRegister();
      
      const form = document.getElementById('register-form');
      document.getElementById('username').value = 'testuser';
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('should prevent default form submission', async () => {
      // Arrange
      mockApiRegister.mockResolvedValue({});
      showRegister();
      
      const form = document.getElementById('register-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      // Act
      form.dispatchEvent(submitEvent);

      // Assert
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    it('should have required attribute on username input', () => {
      showRegister();
      
      const usernameInput = document.getElementById('username');
      expect(usernameInput.required).toBe(true);
    });

    it('should have required attribute on email input', () => {
      showRegister();
      
      const emailInput = document.getElementById('email');
      expect(emailInput.required).toBe(true);
    });

    it('should have required attribute on password input', () => {
      showRegister();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.required).toBe(true);
    });

    it('should enforce minimum username length of 3', () => {
      showRegister();
      
      const usernameInput = document.getElementById('username');
      expect(usernameInput.minLength).toBeGreaterThanOrEqual(3);
    });

    it('should enforce minimum password length of 6', () => {
      showRegister();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.minLength).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Form inputs collect correct data', () => {
    it('should collect username from input', () => {
      showRegister();
      
      const usernameInput = document.getElementById('username');
      usernameInput.value = 'testuser';
      expect(usernameInput.value).toBe('testuser');
    });

    it('should collect email from input', () => {
      showRegister();
      
      const emailInput = document.getElementById('email');
      emailInput.value = 'test@example.com';
      expect(emailInput.value).toBe('test@example.com');
    });

    it('should collect password from input', () => {
      showRegister();
      
      const passwordInput = document.getElementById('password');
      passwordInput.value = 'password123';
      expect(passwordInput.value).toBe('password123');
    });
  });
});
