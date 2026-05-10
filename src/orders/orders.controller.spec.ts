import { Gender, OrderStatus, PaymentMode } from '@prisma/client';
import { PublicUser } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersController } from './orders.controller';
import { OrdersService, PublicOrder } from './orders.service';

type OrdersServiceMock = jest.Mocked<
  Pick<OrdersService, 'create' | 'findAll' | 'findOne' | 'updateStatus'>
>;

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: OrdersServiceMock;

  const user: PublicUser = {
    id: '507f1f77bcf86cd799439011',
    firstName: 'Cesar',
    lastName: 'Bolanos',
    gender: Gender.MALE,
    dateOfBirth: new Date('1995-01-01T00:00:00.000Z'),
    email: 'cesar@example.com',
    whatsappCountryCode: '503',
    whatsappNumber: '77777777',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const createOrderDto: CreateOrderDto = {
    pickupAddress: 'Pickup address',
    scheduledDate: '2025-07-03',
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
  };

  const publicOrder: PublicOrder = {
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
    packages: createOrderDto.packages,
    status: OrderStatus.PENDING,
    paymentMode: PaymentMode.STANDARD,
    expectedCollectionAmount: null,
    collectedAmount: null,
    shippingCost: 4.5,
    codCommission: 0,
    settlementAmount: -4.5,
    deliveredAt: null,
    paidAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateStatus: jest.fn(),
    };

    controller = new OrdersController(
      ordersService as unknown as OrdersService,
    );
  });

  it('creates an order for the current user', async () => {
    ordersService.create.mockResolvedValue(publicOrder);

    await expect(controller.create(user, createOrderDto)).resolves.toEqual(
      publicOrder,
    );

    expect(ordersService.create).toHaveBeenCalledWith(user.id, createOrderDto);
  });

  it('finds orders for the current user', async () => {
    ordersService.findAll.mockResolvedValue([publicOrder]);

    await expect(controller.findAll(user, {})).resolves.toEqual([publicOrder]);

    expect(ordersService.findAll).toHaveBeenCalledWith(user.id, {});
  });

  it('finds one order for the current user', async () => {
    ordersService.findOne.mockResolvedValue(publicOrder);

    await expect(controller.findOne(user, publicOrder.id)).resolves.toEqual(
      publicOrder,
    );

    expect(ordersService.findOne).toHaveBeenCalledWith(user.id, publicOrder.id);
  });

  it('updates an order status for the current user', async () => {
    const updatedOrder: PublicOrder = {
      ...publicOrder,
      status: OrderStatus.IN_TRANSIT,
    };
    const updateStatusDto = {
      status: OrderStatus.IN_TRANSIT,
    };

    ordersService.updateStatus.mockResolvedValue(updatedOrder);

    await expect(
      controller.updateStatus(user, publicOrder.id, updateStatusDto),
    ).resolves.toEqual(updatedOrder);

    expect(ordersService.updateStatus).toHaveBeenCalledWith(
      user.id,
      publicOrder.id,
      updateStatusDto,
    );
  });
});
