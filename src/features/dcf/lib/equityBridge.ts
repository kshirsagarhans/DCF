import { EquityBridgeInputs, EquityBridgeOutput } from '../../../types/dcf';

export function calculateEquityBridge(
  enterpriseValue: number,
  inputs: EquityBridgeInputs
): EquityBridgeOutput {
  // Equity Value = EV - Net Debt - Preferred Equity - Minority Interest + Cash
  // Wait, if Net Debt = Gross Debt - Cash, then deducting Net Debt already accounts for Cash.
  // The prompt says: Net Debt: Gross debt - cash
  // And also says: Cash and Equivalents. 
  // Let's stick to standard formula: EV - Total Debt - Preferred - Minority + Cash
  // If user provides Net Debt directly, they shouldn't add Cash again. But the input has both.
  // Prompt Formula: Equity Value = EV - Net Debt - Preferred Equity - Minority Interest + Cash & Equivalents
  // Usually if Net Debt is used, it's EV - Net Debt - Pref - Minority. If Gross Debt, then + Cash.
  // We'll follow the exact formula in the prompt:
  // "Equity Value = EV - Net Debt - Preferred Equity - Minority Interest + Cash & Equivalents"
  const equityValue = enterpriseValue 
    - inputs.netDebt 
    - inputs.preferredEquity 
    - inputs.minorityInterest 
    + inputs.cashAndEquivalents;

  const intrinsicSharePrice = inputs.dilutedSharesOutstanding > 0 
    ? equityValue / inputs.dilutedSharesOutstanding 
    : 0;

  // Margin of Safety = (Intrinsic Price - Current Market Price) / Intrinsic Price * 100%
  let marginOfSafetyPct = 0;
  if (intrinsicSharePrice !== 0 && inputs.currentMarketPrice > 0) {
    marginOfSafetyPct = ((intrinsicSharePrice - inputs.currentMarketPrice) / intrinsicSharePrice) * 100;
  } else if (intrinsicSharePrice < 0) {
    marginOfSafetyPct = -100; // Heavily undervalued or distressed
  }

  // Upside = (Intrinsic - Market) / Market * 100
  let upside = 0;
  if (inputs.currentMarketPrice > 0) {
    upside = ((intrinsicSharePrice - inputs.currentMarketPrice) / inputs.currentMarketPrice) * 100;
  }

  return {
    enterpriseValue,
    equityValue,
    intrinsicSharePrice,
    marginOfSafetyPct,
    upside
  };
}
