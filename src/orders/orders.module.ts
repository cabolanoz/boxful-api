import { Module } from '@nestjs/common';
import { SettlementsModule } from '../settlements/settlements.module';
import { ShippingRatesModule } from '../shipping-rates/shipping-rates.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ShippingRatesModule, SettlementsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
