import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    getUserFromToken: jest.fn(),
    validateUser: jest.fn(),
    validateJwt: jest.fn(),
    validateApiKey: jest.fn(),
    getOrCreateDefaultUser: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getUserApiKey: jest.fn(),
    revealUserApiKey: jest.fn(),
    regenerateUserApiKey: jest.fn(),
  };

  const mockRequest = (user?: { id: string; username: string }) => ({
    user,
    session: { userId: user?.id, username: user?.username, destroy: jest.fn(), save: jest.fn() },
    headers: {},
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================================
  // PATCH /auth/profile
  // =========================================================================
  describe('updateProfile', () => {
    it('should update username', async () => {
      const req = mockRequest({ id: 'user-123', username: 'fred' });
      mockAuthService.updateProfile.mockResolvedValue({
        id: 'user-123',
        username: 'newname',
      });

      const result = await controller.updateProfile(req as any, {
        username: 'newname',
      });

      expect(result).toEqual({ id: 'user-123', username: 'newname' });
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith('user-123', {
        username: 'newname',
      });
    });

    it('should throw if no authenticated user', async () => {
      const req = mockRequest();
      req.user = undefined;
      req.session.userId = undefined;

      await expect(
        controller.updateProfile(req as any, { username: 'newname' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // =========================================================================
  // PATCH /auth/password
  // =========================================================================
  describe('changePassword', () => {
    it('should change password', async () => {
      const req = mockRequest({ id: 'user-123', username: 'fred' });
      mockAuthService.changePassword.mockResolvedValue({ success: true });

      const result = await controller.changePassword(req as any, {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(result).toEqual({ success: true });
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('user-123', {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });
    });

    it('should throw if no authenticated user', async () => {
      const req = mockRequest();
      req.user = undefined;
      req.session.userId = undefined;

      await expect(
        controller.changePassword(req as any, {
          currentPassword: 'old',
          newPassword: 'new123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // =========================================================================
  // GET /auth/api-key
  // =========================================================================
  describe('getApiKey', () => {
    it('should return masked API key', async () => {
      const req = mockRequest({ id: 'user-123', username: 'fred' });
      mockAuthService.getUserApiKey.mockResolvedValue({
        maskedKey: 'sk_***...456',
      });

      const result = await controller.getApiKey(req as any);

      expect(result).toEqual({ maskedKey: 'sk_***...456' });
      expect(mockAuthService.getUserApiKey).toHaveBeenCalledWith('user-123');
    });

    it('should throw if no authenticated user', async () => {
      const req = mockRequest();
      req.user = undefined;
      req.session.userId = undefined;

      await expect(controller.getApiKey(req as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // =========================================================================
  // GET /auth/api-key/reveal
  // =========================================================================
  describe('revealApiKey', () => {
    it('should return full API key', async () => {
      const req = mockRequest({ id: 'user-123', username: 'fred' });
      mockAuthService.revealUserApiKey.mockResolvedValue({
        apiKey: 'sk_fullkey123456',
      });

      const result = await controller.revealApiKey(req as any);

      expect(result).toEqual({ apiKey: 'sk_fullkey123456' });
      expect(mockAuthService.revealUserApiKey).toHaveBeenCalledWith('user-123');
    });
  });

  // =========================================================================
  // POST /auth/api-key/regenerate
  // =========================================================================
  describe('regenerateApiKey', () => {
    it('should regenerate API key', async () => {
      const req = mockRequest({ id: 'user-123', username: 'fred' });
      mockAuthService.regenerateUserApiKey.mockResolvedValue({
        apiKey: 'sk_newkey789012',
      });

      const result = await controller.regenerateApiKey(req as any);

      expect(result).toEqual({ apiKey: 'sk_newkey789012' });
      expect(mockAuthService.regenerateUserApiKey).toHaveBeenCalledWith('user-123');
    });
  });
});
