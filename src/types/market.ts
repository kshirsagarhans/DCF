export interface MarketDataQuote {
  symbol: string;
  price: number;
  marketCap: number;
  sharesOutstanding: number;
}

export interface MarketDataProfile {
  symbol: string;
  companyName: string;
  currency: string;
  sector: string;
  industry: string;
  description: string;
  mktCap: number;
}

export interface MarketDataKeyMetrics {
  symbol: string;
  beta: number;
  evToEbitda: number;
  peRatio: number;
  evToSales: number;
  revenueGrowth: number;
  ebitdaMargin: number;
}

export interface MarketDataIncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  ebitda: number;
  depreciationAndAmortization: number;
  calendarYear: string;
}
