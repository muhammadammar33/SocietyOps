import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateBillingDto) {
    return this.prisma.billing.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate),
      },
      include: {
        house: true,
        payments: true,
      },
    });
  }

  findAll() {
    return this.prisma.billing.findMany({
      orderBy: { dueDate: 'asc' },
      include: {
        house: {
          include: {
            owner: true,
          },
        },
        payments: true,
      },
    });
  }

  async findOne(id: string) {
    const billing = await this.prisma.billing.findUnique({
      where: { id },
      include: {
        house: {
          include: {
            owner: true,
            society: true,
          },
        },
        payments: true,
      },
    });

    if (!billing) {
      throw new NotFoundException(`Billing ${id} not found`);
    }

    return billing;
  }

  async update(id: string, data: UpdateBillingDto) {
    await this.findOne(id);

    return this.prisma.billing.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        house: true,
        payments: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.billing.delete({ where: { id } });
  }
}
