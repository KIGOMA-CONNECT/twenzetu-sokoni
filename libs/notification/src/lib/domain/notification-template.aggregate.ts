import { AggregateRoot, EntityId, Guard } from '@afri-market/kernel';

export interface NotificationTemplateProps {
  readonly name: string;
  readonly channel: string;
  readonly subject?: string;
  readonly bodyTemplate: string;
  readonly variables: string[];
  readonly tenantId?: string;
  readonly isActive?: boolean;
}

export class NotificationTemplate extends AggregateRoot<EntityId> {
  private constructor(
    id: EntityId,
    private _name: string,
    private readonly _channel: string,
    private _subject: string | undefined,
    private _bodyTemplate: string,
    private _variables: string[],
    private readonly _tenantId: string | undefined,
    private _isActive: boolean,
  ) {
    super(id);
  }

  public static define(props: NotificationTemplateProps): NotificationTemplate {
    Guard.assert(Guard.againstEmptyString(props.name, 'name'));
    Guard.assert(Guard.againstEmptyString(props.bodyTemplate, 'bodyTemplate'));

    return new NotificationTemplate(
      EntityId.create(),
      props.name,
      props.channel,
      props.subject,
      props.bodyTemplate,
      props.variables,
      props.tenantId,
      props.isActive ?? true,
    );
  }

  public get name(): string { return this._name; }
  public get channel(): string { return this._channel; }
  public get subject(): string | undefined { return this._subject; }
  public get bodyTemplate(): string { return this._bodyTemplate; }
  public get variables(): string[] { return [...this._variables]; }
  public get tenantId(): string | undefined { return this._tenantId; }
  public get isActive(): boolean { return this._isActive; }

  public render(variables: Record<string, string>): { subject?: string; body: string } {
    let body = this._bodyTemplate;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    let subject = this._subject;
    if (subject) {
      for (const [key, value] of Object.entries(variables)) {
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return { subject, body };
  }

  public deactivate(): void { this._isActive = false; }
  public activate(): void { this._isActive = true; }
}
