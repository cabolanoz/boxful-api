import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { OrdersService, PublicOrder } from './orders.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: PublicUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<PublicOrder> {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: FindOrdersQueryDto,
  ): Promise<PublicOrder[]> {
    return this.ordersService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id') orderId: string,
  ): Promise<PublicOrder> {
    return this.ordersService.findOne(user.id, orderId);
  }
}
