import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AuthenticatedUser } from './jwt.strategy';
import { SmtpEmailService } from './smtp-email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smtpEmailService: SmtpEmailService,
  ) {}

  async register(data: RegisterDto) {
    const email = this.normalizeEmail(data.email);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: data.phone }, { cnic: data.cnic }],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email, phone or CNIC already exists',
      );
    }

    const passwordHash = await hash(data.password, 10);
    const verificationToken = this.generateEmailVerificationToken();

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        cnic: data.cnic,
        role: data.role,
        societyId: data.societyId,
        emailVerifiedAt: null,
        emailVerificationTokenHash: verificationToken.tokenHash,
        emailVerificationTokenExpiresAt: verificationToken.expiresAt,
        authCredential: {
          create: {
            passwordHash,
          },
        },
      },
    });

    void this.smtpEmailService
      .sendUserCreatedEmail({
        email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        password: data.password,
        verificationLink: this.buildEmailVerificationLink(
          verificationToken.token,
        ),
        includeSocietyAdminDefaultPassword:
          data.role === UserRole.SOCIETY_ADMIN,
      })
      .catch(() => {
        // User is already created; email delivery should not fail the request.
      });

    return this.buildAuthResponse(user);
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: data.phone },
      include: {
        authCredential: true,
      },
    });

    if (!user?.authCredential) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await compare(
      data.password,
      user.authCredential.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(
        'Email is not verified. Please verify your email before signing in.',
      );
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(token: string) {
    const normalizedToken = token?.trim();
    if (!normalizedToken) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = this.hashVerificationToken(normalizedToken);
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: {
          gt: now,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Verification link is invalid or expired',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const rawEmail = Reflect.get(data as Record<string, unknown>, 'email');
    const rawPhone = Reflect.get(data as Record<string, unknown>, 'phone');
    const rawCnic = Reflect.get(data as Record<string, unknown>, 'cnic');
    const rawName = Reflect.get(data as Record<string, unknown>, 'name');
    const rawCurrentEmail = Reflect.get(
      user as Record<string, unknown>,
      'email',
    );

    const requestedEmail = typeof rawEmail === 'string' ? rawEmail : null;
    const requestedPhone = typeof rawPhone === 'string' ? rawPhone : null;
    const requestedCnic = typeof rawCnic === 'string' ? rawCnic : null;
    const requestedName = typeof rawName === 'string' ? rawName : null;
    const currentEmail =
      typeof rawCurrentEmail === 'string' ? rawCurrentEmail : null;

    const hasEmailUpdate = requestedEmail !== null;
    const nextEmail = hasEmailUpdate
      ? this.normalizeEmail(requestedEmail)
      : currentEmail;

    if (hasEmailUpdate && !nextEmail) {
      throw new BadRequestException('Email cannot be empty');
    }

    const changedEmail = nextEmail !== currentEmail;
    const changedPhone =
      requestedPhone !== null && requestedPhone !== user.phone;
    const changedCnic = requestedCnic !== null && requestedCnic !== user.cnic;

    if (changedEmail || changedPhone || changedCnic) {
      const uniqueFieldChecks: Prisma.UserWhereInput[] = [];

      if (changedEmail && nextEmail) {
        uniqueFieldChecks.push({ email: nextEmail });
      }

      if (changedPhone && requestedPhone) {
        uniqueFieldChecks.push({ phone: requestedPhone });
      }

      if (changedCnic && requestedCnic) {
        uniqueFieldChecks.push({ cnic: requestedCnic });
      }

      const conflict = await this.prisma.user.findFirst({
        where: {
          id: {
            not: userId,
          },
          OR: uniqueFieldChecks,
        },
      });

      if (conflict) {
        throw new ConflictException(
          'Another user already uses this email, phone, or CNIC',
        );
      }
    }

    const verificationToken = changedEmail
      ? this.generateEmailVerificationToken()
      : null;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(requestedName !== null ? { name: requestedName } : {}),
        ...(requestedPhone !== null ? { phone: requestedPhone } : {}),
        ...(requestedCnic !== null ? { cnic: requestedCnic } : {}),
        ...(changedEmail
          ? {
              email: nextEmail,
              emailVerifiedAt: null,
              emailVerificationTokenHash: verificationToken?.tokenHash,
              emailVerificationTokenExpiresAt: verificationToken?.expiresAt,
            }
          : {}),
      },
    });

    if (changedEmail && nextEmail && verificationToken) {
      const emailService: SmtpEmailService = this.smtpEmailService;

      void emailService
        .sendEmailVerificationEmail({
          email: nextEmail,
          name: updated.name,
          verificationLink: this.buildEmailVerificationLink(
            verificationToken.token,
          ),
        })
        .catch(() => {
          // Profile update must not fail because of email transport issues.
        });
    }

    return this.me(updated.id);
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await hash(newPassword, 10);

    await this.prisma.authCredential.upsert({
      where: { userId },
      update: { passwordHash },
      create: { userId, passwordHash },
    });
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string | null;
    emailVerifiedAt: Date | null;
    phone: string;
    cnic: string;
    name: string;
    role: UserRole;
    societyId: string | null;
  }) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      societyId: user.societyId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        phone: user.phone,
        cnic: user.cnic,
        name: user.name,
        role: user.role,
        societyId: user.societyId,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateEmailVerificationToken() {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashVerificationToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return { token, tokenHash, expiresAt };
  }

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildEmailVerificationLink(token: string): string {
    const frontendUrl = this.configService
      .get<string>('FRONTEND_URL', 'http://localhost:3000')
      .replace(/\/$/, '');

    return `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
  }
}
