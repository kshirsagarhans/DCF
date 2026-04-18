import { describe, it, expect } from 'vitest';
import { calculateDCF } from './fcf';
import { DCFScenario } from '../../../types/dcf';

describe('FCF Calculation Engine', () => {
  const mockScenario: DCFScenario = {
    id: 'test',
    userId: 'user',
    label: 'Test',
    companyName: 'Test Corp',
    currency: 'USD',
    baseCurrency: 'USD',
    historicalCutoffYear: 2023,
    forecastYears: [2024, 2025, 2026],
    ebitdaData: { 2024: 100, 2025: 110, 2026: 121 },
    daData: { 2024: 20, 2025: 20, 2026: 20 },
    capexData: { 2024: 25, 2025: 30, 2026: 35 },
    nwcData: { 2024: 5, 2025: 5, 2026: 5 },
    parameters: {
      discountRate: 10,
      perpetuityRate: 2,
      corporateTaxRate: 20,
    },
    useIncomeStatement: false,
    createdAt: '',
    updatedAt: '',
    version: 1
  };

  it('should calculate NOPAT and FCF correctly', () => {
    const result = calculateDCF(mockScenario);
    
    // Year 2024
    // EBIT = 100 - 20 = 80
    // Tax = 80 * 20% = 16
    // NOPAT = 80 - 16 = 64
    // FCF = 64 + 20 (DA) - 25 (CapEx) - 5 (NWC) = 54
    expect(result.fcfRows[0].fcf).toBe(54);
    
    // Year 2025
    // EBIT = 110 - 20 = 90
    // Tax = 90 * 20% = 18
    // NOPAT = 90 - 18 = 72
    // FCF = 72 + 20 - 30 - 5 = 57
    expect(result.fcfRows[1].fcf).toBe(57);
  });

  it('should calculate terminal value using Gordon Growth', () => {
    const result = calculateDCF(mockScenario);
    
    // Year 2026 FCF = 121 - 20 (DA) = 101 EBIT -> NOPAT = 101 - 20.2 = 80.8
    // FCF = 80.8 + 20 - 35 - 5 = 60.8
    // Terminal FCF = 60.8 * (1 + 2%) = 62.016
    // Terminal Value = 62.016 / (10% - 2%) = 62.016 / 0.08 = 775.2
    // Present Value of TV = 775.2 / (1.10)^3 = 775.2 / 1.331 = 582.4
    
    expect(result.terminalValue).toBeCloseTo(775.2, 1);
    expect(result.terminalValuePV).toBeCloseTo(582.4, 1);
  });
});
