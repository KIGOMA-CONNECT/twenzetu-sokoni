import { EntityId } from '@afri-market/kernel';
import { FormMetadata } from './form-metadata.aggregate';

describe('FormMetadata.define', () => {
  it('creates a form with defaults', () => {
    const form = FormMetadata.define({
      entityType: 'Customer',
      formName: 'create-customer',
      label: 'Create Customer',
    });

    expect(form.entityType).toBe('Customer');
    expect(form.formName).toBe('create-customer');
    expect(form.label).toBe('Create Customer');
    expect(form.layout).toBe('GRID');
    expect(form.sections).toEqual([]);
    expect(form.columns).toBe(1);
    expect(form.submitLabel).toBe('Save');
    expect(form.cancelLabel).toBe('Cancel');
  });

  it('accepts optional properties', () => {
    const form = FormMetadata.define({
      entityType: 'Customer',
      formName: 'create-customer',
      label: 'Create Customer',
      description: 'Form to create a new customer',
      layout: 'STEPS',
      sections: [
        { title: 'Personal Info', fields: ['firstName', 'lastName'] },
      ],
      columns: 2,
      submitLabel: 'Create',
      cancelLabel: 'Back',
    });

    expect(form.description).toBe('Form to create a new customer');
    expect(form.layout).toBe('STEPS');
    expect(form.sections).toHaveLength(1);
    expect(form.columns).toBe(2);
    expect(form.submitLabel).toBe('Create');
    expect(form.cancelLabel).toBe('Back');
  });

  it('rejects empty entityType', () => {
    expect(() =>
      FormMetadata.define({ entityType: '', formName: 'f', label: 'L' })
    ).toThrow();
  });

  it('rejects empty formName', () => {
    expect(() =>
      FormMetadata.define({ entityType: 'C', formName: '', label: 'L' })
    ).toThrow();
  });

  it('rejects empty label', () => {
    expect(() =>
      FormMetadata.define({ entityType: 'C', formName: 'f', label: '' })
    ).toThrow();
  });
});

describe('FormMetadata mutators', () => {
  it('addSection() adds a section', () => {
    const form = FormMetadata.define({
      entityType: 'Customer',
      formName: 'create-customer',
      label: 'Create Customer',
    });

    form.addSection({ title: 'Contact', fields: ['email', 'phone'] });
    expect(form.sections).toHaveLength(1);
    expect(form.sections[0].title).toBe('Contact');
  });

  it('removeSection() removes by title', () => {
    const form = FormMetadata.define({
      entityType: 'Customer',
      formName: 'create-customer',
      label: 'Create Customer',
    });

    form.addSection({ title: 'A', fields: [] });
    form.addSection({ title: 'B', fields: [] });
    form.removeSection('A');
    expect(form.sections).toHaveLength(1);
    expect(form.sections[0].title).toBe('B');
  });

  it('updateLayout() and updateColumns() change values', () => {
    const form = FormMetadata.define({
      entityType: 'Customer',
      formName: 'create-customer',
      label: 'Create Customer',
    });

    form.updateLayout('TABS');
    expect(form.layout).toBe('TABS');

    form.updateColumns(3);
    expect(form.columns).toBe(3);
  });
});
