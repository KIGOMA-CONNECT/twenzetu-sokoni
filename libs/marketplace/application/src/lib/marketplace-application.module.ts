import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MARKETPLACE_ENTITIES } from '@afri-market/marketplace-infrastructure';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import {
  TypeOrmVendorRepository,
  TypeOrmOrderRepository,
  TypeOrmProductRepository,
  TypeOrmDeliveryRepository,
  TypeOrmPaymentRepository,
  TypeOrmDisputeRepository,
  TypeOrmCustomerPointsRepository,
  TypeOrmSurgeRuleRepository,
  TypeOrmWalletRepository,
  TypeOrmWalletTransactionRepository,
  TypeOrmUsedGoodsRepository,
  TypeOrmReviewRepository,
  TypeOrmCustomProcurementRepository,
  TypeOrmVendorQuoteRepository,
  TypeOrmPartnerKycRepository,
  TypeOrmMicroLoanRepository,
  TypeOrmCreditScoreRepository,
  TypeOrmBulkOrderRepository,
  TypeOrmFieldAgentRepository,
  TypeOrmHyperlocalPoiRepository,
  TypeOrmCountryConfigRepository,
  TypeOrmVehicleRepository,
  TypeOrmCategoryRepository,
  TypeOrmAddressRepository,
  TypeOrmMenuRepository,
  TypeOrmAdminUserRepository,
  TypeOrmCouponRepository,
  TypeOrmFlashSaleRepository,
  TypeOrmServiceListingRepository,
  TypeOrmServiceRequestRepository,
  TypeOrmServiceQuoteRepository,
  TypeOrmCartRepository,
  TypeOrmAdvertRepository,
} from '@afri-market/marketplace-infrastructure';
import { SmsService, MobileMoneyService, EmailService } from '@afri-market/integrations';
import {
  VENDOR_REPOSITORY, ORDER_REPOSITORY, PRODUCT_REPOSITORY,
  DELIVERY_REPOSITORY, PAYMENT_REPOSITORY, DISPUTE_REPOSITORY,
  CUSTOMER_POINTS_REPOSITORY, SURGE_RULE_REPOSITORY,
  WALLET_REPOSITORY, WALLET_TRANSACTION_REPOSITORY, USED_GOODS_REPOSITORY,
  REVIEW_REPOSITORY, PROCUREMENT_REPOSITORY, VENDOR_QUOTE_REPOSITORY,
  PARTNER_KYC_REPOSITORY, MICRO_LOAN_REPOSITORY, CREDIT_SCORE_REPOSITORY,
  BULK_ORDER_REPOSITORY, FIELD_AGENT_REPOSITORY, HYPERLOCAL_POI_REPOSITORY,
  SMS_SERVICE, MOBILE_MONEY_SERVICE, EMAIL_SERVICE, COUNTRY_CONFIG_REPOSITORY, MARKETPLACE_GATEWAY,
  VEHICLE_REPOSITORY,
  PRODUCT_CATEGORY_REPOSITORY, ADDRESS_REPOSITORY, MENU_REPOSITORY,
  ADMIN_USER_REPOSITORY,
  COUPON_REPOSITORY, FLASH_SALE_REPOSITORY,
  SERVICE_LISTING_REPOSITORY, SERVICE_REQUEST_REPOSITORY, SERVICE_QUOTE_REPOSITORY,
  CART_REPOSITORY, ADVERT_REPOSITORY,
} from './tokens';
import { CreateVendorUseCase } from './use-cases/vendor/create-vendor.use-case';
import { FindVendorsUseCase } from './use-cases/vendor/find-vendors.use-case';
import { CreateProductUseCase } from './use-cases/product/create-product.use-case';
import { FindProductsUseCase } from './use-cases/product/find-products.use-case';
import { CreateOrderUseCase } from './use-cases/order/create-order.use-case';
import { UpdateOrderStatusUseCase } from './use-cases/order/update-order-status.use-case';
import { FindOrdersUseCase } from './use-cases/order/find-orders.use-case';
import { CreateDeliveryUseCase } from './use-cases/delivery/create-delivery.use-case';
import { FindDeliveriesUseCase } from './use-cases/delivery/find-deliveries.use-case';
import { CompleteDeliveryUseCase } from './use-cases/delivery/complete-delivery.use-case';
import { CreateReviewUseCase } from './use-cases/review/create-review.use-case';
import { CreateProcurementUseCase } from './use-cases/procurement/create-procurement.use-case';
import { SubmitQuoteUseCase } from './use-cases/procurement/submit-quote.use-case';
import { CreateDisputeUseCase } from './use-cases/dispute/create-dispute.use-case';
import { ResolveDisputeUseCase } from './use-cases/dispute/resolve-dispute.use-case';
import { CalculateSurgeUseCase } from './use-cases/surge/calculate-surge.use-case';
import { EarnPointsUseCase } from './use-cases/loyalty/earn-points.use-case';
import { RedeemPointsUseCase } from './use-cases/loyalty/redeem-points.use-case';
import { SubmitKycUseCase } from './use-cases/kyc/submit-kyc.use-case';
import { VerifyKycUseCase } from './use-cases/kyc/verify-kyc.use-case';
import { RequestLoanUseCase } from './use-cases/finance/request-loan.use-case';
import { RepayLoanUseCase } from './use-cases/finance/repay-loan.use-case';
import { CalculateCreditScoreUseCase } from './use-cases/finance/calculate-credit-score.use-case';
import { CreateBulkOrderUseCase } from './use-cases/b2b/create-bulk-order.use-case';
import { JoinBulkOrderUseCase } from './use-cases/b2b/join-bulk-order.use-case';
import { RegisterAgentUseCase } from './use-cases/agent/register-agent.use-case';
import { CreatePoiUseCase } from './use-cases/poi/create-poi.use-case';
import { FindNearbyPoiUseCase } from './use-cases/poi/find-nearby-poi.use-case';
import { GetWalletUseCase } from './use-cases/wallet/get-wallet.use-case';
import { CreditWalletUseCase } from './use-cases/wallet/credit-wallet.use-case';
import { DebitWalletUseCase } from './use-cases/wallet/debit-wallet.use-case';
import { ListWalletTransactionsUseCase } from './use-cases/wallet/list-wallet-transactions.use-case';
import { CreateUsedGoodsUseCase } from './use-cases/used-goods/create-used-goods.use-case';
import { ListUsedGoodsUseCase } from './use-cases/used-goods/list-used-goods.use-case';
import { GetUsedGoodsUseCase } from './use-cases/used-goods/get-used-goods.use-case';
import { GetVendorOrdersUseCase } from './use-cases/vendor/get-vendor-orders.use-case';
import { VendorUpdateOrderStatusUseCase } from './use-cases/vendor/vendor-update-order-status.use-case';
import { GetVendorStatsUseCase } from './use-cases/vendor/get-vendor-stats.use-case';
import { SearchVendorsUseCase } from './use-cases/vendor/search-vendors.use-case';
import { GetDriverDeliveriesUseCase } from './use-cases/delivery/get-driver-deliveries.use-case';
import { DriverUpdateDeliveryStatusUseCase } from './use-cases/delivery/driver-update-delivery-status.use-case';
import { SearchProductsUseCase } from './use-cases/product/search-products.use-case';
import { ReleasePaymentUseCase } from './use-cases/payment/release-payment.use-case';
import { ListPaymentsUseCase } from './use-cases/payment/list-payments.use-case';
import { GetPaymentByOrderUseCase } from './use-cases/payment/get-payment-by-order.use-case';
import { ConfirmPaymentUseCase } from './use-cases/payment/confirm-payment.use-case';
import { FailPaymentUseCase } from './use-cases/payment/fail-payment.use-case';
import { CancelOrderUseCase } from './use-cases/order/cancel-order.use-case';
import { FindMyDisputesUseCase, GetDisputeDetailUseCase } from './use-cases/dispute/find-disputes.use-case';
import { FindReviewsByVendorUseCase } from './use-cases/review/find-reviews-by-vendor.use-case';
import { FindMyReviewedOrdersUseCase } from './use-cases/review/find-my-reviewed-orders.use-case';
import { CreateSurgeRuleUseCase, ListSurgeRulesUseCase } from './use-cases/surge/list-surge-rules.use-case';
import { GetMyKycStatusUseCase, ListPendingKycUseCase } from './use-cases/kyc/get-kyc-status.use-case';
import { ListMyLoansUseCase } from './use-cases/finance/list-my-loans.use-case';
import { GetMyLoyaltyUseCase } from './use-cases/loyalty/get-my-loyalty.use-case';
import { ListActiveBulkOrdersUseCase } from './use-cases/b2b/list-active-bulk-orders.use-case';
import { GetMyAgentProfileUseCase } from './use-cases/agent/get-my-agent-profile.use-case';
import { GetProcurementDetailUseCase } from './use-cases/procurement/get-procurement-detail.use-case';
import { GetAdminDashboardUseCase } from './use-cases/admin/get-admin-dashboard.use-case';
import { GetAdminAnalyticsUseCase } from './use-cases/admin/get-admin-analytics.use-case';
import { ApproveVendorAdminUseCase } from './use-cases/admin/approve-vendor-admin.use-case';
import { SuspendVendorAdminUseCase } from './use-cases/admin/suspend-vendor-admin.use-case';
import { ListAdminDisputesUseCase } from './use-cases/admin/list-admin-disputes.use-case';
import { ResolveDisputeAdminUseCase } from './use-cases/admin/resolve-dispute-admin.use-case';
import { ListPendingVendorsAdminUseCase } from './use-cases/admin/list-pending-vendors-admin.use-case';
import { ListRecentOrdersAdminUseCase } from './use-cases/admin/list-recent-orders-admin.use-case';
import { GetFinanceSummaryAdminUseCase } from './use-cases/admin/get-finance-summary-admin.use-case';
import { GetRevenueReportUseCase } from './use-cases/admin/get-revenue-report.use-case';
import { GetDisputeMetricsUseCase } from './use-cases/admin/get-dispute-metrics.use-case';
import { ListAllVendorsAdminUseCase } from './use-cases/admin/list-all-vendors-admin.use-case';
import { GetReconciliationReportUseCase } from './use-cases/admin/get-reconciliation-report.use-case';
import { RegisterVehicleUseCase } from './use-cases/vehicle/register-vehicle.use-case';
import { UpdateVehicleLocationUseCase } from './use-cases/vehicle/update-vehicle-location.use-case';
import { ListDriverVehiclesUseCase } from './use-cases/vehicle/list-driver-vehicles.use-case';
import { ToggleDriverAvailabilityUseCase } from './use-cases/vehicle/toggle-driver-availability.use-case';
import { UpdateUsedGoodsUseCase } from './use-cases/used-goods/update-used-goods.use-case';
import { GetDeliveryTrackingUseCase } from './use-cases/delivery/get-delivery-tracking.use-case';
import { UpdateDriverLocationUseCase } from './use-cases/delivery/update-driver-location.use-case';
import { CreateCategoryUseCase } from './use-cases/category/create-category.use-case';
import { ListCategoriesUseCase } from './use-cases/category/list-categories.use-case';
import { CreateAddressUseCase } from './use-cases/address/create-address.use-case';
import { ListAddressesUseCase } from './use-cases/address/list-addresses.use-case';
import { DeleteAddressUseCase } from './use-cases/address/delete-address.use-case';
import { SetDefaultAddressUseCase } from './use-cases/address/set-default-address.use-case';
import { CreateMenuUseCase } from './use-cases/menu/create-menu.use-case';
import { ListMenusUseCase } from './use-cases/menu/list-menus.use-case';
import { CreateCouponUseCase } from './use-cases/promotion/create-coupon.use-case';
import { ValidateCouponUseCase } from './use-cases/promotion/validate-coupon.use-case';
import { ListCouponsUseCase } from './use-cases/promotion/list-coupons.use-case';
import { CreateFlashSaleUseCase } from './use-cases/promotion/create-flash-sale.use-case';
import { ListActiveFlashSalesUseCase } from './use-cases/promotion/list-active-flash-sales.use-case';
import { ListFlashSalesUseCase } from './use-cases/promotion/list-flash-sales.use-case';
import { CreateServiceListingUseCase } from './use-cases/service/create-service-listing.use-case';
import { ListServiceListingsUseCase } from './use-cases/service/list-service-listings.use-case';
import { CreateServiceRequestUseCase } from './use-cases/service/create-service-request.use-case';
import { ListServiceRequestsUseCase } from './use-cases/service/list-service-requests.use-case';
import { SubmitServiceQuoteUseCase } from './use-cases/service/submit-service-quote.use-case';
import { AcceptServiceQuoteUseCase } from './use-cases/service/accept-service-quote.use-case';
import { SendServiceMessageUseCase } from './use-cases/service/send-service-message.use-case';
import { ListServiceMessagesUseCase } from './use-cases/service/list-service-messages.use-case';
import { DeleteServiceListingUseCase } from './use-cases/service/delete-service-listing.use-case';
import { CreateServiceReviewUseCase } from './use-cases/service/create-service-review.use-case';
import { GetCartUseCase } from './use-cases/cart/get-cart.use-case';
import { AddToCartUseCase } from './use-cases/cart/add-to-cart.use-case';
import { UpdateCartItemUseCase } from './use-cases/cart/update-cart-item.use-case';
import { RemoveCartItemUseCase } from './use-cases/cart/remove-cart-item.use-case';
import { ClearCartUseCase } from './use-cases/cart/clear-cart.use-case';
import { CheckoutCartUseCase } from './use-cases/order/checkout-cart.use-case';
import { ListActiveAdsUseCase } from './use-cases/marketing/list-active-ads.use-case';
import { ListAdvertsUseCase } from './use-cases/marketing/list-adverts.use-case';
import { CreateAdvertUseCase } from './use-cases/marketing/create-advert.use-case';

const REPOSITORIES = [
  { provide: VENDOR_REPOSITORY, useClass: TypeOrmVendorRepository },
  { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
  { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
  { provide: DELIVERY_REPOSITORY, useClass: TypeOrmDeliveryRepository },
  { provide: PAYMENT_REPOSITORY, useClass: TypeOrmPaymentRepository },
  { provide: DISPUTE_REPOSITORY, useClass: TypeOrmDisputeRepository },
  { provide: CUSTOMER_POINTS_REPOSITORY, useClass: TypeOrmCustomerPointsRepository },
  { provide: SURGE_RULE_REPOSITORY, useClass: TypeOrmSurgeRuleRepository },
  { provide: WALLET_REPOSITORY, useClass: TypeOrmWalletRepository },
  { provide: WALLET_TRANSACTION_REPOSITORY, useClass: TypeOrmWalletTransactionRepository },
  { provide: USED_GOODS_REPOSITORY, useClass: TypeOrmUsedGoodsRepository },
  { provide: REVIEW_REPOSITORY, useClass: TypeOrmReviewRepository },
  { provide: PROCUREMENT_REPOSITORY, useClass: TypeOrmCustomProcurementRepository },
  { provide: VENDOR_QUOTE_REPOSITORY, useClass: TypeOrmVendorQuoteRepository },
  { provide: PARTNER_KYC_REPOSITORY, useClass: TypeOrmPartnerKycRepository },
  { provide: MICRO_LOAN_REPOSITORY, useClass: TypeOrmMicroLoanRepository },
  { provide: CREDIT_SCORE_REPOSITORY, useClass: TypeOrmCreditScoreRepository },
  { provide: BULK_ORDER_REPOSITORY, useClass: TypeOrmBulkOrderRepository },
  { provide: FIELD_AGENT_REPOSITORY, useClass: TypeOrmFieldAgentRepository },
  { provide: HYPERLOCAL_POI_REPOSITORY, useClass: TypeOrmHyperlocalPoiRepository },
  { provide: COUNTRY_CONFIG_REPOSITORY, useClass: TypeOrmCountryConfigRepository },
  { provide: VEHICLE_REPOSITORY, useClass: TypeOrmVehicleRepository },
  { provide: PRODUCT_CATEGORY_REPOSITORY, useClass: TypeOrmCategoryRepository },
  { provide: ADDRESS_REPOSITORY, useClass: TypeOrmAddressRepository },
  { provide: MENU_REPOSITORY, useClass: TypeOrmMenuRepository },
  { provide: ADMIN_USER_REPOSITORY, useClass: TypeOrmAdminUserRepository },
  { provide: COUPON_REPOSITORY, useClass: TypeOrmCouponRepository },
  { provide: FLASH_SALE_REPOSITORY, useClass: TypeOrmFlashSaleRepository },
  { provide: SERVICE_LISTING_REPOSITORY, useClass: TypeOrmServiceListingRepository },
  { provide: SERVICE_REQUEST_REPOSITORY, useClass: TypeOrmServiceRequestRepository },
  { provide: SERVICE_QUOTE_REPOSITORY, useClass: TypeOrmServiceQuoteRepository },
  { provide: CART_REPOSITORY, useClass: TypeOrmCartRepository },
  { provide: ADVERT_REPOSITORY, useClass: TypeOrmAdvertRepository },
];

const SERVICES = [
  { provide: SMS_SERVICE, useClass: SmsService },
  { provide: MOBILE_MONEY_SERVICE, useClass: MobileMoneyService },
  { provide: EMAIL_SERVICE, useClass: EmailService },
  { provide: MARKETPLACE_GATEWAY, useValue: null },
];

const USE_CASES = [
  CreateVendorUseCase,
  FindVendorsUseCase,
  CreateProductUseCase,
  FindProductsUseCase,
  CreateOrderUseCase,
  UpdateOrderStatusUseCase,
  FindOrdersUseCase,
  CreateDeliveryUseCase,
  FindDeliveriesUseCase,
  CompleteDeliveryUseCase,
  CreateReviewUseCase,
  CreateProcurementUseCase,
  SubmitQuoteUseCase,
  CreateDisputeUseCase,
  ResolveDisputeUseCase,
  CalculateSurgeUseCase,
  EarnPointsUseCase,
  RedeemPointsUseCase,
  SubmitKycUseCase,
  VerifyKycUseCase,
  RequestLoanUseCase,
  RepayLoanUseCase,
  CalculateCreditScoreUseCase,
  CreateBulkOrderUseCase,
  JoinBulkOrderUseCase,
  RegisterAgentUseCase,
  CreatePoiUseCase,
  FindNearbyPoiUseCase,
  GetWalletUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  ListWalletTransactionsUseCase,
  CreateUsedGoodsUseCase,
  ListUsedGoodsUseCase,
  GetUsedGoodsUseCase,
  GetVendorOrdersUseCase,
  VendorUpdateOrderStatusUseCase,
  GetVendorStatsUseCase,
  SearchVendorsUseCase,
  GetDriverDeliveriesUseCase,
  DriverUpdateDeliveryStatusUseCase,
  SearchProductsUseCase,
  ReleasePaymentUseCase,
  ListPaymentsUseCase,
  GetPaymentByOrderUseCase,
  ConfirmPaymentUseCase,
  FailPaymentUseCase,
  CancelOrderUseCase,
  FindMyDisputesUseCase,
  GetDisputeDetailUseCase,
  FindReviewsByVendorUseCase,
  FindMyReviewedOrdersUseCase,
  CreateSurgeRuleUseCase,
  ListSurgeRulesUseCase,
  GetMyKycStatusUseCase,
  ListPendingKycUseCase,
  ListMyLoansUseCase,
  GetMyLoyaltyUseCase,
  ListActiveBulkOrdersUseCase,
  GetMyAgentProfileUseCase,
  GetProcurementDetailUseCase,
  GetAdminDashboardUseCase,
  GetAdminAnalyticsUseCase,
  ApproveVendorAdminUseCase,
  SuspendVendorAdminUseCase,
  ListAdminDisputesUseCase,
  ResolveDisputeAdminUseCase,
  ListPendingVendorsAdminUseCase,
  ListRecentOrdersAdminUseCase,
  GetFinanceSummaryAdminUseCase,
  GetRevenueReportUseCase,
  GetDisputeMetricsUseCase,
  ListAllVendorsAdminUseCase,
  GetReconciliationReportUseCase,
  RegisterVehicleUseCase,
  UpdateVehicleLocationUseCase,
  ListDriverVehiclesUseCase,
  ToggleDriverAvailabilityUseCase,
  UpdateUsedGoodsUseCase,
  UpdateDriverLocationUseCase,
  GetDeliveryTrackingUseCase,
  CreateCategoryUseCase,
  ListCategoriesUseCase,
CreateAddressUseCase,
ListAddressesUseCase,
DeleteAddressUseCase,
SetDefaultAddressUseCase,
  CreateMenuUseCase,
  ListMenusUseCase,
  CreateCouponUseCase,
  ValidateCouponUseCase,
  ListCouponsUseCase,
  CreateFlashSaleUseCase,
  ListActiveFlashSalesUseCase,
  ListFlashSalesUseCase,
  CreateServiceListingUseCase,
  ListServiceListingsUseCase,
  CreateServiceRequestUseCase,
  ListServiceRequestsUseCase,
  SubmitServiceQuoteUseCase,
  AcceptServiceQuoteUseCase,
  SendServiceMessageUseCase,
  ListServiceMessagesUseCase,
  DeleteServiceListingUseCase,
  CreateServiceReviewUseCase,
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  ClearCartUseCase,
  CheckoutCartUseCase,
  ListActiveAdsUseCase,
  ListAdvertsUseCase,
  CreateAdvertUseCase,
];

@Module({
  imports: [TypeOrmModule.forFeature([...MARKETPLACE_ENTITIES, ...IDENTITY_ENTITIES])],
  providers: [...REPOSITORIES, ...SERVICES, ...USE_CASES],
  exports: [...USE_CASES, PRODUCT_REPOSITORY, VENDOR_REPOSITORY, ORDER_REPOSITORY, REVIEW_REPOSITORY, PAYMENT_REPOSITORY, DELIVERY_REPOSITORY, SERVICE_LISTING_REPOSITORY, SERVICE_REQUEST_REPOSITORY, SERVICE_QUOTE_REPOSITORY, MOBILE_MONEY_SERVICE, SMS_SERVICE, EMAIL_SERVICE, ADVERT_REPOSITORY],
})
export class MarketplaceApplicationModule {}
