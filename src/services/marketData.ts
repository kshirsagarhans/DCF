import { MarketDataProfile, MarketDataQuote, MarketDataKeyMetrics, MarketDataIncomeStatement } from '../types/market';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

async function fetchFMP<T>(endpoint: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${FMP_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const marketDataService = {
  async getQuote(ticker: string): Promise<MarketDataQuote> {
    const data = await fetchFMP<any[]>(`/quote/${ticker}`);
    if (!data || data.length === 0) throw new Error('Quote not found');
    return {
      symbol: data[0].symbol,
      price: data[0].price,
      marketCap: data[0].marketCap,
      sharesOutstanding: data[0].sharesOutstanding
    };
  },

  async getProfile(ticker: string): Promise<MarketDataProfile> {
    const data = await fetchFMP<any[]>(`/profile/${ticker}`);
    if (!data || data.length === 0) throw new Error('Profile not found');
    return {
      symbol: data[0].symbol,
      companyName: data[0].companyName,
      currency: data[0].currency,
      sector: data[0].sector,
      industry: data[0].industry,
      description: data[0].description,
      mktCap: data[0].mktCap || 0
    };
  },

  async getKeyMetrics(ticker: string): Promise<MarketDataKeyMetrics> {
    const data = await fetchFMP<any[]>(`/key-metrics-ttm/${ticker}`);
    if (!data || data.length === 0) throw new Error('Key metrics not found');
    
    // We also need beta, might be in profile or enterprise-values
    const profile = await fetchFMP<any[]>(`/profile/${ticker}`);
    const beta = profile && profile.length > 0 ? profile[0].beta : 1.0;

    return {
      symbol: ticker,
      beta: beta,
      evToEbitda: data[0].enterpriseValueOverEBITDATTM || 0,
      peRatio: data[0].peRatioTTM || 0,
      evToSales: data[0].evToSalesTTM || 0,
      revenueGrowth: data[0].revenueGrowthTTM || 0,
      ebitdaMargin: data[0].ebitdaOverRevenueTTM || 0
    };
  },

  async getIncomeStatement(ticker: string, limit = 3): Promise<MarketDataIncomeStatement[]> {
    const data = await fetchFMP<any[]>(`/income-statement/${ticker}?limit=${limit}`);
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      date: item.date,
      symbol: item.symbol,
      revenue: item.revenue,
      ebitda: item.ebitda,
      depreciationAndAmortization: item.depreciationAndAmortization,
      calendarYear: item.calendarYear
    })).sort((a, b) => Number(a.calendarYear) - Number(b.calendarYear)); // sort chronologically
  }
};
