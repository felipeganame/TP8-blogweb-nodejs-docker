import { jest } from '@jest/globals';

// Setup JSDOM environment
beforeEach(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: function(key) {
      return this[key] || null;
    },
    setItem: function(key, value) {
      this[key] = String(value);
    },
    removeItem: function(key) {
      delete this[key];
    },
    clear: function() {
      Object.keys(this).forEach(key => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete this[key];
        }
      });
    }
  };
  
  global.localStorage = localStorageMock;

  // Mock window.APP_CONFIG
  global.window = global.window || {};
  global.window.APP_CONFIG = {
    API_URL: 'http://localhost:8080'
  };
  
  // Create a spy for window.location.reload
  delete window.location;
  window.location = {
    hostname: 'localhost',
    origin: 'http://localhost:3000',
    reload: jest.fn()
  };

  // Mock fetch
  global.fetch = undefined; // Will be mocked in individual tests
  
  // Mock require for dynamic imports in login/register - usando funciones simples
  global.require = (module) => {
    if (module === './register.js') {
      return { showRegister: () => {} };
    }
    if (module === './login.js') {
      return { showLogin: () => {} };
    }
    return {};
  };
});

afterEach(() => {
  // Clear localStorage after each test
  if (global.localStorage) {
    global.localStorage.clear();
  }
  
  // Clear all mocks
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
  
  if (window.location && window.location.reload && window.location.reload.mockClear) {
    window.location.reload.mockClear();
  }
});
