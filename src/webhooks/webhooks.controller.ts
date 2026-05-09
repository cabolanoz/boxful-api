import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderDeliveryWebhookDto } from './dto/order-delivery-webhook.dto';
import { WebhooksService } from './webhooks.service';
import type { PublicOrder } from '../orders/orders.service';

@Controller('webhooks/orders')
export class WebhooksController {
  constructor(
    private readonly configService: ConfigService,
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('delivery')
  handleOrderDelivery(
    @Headers('x-webhook-secret') webhookSecret: string | undefined,
    @Body() payload: OrderDeliveryWebhookDto,
  ): Promise<PublicOrder> {
    const expectedSecret =
      this.configService.getOrThrow<string>('WEBHOOK_SECRET');

    if (webhookSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return this.webhooksService.handleOrderDelivery(payload);
  }
}
