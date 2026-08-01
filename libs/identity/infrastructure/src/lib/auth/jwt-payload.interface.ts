export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  phoneNumber: string;
  permissions?: string;
  sid: string;
  tokenType: TokenType;
}
