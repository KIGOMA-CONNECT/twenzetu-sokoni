import { Money } from '@abms/kernel';
import { PayeTaxBand } from './statutory-rates';

// Stateless domain service — all payroll arithmetic funnels through here so
// it's independently testable against known band configurations without
// constructing a full Payslip aggregate.
export class PayrollCalculator {
  public static calculatePaye(grossPay: Money, bands: readonly PayeTaxBand[]): Money {
    let tax = Money.create('0', grossPay.currency).getValue();

    for (const band of bands) {
      if (!grossPay.isGreaterThan(band.lowerBound)) {
        break;
      }
      const bandCeiling =
        band.upperBound && grossPay.isGreaterThan(band.upperBound) ? band.upperBound : grossPay;
      const taxableInBand = bandCeiling.subtract(band.lowerBound).getValue();
      const bandTax = taxableInBand.percentageOf(band.rateBasisPoints);
      tax = tax.add(bandTax).getValue();
    }

    return tax;
  }
}
