export interface YearlyValue {
  [year: number]: number;
}

export interface IncomeStatementRow {
  revenue: number;
  cogs: number;
  grossProfit: number;      // computed: revenue − cogs
  sga: number;
  ebitda: number;           // computed: grossProfit − sga
  depreciation: number;
  amortization: number;
  ebit: number;             // computed: ebitda − d&a
}

export interface FCFBuildRow {
  year: number;
  ebitda: number;
  da: number;               // D&A (add-back)
  ebit: number;
  nopat: number;            // EBIT × (1 − taxRate)
  capex: number;
  deltaNWC: number;         // Change in net working capital
  fcf: number;              // NOPAT + D&A − CapEx − ΔNWC
  discountFactor: number;
  presentValue: number;
}

export interface DCFParameters {
  discountRate: number;         // WACC %
  perpetuityRate: number;       // Terminal growth rate %
  corporateTaxRate: number;     // Tax rate %
  capexPct?: number;            // CapEx as % of revenue (alternative to absolute)
  nwcPct?: number;              // NWC change as % of revenue (alternative to absolute)
}

export interface EquityBridgeInputs {
  netDebt: number;              // Gross debt − cash
  preferredEquity: number;
  minorityInterest: number;
  cashAndEquivalents: number;
  dilutedSharesOutstanding: number;
  currentMarketPrice: number;   // For margin of safety calc
}

export interface EquityBridgeOutput {
  enterpriseValue: number;
  equityValue: number;
  intrinsicSharePrice: number;
  marginOfSafetyPct: number;    // Positive = undervalued
  upside: number;               // (intrinsic − market) / market × 100
}

export interface DCFResults {
  enterpriseValue: number;
  terminalValue: number;
  terminalValuePV: number;
  projectionsPV: number;
  fcfRows: FCFBuildRow[];
  equityBridge?: EquityBridgeOutput;
  terminalValuePct: number;     // TV PV / EV — useful indicator
}

export interface SensitivityGrid {
  waccValues: number[];         // e.g. [8, 10, 12, 14, 16]
  growthValues: number[];       // e.g. [1, 2, 3, 4, 5]
  evGrid: number[][];           // [waccIdx][growthIdx]
  sharePriceGrid?: number[][];  // Only if equity bridge inputs exist
}

export interface MonteCarloConfig {
  trials: number;               // Default 5000
  waccMean: number;
  waccStd: number;
  growthMean: number;
  growthStd: number;
  ebitdaGrowthMean: number;
  ebitdaGrowthStd: number;
}

export interface MonteCarloResults {
  evDistribution: number[];
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
  std: number;
}

export interface IRRInputs {
  entryEV: number;
  entryEbitda: number;          // For entry multiple display
  holdingPeriodYears: number;
  exitEVMultiple: number;       // EV/EBITDA at exit
  exitYearEbitda: number;       // Projected EBITDA at exit year
  netDebtAtExit: number;
  equityInvested: number;
}

export interface IRRResults {
  irr: number;                  // %
  moic: number;                 // x
  equityAtExit: number;
  evAtExit: number;
  entryMultiple: number;        // EV/EBITDA at entry
  exitMultiple: number;         // EV/EBITDA at exit
  cashFlows: number[];
}

export interface CompsEntry {
  ticker: string;
  companyName: string;
  evToEbitda: number;
  peRatio: number;
  evToRevenue: number;
  marketCap: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  currency: string;
}

export interface DCFScenario {
  id: string;
  userId: string;
  label: string;
  companyName: string;
  ticker?: string;
  sector?: string;
  currency: SupportedCurrency;
  baseCurrency: SupportedCurrency;
  forecastYears: number[];      // e.g. [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028]
  historicalCutoffYear: number; // Years ≤ this are actuals; years > are projections
  ebitdaData: YearlyValue;
  daData: YearlyValue;          // D&A per year
  capexData: YearlyValue;       // CapEx per year (absolute)
  nwcData: YearlyValue;         // NWC change per year
  parameters: DCFParameters;
  equityBridgeInputs?: EquityBridgeInputs;
  useIncomeStatement: boolean;
  incomeStatementData?: { [year: number]: IncomeStatementRow };
  comps?: CompsEntry[];
  irrInputs?: IRRInputs;
  notes?: string;               // Markdown
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;              // Optimistic locking
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CHF' | 'AUD' | 'CAD' | 'SGD';
export type AppTab = 'dcf' | 'inputs' | 'sensitivity' | 'equity' | 'irr' | 'montecarlo' | 'comps';
