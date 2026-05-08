import { Gender } from '@prisma/client';
import { type PublicUser } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { AuthResponse } from './types/auth-response.type';

type AuthServiceMock = jest.Mocked<Pick<AuthService, 'register' | 'login'>>;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthServiceMock;

  const publicUser: PublicUser = {
    id: '507f1f77bcf86cd799439011',
    firstName: 'Cesar',
    lastName: 'Bolanos',
    gender: Gender.MALE,
    dateOfBirth: new Date('1995-01-01T00:00:00.000Z'),
    email: 'cesar@example.com',
    whatsappCountryCode: '503',
    whatsappNumber: '77777777',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const authResponse: AuthResponse = {
    accessToken: 'test-token',
    tokenType: 'Bearer',
    user: publicUser,
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    controller = new AuthController(authService as unknown as AuthService);
  });

  it('registers a user', async () => {
    const dto: RegisterDto = {
      firstName: 'Cesar',
      lastName: 'Bolanos',
      gender: Gender.MALE,
      dateOfBirth: '1995-01-01',
      email: 'cesar@example.com',
      whatsappCountryCode: '503',
      whatsappNumber: '77777777',
      password: 'password123',
      confirmPassword: 'password123',
    };

    authService.register.mockResolvedValue(authResponse);

    await expect(controller.register(dto)).resolves.toEqual(authResponse);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('logs in a user', async () => {
    const dto: LoginDto = {
      email: 'cesar@example.com',
      password: 'password123',
    };

    authService.login.mockResolvedValue(authResponse);

    await expect(controller.login(dto)).resolves.toEqual(authResponse);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('returns the current user', () => {
    expect(controller.me(publicUser)).toEqual(publicUser);
  });
});
