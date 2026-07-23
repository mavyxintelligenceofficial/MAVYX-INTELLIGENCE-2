import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

/**
 * Never return the raw Prisma User object to a controller - it contains
 * passwordHash. Every public method here strips that out before
 * returning anything.
 */
function toPublicUser(user: { id: string; email: string; fullName: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
      },
    });

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

    return { user: toPublicUser(user), accessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });

    return { user: toPublicUser(user), accessToken };
  }
}
