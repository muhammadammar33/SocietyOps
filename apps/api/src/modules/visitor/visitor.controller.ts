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
import { VisitorService } from './visitor.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN, UserRole.SECURITY_GUARD)
@Controller('visitors')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.SECURITY_GUARD,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Post()
  create(@Body() createVisitorDto: CreateVisitorDto) {
    return this.visitorService.create(createVisitorDto);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.SECURITY_GUARD,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get()
  findAll() {
    return this.visitorService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.SECURITY_GUARD,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVisitorDto: UpdateVisitorDto) {
    return this.visitorService.update(id, updateVisitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitorService.remove(id);
  }
}
