import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocietyModule } from './modules/society/society.module';
import { HouseModule } from './modules/house/house.module';
import { ResidentModule } from './modules/resident/resident.module';
import { BillingModule } from './modules/billing/billing.module';
import { ComplaintModule } from './modules/complaint/complaint.module';
import { VisitorModule } from './modules/visitor/visitor.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    SocietyModule,
    HouseModule,
    ResidentModule,
    BillingModule,
    ComplaintModule,
    VisitorModule,
    NotificationModule,
  ],
})
export class AppModule {}
