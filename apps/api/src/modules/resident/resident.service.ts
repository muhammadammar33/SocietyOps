import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { SmtpEmailService } from '../auth/smtp-email.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';

@Injectable()
export class ResidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly smtpEmailService: SmtpEmailService,
  ) {}

  async create(data: CreateResidentDto) {
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

    const verificationToken = this.generateEmailVerificationToken();

    const user = await this.prisma.user.create({
      data: {
        ...data,
        email,
        emailVerifiedAt: null,
        emailVerificationTokenHash: verificationToken.tokenHash,
        emailVerificationTokenExpiresAt: verificationToken.expiresAt,
      },
    });

    void this.smtpEmailService
      .sendEmailVerificationEmail({
        email,
        name: user.name,
        verificationLink: this.buildEmailVerificationLink(
          verificationToken.token,
        ),
      })
      .catch(() => {
        // User creation should not fail because SMTP delivery failed.
      });

    return user;
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        society: true,
        ownedHouses: true,
        tenantAssignments: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const resident = await this.prisma.user.findUnique({
      where: { id },
      include: {
        society: true,
        ownedHouses: true,
        tenantAssignments: {
          include: {
            house: true,
          },
        },
        complaints: true,
      },
    });

    if (!resident) {
      throw new NotFoundException(`Resident ${id} not found`);
    }

    return resident;
  }

  async update(id: string, data: UpdateResidentDto) {
    const resident = await this.findOne(id);

    const rawEmail = Reflect.get(data as Record<string, unknown>, 'email');
    const rawPhone = Reflect.get(data as Record<string, unknown>, 'phone');
    const rawCnic = Reflect.get(data as Record<string, unknown>, 'cnic');
    const requestedEmail = typeof rawEmail === 'string' ? rawEmail : null;
    const requestedPhone = typeof rawPhone === 'string' ? rawPhone : null;
    const requestedCnic = typeof rawCnic === 'string' ? rawCnic : null;
    const currentEmail = resident.email;
    const hasEmailUpdate = requestedEmail !== null;
    const nextEmail = hasEmailUpdate
      ? this.normalizeEmail(requestedEmail)
      : currentEmail;

    if (hasEmailUpdate && !nextEmail) {
      throw new BadRequestException('Email cannot be empty');
    }

    const changedEmail = nextEmail !== currentEmail;
    const changedPhone =
      requestedPhone !== null && requestedPhone !== resident.phone;
    const changedCnic =
      requestedCnic !== null && requestedCnic !== resident.cnic;

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
            not: id,
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
      where: { id },
      data: {
        ...data,
        ...(hasEmailUpdate ? { email: nextEmail } : {}),
        ...(changedEmail
          ? {
              emailVerifiedAt: null,
              emailVerificationTokenHash: verificationToken?.tokenHash,
              emailVerificationTokenExpiresAt: verificationToken?.expiresAt,
            }
          : {}),
      },
    });

    if (changedEmail && nextEmail && verificationToken) {
      void this.smtpEmailService
        .sendEmailVerificationEmail({
          email: nextEmail,
          name: updated.name,
          verificationLink: this.buildEmailVerificationLink(
            verificationToken.token,
          ),
        })
        .catch(() => {
          // User update should not fail because SMTP delivery failed.
        });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({ where: { id } });
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
