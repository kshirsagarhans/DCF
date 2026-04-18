import { MarketDataProfile, MarketDataQuote, MarketDataKeyMetrics, MarketDataIncomeStatement } from '../types/market';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

async function fetchFMP<T>(endpoint: string): Promise<T> {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${sep}apikey=${FMP_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API Error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  // FMP returns { "Error Message": "..." } for invalid requests
  if (data && typeof data === 'object' && !Array.isArray(data) && data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  return data;
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
    if (!data || data.length === 0) throw new Error('Profile not found for ticker: ' + ticker);
    return {
      symbol: data[0].symbol,
      companyName: data[0].companyName || ticker,
      currency: data[0].currency || 'USD',
      sector: data[0].sector || '',
      industry: data[0].industry || '',
      description: data[0].description || '',
      mktCap: data[0].mktCap || 0
    };
  },

  async getKeyMetrics(ticker: string): Promise<MarketDataKeyMetrics> {
    // Use profile endpoint for beta (reliable on free tier)
    const profile = await fetchFMP<any[]>(`/profile/${ticker}`);
    const beta = profile && profile.length > 0 ? (profile[0].beta || 1.0) : 1.0;

    // Try TTM key metrics; on free tier this may be limited
    let evToEbitda = 0, peRatio = 0, evToSales = 0, revenueGrowth = 0, ebitdaMargin = 0;
    try {
      const metrics = await fetchFMP<any[]>(`/key-metrics-ttm/${ticker}`);
      if (metrics && metrics.length > 0) {
        evToEbitda = metrics[0].enterpriseValueOverEBITDATTM || 0;
        peRatio = metrics[0].peRatioTTM || 0;
        evToSales = metrics[0].evToSalesTTM || 0;
        revenueGrowth = metrics[0].revenueGrowthTTM || 0;
        ebitdaMargin = metrics[0].ebitdaOverRevenueTTM || 0;
      }
    } catch {
      // Non-fatal — return what we have from profile
    }

    return { symbol: ticker, beta, evToEbitda, peRatio, evToSales, revenueGrowth, ebitdaMargin };
  },

  async getIncomeStatement(ticker: string, limit = 3): Promise<MarketDataIncomeStatement[]> {
    const data = await fetchFMP<any[]>(`/income-statement/${ticker}?limit=${limit}`);
    if (!data || data.length === 0) return [];

    return data
      .map(item => ({
        date: item.date,
        symbol: item.symbol,
        revenue: item.revenue || 0,
        ebitda: item.ebitda || 0,
        depreciationAndAmortization: item.depreciationAndAmortization || 0,
        calendarYear: item.calendarYear || String(new Date(item.date).getFullYear())
      }))
      .sort((a, b) => Number(a.calendarYear) - Number(b.calendarYear));
  },

  /** Search for tickers by company name or symbol */
  async searchTicker(query: string): Promise<{ symbol: string; name: string; currency: string; stockExchange: string }[]> {
    const data = await fetchFMP<any[]>(`/search?query=${encodeURIComponent(query)}&limit=8`);
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      symbol: item.symbol || '',
      name: item.name || '',
      currency: item.currency || 'USD',
      stockExchange: item.stockExchange || ''
    }));
  }
};
