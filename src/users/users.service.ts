import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  email: true,
  whatsappCountryCode: true,
  whatsappNumber: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

interface CreateUserParams {
  firstName: string;
  lastName: string;
  gender: User['gender'];
  dateOfBirth: Date;
  email: string;
  passwordHash: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  create(params: CreateUserParams): Promise<PublicUser> {
    return this.prisma.user.create({
      data: params,
      select: publicUserSelect,
    });
  }

  toPublicUser(user: User): PublicUser {
    return {
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
    };
  }
}
