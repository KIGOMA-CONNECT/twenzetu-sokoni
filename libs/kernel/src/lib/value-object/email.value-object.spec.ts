import { Email } from './email.value-object';

describe('Email', () => {
  it('creates successfully from a valid email address', () => {
    const email = Email.create('ceo@afribiz.co.tz');

    expect(email.value).toBe('ceo@afribiz.co.tz');
  });

  it('normalizes to lowercase and trims whitespace', () => {
    const email = Email.create('  CEO@Afribiz.Co.Tz  ');

    expect(email.value).toBe('ceo@afribiz.co.tz');
  });

  it('throws for an empty value', () => {
    expect(() => Email.create('')).toThrow('Email cannot be empty');
    expect(() => Email.create('   ')).toThrow('Email cannot be empty');
  });

  it('throws for a value with no @ symbol', () => {
    expect(() => Email.create('not-an-email')).toThrow('Invalid email format');
  });

  it('throws for a value with no domain', () => {
    expect(() => Email.create('ceo@')).toThrow('Invalid email format');
  });

  it('throws for a value with whitespace inside it', () => {
    expect(() => Email.create('ceo @afribiz.co.tz')).toThrow('Invalid email format');
  });

  it('two emails with the same value are equal', () => {
    const a = Email.create('ceo@afribiz.co.tz');
    const b = Email.create('CEO@afribiz.co.tz');

    expect(a.equals(b)).toBe(true);
  });

  it('two emails with different values are not equal', () => {
    const a = Email.create('ceo@afribiz.co.tz');
    const b = Email.create('dev@afribiz.co.tz');

    expect(a.equals(b)).toBe(false);
  });
});
