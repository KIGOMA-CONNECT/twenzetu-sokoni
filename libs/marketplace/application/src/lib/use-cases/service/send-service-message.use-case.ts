import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

interface SendMessageResult {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: Date;
}

@Injectable()
export class SendServiceMessageUseCase {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  public async execute(
    tenantId: string,
    requestId: string,
    sender: { id: string; name: string; role: string },
    message: string,
  ): Promise<SendMessageResult> {
    const id = randomUUID();
    await this.ds.query(
      `INSERT INTO service_request_messages (id, tenant_id, request_id, sender_id, sender_name, sender_role, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, tenantId, requestId, sender.id, sender.name, sender.role, message],
    );
    return {
      id,
      requestId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      message,
      createdAt: new Date(),
    };
  }
}
