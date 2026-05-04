import { Module } from '@nestjs/common';
import { SmtpEmailService } from '../auth/smtp-email.service';
import { ResidentController } from './resident.controller';
import { ResidentService } from './resident.service';

@Module({
	controllers: [ResidentController],
	providers: [ResidentService, SmtpEmailService],
})
export class ResidentModule {}
