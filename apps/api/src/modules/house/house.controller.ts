import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { HouseService } from './house.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateResidentCountDto } from './dto/update-resident-count.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN)
@Controller('houses')
export class HouseController {
  constructor(private readonly houseService: HouseService) {}

  @Post()
  create(@Body() body: CreateHouseDto) {
    return this.houseService.create(body);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get()
  findAll() {
    return this.houseService.findAll();
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SOCIETY_ADMIN,
    UserRole.RESIDENT_OWNER,
    UserRole.RESIDENT_TENANT,
  )
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.houseService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateHouseDto) {
    return this.houseService.update(id, body);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.SOCIETY_ADMIN, UserRole.RESIDENT_OWNER)
  @Patch(':id/resident-count')
  updateResidentCount(
    @Param('id') id: string,
    @Body() body: UpdateResidentCountDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.houseService.updateResidentCount(id, body.residentCount, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.houseService.remove(id);
  }
}
