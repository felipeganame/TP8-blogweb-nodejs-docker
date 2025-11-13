import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Create a test user in the database
 */
export const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    ...userData,
  };

  const user = await User.create(defaultUserData);
  return user;
};

/**
 * Generate a valid JWT token for a user
 */
export const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Create a user and return it with a valid token
 */
export const createAuthenticatedUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateTestToken(user._id);
  
  return {
    user,
    token,
  };
};

/**
 * Mock Express request object
 */
export const mockRequest = (options = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...options,
  };
};

/**
 * Mock Express response object
 */
export const mockResponse = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    sendData: null,
  };
  
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  
  res.json = function(data) {
    res.jsonData = data;
    return res;
  };
  
  res.send = function(data) {
    res.sendData = data;
    return res;
  };
  
  return res;
};

/**
 * Mock Express next function
 */
export const mockNext = () => {
  const next = function() {
    next.called = true;
    next.calls.push(arguments);
  };
  next.called = false;
  next.calls = [];
  return next;
};
