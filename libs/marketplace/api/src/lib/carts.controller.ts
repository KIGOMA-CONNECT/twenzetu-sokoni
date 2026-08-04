import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@afri-market/identity-infrastructure';
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  ClearCartUseCase,
} from '@afri-market/marketplace-application';
import { AddCartItemDto } from './dto/cart-add-item.dto';
import { UpdateCartItemDto } from './dto/cart-update-item.dto';

@ApiTags('Cart')
@Controller('carts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class CartsController {
  constructor(
    private readonly getCart: GetCartUseCase,
    private readonly addToCart: AddToCartUseCase,
    private readonly updateCartItem: UpdateCartItemUseCase,
    private readonly removeCartItem: RemoveCartItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get (or create) the active cart for a vendor' })
  @ApiQuery({ name: 'vendorId', required: true, description: 'Vendor ID' })
  @ApiResponse({ status: 200, description: 'Cart with items and totals' })
  public async findCart(@Query('vendorId') vendorId: string, @CurrentUser() user: JwtPayload) {
    return { data: await this.getCart.execute(user.tenantId, user.sub, vendorId) };
  }

  @Post('items')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Add an item to the active cart for a vendor' })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({ status: 201, description: 'Updated cart' })
  @ApiResponse({ status: 400, description: 'Product not available or insufficient stock' })
  public async addItem(@Body() dto: AddCartItemDto, @CurrentUser() user: JwtPayload) {
    return {
      data: await this.addToCart.execute({
        tenantId: user.tenantId,
        userId: user.sub,
        vendorId: dto.vendorId,
        productId: dto.productId,
        quantity: dto.quantity,
      }),
    };
  }

  @Patch(':id/items/:productId')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiOperation({ summary: 'Update item quantity (set to 0 to remove)' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  public async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      data: await this.updateCartItem.execute({
        tenantId: user.tenantId,
        userId: user.sub,
        cartId: id,
        productId,
        quantity: dto.quantity,
      }),
    };
  }

  @Delete(':id/items/:productId')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiResponse({ status: 200, description: 'Updated cart' })
  public async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      data: await this.removeCartItem.execute({
        tenantId: user.tenantId,
        userId: user.sub,
        cartId: id,
        productId,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiOperation({ summary: 'Clear the cart' })
  @ApiResponse({ status: 200, description: 'Empty cart' })
  public async clear(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      data: await this.clearCart.execute({ tenantId: user.tenantId, userId: user.sub, cartId: id }),
    };
  }
}
