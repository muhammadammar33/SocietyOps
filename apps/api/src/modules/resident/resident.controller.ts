import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { ResidentService } from './resident.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN)
@Controller('residents')
export class ResidentController {
  constructor(private readonly residentService: ResidentService) {}

  @Post()
  create(@Body() body: CreateResidentDto) {
    return this.residentService.create(body);
  }

  @Get()
  findAll() {
    return this.residentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.residentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateResidentDto) {
    return this.residentService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.residentService.remove(id);
  }
}
