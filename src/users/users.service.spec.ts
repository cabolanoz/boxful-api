import { Gender, type User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService({} as PrismaService);
  });

  it('converts a database user into a public user without passwordHash', () => {
    const user: User = {
      id: '507f1f77bcf86cd799439011',
      firstName: 'Cesar',
      lastName: 'Bolanos',
      gender: Gender.MALE,
      dateOfBirth: new Date('1995-01-01T00:00:00.000Z'),
      email: 'cesar@example.com',
      passwordHash: 'hashed-password',
      whatsappCountryCode: '503',
      whatsappNumber: '77777777',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const publicUser = service.toPublicUser(user);

    expect(publicUser).toEqual({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      whatsappCountryCode: user.whatsappCountryCode,
      whatsappNumber: user.whatsappNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

    expect(publicUser).not.toHaveProperty('passwordHash');
  });
});
