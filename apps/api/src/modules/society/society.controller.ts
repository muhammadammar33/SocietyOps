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
import { SocietyService } from './society.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN)
@Controller('societies')
export class SocietyController {
  constructor(private readonly societyService: SocietyService) {}

  @Post()
  create(@Body() body: CreateSocietyDto) {
    return this.societyService.create(body);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get()
  findAll() {
    return this.societyService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.societyService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSocietyDto) {
    return this.societyService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.societyService.remove(id);
  }
}
