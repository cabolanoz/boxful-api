import { DayOfWeek, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const shippingRates: Array<{ dayOfWeek: DayOfWeek; baseCost: number }> = [
  { dayOfWeek: DayOfWeek.MONDAY, baseCost: 4 },
  { dayOfWeek: DayOfWeek.TUESDAY, baseCost: 4 },
  { dayOfWeek: DayOfWeek.WEDNESDAY, baseCost: 4.5 },
  { dayOfWeek: DayOfWeek.THURSDAY, baseCost: 4.5 },
  { dayOfWeek: DayOfWeek.FRIDAY, baseCost: 5 },
  { dayOfWeek: DayOfWeek.SATURDAY, baseCost: 6 },
  { dayOfWeek: DayOfWeek.SUNDAY, baseCost: 6 },
];

async function main(): Promise<void> {
  await Promise.all(
    shippingRates.map((rate) =>
      prisma.shippingRate.upsert({
        where: {
          dayOfWeek: rate.dayOfWeek,
        },
        update: {
          baseCost: rate.baseCost,
          active: true,
        },
        create: {
          dayOfWeek: rate.dayOfWeek,
          baseCost: rate.baseCost,
        },
      }),
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
