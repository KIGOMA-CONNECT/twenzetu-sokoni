import { CurrencyCode, Money } from '@abms/kernel';

// A single marginal PAYE band: [lowerBound, upperBound) taxed at rateBasisPoints.
// `upperBound: null` means "no ceiling" (the top band). Bands must be given
// in ascending order starting at 0 — PayrollCalculator.calculatePaye() walks
// them in order and stops at the first band whose lowerBound the gross pay
// doesn't exceed.
export interface PayeTaxBand {
  readonly lowerBound: Money;
  readonly upperBound: Money | null;
  readonly rateBasisPoints: number;
}

// Statutory deduction/contribution rates a Payslip is computed against.
// Deliberately a plain data structure passed into PayrollCalculator/Payslip
// rather than a hardcoded singleton — tax law changes, and a future sprint
// can add an admin-configurable rate schedule without touching the
// calculation logic itself. See ADR-0010's explicit caveat: the default set
// below (TANZANIA_STATUTORY_RATES_V1) is a reference default, not a
// guaranteed-current legal fact, and must be verified against the current
// Finance Act / NSSF Act / WCF Act / SDL rules by a qualified payroll or tax
// professional before being relied on for real payroll runs.
export interface StatutoryRates {
  readonly currency: CurrencyCode;
  readonly payeBands: readonly PayeTaxBand[];
  readonly nssfEmployeeRateBasisPoints: number;
  readonly nssfEmployerRateBasisPoints: number;
  readonly wcfEmployerRateBasisPoints: number;
  readonly sdlEmployerRateBasisPoints: number;
}

function tzs(amount: string): Money {
  return Money.create(amount, CurrencyCode.create('TZS').getValue()).getValue();
}

/**
 * Reference default for Tanzania mainland, resident individuals, monthly
 * PAYE bands — commonly cited post-2023 Finance Act figures. NOT verified
 * against a current, authoritative TRA source at the time this code was
 * written; treat as a starting configuration to confirm/replace, not as
 * ground truth. NSSF is modeled at the common 20% total (10% employee / 10%
 * employer) contribution split; WCF at the 0.6% private-sector employer
 * rate; SDL at 3.5% employer rate (both employer-only costs, not deducted
 * from the employee's net pay).
 */
export function createTanzaniaStatutoryRatesV1(): StatutoryRates {
  const currency = CurrencyCode.create('TZS').getValue();
  return {
    currency,
    payeBands: [
      { lowerBound: tzs('0'), upperBound: tzs('270000'), rateBasisPoints: 0 },
      { lowerBound: tzs('270000'), upperBound: tzs('520000'), rateBasisPoints: 800 },
      { lowerBound: tzs('520000'), upperBound: tzs('760000'), rateBasisPoints: 2000 },
      { lowerBound: tzs('760000'), upperBound: tzs('1000000'), rateBasisPoints: 2500 },
      { lowerBound: tzs('1000000'), upperBound: null, rateBasisPoints: 3000 },
    ],
    nssfEmployeeRateBasisPoints: 1000,
    nssfEmployerRateBasisPoints: 1000,
    wcfEmployerRateBasisPoints: 60,
    sdlEmployerRateBasisPoints: 350,
  };
}
