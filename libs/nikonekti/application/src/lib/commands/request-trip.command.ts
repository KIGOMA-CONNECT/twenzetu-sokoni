import { ICommand } from '@abms/kernel';

export type TripRequestChannelInput = 'APP' | 'USSD' | 'WEB' | 'AGENT';

export interface RequestTripResult {
  readonly id: string;
}

export class RequestTripCommand implements ICommand<RequestTripResult> {
  public readonly _resultType?: RequestTripResult;

  public constructor(
    public readonly customerPhone: string,
    public readonly pickupLocation: string,
    public readonly destinationLocation: string,
    public readonly requestChannel: TripRequestChannelInput,
  ) {}
}
