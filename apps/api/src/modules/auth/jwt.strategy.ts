import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phone: string;
  cnic: string;
  name: string;
  role: UserRole;
  societyId: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'replace-with-strong-secret',
      ),
    });
  }

  async validate(payload: { sub: string }): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Email is not verified. Please verify your email before signing in.',
      );
    }

    const rawEmail = Reflect.get(user as Record<string, unknown>, 'email');

    return {
      id: user.id,
      email: typeof rawEmail === 'string' ? rawEmail : null,
      emailVerified: Boolean(user.emailVerifiedAt),
      phone: user.phone,
      cnic: user.cnic,
      name: user.name,
      role: user.role,
      societyId: user.societyId ?? null,
    };
  }
}
