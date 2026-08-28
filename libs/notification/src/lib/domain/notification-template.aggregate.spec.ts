import { EntityId } from '@afri-market/kernel';
import { NotificationTemplate } from './notification-template.aggregate';

describe('NotificationTemplate.define', () => {
  it('creates a template with isActive=true', () => {
    const template = NotificationTemplate.define({
      name: 'welcome-email',
      channel: 'EMAIL',
      bodyTemplate: '<h1>Welcome {{userName}}</h1>',
      variables: ['userName'],
    });

    expect(template.name).toBe('welcome-email');
    expect(template.channel).toBe('EMAIL');
    expect(template.bodyTemplate).toBe('<h1>Welcome {{userName}}</h1>');
    expect(template.variables).toEqual(['userName']);
    expect(template.isActive).toBe(true);
    expect(template.subject).toBeUndefined();
    expect(template.tenantId).toBeUndefined();
  });

  it('accepts optional subject and tenantId', () => {
    const template = NotificationTemplate.define({
      name: 'order-confirmation',
      channel: 'EMAIL',
      subject: 'Order #{{orderId}} confirmed',
      bodyTemplate: 'Thank you for your order.',
      variables: ['orderId'],
      tenantId: 'tenant-1',
      isActive: false,
    });

    expect(template.subject).toBe('Order #{{orderId}} confirmed');
    expect(template.tenantId).toBe('tenant-1');
    expect(template.isActive).toBe(false);
  });

  it('rejects empty name', () => {
    expect(() =>
      NotificationTemplate.define({
        name: '',
        channel: 'EMAIL',
        bodyTemplate: 'Hello',
        variables: [],
      })
    ).toThrow();
  });

  it('rejects empty bodyTemplate', () => {
    expect(() =>
      NotificationTemplate.define({
        name: 'tpl',
        channel: 'EMAIL',
        bodyTemplate: '',
        variables: [],
      })
    ).toThrow();
  });
});

describe('NotificationTemplate.render', () => {
  it('replaces variables in bodyTemplate', () => {
    const template = NotificationTemplate.define({
      name: 'welcome',
      channel: 'EMAIL',
      bodyTemplate: '<h1>Welcome {{userName}}</h1><p>Your role is {{role}}.</p>',
      variables: ['userName', 'role'],
    });

    const result = template.render({ userName: 'John', role: 'Admin' });
    expect(result.body).toBe('<h1>Welcome John</h1><p>Your role is Admin.</p>');
  });

  it('replaces variables in subject', () => {
    const template = NotificationTemplate.define({
      name: 'welcome',
      channel: 'EMAIL',
      subject: 'Welcome {{userName}}!',
      bodyTemplate: '<p>Hello</p>',
      variables: ['userName'],
    });

    const result = template.render({ userName: 'Jane' });
    expect(result.subject).toBe('Welcome Jane!');
  });

  it('handles missing variables gracefully', () => {
    const template = NotificationTemplate.define({
      name: 'test',
      channel: 'EMAIL',
      bodyTemplate: 'Hello {{name}}, your code is {{code}}',
      variables: ['name', 'code'],
    });

    const result = template.render({ name: 'John' });
    expect(result.body).toBe('Hello John, your code is {{code}}');
  });

  it('replaces all occurrences of a variable', () => {
    const template = NotificationTemplate.define({
      name: 'test',
      channel: 'EMAIL',
      bodyTemplate: '{{name}} and {{name}} and {{name}}',
      variables: ['name'],
    });

    const result = template.render({ name: 'X' });
    expect(result.body).toBe('X and X and X');
  });
});

describe('NotificationTemplate mutators', () => {
  it('activate()/deactivate() toggle isActive', () => {
    const template = NotificationTemplate.define({
      name: 'tpl',
      channel: 'EMAIL',
      bodyTemplate: 'Hello',
      variables: [],
    });

    template.deactivate();
    expect(template.isActive).toBe(false);

    template.activate();
    expect(template.isActive).toBe(true);
  });
});
