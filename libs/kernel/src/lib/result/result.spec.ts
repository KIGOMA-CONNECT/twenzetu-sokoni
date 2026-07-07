import { Result } from './result';

describe('Result', () => {
  it('ok() creates a successful result carrying a value', () => {
    const result = Result.ok<number>(42);

    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe(42);
  });

  it('fail() creates a failed result carrying an error', () => {
    const error = new Error('boom');
    const result = Result.fail<number>(error);

    expect(result.isFailure).toBe(true);
    expect(result.isSuccess).toBe(false);
    expect(result.getError()).toBe(error);
  });

  it('getValue() throws when called on a failed result', () => {
    const result = Result.fail<number>(new Error('boom'));

    expect(() => result.getValue()).toThrow();
  });

  it('getError() throws when called on a successful result', () => {
    const result = Result.ok<number>(1);

    expect(() => result.getError()).toThrow();
  });

  it('combine() returns success when all results succeed', () => {
    const combined = Result.combine([Result.ok(1), Result.ok('a'), Result.ok(true)]);

    expect(combined.isSuccess).toBe(true);
  });

  it('combine() returns the first failure', () => {
    const error = new Error('first failure');
    const combined = Result.combine([
      Result.ok(1),
      Result.fail(error),
      Result.fail(new Error('second')),
    ]);

    expect(combined.isFailure).toBe(true);
    expect(combined.getError()).toBe(error);
  });
});
