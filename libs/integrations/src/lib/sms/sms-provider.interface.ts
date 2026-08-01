export interface SendSmsResult {
  readonly success: boolean;
  readonly messageId?: string;
  readonly provider: string;
  readonly simulated?: boolean;
}

export interface SmsMessage {
  readonly to: string;
  readonly message: string;
  readonly tenantId?: string;
}

export interface SmsProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  send(message: SmsMessage): Promise<SendSmsResult>;
}
