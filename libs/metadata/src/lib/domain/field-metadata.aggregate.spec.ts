import { EntityId } from '@afri-market/kernel';
import { FieldMetadata } from './field-metadata.aggregate';

describe('FieldMetadata.define', () => {
  it('creates a field with defaults', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email Address',
    });

    expect(field.entityType).toBe('Customer');
    expect(field.fieldName).toBe('email');
    expect(field.fieldType).toBe('EMAIL');
    expect(field.label).toBe('Email Address');
    expect(field.isRequired).toBe(false);
    expect(field.isUnique).toBe(false);
    expect(field.isReadOnly).toBe(false);
    expect(field.isHidden).toBe(false);
    expect(field.order).toBe(0);
    expect(field.group).toBeUndefined();
    expect(field.options).toEqual([]);
    expect(field.validation).toEqual([]);
  });

  it('accepts optional properties', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'loyaltyTier',
      fieldType: 'ENUM',
      label: 'Loyalty Tier',
      isRequired: true,
      isUnique: true,
      isReadOnly: true,
      isHidden: true,
      defaultValue: 'BRONZE',
      options: [
        { label: 'Bronze', value: 'BRONZE' },
        { label: 'Gold', value: 'GOLD' },
      ],
      validation: [{ constraint: 'REQUIRED' }, { constraint: 'MAX_LENGTH', parameters: { max: 50 } }],
      order: 10,
      group: 'Membership',
    });

    expect(field.isRequired).toBe(true);
    expect(field.isUnique).toBe(true);
    expect(field.isReadOnly).toBe(true);
    expect(field.isHidden).toBe(true);
    expect(field.defaultValue).toBe('BRONZE');
    expect(field.options).toHaveLength(2);
    expect(field.validation).toHaveLength(2);
    expect(field.order).toBe(10);
    expect(field.group).toBe('Membership');
  });

  it('rejects empty entityType', () => {
    expect(() =>
      FieldMetadata.define({
        entityType: '',
        fieldName: 'email',
        fieldType: 'EMAIL',
        label: 'Email',
      })
    ).toThrow();
  });

  it('rejects empty fieldName', () => {
    expect(() =>
      FieldMetadata.define({
        entityType: 'Customer',
        fieldName: '',
        fieldType: 'EMAIL',
        label: 'Email',
      })
    ).toThrow();
  });

  it('rejects empty label', () => {
    expect(() =>
      FieldMetadata.define({
        entityType: 'Customer',
        fieldName: 'email',
        fieldType: 'EMAIL',
        label: '',
      })
    ).toThrow();
  });
});

describe('FieldMetadata mutators', () => {
  it('updateLabel() changes the label', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Old Label',
    });

    field.updateLabel('New Label');
    expect(field.label).toBe('New Label');
  });

  it('updateLabel() rejects empty string', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email',
    });

    expect(() => field.updateLabel('')).toThrow();
  });

  it('makeRequired()/makeOptional() toggle isRequired', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email',
    });

    field.makeRequired();
    expect(field.isRequired).toBe(true);

    field.makeOptional();
    expect(field.isRequired).toBe(false);
  });

  it('makeReadOnly()/makeEditable() toggle isReadOnly', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email',
    });

    field.makeReadOnly();
    expect(field.isReadOnly).toBe(true);

    field.makeEditable();
    expect(field.isReadOnly).toBe(false);
  });

  it('show()/hide() toggle isHidden', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email',
    });

    field.hide();
    expect(field.isHidden).toBe(true);

    field.show();
    expect(field.isHidden).toBe(false);
  });

  it('setDefaultValue(), setOrder(), setGroup() update properties', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'email',
      fieldType: 'EMAIL',
      label: 'Email',
    });

    field.setDefaultValue('test@example.com');
    expect(field.defaultValue).toBe('test@example.com');

    field.setOrder(5);
    expect(field.order).toBe(5);

    field.setGroup('Contact');
    expect(field.group).toBe('Contact');
  });

  it('addOption() and addValidation() append to arrays', () => {
    const field = FieldMetadata.define({
      entityType: 'Customer',
      fieldName: 'tier',
      fieldType: 'ENUM',
      label: 'Tier',
    });

    field.addOption('Bronze', 'BRONZE');
    field.addOption('Silver', 'SILVER');
    expect(field.options).toHaveLength(2);

    field.addValidation('REQUIRED');
    expect(field.validation).toHaveLength(1);
  });
});

describe('FieldMetadata.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const field = FieldMetadata.reconstitute({
      id,
      entityType: 'Customer',
      fieldName: 'loyaltyTier',
      fieldType: 'ENUM',
      label: 'Loyalty Tier',
      isRequired: true,
      isUnique: false,
      isReadOnly: true,
      isHidden: false,
      order: 10,
      group: 'Membership',
    });

    expect(field.id.equals(id)).toBe(true);
    expect(field.isRequired).toBe(true);
    expect(field.isReadOnly).toBe(true);
    expect(field.order).toBe(10);
  });
});
