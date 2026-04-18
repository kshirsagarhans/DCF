import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { useAppStore } from '../../../store';
import { DCFScenario, SupportedCurrency, DCFParameters } from '../../../types/dcf';
import {
  marketDataService,
  Exchange,
  EXCHANGE_META,
  POPULAR_INDIAN_STOCKS,
  normalizeTicker,
  isIndianTicker,
} from '../../../services/marketData';
import { useToast } from '../../../shared/components/Toast';
import { Loader2, Search, CheckCircle, XCircle, Info, TrendingUp, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES: SupportedCurrency[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CHF', 'AUD', 'CAD', 'SGD'];
const EXCHANGES: Exchange[] = ['AUTO', 'NSE', 'BSE', 'NASDAQ', 'NYSE', 'LSE'];

export const NewScenarioModal: React.FC<NewScenarioModalProps> = ({ isOpen, onClose }) => {
  const { addScenario, user } = useAppStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tickerStatus, setTickerStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  // Exchange & search
  const [exchange, setExchange] = useState<Exchange>('AUTO');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showIndianQuicks, setShowIndianQuicks] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Form
  const [label, setLabel] = useState('Base Scenario');
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('');
  const [sector, setSector] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [historicalCutoffYear, setHistoricalCutoffYear] = useState(new Date().getFullYear() - 1);
  const [forecastYearsCount, setForecastYearsCount] = useState(5);
  const [wacc, setWacc] = useState(10.0);
  const [growthRate, setGrowthRate] = useState(2.0);
  const [taxRate, setTaxRate] = useState(25.17); // India default: 22% base + surcharge
  const [prefilledEbitda, setPrefilledEbitda] = useState<Record<number, number>>({});
  const [prefilledDa, setPrefilledDa] = useState<Record<number, number>>({});

  // When exchange changes, update currency & tax defaults
  useEffect(() => {
    const isIndian = exchange === 'NSE' || exchange === 'BSE';
    if (isIndian) {
      setCurrency('INR');
      setTaxRate(25.17); // India effective corporate tax
      setGrowthRate(7.0); // higher perpetuity rate for India
      setWacc(12.0);      // higher WACC for India
    } else if (exchange === 'LSE') {
      setCurrency('GBP');
      setTaxRate(25.0);
    } else if (exchange === 'NASDAQ' || exchange === 'NYSE') {
      setCurrency('USD');
      setTaxRate(21.0);
    }
  }, [exchange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowIndianQuicks(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search with debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setTickerStatus('idle');
    clearTimeout(searchTimer.current);
    if (value.length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await marketDataService.searchTicker(value, exchange);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]); setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  // Fetch full data for a chosen ticker
  const fetchTickerData = async (sym: string, name: string, cur: string) => {
    setShowDropdown(false);
    setShowIndianQuicks(false);
    setSearchQuery(sym);
    setTicker(sym);
    setCompanyName(name);
    if (CURRENCIES.includes(cur as SupportedCurrency)) setCurrency(cur as SupportedCurrency);
    setLoading(true);
    setTickerStatus('idle');
    try {
      const [metrics, statements] = await Promise.allSettled([
        marketDataService.getKeyMetrics(sym),
        marketDataService.getIncomeStatement(sym, 4),
      ]);

      if (metrics.status === 'fulfilled') {
        const isINR = isIndianTicker(sym);
        // For Indian stocks, use higher risk premium (7% ERP) instead of US (5.5%)
        const erp = isINR ? 7.0 : 5.5;
        const rfr = isINR ? 7.0 : 4.5; // India 10y Gsec vs US T-bill
        const estimated = rfr + metrics.value.beta * erp;
        setWacc(Number(Math.min(Math.max(estimated, 5), 35).toFixed(1)));
      }

      if (statements.status === 'fulfilled' && statements.value.length > 0) {
        const ebitdaMap: Record<number, number> = {};
        const daMap: Record<number, number> = {};
        const isINR = isIndianTicker(sym);

        statements.value.forEach(stmt => {
          const year = parseInt(stmt.calendarYear);
          if (!isNaN(year)) {
            // FMP reports in absolute values; divide by 1e7 for Crores (INR), 1e6 for USD millions
            const divisor = isINR ? 1e7 : 1e6;
            ebitdaMap[year] = parseFloat((stmt.ebitda / divisor).toFixed(2));
            daMap[year]     = parseFloat((stmt.depreciationAndAmortization / divisor).toFixed(2));
          }
        });
        setPrefilledEbitda(ebitdaMap);
        setPrefilledDa(daMap);

        const years = Object.keys(ebitdaMap).map(Number).sort((a, b) => b - a);
        if (years.length > 0) setHistoricalCutoffYear(years[0]);

        const unit = isIndianTicker(sym) ? 'Crores (₹)' : 'Millions ($)';
        showToast(`✓ Loaded ${statements.value.length} years of data (${unit})`, 'success');
      } else {
        showToast(`Profile loaded for ${sym}. No income data on free tier — enter manually.`, 'info');
      }
      setTickerStatus('ok');
    } catch (err: any) {
      showToast(`Partial data for ${sym}. Fill in remaining fields manually.`, 'warning');
      setTickerStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Handle dropdown or quick-pick selection
  const handleSelect = (sym: string, name: string, cur: string) =>
    fetchTickerData(sym, name, cur);

  // Manual fetch from the input
  const handleManualFetch = () => {
    if (!searchQuery) return;
    const fullSym = normalizeTicker(searchQuery, exchange);
    const cur = EXCHANGE_META[exchange].currency || 'USD';
    fetchTickerData(fullSym, companyName || fullSym, cur);
  };

  const reset = () => {
    setStep(1); setLabel('Base Scenario'); setCompanyName(''); setTicker('');
    setSector(''); setCurrency('USD'); setExchange('AUTO');
    setHistoricalCutoffYear(new Date().getFullYear() - 1); setForecastYearsCount(5);
    setWacc(10); setGrowthRate(2); setTaxRate(21);
    setPrefilledEbitda({}); setPrefilledDa({}); setSearchQuery('');
    setTickerStatus('idle'); setSearchResults([]); setShowDropdown(false);
    setShowIndianQuicks(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = () => {
    if (!companyName) { showToast('Company name is required', 'error'); return; }
    const startYear = historicalCutoffYear - 2;
    const forecastYears: number[] = [];
    for (let i = startYear; i <= historicalCutoffYear + forecastYearsCount; i++) forecastYears.push(i);

    const parameters: DCFParameters = {
      discountRate: wacc,
      perpetuityRate: growthRate,
      corporateTaxRate: taxRate,
    };
    const newScenario: DCFScenario = {
      id: crypto.randomUUID(),
      userId: user?.id || 'local',
      label, companyName, ticker, sector, currency,
      baseCurrency: currency,
      forecastYears, historicalCutoffYear,
      ebitdaData: prefilledEbitda,
      daData: prefilledDa,
      capexData: {}, nwcData: {},
      parameters,
      useIncomeStatement: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    addScenario(newScenario);
    showToast('Scenario created!', 'success');
    handleClose();
    navigate(`/scenario/${newScenario.id}/dcf`);
  };

  const isINRExchange = exchange === 'NSE' || exchange === 'BSE';
  const inputClass = 'w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Scenario" width="md">
      {/* Step progress */}
      <div className="flex mb-6 gap-2 text-label text-[var(--text-tertiary)]">
        {['Company Info', 'Timeline', 'Assumptions'].map((lbl, i) => (
          <div key={i} className={`flex-1 border-b-2 pb-2 text-center transition-colors ${step >= i + 1 ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-strong)]'}`}>
            {i + 1}. {lbl}
          </div>
        ))}
      </div>

      <div className="min-h-[320px]">
        {/* ── Step 1: Company Info ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">

            {/* Exchange selector */}
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1.5">Exchange / Market</label>
              <div className="flex flex-wrap gap-1.5">
                {EXCHANGES.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setExchange(ex)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all border ${
                      exchange === ex
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] border-[var(--accent-primary)]'
                        : 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    {EXCHANGE_META[ex].flag} {ex}
                  </button>
                ))}
              </div>
              {isINRExchange && (
                <p className="text-xs text-[var(--accent-primary)] mt-1.5 flex items-center gap-1">
                  <TrendingUp size={12} />
                  Indian market defaults: WACC ~12%, Growth ~7%, Tax ~25.2%, Currency INR
                </p>
              )}
            </div>

            {/* Ticker search */}
            <div ref={searchRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-label text-[var(--text-secondary)]">
                  {isINRExchange ? 'NSE / BSE Ticker' : 'Ticker Symbol'} (Optional)
                </label>
                {isINRExchange && (
                  <button
                    onClick={() => setShowIndianQuicks(!showIndianQuicks)}
                    className="text-xs text-[var(--accent-primary)] flex items-center gap-1 hover:underline"
                  >
                    <Star size={11} /> Popular Indian Stocks
                  </button>
                )}
              </div>

              {/* Popular Indian stocks quick-pick */}
              {showIndianQuicks && (
                <div className="mb-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden shadow-xl max-h-52 overflow-y-auto custom-scrollbar">
                  <div className="px-3 py-1.5 bg-[var(--bg-surface-2)] text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    🇮🇳 Nifty 50 Stocks
                  </div>
                  {POPULAR_INDIAN_STOCKS.map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelect(s.symbol, s.name, 'INR')}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                    >
                      <div>
                        <span className="font-mono font-medium text-[var(--accent-primary)] text-sm">{s.symbol.replace('.NS', '')}</span>
                        <span className="text-[var(--text-secondary)] text-sm ml-2">{s.name}</span>
                      </div>
                      <span className="text-[var(--text-tertiary)] text-xs shrink-0 ml-2 bg-[var(--bg-surface-3)] px-1.5 py-0.5 rounded">
                        {s.sector}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={searchQuery}
                      onChange={e => handleSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualFetch()}
                      className={`${inputClass} pr-10 font-mono`}
                      placeholder={isINRExchange ? 'RELIANCE, TCS, HDFCBANK...' : 'AAPL, MSFT, TSLA...'}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                      {searchLoading
                        ? <Loader2 size={15} className="animate-spin" />
                        : tickerStatus === 'ok'
                          ? <CheckCircle size={15} className="text-[var(--positive)]" />
                          : tickerStatus === 'error'
                            ? <XCircle size={15} className="text-[var(--negative)]" />
                            : <Search size={15} />}
                    </div>
                  </div>
                  <button
                    onClick={handleManualFetch}
                    disabled={!searchQuery || loading}
                    className="bg-[var(--accent-primary)] text-[var(--bg-base)] px-4 h-[38px] rounded font-medium text-sm disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center gap-1.5"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
                  </button>
                </div>

                {/* Autocomplete dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-2xl overflow-hidden">
                    {searchResults.map(r => (
                      <button
                        key={r.symbol}
                        onClick={() => handleSelect(r.symbol, r.name, r.currency)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors text-left border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono font-semibold text-[var(--accent-primary)] text-sm">{r.symbol}</span>
                          <span className="text-[var(--text-secondary)] text-sm ml-2 truncate">{r.name}</span>
                        </div>
                        <span className="text-[var(--text-tertiary)] text-xs shrink-0 ml-2">
                          {r.exchangeShortName || r.stockExchange} · {r.currency}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status messages */}
              {tickerStatus === 'error' && (
                <p className="flex items-center gap-1 text-xs text-[var(--accent-coral)] mt-1">
                  <Info size={11} /> Could not fetch live data. Fill in fields manually below.
                </p>
              )}
              {tickerStatus === 'ok' && Object.keys(prefilledEbitda).length > 0 && (
                <p className="flex items-center gap-1 text-xs text-[var(--positive)] mt-1">
                  <CheckCircle size={11} />
                  {isINRExchange ? 'EBITDA prefilled in ₹ Crores' : 'EBITDA prefilled in $ Millions'} — years: {Object.keys(prefilledEbitda).sort().join(', ')}
                </p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Company Name <span className="text-[var(--accent-coral)]">*</span></label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className={inputClass}
                placeholder={isINRExchange ? 'Reliance Industries Ltd.' : 'Apple Inc.'}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Sector</label>
                <input value={sector} onChange={e => setSector(e.target.value)} className={inputClass} placeholder={isINRExchange ? 'Energy / IT / Banking...' : 'Technology'} />
              </div>
              <div>
                <label className="block text-label text-[var(--text-secondary)] mb-1">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as SupportedCurrency)} className={inputClass}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Scenario Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} className={inputClass} placeholder="Base Case" />
            </div>
          </div>
        )}

        {/* ── Step 2: Timeline ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Last Historical Year (Actuals Cutoff)</label>
              <input type="number" value={historicalCutoffYear} onChange={e => setHistoricalCutoffYear(Number(e.target.value))} className={inputClass} />
              <p className="text-label text-[var(--text-tertiary)] mt-1">Years after this will be forecasted.</p>
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Number of Forecast Years</label>
              <select value={forecastYearsCount} onChange={e => setForecastYearsCount(Number(e.target.value))} className={inputClass}>
                <option value={3}>3 Years</option>
                <option value={5}>5 Years (Standard)</option>
                <option value={7}>7 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>

            {Object.keys(prefilledEbitda).length > 0 && (
              <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-4">
                <p className="text-label font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-[var(--positive)]" />
                  Prefilled EBITDA — {isINRExchange ? '₹ Crores' : '$ Millions'}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(prefilledEbitda).sort(([a], [b]) => Number(a) - Number(b)).map(([year, val]) => (
                    <div key={year} className="text-center bg-[var(--bg-surface-3)] rounded p-2">
                      <p className="text-[10px] text-[var(--text-tertiary)]">{year}</p>
                      <p className="text-sm font-semibold text-[var(--accent-primary)] data-number">{val.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: DCF Assumptions ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {isINRExchange && (
              <div className="bg-[var(--accent-primary)] bg-opacity-10 border border-[var(--accent-primary)] border-opacity-30 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp size={15} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div className="text-xs text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Indian market defaults applied:</strong> Higher WACC (risk premium + India country risk), 
                  higher terminal growth (GDP growth proxy ~7%), and effective corporate tax rate of 25.17%.
                </div>
              </div>
            )}
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">WACC / Discount Rate %</label>
              <input type="number" step="0.1" min="1" max="60" value={wacc} onChange={e => setWacc(Number(e.target.value))} className={inputClass} />
              {ticker && <p className="text-xs text-[var(--accent-secondary)] mt-1">Auto-estimated via CAPM: RFR + Beta × ERP</p>}
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Terminal Growth Rate %</label>
              <input type="number" step="0.1" min="0" max="20" value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Corporate Tax Rate %</label>
              <input type="number" step="0.5" min="0" max="60" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className={inputClass} />
              {isINRExchange && <p className="text-xs text-[var(--text-tertiary)] mt-1">India base rate 22% + surcharge ≈ 25.17%</p>}
            </div>
            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-3 grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Company', value: companyName },
                { label: 'Exchange', value: isINRExchange ? (exchange === 'NSE' ? 'NSE 🇮🇳' : 'BSE 🇮🇳') : exchange },
                { label: 'Currency', value: currency },
                { label: 'Horizon', value: `${forecastYearsCount}Y` },
              ].map(({ label: lbl, value }) => (
                <div key={lbl}>
                  <p className="text-label text-[var(--text-tertiary)]">{lbl}</p>
                  <p className="font-medium text-[var(--text-primary)] text-sm truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex justify-between mt-8 border-t border-[var(--border-subtle)] pt-4">
        <button
          onClick={step === 1 ? handleClose : () => setStep(step - 1)}
          className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        <button
          onClick={step === 3 ? handleCreate : () => setStep(step + 1)}
          disabled={(step === 1 && !companyName) || loading}
          className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] text-sm font-semibold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {step === 3 ? 'Create Scenario →' : 'Next →'}
        </button>
      </div>
    </Modal>
  );
};
