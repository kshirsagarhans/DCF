import { IRRInputs, FCFBuildRow, IRRResults } from '../../../types/dcf';

// Helper function to calculate IRR from cash flows
function computeIRR(cashFlows: number[], guess = 0.1): number {
  const maxIterations = 1000;
  let rate = guess;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    
    if (Math.abs(npv) < 1e-6) return rate;
    
    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < 1e-6) return newRate;
    
    rate = newRate;
  }
  
  return rate;
}

export function calculateIRR(inputs: IRRInputs, fcfRows: FCFBuildRow[]): IRRResults {
  // Cash flows start with Year 0: -Equity Invested
  const cashFlows = [-inputs.equityInvested];
  
  // Terminal Value at exit
  const exitEnterpriseValue = inputs.exitYearEbitda * inputs.exitEVMultiple;
  const exitEquityValue = exitEnterpriseValue - inputs.netDebtAtExit;
  
  // Add intermediate FCFs if any
  for (let i = 0; i < inputs.holdingPeriodYears; i++) {
    if (i < fcfRows.length) {
      if (i === inputs.holdingPeriodYears - 1) {
        // Last year includes the exit value
        cashFlows.push(fcfRows[i].fcf + exitEquityValue);
      } else {
        // Assume FCF is distributed or retained (for simplicity we treat it as cash flow here)
        cashFlows.push(fcfRows[i].fcf);
      }
    } else {
      // If holding period exceeds explicit forecast, pad with 0s (simplification)
      cashFlows.push(i === inputs.holdingPeriodYears - 1 ? exitEquityValue : 0);
    }
  }
  
  const irr = computeIRR(cashFlows);
  
  // MOIC = Total Cash Returned / Equity Invested
  const totalReturn = cashFlows.slice(1).reduce((sum, cf) => sum + (cf > 0 ? cf : 0), 0);
  const moic = inputs.equityInvested > 0 ? totalReturn / inputs.equityInvested : 0;
  
  return {
    irr,
    moic,
    equityAtExit: exitEquityValue,
    evAtExit: exitEnterpriseValue,
    entryMultiple: inputs.entryEbitda > 0 ? inputs.entryEV / inputs.entryEbitda : 0,
    exitMultiple: inputs.exitEVMultiple,
    cashFlows
  };
}
