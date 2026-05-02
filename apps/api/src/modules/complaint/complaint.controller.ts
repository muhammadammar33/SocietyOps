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
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN)
@Controller('complaints')
export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Post()
  create(@Body() body: CreateComplaintDto) {
    return this.complaintService.create(body);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get()
  findAll() {
    return this.complaintService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateComplaintDto) {
    return this.complaintService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.complaintService.remove(id);
  }
}
