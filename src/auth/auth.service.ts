import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './types/auth-response.type';
import { JwtPayload } from './types/jwt-payload.type';
import { normalizeEmail } from '../common/utils/normalize-email';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email,
      whatsappCountryCode,
      whatsappNumber,
      password,
      confirmPassword,
    } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do NOT match');
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Emails is already registered');
    }

    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 12,
    );

    if (!Number.isInteger(saltRounds) || saltRounds < 4 || saltRounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 4 and 15');
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.usersService.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      dateOfBirth: new Date(dateOfBirth),
      email: normalizedEmail,
      whatsappCountryCode: whatsappCountryCode.trim(),
      whatsappNumber: whatsappNumber.trim(),
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const normalizedEmail = normalizeEmail(email);
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(this.usersService.toPublicUser(user));
  }

  private async buildAuthResponse(user: PublicUser): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user,
    };
  }
}
