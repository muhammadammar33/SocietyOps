import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Injectable()
export class VisitorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVisitorDto) {
    return this.prisma.visitorLog.create({
      data: {
        houseId: data.houseId,
        visitorName: data.visitorName,
        entryTime: new Date(data.entryTime),
        ...(data.exitTime && { exitTime: new Date(data.exitTime) }),
        ...(data.approvedById && { approvedById: data.approvedById }),
      },
      include: { house: { include: { owner: true, society: true } } },
    });
  }

  async findAll() {
    return this.prisma.visitorLog.findMany({
      include: { house: { include: { owner: true, society: true } } },
      orderBy: { entryTime: 'desc' },
    });
  }

  async findOne(id: string) {
    const visitorLog = await this.prisma.visitorLog.findUnique({
      where: { id },
      include: { house: { include: { owner: true, society: true } } },
    });

    if (!visitorLog) {
      throw new NotFoundException(`Visitor log #${id} not found`);
    }

    return visitorLog;
  }

  async update(id: string, data: UpdateVisitorDto) {
    const visitorLog = await this.findOne(id);

    return this.prisma.visitorLog.update({
      where: { id },
      data: {
        ...(data.houseId && { houseId: data.houseId }),
        ...(data.visitorName && { visitorName: data.visitorName }),
        ...(data.entryTime && { entryTime: new Date(data.entryTime) }),
        ...(data.exitTime !== undefined && { exitTime: data.exitTime ? new Date(data.exitTime) : null }),
        ...(data.approvedById !== undefined && { approvedById: data.approvedById }),
      },
      include: { house: { include: { owner: true, society: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.visitorLog.delete({
      where: { id },
    });
  }
}
