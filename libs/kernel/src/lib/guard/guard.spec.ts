import { BusinessRuleViolationException } from '../errors/business-rule-violation.exception';
import { Guard } from './guard';

describe('Guard', () => {
  describe('againstNullOrUndefined', () => {
    it('fails for null and undefined', () => {
      expect(Guard.againstNullOrUndefined(null, 'value').succeeded).toBe(false);
      expect(Guard.againstNullOrUndefined(undefined, 'value').succeeded).toBe(false);
    });

    it('succeeds for a defined value', () => {
      expect(Guard.againstNullOrUndefined('x', 'value').succeeded).toBe(true);
    });
  });

  describe('againstEmptyString', () => {
    it('fails for an empty or whitespace-only string', () => {
      expect(Guard.againstEmptyString('', 'name').succeeded).toBe(false);
      expect(Guard.againstEmptyString('   ', 'name').succeeded).toBe(false);
    });

    it('succeeds for a non-empty string', () => {
      expect(Guard.againstEmptyString('Acme', 'name').succeeded).toBe(true);
    });
  });

  describe('isValidUUID', () => {
    it('fails for a non-UUID string', () => {
      expect(Guard.isValidUUID('not-a-uuid').succeeded).toBe(false);
    });

    it('succeeds for a valid UUID', () => {
      expect(Guard.isValidUUID('3f2504e0-4f89-41d3-9a0c-0305e82c3301').succeeded).toBe(true);
    });
  });

  describe('inRange', () => {
    it('fails when the value is outside the range', () => {
      expect(Guard.inRange(11, 0, 10, 'quantity').succeeded).toBe(false);
    });

    it('succeeds when the value is inside the range', () => {
      expect(Guard.inRange(5, 0, 10, 'quantity').succeeded).toBe(true);
    });
  });

  describe('combine', () => {
    it('returns the first failing result', () => {
      const result = Guard.combine([
        Guard.againstNullOrUndefined('x', 'a'),
        Guard.againstEmptyString('', 'b'),
        Guard.isValidUUID('not-a-uuid', 'c'),
      ]);

      expect(result.succeeded).toBe(false);
      expect(result.message).toContain('b must not be empty');
    });

    it('succeeds when every result succeeds', () => {
      const result = Guard.combine([
        Guard.againstNullOrUndefined('x', 'a'),
        Guard.againstEmptyString('y', 'b'),
      ]);

      expect(result.succeeded).toBe(true);
    });
  });

  describe('assert', () => {
    it('throws BusinessRuleViolationException when the guard result failed', () => {
      expect(() => Guard.assert(Guard.againstEmptyString('', 'name'))).toThrow(
        BusinessRuleViolationException,
      );
    });

    it('does not throw when the guard result succeeded', () => {
      expect(() => Guard.assert(Guard.againstEmptyString('Acme', 'name'))).not.toThrow();
    });
  });
});
