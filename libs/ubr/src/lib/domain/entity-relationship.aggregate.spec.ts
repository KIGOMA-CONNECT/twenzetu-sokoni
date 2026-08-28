import { EntityId } from '@afri-market/kernel';
import { EntityRelationship } from './entity-relationship.aggregate';

describe('EntityRelationship.define', () => {
  it('creates a relationship with default MANY_TO_ONE cardinality', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'Employee belongs to Company',
    });

    expect(rel.sourceEntityType).toBe('Employee');
    expect(rel.targetEntityType).toBe('Company');
    expect(rel.relationshipType).toBe('BELONGS_TO');
    expect(rel.label).toBe('Employee belongs to Company');
    expect(rel.cardinality).toBe('ONE_TO_MANY');
    expect(rel.state).toBe('ACTIVE');
  });

  it('accepts custom cardinality and description', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Department',
      targetEntityType: 'Company',
      relationshipType: 'HAS',
      label: 'Company has Departments',
      description: 'One-to-many relationship',
      cardinality: 'ONE_TO_MANY',
      properties: { min: 1, max: 50 },
    });

    expect(rel.cardinality).toBe('ONE_TO_MANY');
    expect(rel.description).toBe('One-to-many relationship');
    expect(rel.properties).toEqual({ min: 1, max: 50 });
  });

  it('rejects empty sourceEntityType', () => {
    expect(() =>
      EntityRelationship.define({
        sourceEntityType: '',
        targetEntityType: 'Company',
        relationshipType: 'HAS',
        label: 'test',
      })
    ).toThrow();
  });

  it('rejects empty targetEntityType', () => {
    expect(() =>
      EntityRelationship.define({
        sourceEntityType: 'Employee',
        targetEntityType: '',
        relationshipType: 'HAS',
        label: 'test',
      })
    ).toThrow();
  });

  it('rejects empty label', () => {
    expect(() =>
      EntityRelationship.define({
        sourceEntityType: 'Employee',
        targetEntityType: 'Company',
        relationshipType: 'HAS',
        label: '',
      })
    ).toThrow();
  });
});

describe('EntityRelationship mutators', () => {
  it('updateLabel() changes the label', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'Old label',
    });

    rel.updateLabel('New label');
    expect(rel.label).toBe('New label');
  });

  it('updateLabel() rejects empty string', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'test',
    });

    expect(() => rel.updateLabel('')).toThrow();
  });

  it('setProperty() manages properties', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'test',
    });

    rel.setProperty('since', '2020');
    expect(rel.properties.since).toBe('2020');
  });

  it('deactivate(), activate(), deprecate() toggle state', () => {
    const rel = EntityRelationship.define({
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'test',
    });

    rel.deactivate();
    expect(rel.state).toBe('INACTIVE');

    rel.activate();
    expect(rel.state).toBe('ACTIVE');

    rel.deprecate();
    expect(rel.state).toBe('DEPRECATED');
  });
});

describe('EntityRelationship.reconstitute', () => {
  it('rebuilds from persisted state', () => {
    const id = EntityId.create();
    const rel = EntityRelationship.reconstitute({
      id,
      sourceEntityType: 'Employee',
      targetEntityType: 'Company',
      relationshipType: 'BELONGS_TO',
      label: 'Employee belongs to Company',
      cardinality: 'MANY_TO_ONE',
      state: 'INACTIVE',
      properties: { key: 'val' },
    });

    expect(rel.id.equals(id)).toBe(true);
    expect(rel.cardinality).toBe('MANY_TO_ONE');
    expect(rel.state).toBe('INACTIVE');
    expect(rel.properties).toEqual({ key: 'val' });
  });
});
