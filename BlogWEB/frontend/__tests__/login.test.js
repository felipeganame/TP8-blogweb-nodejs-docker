/**
 * Tests for login.js module
 * Covers login form rendering and authentication flow
 */

import { jest } from '@jest/globals';

describe('Login Module', () => {
  let showLogin;
  let mockApiLogin, mockAuthSetUser;

  beforeEach(async () => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="main-content"></div>
    `;

    // Create mock functions
    mockApiLogin = jest.fn();
    mockAuthSetUser = jest.fn();

    // Import and patch the modules
    const loginModule = await import('../public/js/login.js');
    const apiModule = await import('../public/js/api.js');
    const authModule = await import('../public/js/auth.js');

    // Patch the api and auth objects
    apiModule.api.login = mockApiLogin;
    authModule.auth.setUser = mockAuthSetUser;

    showLogin = loginModule.showLogin;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('showLogin', () => {
    it('should render login form', () => {
      showLogin();
      
      expect(document.getElementById('login-form')).toBeTruthy();
      expect(document.getElementById('email')).toBeTruthy();
      expect(document.getElementById('password')).toBeTruthy();
    });

    it('should render email input with correct type', () => {
      showLogin();
      
      const emailInput = document.getElementById('email');
      expect(emailInput.type).toBe('email');
    });

    it('should render password input with correct type', () => {
      showLogin();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.type).toBe('password');
    });

    it('should render submit button', () => {
      showLogin();
      
      const submitButton = document.querySelector('#login-form button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent).toContain('Iniciar');
    });

    it('should render register link button', () => {
      showLogin();
      
      const registerButton = document.getElementById('goto-register');
      expect(registerButton).toBeTruthy();
    });

    it('should render error container', () => {
      showLogin();
      
      const errorDiv = document.getElementById('login-error');
      expect(errorDiv).toBeTruthy();
    });
  });

  describe('handleLogin form submission', () => {
    it('should call api.login with form data on submit', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'fake-token'
      };
      mockApiLogin.mockResolvedValue(mockResponse);
      
      showLogin();
      
      const form = document.getElementById('login-form');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      emailInput.value = 'test@example.com';
      passwordInput.value = 'password123';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockApiLogin).toHaveBeenCalledWith({ 
        email: 'test@example.com', 
        password: 'password123' 
      });
    });

    it('should call auth.setUser on successful login', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'fake-token'
      };
      mockApiLogin.mockResolvedValue(mockResponse);
      
      showLogin();
      
      const form = document.getElementById('login-form');
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

    it('should reload page on successful login', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'fake-token'
      };
      mockApiLogin.mockResolvedValue(mockResponse);
      
      showLogin();
      
      const form = document.getElementById('login-form');
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

    it('should display error message on login failure', async () => {
      // Arrange
      const errorMessage = 'Credenciales inválidas';
      mockApiLogin.mockRejectedValue(new Error(errorMessage));
      
      showLogin();
      
      const form = document.getElementById('login-form');
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'wrongpassword';

      // Act
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      const errorDiv = document.getElementById('login-error');
      expect(errorDiv.textContent).toContain(errorMessage);
    });

    it('should not reload page on login failure', async () => {
      // Arrange
      mockApiLogin.mockRejectedValue(new Error('Login failed'));
      
      showLogin();
      
      const form = document.getElementById('login-form');
      document.getElementById('email').value = 'test@example.com';
      document.getElementById('password').value = 'wrongpassword';

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
      mockApiLogin.mockResolvedValue({});
      showLogin();
      
      const form = document.getElementById('login-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      // Act
      form.dispatchEvent(submitEvent);

      // Assert
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    it('should have required attribute on email input', () => {
      showLogin();
      
      const emailInput = document.getElementById('email');
      expect(emailInput.required).toBe(true);
    });

    it('should have required attribute on password input', () => {
      showLogin();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.required).toBe(true);
    });

    it('should have email type for email input', () => {
      showLogin();
      
      const emailInput = document.getElementById('email');
      expect(emailInput.type).toBe('email');
    });

    it('should have password type for password input', () => {
      showLogin();
      
      const passwordInput = document.getElementById('password');
      expect(passwordInput.type).toBe('password');
    });
  });
});
