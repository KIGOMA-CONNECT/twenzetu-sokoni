import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceApplicationModule, MARKETPLACE_GATEWAY } from '@afri-market/marketplace-application';
import { FileUploadService, MobileMoneyService } from '@afri-market/integrations';
import { NotificationOrmEntity, PushSubscriptionOrmEntity } from '@afri-market/marketplace-infrastructure';
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
import { CartsController } from './carts.controller';
import { MenusController } from './menus.controller';
import { VehiclesController } from './vehicles.controller';
import { CouponsController } from './coupons.controller';
import { FlashSalesController } from './flash-sales.controller';
import { DriverFleetController } from './driver-fleet.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { OrderNotifierService } from './order-notifier.service';
import { ChatController } from './chat.controller';
import { RecommendationsController } from './recommendations.controller';
import { ReferralsController } from './referrals.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { CatalogController } from './catalog.controller';
import { ServicesController } from './services.controller';
import { SavingsController } from './savings.controller';
import { FintechLoansController } from './fintech-loans.controller';
import { VendorSubscriptionsController } from './vendor-subscriptions.controller';
import { CommissionsController } from './commissions.controller';

@Module({
  imports: [MarketplaceApplicationModule, MarketplaceGatewayModule, AdminModule, TypeOrmModule.forFeature([NotificationOrmEntity, PushSubscriptionOrmEntity])],
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
    CartsController,
    MenusController,
    VehiclesController,
    CouponsController,
    FlashSalesController,
    DriverFleetController,
    NotificationsController,
    ChatController,
    RecommendationsController,
    ReferralsController,
    SubscriptionsController,
    CatalogController,
    ServicesController,
    SavingsController,
    FintechLoansController,
    VendorSubscriptionsController,
    CommissionsController,
  ],
  providers: [
    { provide: MARKETPLACE_GATEWAY, useExisting: MarketplaceGateway },
    FileUploadService,
    MobileMoneyService,
    NotificationsService,
    PushService,
    OrderNotifierService,
  ],
  exports: [NotificationsService, PushService],
})
export class MarketplaceModule {}
