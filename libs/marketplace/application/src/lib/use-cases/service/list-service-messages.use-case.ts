import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ListServiceMessagesUseCase {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  public async execute(tenantId: string, requestId: string): Promise<unknown[]> {
    const rows = await this.ds.query(
      `SELECT id, request_id AS "requestId", sender_id AS "senderId", sender_name AS "senderName",
              sender_role AS "senderRole", message, created_at AS "createdAt"
       FROM service_request_messages
       WHERE tenant_id = $1 AND request_id = $2
       ORDER BY created_at ASC`,
      [tenantId, requestId],
    );
    return rows;
  }
}
