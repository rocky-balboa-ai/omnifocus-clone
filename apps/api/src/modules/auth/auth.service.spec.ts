import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // updateProfile - PATCH /auth/profile
  // =========================================================================
  describe('updateProfile', () => {
    const userId = 'user-123';
    const existingUser = {
      id: userId,
      username: 'fred',
      passwordHash: 'hashed-password',
    };

    it('should update username successfully', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser) // find current user
        .mockResolvedValueOnce(null); // check username uniqueness
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        username: 'newname',
      });

      const result = await service.updateProfile(userId, { username: 'newname' });

      expect(result).toEqual({ id: userId, username: 'newname' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { username: 'newname' },
        select: { id: true, username: true },
      });
    });

    it('should throw ConflictException if username already taken', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other-user', username: 'taken' });

      await expect(
        service.updateProfile(userId, { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if username is empty', async () => {
      await expect(
        service.updateProfile(userId, { username: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if username is too short', async () => {
      await expect(
        service.updateProfile(userId, { username: 'ab' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not throw if username unchanged', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(existingUser);
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        username: 'fred',
      });

      const result = await service.updateProfile(userId, { username: 'fred' });
      expect(result).toEqual({ id: userId, username: 'fred' });
    });
  });

  // =========================================================================
  // changePassword - PATCH /auth/password
  // =========================================================================
  describe('changePassword', () => {
    const userId = 'user-123';
    const existingUser = {
      id: userId,
      username: 'fred',
      passwordHash: 'hashed-old-password',
    };

    it('should change password when current password is correct', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      mockPrismaService.user.update.mockResolvedValue({ id: userId, username: 'fred' });

      const result = await service.changePassword(userId, {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(result).toEqual({ success: true });
      expect(bcrypt.compare).toHaveBeenCalledWith('oldpass', 'hashed-old-password');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'hashed-new-password' },
      });
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, {
          currentPassword: 'wrongpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new password is too short', async () => {
      await expect(
        service.changePassword(userId, {
          currentPassword: 'oldpass',
          newPassword: 'ab',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, {
          currentPassword: 'oldpass',
          newPassword: 'newpass123',
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // API Key Management
  // =========================================================================
  describe('getUserApiKey (masked)', () => {
    const userId = 'user-123';

    it('should return masked API key', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        apiKey: 'sk_abcdefghijklmnopqrstuvwxyz123456',
      });

      const result = await service.getUserApiKey(userId);

      expect(result.maskedKey).toMatch(/^sk_\*{3}\.\.\..*$/);
      expect(result.maskedKey).not.toBe('sk_abcdefghijklmnopqrstuvwxyz123456');
    });

    it('should generate API key if user has none', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        apiKey: null,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        apiKey: 'sk_newgeneratedkey123456',
      });

      const result = await service.getUserApiKey(userId);

      expect(result.maskedKey).toBeDefined();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('revealUserApiKey', () => {
    const userId = 'user-123';

    it('should return full API key', async () => {
      const fullKey = 'sk_abcdefghijklmnopqrstuvwxyz123456';
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        apiKey: fullKey,
      });

      const result = await service.revealUserApiKey(userId);

      expect(result.apiKey).toBe(fullKey);
    });

    it('should generate API key if user has none', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        apiKey: null,
      });
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        apiKey: 'sk_newgeneratedkey123456',
      });

      const result = await service.revealUserApiKey(userId);

      expect(result.apiKey).toBeDefined();
      expect(result.apiKey).toMatch(/^sk_/);
    });
  });

  describe('regenerateUserApiKey', () => {
    const userId = 'user-123';

    it('should generate a new API key', async () => {
      const newKey = 'sk_newrandomkey123456789';
      mockPrismaService.user.update.mockResolvedValue({
        id: userId,
        apiKey: newKey,
      });

      const result = await service.regenerateUserApiKey(userId);

      expect(result.apiKey).toBeDefined();
      expect(result.apiKey).toMatch(/^sk_/);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { apiKey: expect.stringMatching(/^sk_/) },
        select: { id: true, apiKey: true },
      });
    });
  });
});
