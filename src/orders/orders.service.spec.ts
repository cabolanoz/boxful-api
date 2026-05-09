import { NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type PrismaOrderMock = jest.Mocked<
  Pick<PrismaService['order'], 'create' | 'findMany' | 'findFirst'>
>;

describe('OrdersService', () => {
  let service: OrdersService;
  let orderMock: PrismaOrderMock;

  const userId = '507f1f77bcf86cd799439011';

  const createOrderDto: CreateOrderDto = {
    pickupAddress: ' Pickup address ',
    scheduledDate: '2025-07-03',
    recipient: {
      firstName: ' Gabriela ',
      lastName: ' Diaz ',
      email: 'GABRIELA@EXAMPLE.COM',
      phoneCountryCode: '503',
      phoneNumber: '77777777',
      address: ' Recipient address ',
      department: ' San Salvador ',
      municipality: ' San Salvador ',
      referencePoint: ' Reference point ',
      instructions: ' Call before delivery ',
    },
    packages: [
      {
        lengthCm: 15,
        heightCm: 15,
        widthCm: 15,
        weightPounds: 3,
        content: ' iPhone 14 Pro Max ',
      },
    ],
  };

  const publicOrder = {
    id: '507f1f77bcf86cd799439012',
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
    status: OrderStatus.PENDING,
    paymentMode: PaymentMode.STANDARD,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    orderMock = {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    };

    service = new OrdersService({
      order: orderMock,
    } as unknown as PrismaService);
  });

  it('creates an order with normalized data', async () => {
    orderMock.create.mockResolvedValue(publicOrder);

    const response = await service.create(userId, createOrderDto);

    expect(response).toEqual(publicOrder);
    expect(orderMock.create).toHaveBeenCalledTimes(1);

    const createCall = orderMock.create.mock.calls[0];

    if (!createCall) {
      throw new Error('Expected prisma.order.create to be called');
    }

    const createArgs = createCall[0];

    expect(createArgs.data.userId).toBe(userId);
    expect(createArgs.data.pickupAddress).toBe('Pickup address');
    expect(createArgs.data.paymentMode).toBe(PaymentMode.STANDARD);
    expect(createArgs.data.recipient.email).toBe('gabriela@example.com');
    expect(createArgs.data.packages).toMatchObject([
      {
        content: 'iPhone 14 Pro Max',
      },
    ]);
    expect(createArgs.data.trackingCode).toMatch(/^BOX-/);
  });

  it('finds orders ordered by creation date descending', async () => {
    orderMock.findMany.mockResolvedValue([publicOrder]);

    const response = await service.findAll(userId, {
      status: OrderStatus.PENDING,
      paymentMode: PaymentMode.STANDARD,
    });

    expect(response).toEqual([publicOrder]);
    expect(orderMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId,
          status: OrderStatus.PENDING,
          paymentMode: PaymentMode.STANDARD,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    );
  });

  it('finds one order by user and order id', async () => {
    orderMock.findFirst.mockResolvedValue(publicOrder);

    const response = await service.findOne(userId, publicOrder.id);

    expect(response).toEqual(publicOrder);
    expect(orderMock.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: publicOrder.id,
          userId,
        },
      }),
    );
  });

  it('throws NotFoundException when order id is invalid', async () => {
    await expect(service.findOne(userId, 'invalid-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(orderMock.findFirst).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when order does not exist', async () => {
    orderMock.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne(userId, publicOrder.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
