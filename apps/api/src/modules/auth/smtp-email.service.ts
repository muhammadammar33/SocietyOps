import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpEmailService {
  private readonly logger = new Logger(SmtpEmailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly from?: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const secure =
      this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');

    if (!host || !user || !pass || !from) {
      this.logger.warn(
        'SMTP is not fully configured. User creation emails are disabled.',
      );
      return;
    }

    this.from = from;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendUserCreatedEmail(payload: {
    email: string;
    name: string;
    phone: string;
    role: string;
    password: string;
    verificationLink: string;
    includeSocietyAdminDefaultPassword: boolean;
  }): Promise<void> {
    if (!this.transporter || !this.from) {
      return;
    }

    const societyAdminPasswordLines = payload.includeSocietyAdminDefaultPassword
      ? ['', 'General Society Admin Password: SocietyAdmin@123']
      : [];

    await this.transporter.sendMail({
      from: this.from,
      to: payload.email,
      subject: 'Your SocietyOps account has been created',
      text: [
        `Hello ${payload.name},`,
        '',
        'Your SocietyOps account has been created successfully.',
        `Role: ${payload.role}`,
        `Phone: ${payload.phone}`,
        `Temporary Password: ${payload.password}`,
        ...societyAdminPasswordLines,
        '',
        'Verify your email address before signing in:',
        payload.verificationLink,
        '',
        'Please log in and change your password as soon as possible.',
      ].join('\n'),
    });
  }

  async sendEmailVerificationEmail(payload: {
    email: string;
    name: string;
    verificationLink: string;
  }): Promise<void> {
    if (!this.transporter || !this.from) {
      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to: payload.email,
      subject: 'Verify your SocietyOps email address',
      text: [
        `Hello ${payload.name},`,
        '',
        'Use the link below to verify your email address:',
        payload.verificationLink,
        '',
        'You must verify your email before signing in.',
      ].join('\n'),
    });
  }
}
