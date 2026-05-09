import { Module } from '@nestjs/common';
import { ShippingRatesService } from './shipping-rates.service';

@Module({
  providers: [ShippingRatesService],
  exports: [ShippingRatesService],
})
export class ShippingRatesModule {}
