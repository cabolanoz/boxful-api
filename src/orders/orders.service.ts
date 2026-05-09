import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMode, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { generateTrackingCode } from './utils/generate-tracking-code';

const publicOrderSelect = {
  id: true,
  trackingCode: true,
  pickupAddress: true,
  scheduledDate: true,
  recipient: true,
  packages: true,
  status: true,
  paymentMode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

export type PublicOrder = Prisma.OrderGetPayload<{
  select: typeof publicOrderSelect;
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createOrderDto: CreateOrderDto): Promise<PublicOrder> {
    return this.prisma.order.create({
      data: {
        userId,
        trackingCode: generateTrackingCode(),
        pickupAddress: createOrderDto.pickupAddress.trim(),
        scheduledDate: new Date(createOrderDto.scheduledDate),
        paymentMode: PaymentMode.STANDARD,
        recipient: {
          firstName: createOrderDto.recipient.firstName.trim(),
          lastName: createOrderDto.recipient.lastName.trim(),
          email: createOrderDto.recipient.email?.trim().toLowerCase(),
          phoneCountryCode: createOrderDto.recipient.phoneCountryCode.trim(),
          phoneNumber: createOrderDto.recipient.phoneNumber.trim(),
          address: createOrderDto.recipient.address.trim(),
          department: createOrderDto.recipient.department.trim(),
          municipality: createOrderDto.recipient.municipality.trim(),
          referencePoint: createOrderDto.recipient.referencePoint?.trim(),
          instructions: createOrderDto.recipient.instructions?.trim(),
        },
        packages: createOrderDto.packages.map((packageItem) => ({
          lengthCm: packageItem.lengthCm,
          heightCm: packageItem.heightCm,
          widthCm: packageItem.widthCm,
          weightPounds: packageItem.weightPounds,
          content: packageItem.content.trim(),
        })),
      },
      select: publicOrderSelect,
    });
  }

  findAll(userId: string, query: FindOrdersQueryDto): Promise<PublicOrder[]> {
    const where: Prisma.OrderWhereInput = {
      userId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentMode) {
      where.paymentMode = query.paymentMode;
    }

    if (query.dateFrom || query.dateTo) {
      where.scheduledDate = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    return this.prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: publicOrderSelect,
    });
  }

  async findOne(userId: string, orderId: string): Promise<PublicOrder> {
    if (!this.isValidMongoObjectId(orderId)) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: publicOrderSelect,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private isValidMongoObjectId(value: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }
}
