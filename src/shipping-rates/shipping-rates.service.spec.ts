import { NotFoundException } from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingRatesService } from './shipping-rates.service';

type ShippingRateMock = jest.Mocked<
  Pick<PrismaService['shippingRate'], 'findFirst'>
>;

describe('ShippingRatesService', () => {
  let service: ShippingRatesService;
  let shippingRateMock: ShippingRateMock;

  beforeEach(() => {
    shippingRateMock = {
      findFirst: jest.fn(),
    };

    service = new ShippingRatesService({
      shippingRate: shippingRateMock,
    } as unknown as PrismaService);
  });

  it('gets the active base cost for the scheduled date weekday', async () => {
    shippingRateMock.findFirst.mockResolvedValue({
      id: '507f1f77bcf86cd799439099',
      dayOfWeek: DayOfWeek.THURSDAY,
      baseCost: 4.5,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(
      service.getBaseCostForDate(new Date('2025-07-03T00:00:00.000Z')),
    ).resolves.toBe(4.5);

    expect(shippingRateMock.findFirst).toHaveBeenCalledWith({
      where: {
        dayOfWeek: DayOfWeek.THURSDAY,
        active: true,
      },
    });
  });

  it('throws when there is no active rate for the scheduled date', async () => {
    shippingRateMock.findFirst.mockResolvedValue(null);

    await expect(
      service.getBaseCostForDate(new Date('2025-07-03T00:00:00.000Z')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
