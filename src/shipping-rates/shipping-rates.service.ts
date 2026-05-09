import { Injectable, NotFoundException } from '@nestjs/common';
import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const daysByUtcIndex: readonly DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

@Injectable()
export class ShippingRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getBaseCostForDate(date: Date): Promise<number> {
    const dayOfWeek = this.getDayOfWeek(date);

    const rate = await this.prisma.shippingRate.findFirst({
      where: {
        dayOfWeek,
        active: true,
      },
    });

    if (!rate) {
      throw new NotFoundException(`Shipping rate not found for ${dayOfWeek}`);
    }

    return rate.baseCost;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    return daysByUtcIndex[date.getUTCDay()];
  }
}
