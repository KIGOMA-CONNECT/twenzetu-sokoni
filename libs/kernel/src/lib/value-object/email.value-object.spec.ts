import { ValidationDomainException } from '../errors/validation-domain.exception';
import { Email } from './email.value-object';

describe('Email', () => {
  it('creates successfully from a valid email address', () => {
    const result = Email.create('ceo@afribiz.co.tz');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('ceo@afribiz.co.tz');
  });

  it('normalizes to lowercase and trims whitespace', () => {
    const result = Email.create('  CEO@Afribiz.Co.Tz  ');

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().value).toBe('ceo@afribiz.co.tz');
  });

  it('fails for a value with no @ symbol', () => {
    const result = Email.create('not-an-email');

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationDomainException);
  });

  it('fails for a value with no domain', () => {
    const result = Email.create('ceo@');

    expect(result.isFailure).toBe(true);
  });

  it('fails for a value with whitespace inside it', () => {
    const result = Email.create('ceo @afribiz.co.tz');

    expect(result.isFailure).toBe(true);
  });

  it('two emails with the same value are equal', () => {
    const a = Email.create('ceo@afribiz.co.tz').getValue();
    const b = Email.create('CEO@afribiz.co.tz').getValue();

    expect(a.equals(b)).toBe(true);
  });
});
