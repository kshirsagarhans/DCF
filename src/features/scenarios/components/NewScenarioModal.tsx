import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { useAppStore } from '../../../store';
import { DCFScenario, SupportedCurrency, DCFParameters } from '../../../types/dcf';
import { marketDataService } from '../../../services/marketData';
import { useToast } from '../../../shared/components/Toast';
import { Loader2, Search, CheckCircle, XCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES: SupportedCurrency[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CHF', 'AUD', 'CAD', 'SGD'];

export const NewScenarioModal: React.FC<NewScenarioModalProps> = ({ isOpen, onClose }) => {
  const { addScenario, user } = useAppStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tickerFetched, setTickerFetched] = useState<boolean | null>(null); // null=not tried, true=ok, false=failed

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string; currency: string; stockExchange: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Form state
  const [label, setLabel] = useState('Base Scenario');
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('');
  const [sector, setSector] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [historicalCutoffYear, setHistoricalCutoffYear] = useState(new Date().getFullYear() - 1);
  const [forecastYearsCount, setForecastYearsCount] = useState(5);
  const [wacc, setWacc] = useState(10.0);
  const [growthRate, setGrowthRate] = useState(2.0);
  const [taxRate, setTaxRate] = useState(21.0);
  const [prefilledEbitda, setPrefilledEbitda] = useState<Record<number, number>>({});
  const [prefilledDa, setPrefilledDa] = useState<Record<number, number>>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live search as user types
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setTickerFetched(null);
    clearTimeout(searchTimer.current);
    if (value.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await marketDataService.searchTicker(value);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  // Select a ticker from dropdown
  const handleSelectTicker = async (sym: string, name: string, cur: string) => {
    setShowDropdown(false);
    setSearchQuery(sym);
    setTicker(sym);
    setCompanyName(name);
    if (CURRENCIES.includes(cur as SupportedCurrency)) setCurrency(cur as SupportedCurrency);

    setLoading(true);
    setTickerFetched(null);
    try {
      // Fetch key metrics for WACC estimate
      const metrics = await marketDataService.getKeyMetrics(sym);
      const estimatedWacc = 5.0 + (metrics.beta * 5.5);
      setWacc(Number(Math.min(Math.max(estimatedWacc, 5), 30).toFixed(1)));

      // Fetch income statement for historical EBITDA / D&A
      const statements = await marketDataService.getIncomeStatement(sym, 3);
      if (statements.length > 0) {
        const ebitdaData: Record<number, number> = {};
        const daData: Record<number, number> = {};
        statements.forEach(stmt => {
          const year = parseInt(stmt.calendarYear);
          if (!isNaN(year)) {
            ebitdaData[year] = Math.round(stmt.ebitda / 1e6); // store in millions
            daData[year] = Math.round(stmt.depreciationAndAmortization / 1e6);
          }
        });
        setPrefilledEbitda(ebitdaData);
        setPrefilledDa(daData);
        // Auto-set cutoff year to the most recent year in data
        const years = Object.keys(ebitdaData).map(Number).sort((a, b) => b - a);
        if (years.length > 0) setHistoricalCutoffYear(years[0]);
        showToast(`✓ Loaded ${statements.length} years of data for ${sym}`, 'success');
      } else {
        showToast(`Profile loaded for ${sym}. No income data available — enter manually.`, 'info');
      }
      setTickerFetched(true);
    } catch (err: any) {
      showToast(`Could not load full data for ${sym}. You can fill in manually.`, 'warning');
      setTickerFetched(false);
    } finally {
      setLoading(false);
    }
  };

  // Manual ticker lookup button
  const handleManualLookup = async () => {
    if (!searchQuery) return;
    await handleSelectTicker(searchQuery.toUpperCase(), companyName || searchQuery.toUpperCase(), currency);
  };

  const resetModal = () => {
    setStep(1); setLabel('Base Scenario'); setCompanyName(''); setTicker('');
    setSector(''); setCurrency('USD'); setHistoricalCutoffYear(new Date().getFullYear() - 1);
    setForecastYearsCount(5); setWacc(10); setGrowthRate(2); setTaxRate(21);
    setPrefilledEbitda({}); setPrefilledDa({}); setSearchQuery(''); setTickerFetched(null);
  };

  const handleClose = () => { resetModal(); onClose(); };

  const handleCreate = () => {
    if (!companyName) {
      showToast('Company name is required', 'error');
      return;
    }
    const startYear = historicalCutoffYear - 2;
    const forecastYears: number[] = [];
    for (let i = startYear; i <= historicalCutoffYear + forecastYearsCount; i++) {
      forecastYears.push(i);
    }
    const parameters: DCFParameters = {
      discountRate: wacc,
      perpetuityRate: growthRate,
      corporateTaxRate: taxRate,
    };
    const newScenario: DCFScenario = {
      id: crypto.randomUUID(),
      userId: user?.id || 'local',
      label,
      companyName,
      ticker,
      sector,
      currency,
      baseCurrency: currency,
      forecastYears,
      historicalCutoffYear,
      ebitdaData: prefilledEbitda,
      daData: prefilledDa,
      capexData: {},
      nwcData: {},
      parameters,
      useIncomeStatement: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    addScenario(newScenario);
    showToast('Scenario created!', 'success');
    handleClose();
    navigate(`/scenario/${newScenario.id}/dcf`);
  };

  const inputClass = 'w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Scenario" width="md">
      {/* Step indicators */}
      <div className="flex mb-6 text-label text-[var(--text-tertiary)] gap-2">
        {['Company Info', 'Timeline', 'Assumptions'].map((label, i) => (
          <div key={i} className={`flex-1 border-b-2 pb-2 text-center transition-colors ${step >= i + 1 ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-strong)]'}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="min-h-[280px]">
        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Live ticker search */}
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">
                Search Ticker / Company Name
              </label>
              <div ref={searchRef} className="relative">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      value={searchQuery}
                      onChange={e => handleSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
                      className={`${inputClass} pr-10 uppercase`}
                      placeholder="AAPL, MSFT, RELIANCE..."
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                      {searchLoading
                        ? <Loader2 size={16} className="animate-spin" />
                        : tickerFetched === true
                          ? <CheckCircle size={16} className="text-[var(--positive)]" />
                          : tickerFetched === false
                            ? <XCircle size={16} className="text-[var(--negative)]" />
                            : <Search size={16} />
                      }
                    </div>
                  </div>
                  <button
                    onClick={handleManualLookup}
                    disabled={!searchQuery || loading}
                    className="bg-[var(--accent-primary)] text-[var(--bg-base)] h-[42px] px-4 rounded font-medium text-sm disabled:opacity-50 hover:bg-opacity-90 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Fetch'}
                  </button>
                </div>

                {/* Autocomplete dropdown */}
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-xl overflow-hidden">
                    {searchResults.map(r => (
                      <button
                        key={r.symbol}
                        onClick={() => handleSelectTicker(r.symbol, r.name, r.currency)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-surface-2)] transition-colors text-left"
                      >
                        <div>
                          <span className="font-medium text-[var(--accent-primary)] text-sm font-mono">{r.symbol}</span>
                          <span className="text-[var(--text-secondary)] text-sm ml-2 truncate">{r.name}</span>
                        </div>
                        <span className="text-[var(--text-tertiary)] text-xs ml-2 shrink-0">{r.stockExchange} · {r.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {tickerFetched === false && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--accent-coral)] mt-1">
                  <Info size={12} /> Could not fetch live data. Fill in the fields below manually.
                </p>
              )}
              {tickerFetched === true && Object.keys(prefilledEbitda).length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--positive)] mt-1">
                  <CheckCircle size={12} /> Historical EBITDA & D&A prefilled from FMP ({Object.keys(prefilledEbitda).join(', ')}).
                </p>
              )}
            </div>

            {/* Company Name (required) */}
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Company Name <span className="text-[var(--accent-coral)]">*</span></label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className={inputClass}
                placeholder="Apple Inc."
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Sector</label>
                <input
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className={inputClass}
                  placeholder="Technology"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                  className={inputClass}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Scenario Label</label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                className={inputClass}
                placeholder="Base Case"
              />
            </div>
          </div>
        )}

        {/* Step 2: Timeline */}
        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Last Historical Year (Actuals Cutoff)</label>
              <input
                type="number"
                value={historicalCutoffYear}
                onChange={e => setHistoricalCutoffYear(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-label text-[var(--text-tertiary)] mt-1">Years after this will be projected.</p>
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Number of Forecast Years</label>
              <select
                value={forecastYearsCount}
                onChange={e => setForecastYearsCount(Number(e.target.value))}
                className={inputClass}
              >
                <option value={3}>3 Years</option>
                <option value={5}>5 Years (Standard)</option>
                <option value={7}>7 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>
            {Object.keys(prefilledEbitda).length > 0 && (
              <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-3">
                <p className="text-label font-semibold text-[var(--text-secondary)] mb-2">Prefilled Historical Data (M)</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(prefilledEbitda).sort(([a], [b]) => Number(a) - Number(b)).map(([year, val]) => (
                    <div key={year} className="text-center">
                      <p className="text-[10px] text-[var(--text-tertiary)]">{year}</p>
                      <p className="text-sm font-medium text-[var(--accent-primary)] data-number">{val.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: DCF Assumptions */}
        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">WACC / Discount Rate %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={wacc}
                onChange={e => setWacc(Number(e.target.value))}
                className={inputClass}
              />
              {ticker && <p className="text-label text-[var(--accent-secondary)] mt-1">Auto-estimated from company Beta via CAPM.</p>}
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Terminal Growth Rate %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={growthRate}
                onChange={e => setGrowthRate(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Corporate Tax Rate %</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="60"
                value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-lg p-3 flex gap-4 text-center">
              <div className="flex-1">
                <p className="text-label text-[var(--text-tertiary)]">Company</p>
                <p className="font-medium text-[var(--text-primary)]">{companyName}</p>
              </div>
              <div className="flex-1">
                <p className="text-label text-[var(--text-tertiary)]">Currency</p>
                <p className="font-medium text-[var(--text-primary)]">{currency}</p>
              </div>
              <div className="flex-1">
                <p className="text-label text-[var(--text-tertiary)]">Horizon</p>
                <p className="font-medium text-[var(--text-primary)]">{forecastYearsCount}Y</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 border-t border-[var(--border-subtle)] pt-4">
        <button
          onClick={step === 1 ? handleClose : () => setStep(step - 1)}
          className="px-4 py-2 text-body-secondary text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>
        <button
          onClick={step === 3 ? handleCreate : () => setStep(step + 1)}
          disabled={(step === 1 && !companyName) || loading}
          className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] text-body-secondary font-semibold rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {step === 3 ? 'Create Scenario' : 'Next →'}
        </button>
      </div>
    </Modal>
  );
};
