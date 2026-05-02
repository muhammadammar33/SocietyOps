import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';

@Injectable()
export class ResidentService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateResidentDto) {
    return this.prisma.user.create({ data });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        society: true,
        ownedHouses: true,
        tenantAssignments: {
          include: {
            house: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const resident = await this.prisma.user.findUnique({
      where: { id },
      include: {
        society: true,
        ownedHouses: true,
        tenantAssignments: {
          include: {
            house: true,
          },
        },
        complaints: true,
      },
    });

    if (!resident) {
      throw new NotFoundException(`Resident ${id} not found`);
    }

    return resident;
  }

  async update(id: string, data: UpdateResidentDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.delete({ where: { id } });
  }
}
