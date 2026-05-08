import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Gender, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { type PublicUser, UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

type UsersServiceMock = jest.Mocked<
  Pick<UsersService, 'findByEmail' | 'create' | 'toPublicUser'>
>;

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersServiceMock;

  const dateOfBirth = new Date('1995-01-01T00:00:00.000Z');
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');

  const publicUser: PublicUser = {
    id: '507f1f77bcf86cd799439011',
    firstName: 'Cesar',
    lastName: 'Bolanos',
    gender: Gender.MALE,
    dateOfBirth,
    email: 'cesar@example.com',
    whatsappCountryCode: '503',
    whatsappNumber: '77777777',
    createdAt,
    updatedAt,
  };

  const registerDto: RegisterDto = {
    firstName: ' Cesar ',
    lastName: ' Bolanos ',
    gender: Gender.MALE,
    dateOfBirth: '1995-01-01',
    email: 'CESAR@EXAMPLE.COM',
    whatsappCountryCode: '503',
    whatsappNumber: '77777777',
    password: 'password123',
    confirmPassword: 'password123',
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      toPublicUser: jest.fn(),
    };

    const configService = {
      get: (key: string): string | undefined => {
        if (key === 'BCRYPT_SALT_ROUNDS') {
          return '4';
        }

        return undefined;
      },
    } as ConfigService;

    const jwtService = new JwtService({
      secret: 'test-secret',
      signOptions: {
        expiresIn: '1d',
      },
    });

    authService = new AuthService(
      configService,
      jwtService,
      usersService as unknown as UsersService,
    );
  });

  it('registers a new user and returns an auth response', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(publicUser);

    const response = await authService.register(registerDto);

    expect(usersService.findByEmail).toHaveBeenCalledWith('cesar@example.com');
    expect(usersService.create).toHaveBeenCalledTimes(1);

    const createCall = usersService.create.mock.calls[0];

    if (!createCall) {
      throw new Error('Expected usersService.create to be called');
    }

    const createParams = createCall[0];

    expect(createParams.firstName).toBe('Cesar');
    expect(createParams.lastName).toBe('Bolanos');
    expect(createParams.email).toBe('cesar@example.com');
    expect(createParams.passwordHash).not.toBe(registerDto.password);

    const passwordMatches = await bcrypt.compare(
      registerDto.password,
      createParams.passwordHash,
    );

    expect(passwordMatches).toBe(true);

    expect(response.tokenType).toBe('Bearer');
    expect(typeof response.accessToken).toBe('string');
    expect(response.user).toEqual(publicUser);
  });

  it('throws BadRequestException when passwords do not match', async () => {
    await expect(
      authService.register({
        ...registerDto,
        confirmPassword: 'different-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersService.findByEmail).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when email is already registered', async () => {
    const existingUser: User = {
      ...publicUser,
      passwordHash: 'hashed-password',
    };

    usersService.findByEmail.mockResolvedValue(existingUser);

    await expect(authService.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('logs in a valid user and returns an auth response', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);

    const user: User = {
      ...publicUser,
      passwordHash,
    };

    const loginDto: LoginDto = {
      email: 'CESAR@EXAMPLE.COM',
      password: 'password123',
    };

    usersService.findByEmail.mockResolvedValue(user);
    usersService.toPublicUser.mockReturnValue(publicUser);

    const response = await authService.login(loginDto);

    expect(usersService.findByEmail).toHaveBeenCalledWith('cesar@example.com');
    expect(usersService.toPublicUser).toHaveBeenCalledWith(user);
    expect(response.tokenType).toBe('Bearer');
    expect(typeof response.accessToken).toBe('string');
    expect(response.user).toEqual(publicUser);
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws UnauthorizedException when password is invalid', async () => {
    const passwordHash = await bcrypt.hash('password123', 4);

    const user: User = {
      ...publicUser,
      passwordHash,
    };

    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      authService.login({
        email: 'cesar@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(usersService.toPublicUser).not.toHaveBeenCalled();
  });
});
