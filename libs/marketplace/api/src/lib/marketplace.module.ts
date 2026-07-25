import { Module } from '@nestjs/common';
import { MarketplaceApplicationModule, MARKETPLACE_GATEWAY } from '@afri-market/marketplace-application';
import { MarketplaceGatewayModule, MarketplaceGateway } from './gateway';
import { AdminModule } from './admin';
import { VendorsController } from './vendors.controller';
import { ProductsController } from './products.controller';
import { OrdersController } from './orders.controller';
import { DeliveriesController } from './deliveries.controller';
import { ProcurementController } from './procurement.controller';
import { ReviewsController } from './reviews.controller';
import { WalletsController } from './wallets.controller';
import { DisputesController } from './disputes.controller';
import { SurgeController } from './surge.controller';
import { LoyaltyController } from './loyalty.controller';
import { KycController } from './kyc.controller';
import { PoiController } from './poi.controller';
import { FinanceController } from './finance.controller';
import { B2bController } from './b2b.controller';
import { AgentController } from './agent.controller';
import { UsedGoodsController } from './used-goods.controller';
import { PaymentsController } from './payments.controller';
import { UploadsController } from './uploads.controller';
import { WebhooksController } from './webhooks.controller';
import { CategoriesController } from './categories.controller';
import { AddressesController } from './addresses.controller';
import { MenusController } from './menus.controller';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [MarketplaceApplicationModule, MarketplaceGatewayModule, AdminModule],
  controllers: [
    VendorsController,
    ProductsController,
    OrdersController,
    DeliveriesController,
    ProcurementController,
    ReviewsController,
    WalletsController,
    DisputesController,
    SurgeController,
    LoyaltyController,
    KycController,
    PoiController,
    FinanceController,
    B2bController,
    AgentController,
    UsedGoodsController,
    PaymentsController,
    UploadsController,
    WebhooksController,
    CategoriesController,
    AddressesController,
    MenusController,
    VehiclesController,
  ],
  providers: [
    { provide: MARKETPLACE_GATEWAY, useExisting: MarketplaceGateway },
  ],
})
export class MarketplaceModule {}
