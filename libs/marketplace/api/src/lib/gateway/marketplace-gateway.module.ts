import { Module } from '@nestjs/common';
import { MarketplaceGateway } from './marketplace.gateway';

@Module({
  providers: [MarketplaceGateway],
  exports: [MarketplaceGateway],
})
export class MarketplaceGatewayModule {}
