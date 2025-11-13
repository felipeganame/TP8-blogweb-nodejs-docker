import User from '../../models/User.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      // Arrange
      const userData = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user._id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      // Arrange
      const plainPassword = 'mySecurePassword';
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.password).not.toBe(plainPassword);
      expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash is long
      
      // Verify it's a valid bcrypt hash
      const isValidHash = await bcrypt.compare(plainPassword, user.password);
      expect(isValidHash).toBe(true);
    });

    it('should trim and lowercase email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('should trim username', async () => {
      // Arrange
      const userData = {
        username: '  testuser  ',
        email: 'test@example.com',
        password: 'password123',
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.username).toBe('testuser');
    });
  });

  describe('User Validation', () => {
    it('should require username', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        password: 'password123',
      };

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum username length', async () => {
      // Arrange
      const userData = {
        username: 'ab', // Less than 3 characters
        email: 'test@example.com',
        password: 'password123',
      };

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
      };

      // Act & Assert
      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require unique email', async () => {
      // Arrange
      const userData1 = {
        username: 'user1',
        email: 'same@example.com',
        password: 'password123',
      };
      const userData2 = {
        username: 'user2',
        email: 'same@example.com',
        password: 'password456',
      };

      // Act
      await User.create(userData1);

      // Assert
      await expect(User.create(userData2)).rejects.toThrow();
    });

    it('should require unique username', async () => {
      // Arrange
      const userData1 = {
        username: 'sameuser',
        email: 'user1@example.com',
        password: 'password123',
      };
      const userData2 = {
        username: 'sameuser',
        email: 'user2@example.com',
        password: 'password456',
      };

      // Act
      await User.create(userData1);

      // Assert
      await expect(User.create(userData2)).rejects.toThrow();
    });
  });

  describe('comparePassword method', () => {
    it('should return true for correct password', async () => {
      // Arrange
      const plainPassword = 'correctPassword';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
      });

      // Act
      const isMatch = await user.comparePassword(plainPassword);

      // Assert
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      // Arrange
      const plainPassword = 'correctPassword';
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
      });

      // Act
      const isMatch = await user.comparePassword('wrongPassword');

      // Assert
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      // Arrange
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      // Act
      const isMatch = await user.comparePassword('');

      // Assert
      expect(isMatch).toBe(false);
    });
  });

  describe('Password Update', () => {
    it('should rehash password when updated', async () => {
      // Arrange
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldPassword',
      });
      const oldHash = user.password;

      // Act
      user.password = 'newPassword';
      await user.save();

      // Assert
      expect(user.password).not.toBe(oldHash);
      expect(user.password).not.toBe('newPassword');
      
      const isOldPasswordValid = await user.comparePassword('oldPassword');
      const isNewPasswordValid = await user.comparePassword('newPassword');
      expect(isOldPasswordValid).toBe(false);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should not rehash password if not modified', async () => {
      // Arrange
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      const originalHash = user.password;

      // Act
      user.username = 'updateduser';
      await user.save();

      // Assert
      expect(user.password).toBe(originalHash);
    });
  });
});
