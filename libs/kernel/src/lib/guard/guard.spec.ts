import { Guard } from './guard';

describe('Guard', () => {
  describe('againstNullOrUndefined', () => {
    it('throws for null and undefined', () => {
      expect(() => Guard.againstNullOrUndefined(null, 'value')).toThrow(
        'value must not be null or undefined',
      );
      expect(() => Guard.againstNullOrUndefined(undefined, 'value')).toThrow(
        'value must not be null or undefined',
      );
    });

    it('does not throw for a defined value', () => {
      expect(() => Guard.againstNullOrUndefined('x', 'value')).not.toThrow();
    });
  });

  describe('againstEmptyString', () => {
    it('throws for an empty or whitespace-only string', () => {
      expect(() => Guard.againstEmptyString('', 'name')).toThrow('name must not be empty');
      expect(() => Guard.againstEmptyString('   ', 'name')).toThrow('name must not be empty');
    });

    it('throws for a non-string value', () => {
      expect(() => Guard.againstEmptyString(42 as unknown as string, 'name')).toThrow(
        'name must not be empty',
      );
    });

    it('returns the value for a non-empty string', () => {
      expect(Guard.againstEmptyString('Acme', 'name')).toBe('Acme');
    });
  });

  describe('inRange', () => {
    it('throws when the value is outside the range', () => {
      expect(() => Guard.inRange(11, 0, 10, 'quantity')).toThrow(
        'quantity must be between 0 and 10',
      );
    });

    it('does not throw when the value is inside the range', () => {
      expect(() => Guard.inRange(5, 0, 10, 'quantity')).not.toThrow();
    });
  });

  describe('assert', () => {
    it('throws when the condition is falsy', () => {
      expect(() => Guard.assert(false, 'boom')).toThrow('boom');
    });

    it('throws with a default message when none is provided', () => {
      expect(() => Guard.assert(false)).toThrow('Assertion failed');
    });

    it('does not throw when the condition is truthy', () => {
      expect(() => Guard.assert(true)).not.toThrow();
    });
  });
});
