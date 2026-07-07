import { AppConfigModule } from '@abms/core-config';
import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class AppLoggerModule {}
