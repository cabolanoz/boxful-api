import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMode } from '@prisma/client';

interface CalculateOrderSettlementInput {
  paymentMode: PaymentMode;
  shippingCost: number;
  collectedAmount?: number | null;
}

interface OrderSettlement {
  codCommission: number;
  settlementAmount: number;
}

const codCommissionRate = 0.0001;
const maxCodCommission = 25;

@Injectable()
export class SettlementsService {
  calculateOrderSettlement(
    input: CalculateOrderSettlementInput,
  ): OrderSettlement {
    if (input.paymentMode === PaymentMode.STANDARD) {
      return {
        codCommission: 0,
        settlementAmount: -input.shippingCost,
      };
    }

    if (input.collectedAmount == null) {
      return {
        codCommission: 0,
        settlementAmount: -input.shippingCost,
      };
    }

    if (input.collectedAmount < 0) {
      throw new BadRequestException('Collected amount cannot be negative');
    }

    const codCommission = Math.min(
      input.collectedAmount * codCommissionRate,
      maxCodCommission,
    );

    return {
      codCommission,
      settlementAmount:
        input.collectedAmount - input.shippingCost - codCommission,
    };
  }
}
