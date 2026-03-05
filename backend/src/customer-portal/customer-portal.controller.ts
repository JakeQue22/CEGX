import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CustomerJwtGuard } from './guards/customer-jwt.guard';

@ApiTags('Customer Portal')
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(private readonly customerPortalService: CustomerPortalService) {}

  @Post('login')
  login(@Body() dto: CustomerLoginDto) {
    return this.customerPortalService.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @Get('products')
  getProducts() {
    return this.customerPortalService.getProducts();
  }

  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @Get('my-orders')
  getMyOrders(@Req() req: { customer: { id: string } }) {
    return this.customerPortalService.getMyOrders(req.customer.id);
  }

  @ApiBearerAuth()
  @UseGuards(CustomerJwtGuard)
  @Post('orders')
  placeOrder(
    @Req() req: { customer: { id: string } },
    @Body() dto: PlaceOrderDto,
  ) {
    return this.customerPortalService.placeOrder(req.customer.id, dto);
  }
}
