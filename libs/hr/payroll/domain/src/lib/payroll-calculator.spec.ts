import { CurrencyCode, Money } from '@abms/kernel';
import { PayrollCalculator } from './payroll-calculator';
import { createTanzaniaStatutoryRatesV1 } from './statutory-rates';

const TZS = CurrencyCode.create('TZS').getValue();

function tzs(amount: string): Money {
  return Money.create(amount, TZS).getValue();
}

describe('PayrollCalculator.calculatePaye', () => {
  const bands = createTanzaniaStatutoryRatesV1().payeBands;

  it('charges no PAYE within the tax-free band', () => {
    expect(PayrollCalculator.calculatePaye(tzs('200000'), bands).amount).toBe('0.0000');
  });

  it('charges no PAYE exactly at the tax-free band ceiling', () => {
    expect(PayrollCalculator.calculatePaye(tzs('270000'), bands).amount).toBe('0.0000');
  });

  it('taxes only the portion above the tax-free threshold at 8%', () => {
    // (400000 - 270000) * 8% = 10400
    expect(PayrollCalculator.calculatePaye(tzs('400000'), bands).amount).toBe('10400.0000');
  });

  it('accumulates marginal tax across three bands', () => {
    // band2: (520000-270000)*8% = 20000; band3: (600000-520000)*20% = 16000
    expect(PayrollCalculator.calculatePaye(tzs('600000'), bands).amount).toBe('36000.0000');
  });

  it('accumulates marginal tax across four bands', () => {
    // 20000 + (760000-520000)*20%=48000 + (900000-760000)*25%=35000 = 103000
    expect(PayrollCalculator.calculatePaye(tzs('900000'), bands).amount).toBe('103000.0000');
  });

  it('applies the uncapped top band correctly', () => {
    // 20000 + 48000 + (1000000-760000)*25%=60000 + (1200000-1000000)*30%=60000 = 188000
    expect(PayrollCalculator.calculatePaye(tzs('1200000'), bands).amount).toBe('188000.0000');
  });

  it('returns zero for zero gross pay', () => {
    expect(PayrollCalculator.calculatePaye(tzs('0'), bands).amount).toBe('0');
  });
});
