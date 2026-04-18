import { MarketDataProfile, MarketDataQuote, MarketDataKeyMetrics, MarketDataIncomeStatement } from '../types/market';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// ─── Exchange config ────────────────────────────────────────────────────────
export type Exchange = 'AUTO' | 'NSE' | 'BSE' | 'NASDAQ' | 'NYSE' | 'LSE' | 'OTHER';

export const EXCHANGE_META: Record<Exchange, { label: string; suffix: string; currency: string; flag: string }> = {
  AUTO:   { label: 'Auto Detect',        suffix: '',    currency: 'USD', flag: '🌐' },
  NSE:    { label: 'NSE (India)',         suffix: '.NS', currency: 'INR', flag: '🇮🇳' },
  BSE:    { label: 'BSE (India)',         suffix: '.BO', currency: 'INR', flag: '🇮🇳' },
  NASDAQ: { label: 'NASDAQ (US)',         suffix: '',    currency: 'USD', flag: '🇺🇸' },
  NYSE:   { label: 'NYSE (US)',           suffix: '',    currency: 'USD', flag: '🇺🇸' },
  LSE:    { label: 'London Stock Exch.', suffix: '.L',  currency: 'GBP', flag: '🇬🇧' },
  OTHER:  { label: 'Other',              suffix: '',    currency: 'USD', flag: '🌐' },
};

// Popular Indian NSE stocks for quick-select
export const POPULAR_INDIAN_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
  { symbol: 'TCS.NS',      name: 'Tata Consultancy Services', sector: 'IT' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
  { symbol: 'INFY.NS',     name: 'Infosys', sector: 'IT' },
  { symbol: 'ICICIBANK.NS',name: 'ICICI Bank', sector: 'Banking' },
  { symbol: 'HINDUNILVR.NS',name: 'Hindustan Unilever', sector: 'FMCG' },
  { symbol: 'ITC.NS',      name: 'ITC Ltd', sector: 'FMCG' },
  { symbol: 'SBIN.NS',     name: 'State Bank of India', sector: 'Banking' },
  { symbol: 'BAJFINANCE.NS',name: 'Bajaj Finance', sector: 'NBFC' },
  { symbol: 'BHARTIARTL.NS',name: 'Bharti Airtel', sector: 'Telecom' },
  { symbol: 'WIPRO.NS',    name: 'Wipro', sector: 'IT' },
  { symbol: 'MARUTI.NS',   name: 'Maruti Suzuki', sector: 'Auto' },
  { symbol: 'TATAMOTORS.NS',name: 'Tata Motors', sector: 'Auto' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
  { symbol: 'SUNPHARMA.NS',name: 'Sun Pharma', sector: 'Pharma' },
];

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
async function fetchFMP<T>(endpoint: string): Promise<T> {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${sep}apikey=${FMP_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data && typeof data === 'object' && !Array.isArray(data) && data['Error Message']) {
    throw new Error(data['Error Message']);
  }
  return data;
}

// ─── Smart ticker normalizer ──────────────────────────────────────────────────
/** Append exchange suffix if not already present */
export function normalizeTicker(ticker: string, exchange: Exchange): string {
  const raw = ticker.trim().toUpperCase();
  const suffix = EXCHANGE_META[exchange].suffix;
  if (!suffix || raw.includes('.')) return raw; // already has suffix or AUTO
  return `${raw}${suffix}`;
}

/** Detect if a ticker is Indian from its suffix */
export function isIndianTicker(ticker: string): boolean {
  return ticker.endsWith('.NS') || ticker.endsWith('.BO');
}

// ─── Market data service ──────────────────────────────────────────────────────
export const marketDataService = {

  async getQuote(ticker: string): Promise<MarketDataQuote> {
    const data = await fetchFMP<any[]>(`/quote/${ticker}`);
    if (!data || data.length === 0) throw new Error(`Quote not found for ${ticker}`);
    return {
      symbol: data[0].symbol,
      price: data[0].price,
      marketCap: data[0].marketCap,
      sharesOutstanding: data[0].sharesOutstanding
    };
  },

  async getProfile(ticker: string): Promise<MarketDataProfile> {
    const data = await fetchFMP<any[]>(`/profile/${ticker}`);
    if (!data || data.length === 0) throw new Error(`Company not found for ticker: ${ticker}`);
    return {
      symbol: data[0].symbol,
      companyName: data[0].companyName || ticker,
      currency: data[0].currency || (isIndianTicker(ticker) ? 'INR' : 'USD'),
      sector: data[0].sector || '',
      industry: data[0].industry || '',
      description: data[0].description || '',
      mktCap: data[0].mktCap || 0,
    };
  },

  async getKeyMetrics(ticker: string): Promise<MarketDataKeyMetrics> {
    const profile = await fetchFMP<any[]>(`/profile/${ticker}`);
    const beta = (profile?.[0]?.beta) ?? 1.0;

    let evToEbitda = 0, peRatio = 0, evToSales = 0, revenueGrowth = 0, ebitdaMargin = 0;
    try {
      const metrics = await fetchFMP<any[]>(`/key-metrics-ttm/${ticker}`);
      if (metrics?.[0]) {
        evToEbitda   = metrics[0].enterpriseValueOverEBITDATTM ?? 0;
        peRatio      = metrics[0].peRatioTTM ?? 0;
        evToSales    = metrics[0].evToSalesTTM ?? 0;
        revenueGrowth = metrics[0].revenueGrowthTTM ?? 0;
        ebitdaMargin = metrics[0].ebitdaOverRevenueTTM ?? 0;
      }
    } catch { /* non-fatal */ }

    return { symbol: ticker, beta, evToEbitda, peRatio, evToSales, revenueGrowth, ebitdaMargin };
  },

  async getIncomeStatement(ticker: string, limit = 4): Promise<MarketDataIncomeStatement[]> {
    const data = await fetchFMP<any[]>(`/income-statement/${ticker}?limit=${limit}`);
    if (!data || data.length === 0) return [];
    return data
      .map(item => ({
        date:   item.date || '',
        symbol: item.symbol || ticker,
        revenue: item.revenue ?? 0,
        ebitda:  item.ebitda  ?? 0,
        depreciationAndAmortization: item.depreciationAndAmortization ?? 0,
        calendarYear: item.calendarYear || String(new Date(item.date).getFullYear()),
      }))
      .sort((a, b) => Number(a.calendarYear) - Number(b.calendarYear));
  },

  /**
   * Search by query and optionally filter by exchange.
   * For Indian exchanges pass exchange='NSE' or 'BSE'.
   */
  async searchTicker(
    query: string,
    exchange: Exchange = 'AUTO'
  ): Promise<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }[]> {
    let endpoint = `/search?query=${encodeURIComponent(query)}&limit=10`;
    if (exchange === 'NSE') endpoint += '&exchange=NSE';
    else if (exchange === 'BSE') endpoint += '&exchange=BSE';

    const data = await fetchFMP<any[]>(endpoint);
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      symbol: item.symbol || '',
      name:   item.name || '',
      currency: item.currency || 'USD',
      stockExchange:     item.stockExchange || '',
      exchangeShortName: item.exchangeShortName || '',
    }));
  },
};
