import { FCFBuildRow, DCFParameters, DCFResults, DCFScenario } from '../../../types/dcf';

export function calculateFCFRow(
  year: number,
  ebitda: number,
  da: number,
  capex: number,
  deltaNWC: number,
  taxRate: number,
  wacc: number,
  period: number   // 1-indexed discount period
): FCFBuildRow {
  if (capex < 0) {
    throw new Error('CapEx must be non-negative (cannot be a source of cash in this model)');
  }
  const ebit = ebitda - da;
  const nopat = ebit > 0 ? ebit * (1 - taxRate / 100) : ebit;
  const fcf = nopat + da - capex - deltaNWC;
  const discountFactor = 1 / Math.pow(1 + wacc / 100, period);
  return { 
    year, 
    ebitda, 
    da, 
    ebit, 
    nopat, 
    capex, 
    deltaNWC, 
    fcf, 
    discountFactor, 
    presentValue: fcf * discountFactor 
  };
}

export function validateDCFParameters(params: DCFParameters, forecastYearsLength: number) {
  if (params.discountRate < 1 || params.discountRate > 100) {
    throw new Error('Discount rate must be between 1% and 100%');
  }
  if (params.perpetuityRate < 0) {
    throw new Error('Perpetuity growth rate must be non-negative');
  }
  if (params.perpetuityRate >= params.discountRate) {
    throw new Error('Discount rate must be strictly greater than perpetuity rate (Gordon Growth constraint)');
  }
  if (params.corporateTaxRate < 0 || params.corporateTaxRate > 60) {
    throw new Error('Corporate tax rate must be between 0% and 60%');
  }
  if (forecastYearsLength < 3) {
    throw new Error('At least 3 forecast years required');
  }
}

export function calculateDCF(scenario: DCFScenario): DCFResults {
  const projectedYears = scenario.forecastYears.filter(y => y > scenario.historicalCutoffYear);
  validateDCFParameters(scenario.parameters, projectedYears.length);

  const { discountRate, perpetuityRate, corporateTaxRate } = scenario.parameters;
  
  const fcfRows: FCFBuildRow[] = [];
  let projectionsPV = 0;

  projectedYears.forEach((year, index) => {
    // 1-indexed period for discount factor
    const period = index + 1;
    let capex = scenario.capexData[year] || 0;
    if (scenario.parameters.capexPct !== undefined) {
      // In Mode B or when percentage is used, this would use revenue, but EBITDA is baseline here
      // For simplicity if absolute capexData isn't provided but percentage is used:
      // Note: Full formula requires Revenue, which might be in incomeStatementData
      if (scenario.useIncomeStatement && scenario.incomeStatementData?.[year]) {
        capex = scenario.incomeStatementData[year].revenue * (scenario.parameters.capexPct / 100);
      }
    }
    
    let deltaNWC = scenario.nwcData[year] || 0;
    if (scenario.parameters.nwcPct !== undefined) {
       if (scenario.useIncomeStatement && scenario.incomeStatementData?.[year]) {
        deltaNWC = scenario.incomeStatementData[year].revenue * (scenario.parameters.nwcPct / 100);
      }
    }

    const row = calculateFCFRow(
      year,
      scenario.ebitdaData[year] || 0,
      scenario.daData[year] || 0,
      capex,
      deltaNWC,
      corporateTaxRate,
      discountRate,
      period
    );

    fcfRows.push(row);
    projectionsPV += row.presentValue;
  });

  const lastYearFCF = fcfRows[fcfRows.length - 1].fcf;
  // Terminal Value uses final year FCF grown by perpetuity rate
  const terminalValue = (lastYearFCF * (1 + perpetuityRate / 100)) / ((discountRate - perpetuityRate) / 100);
  const terminalDiscountFactor = 1 / Math.pow(1 + discountRate / 100, projectedYears.length);
  const terminalValuePV = terminalValue * terminalDiscountFactor;

  const enterpriseValue = projectionsPV + terminalValuePV;
  const terminalValuePct = enterpriseValue !== 0 ? (terminalValuePV / enterpriseValue) * 100 : 0;

  return {
    enterpriseValue,
    terminalValue,
    terminalValuePV,
    projectionsPV,
    fcfRows,
    terminalValuePct
  };
}
