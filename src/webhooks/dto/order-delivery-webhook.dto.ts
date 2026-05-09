import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class OrderDeliveryWebhookDto {
  @IsString()
  @IsNotEmpty()
  trackingCode!: string;

  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  collectedAmount?: number;
}
