import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMode, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementsService } from '../settlements/settlements.service';
import { ShippingRatesService } from '../shipping-rates/shipping-rates.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { generateTrackingCode } from './utils/generate-tracking-code';

export const publicOrderSelect = {
  id: true,
  trackingCode: true,
  pickupAddress: true,
  scheduledDate: true,
  recipient: true,
  packages: true,
  expectedCollectionAmount: true,
  collectedAmount: true,
  shippingCost: true,
  codCommission: true,
  settlementAmount: true,
  deliveredAt: true,
  paidAt: true,
  status: true,
  paymentMode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

export type PublicOrder = Prisma.OrderGetPayload<{
  select: typeof publicOrderSelect;
}>;

const orderStatusUpdateSelect = {
  id: true,
  paymentMode: true,
  collectedAmount: true,
  shippingCost: true,
  deliveredAt: true,
  paidAt: true,
} satisfies Prisma.OrderSelect;

type OrderStatusUpdateData = Prisma.OrderGetPayload<{
  select: typeof orderStatusUpdateSelect;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingRatesService: ShippingRatesService,
    private readonly settlementsService: SettlementsService,
  ) {}

  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<PublicOrder> {
    const scheduledDate = new Date(createOrderDto.scheduledDate);
    const paymentMode = createOrderDto.paymentMode ?? PaymentMode.STANDARD;

    if (
      paymentMode === PaymentMode.COD &&
      createOrderDto.expectedCollectionAmount == null
    ) {
      throw new BadRequestException(
        'Expected collection amount is required for COD orders',
      );
    }

    const shippingCost =
      await this.shippingRatesService.getBaseCostForDate(scheduledDate);
    const settlement = this.settlementsService.calculateOrderSettlement({
      paymentMode,
      shippingCost,
    });

    return this.prisma.order.create({
      data: {
        userId,
        trackingCode: generateTrackingCode(),
        pickupAddress: createOrderDto.pickupAddress.trim(),
        scheduledDate,
        paymentMode,
        expectedCollectionAmount:
          paymentMode === PaymentMode.COD
            ? createOrderDto.expectedCollectionAmount
            : undefined,
        shippingCost,
        codCommission: settlement.codCommission,
        settlementAmount: settlement.settlementAmount,
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

  async updateStatus(
    userId: string,
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<PublicOrder> {
    if (!this.isValidMongoObjectId(orderId)) {
      throw new NotFoundException('Order not found');
    }

    const order: OrderStatusUpdateData | null =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
        select: orderStatusUpdateSelect,
      });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const collectedAmount = this.getStatusCollectedAmount(
      updateOrderStatusDto,
      order,
    );
    const settlement = this.settlementsService.calculateOrderSettlement({
      paymentMode: order.paymentMode,
      shippingCost: order.shippingCost,
      collectedAmount:
        order.paymentMode === PaymentMode.COD ? collectedAmount : null,
    });
    const now = new Date();

    return this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: updateOrderStatusDto.status,
        collectedAmount:
          updateOrderStatusDto.collectedAmount == null
            ? undefined
            : updateOrderStatusDto.collectedAmount,
        codCommission: settlement.codCommission,
        settlementAmount: settlement.settlementAmount,
        deliveredAt:
          updateOrderStatusDto.status === OrderStatus.DELIVERED
            ? (order.deliveredAt ?? now)
            : order.deliveredAt,
        paidAt:
          order.paymentMode === PaymentMode.COD && collectedAmount != null
            ? (order.paidAt ?? now)
            : order.paidAt,
      },
      select: publicOrderSelect,
    });
  }

  private getStatusCollectedAmount(
    updateOrderStatusDto: UpdateOrderStatusDto,
    order: OrderStatusUpdateData,
  ): number | null {
    return updateOrderStatusDto.collectedAmount ?? order.collectedAmount;
  }

  private isValidMongoObjectId(value: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }
}
