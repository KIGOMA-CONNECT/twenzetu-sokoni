import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface CurrentUserContext {
  userId: string;
  tenantId: string;
  role: string;
  phoneNumber: string;
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  public use(req: Request, _res: Response, next: NextFunction): void {
    const reqRecord = req as unknown as Record<string, unknown>;
    const user = reqRecord.user as CurrentUserContext | undefined;
    if (user) {
      reqRecord.currentUser = user;
    }
    next();
  }
}
