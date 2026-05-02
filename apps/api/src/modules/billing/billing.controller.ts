import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN)
@Controller('billings')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  create(@Body() body: CreateBillingDto) {
    return this.billingService.create(body);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get()
  findAll() {
    return this.billingService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateBillingDto) {
    return this.billingService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.billingService.remove(id);
  }
}
