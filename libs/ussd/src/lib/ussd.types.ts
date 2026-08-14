export interface UssdSession {
  sessionId: string;
  phoneNumber: string;
  tenantId: string;
  userId?: string;
  userRole?: string;
  currentMenu: string;
  data: Record<string, any>;
  cart: CartItem[];
  createdAt: number;
  lastAccessedAt: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  unitPrice: number;
  quantity: number;
  currency: string;
}

export interface UssdRequest {
  sessionId: string;
  phoneNumber: string;
  text: string;
  serviceCode: string;
}

export interface UssdResponse {
  sessionId: string;
  message: string;
  continueSession: boolean;
}

export type MenuHandler = (
  session: UssdSession,
  input: string,
) => Promise<UssdResponse>;

export type BeemCommand = 'initiate' | 'continue' | 'terminate';

export interface BeemUssdRequest {
  command: BeemCommand;
  msisdn: string;
  operator: string;
  sessionId: string;
  requestId: number;
  response: string;
  phoneNumber: string;
}

export interface BeemUssdResponse {
  msisdn: string;
  operator: string;
  session_id: string;
  command: BeemCommand;
  payload: {
    request_id: number;
    request: string;
  };
}
