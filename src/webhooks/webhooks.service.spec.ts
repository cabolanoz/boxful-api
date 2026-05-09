import { OrderStatus, PaymentMode, type Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementsService } from '../settlements/settlements.service';
import { WebhooksService } from './webhooks.service';

type PrismaOrderMock = jest.Mocked<
  Pick<PrismaService['order'], 'findUnique' | 'update'>
>;

describe('WebhooksService', () => {
  let service: WebhooksService;
  let orderMock: PrismaOrderMock;

  const order: Order = {
    id: '507f1f77bcf86cd799439012',
    userId: '507f1f77bcf86cd799439011',
    trackingCode: 'BOX-ABC12345',
    pickupAddress: 'Pickup address',
    scheduledDate: new Date('2025-07-03T00:00:00.000Z'),
    recipient: {
      firstName: 'Gabriela',
      lastName: 'Diaz',
      email: 'gabriela@example.com',
      phoneCountryCode: '503',
      phoneNumber: '77777777',
      address: 'Recipient address',
      department: 'San Salvador',
      municipality: 'San Salvador',
      referencePoint: 'Reference point',
      instructions: 'Call before delivery',
    },
    packages: [
      {
        lengthCm: 15,
        heightCm: 15,
        widthCm: 15,
        weightPounds: 3,
        content: 'iPhone 14 Pro Max',
      },
    ],
    expectedCollectionAmount: 10,
    collectedAmount: null,
    shippingCost: 5,
    codCommission: 0,
    settlementAmount: -5,
    deliveredAt: null,
    paidAt: null,
    status: OrderStatus.PENDING,
    paymentMode: PaymentMode.COD,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    orderMock = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };

    service = new WebhooksService(
      {
        order: orderMock,
      } as unknown as PrismaService,
      new SettlementsService(),
    );
  });

  it('updates a delivered COD order and recalculates settlement from real collected amount', async () => {
    orderMock.findUnique.mockResolvedValue(order);
    orderMock.update.mockResolvedValue({
      ...order,
      status: OrderStatus.DELIVERED,
      collectedAmount: 15,
      codCommission: 0.0015,
      settlementAmount: 9.9985,
      deliveredAt: new Date('2026-01-02T00:00:00.000Z'),
      paidAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const response = await service.handleOrderDelivery({
      trackingCode: order.trackingCode,
      status: OrderStatus.DELIVERED,
      collectedAmount: 15,
    });

    expect(response.status).toBe(OrderStatus.DELIVERED);
    expect(orderMock.update).toHaveBeenCalledTimes(1);

    const updateCall = orderMock.update.mock.calls[0];

    if (!updateCall) {
      throw new Error('Expected prisma.order.update to be called');
    }

    const updateArgs = updateCall[0];

    expect(updateArgs.where).toEqual({
      id: order.id,
    });
    expect(updateArgs.data).toMatchObject({
      status: OrderStatus.DELIVERED,
      collectedAmount: 15,
      codCommission: 0.0015,
      settlementAmount: 9.9985,
    });
  });
});
