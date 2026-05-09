import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicOrderSelect, type PublicOrder } from '../orders/orders.service';
import { SettlementsService } from '../settlements/settlements.service';
import { OrderDeliveryWebhookDto } from './dto/order-delivery-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settlementsService: SettlementsService,
  ) {}

  async handleOrderDelivery(
    payload: OrderDeliveryWebhookDto,
  ): Promise<PublicOrder> {
    const order = await this.prisma.order.findUnique({
      where: {
        trackingCode: payload.trackingCode,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const collectedAmount = payload.collectedAmount ?? order.collectedAmount;
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
        status: payload.status,
        collectedAmount:
          payload.collectedAmount == null ? undefined : payload.collectedAmount,
        codCommission: settlement.codCommission,
        settlementAmount: settlement.settlementAmount,
        deliveredAt:
          payload.status === OrderStatus.DELIVERED
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
}
