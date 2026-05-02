import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';

@Injectable()
export class SocietyService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSocietyDto) {
    return this.prisma.society.create({ data });
  }

  findAll() {
    return this.prisma.society.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            houses: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const society = await this.prisma.society.findUnique({
      where: { id },
      include: {
        users: true,
        houses: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!society) {
      throw new NotFoundException(`Society ${id} not found`);
    }

    return society;
  }

  async update(id: string, data: UpdateSocietyDto) {
    await this.findOne(id);

    return this.prisma.society.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.society.delete({ where: { id } });
  }
}
