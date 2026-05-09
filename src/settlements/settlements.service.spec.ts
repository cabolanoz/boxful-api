import { PaymentMode } from '@prisma/client';
import { SettlementsService } from './settlements.service';

describe('SettlementsService', () => {
  let service: SettlementsService;

  beforeEach(() => {
    service = new SettlementsService();
  });

  it('calculates a standard order settlement', () => {
    expect(
      service.calculateOrderSettlement({
        paymentMode: PaymentMode.STANDARD,
        shippingCost: 5,
      }),
    ).toEqual({
      codCommission: 0,
      settlementAmount: -5,
    });
  });

  it('calculates a COD order settlement with a collected amount', () => {
    expect(
      service.calculateOrderSettlement({
        paymentMode: PaymentMode.COD,
        shippingCost: 5,
        collectedAmount: 100,
      }),
    ).toEqual({
      codCommission: 0.01,
      settlementAmount: 94.99,
    });
  });

  it('caps the COD commission at 25 USD', () => {
    expect(
      service.calculateOrderSettlement({
        paymentMode: PaymentMode.COD,
        shippingCost: 5,
        collectedAmount: 300000,
      }),
    ).toEqual({
      codCommission: 25,
      settlementAmount: 299970,
    });
  });

  it('uses the real collected amount instead of the expected amount', () => {
    expect(
      service.calculateOrderSettlement({
        paymentMode: PaymentMode.COD,
        shippingCost: 5,
        collectedAmount: 15,
      }),
    ).toEqual({
      codCommission: 0.0015,
      settlementAmount: 9.9985,
    });
  });
});
