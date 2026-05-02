import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HouseService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateHouseDto) {
    return this.prisma.house.create({
      data,
      include: {
        society: true,
        owner: true,
      },
    });
  }

  findAll() {
    return this.prisma.house.findMany({
      orderBy: [{ block: 'asc' }, { houseNumber: 'asc' }],
      include: {
        society: true,
        owner: true,
        tenants: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            billings: true,
            complaints: true,
            visitorLogs: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const house = await this.prisma.house.findUnique({
      where: { id },
      include: {
        society: true,
        owner: true,
        tenants: {
          include: {
            user: true,
          },
        },
        billings: true,
        complaints: true,
        visitorLogs: true,
      },
    });

    if (!house) {
      throw new NotFoundException(`House ${id} not found`);
    }

    return house;
  }

  async update(id: string, data: UpdateHouseDto) {
    await this.findOne(id);

    return this.prisma.house.update({
      where: { id },
      data,
      include: {
        society: true,
        owner: true,
      },
    });
  }

  async updateResidentCount(
    id: string,
    residentCount: number,
    actor: { id: string; role: UserRole },
  ) {
    const house = await this.findOne(id);

    if (actor.role === 'RESIDENT_OWNER' && house.ownerId !== actor.id) {
      throw new ForbiddenException('You can only update your own residence');
    }

    return this.prisma.house.update({
      where: { id },
      data: { residentCount },
      include: {
        society: true,
        owner: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.house.delete({ where: { id } });
  }
}
