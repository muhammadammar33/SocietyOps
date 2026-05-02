import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';

@Injectable()
export class ComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateComplaintDto) {
    return this.prisma.complaint.create({
      data,
      include: {
        user: true,
        house: true,
        assignedStaff: true,
      },
    });
  }

  findAll() {
    return this.prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        house: true,
        assignedStaff: true,
      },
    });
  }

  async findOne(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        user: true,
        house: {
          include: {
            society: true,
            owner: true,
          },
        },
        assignedStaff: true,
      },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint ${id} not found`);
    }

    return complaint;
  }

  async update(id: string, data: UpdateComplaintDto) {
    await this.findOne(id);

    return this.prisma.complaint.update({
      where: { id },
      data,
      include: {
        user: true,
        house: true,
        assignedStaff: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.complaint.delete({ where: { id } });
  }
}
