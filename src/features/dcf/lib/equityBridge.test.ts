import { describe, it, expect } from 'vitest';
import { calculateEquityBridge } from './equityBridge';
import { EquityBridgeInputs } from '../../../types/dcf';

describe('Equity Bridge Engine', () => {
  it('should calculate equity value correctly', () => {
    const inputs: EquityBridgeInputs = {
      netDebt: 100,
      preferredEquity: 20,
      minorityInterest: 10,
      cashAndEquivalents: 50,
      dilutedSharesOutstanding: 10,
      currentMarketPrice: 0
    };

    const result = calculateEquityBridge(1000, inputs);
    
    // Equity Value = EV - Net Debt - Pref - Minority + Cash
    // 1000 - 100 - 20 - 10 + 50 = 920
    expect(result.equityValue).toBe(920);
    expect(result.intrinsicSharePrice).toBe(92);
  });

  it('should calculate margin of safety', () => {
    const inputs: EquityBridgeInputs = {
      netDebt: 0,
      preferredEquity: 0,
      minorityInterest: 0,
      cashAndEquivalents: 0,
      dilutedSharesOutstanding: 10,
      currentMarketPrice: 50 // Market is 50, intrinsic is 100
    };

    const result = calculateEquityBridge(1000, inputs);
    
    // Intrinsic = 100
    // Upside = (100 - 50) / 50 * 100 = 100%
    expect(result.marginOfSafetyPct).toBe(50);
    expect(result.upside).toBe(100); // 100% upside
  });
});
