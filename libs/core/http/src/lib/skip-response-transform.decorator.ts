import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_TRANSFORM = 'skip_response_transform';

/**
 * Marks a handler so the global ResponseInterceptor leaves the returned
 * value untouched. Used for provider callbacks (e.g. the Beem USSD Hub)
 * that require the raw JSON contract.
 */
export const SkipResponseTransform = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_RESPONSE_TRANSFORM, true);
