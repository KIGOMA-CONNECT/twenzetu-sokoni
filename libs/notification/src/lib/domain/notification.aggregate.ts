import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export type NotificationChannel = 'IN_APP' | 'SMS' | 'EMAIL' | 'PUSH' | 'WHATSAPP';

export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface NotificationProps {
  readonly tenantId: string;
  readonly userId: string;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body: string;
  readonly priority?: NotificationPriority;
  readonly data?: Record<string, unknown>;
  readonly templateId?: string;
  readonly templateVariables?: Record<string, string>;
}

export class Notification extends AggregateRoot<EntityId> {
  private _status: NotificationStatus;
  private _readAt: Date | undefined;
  private _sentAt: Date | undefined;

  private constructor(
    id: EntityId,
    private readonly _tenantId: string,
    private readonly _userId: string,
    private readonly _channel: NotificationChannel,
    private _title: string,
    private _body: string,
    private readonly _priority: NotificationPriority,
    private readonly _data: Record<string, unknown>,
    private readonly _templateId: string | undefined,
    private readonly _templateVariables: Record<string, string>,
    status: NotificationStatus,
    sentAt: Date | undefined,
    readAt: Date | undefined,
  ) {
    super(id);
    this._status = status;
    this._sentAt = sentAt;
    this._readAt = readAt;
  }

  public static create(props: NotificationProps): Notification {
    Guard.assert(Guard.againstEmptyString(props.tenantId, 'tenantId'));
    Guard.assert(Guard.againstEmptyString(props.userId, 'userId'));
    Guard.assert(Guard.againstEmptyString(props.title, 'title'));
    Guard.assert(Guard.againstEmptyString(props.body, 'body'));

    return new Notification(
      EntityId.create(),
      props.tenantId,
      props.userId,
      props.channel,
      props.title,
      props.body,
      props.priority ?? 'NORMAL',
      props.data ?? {},
      props.templateId,
      props.templateVariables ?? {},
      'PENDING',
      undefined,
      undefined,
    );
  }

  public static reconstitute(props: {
    id: EntityId;
    tenantId: string;
    userId: string;
    channel: NotificationChannel;
    title: string;
    body: string;
    priority: NotificationPriority;
    data: Record<string, unknown>;
    templateId?: string;
    templateVariables: Record<string, string>;
    status: NotificationStatus;
    sentAt?: Date;
    readAt?: Date;
  }): Notification {
    return new Notification(
      props.id,
      props.tenantId,
      props.userId,
      props.channel,
      props.title,
      props.body,
      props.priority,
      props.data,
      props.templateId,
      props.templateVariables,
      props.status,
      props.sentAt,
      props.readAt,
    );
  }

  public get tenantId(): string { return this._tenantId; }
  public get userId(): string { return this._userId; }
  public get channel(): NotificationChannel { return this._channel; }
  public get title(): string { return this._title; }
  public get body(): string { return this._body; }
  public get priority(): NotificationPriority { return this._priority; }
  public get data(): Record<string, unknown> { return { ...this._data }; }
  public get templateId(): string | undefined { return this._templateId; }
  public get templateVariables(): Record<string, string> { return { ...this._templateVariables }; }
  public get status(): NotificationStatus { return this._status; }
  public get sentAt(): Date | undefined { return this._sentAt; }
  public get readAt(): Date | undefined { return this._readAt; }

  public markSent(): void {
    this._status = 'SENT';
    this._sentAt = new Date();
  }

  public markDelivered(): void {
    this._status = 'DELIVERED';
  }

  public markRead(): void {
    this._status = 'READ';
    this._readAt = new Date();
  }

  public markFailed(): void {
    this._status = 'FAILED';
  }
}
