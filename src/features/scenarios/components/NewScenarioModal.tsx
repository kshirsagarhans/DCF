import React, { useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { useAppStore } from '../../../store';
import { DCFScenario, SupportedCurrency, DCFParameters } from '../../../types/dcf';
import { marketDataService } from '../../../services/marketData';
import { useToast } from '../../../shared/components/Toast';
import { Loader2, Search } from 'lucide-react';
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

  // Form State
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

  const [prefilledEbitda, setPrefilledEbitda] = useState<any>({});
  const [prefilledDa, setPrefilledDa] = useState<any>({});

  const handleTickerSearch = async () => {
    if (!ticker) return;
    setLoading(true);
    try {
      const profile = await marketDataService.getProfile(ticker);
      setCompanyName(profile.companyName);
      setSector(profile.sector);
      if (CURRENCIES.includes(profile.currency as SupportedCurrency)) {
        setCurrency(profile.currency as SupportedCurrency);
      }
      
      const metrics = await marketDataService.getKeyMetrics(ticker);
      // Rough WACC estimate: Risk Free (5%) + Beta * ERP (5.5%)
      const estimatedWacc = 5.0 + (metrics.beta * 5.5);
      setWacc(Number(estimatedWacc.toFixed(1)));
      
      const statements = await marketDataService.getIncomeStatement(ticker, 3);
      const ebitdaData: any = {};
      const daData: any = {};
      statements.forEach(stmt => {
        const year = parseInt(stmt.calendarYear);
        ebitdaData[year] = stmt.ebitda;
        daData[year] = stmt.depreciationAndAmortization;
      });
      setPrefilledEbitda(ebitdaData);
      setPrefilledDa(daData);

      showToast(`Data populated from FMP for ${ticker}`, 'success');
    } catch (error) {
      showToast('Could not fetch data. You can proceed manually.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!companyName) {
      showToast('Company name is required', 'error');
      return;
    }

    const startYear = historicalCutoffYear - 2; // Keep 3 years of history if available
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
    showToast('Scenario created successfully', 'success');
    onClose();
    navigate(`/scenario/${newScenario.id}/dcf`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Scenario" width="md">
      <div className="flex mb-6 text-label text-[var(--text-tertiary)] gap-2">
        <div className={`flex-1 border-b-2 pb-2 ${step >= 1 ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-strong)]'}`}>1. Company Info</div>
        <div className={`flex-1 border-b-2 pb-2 ${step >= 2 ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-strong)]'}`}>2. Timeline</div>
        <div className={`flex-1 border-b-2 pb-2 ${step >= 3 ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-[var(--border-strong)]'}`}>3. Assumptions</div>
      </div>

      <div className="min-h-[250px]">
        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Ticker (Optional)</label>
                <input 
                  value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors uppercase"
                  placeholder="AAPL"
                />
              </div>
              <button 
                onClick={handleTickerSearch}
                disabled={!ticker || loading}
                className="bg-[var(--bg-surface-3)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] p-2 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors h-[42px] w-[42px] flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Company Name *</label>
              <input 
                value={companyName} onChange={e => setCompanyName(e.target.value)} required
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Sector</label>
                <input 
                  value={sector} onChange={e => setSector(e.target.value)}
                  className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-label text-[var(--text-secondary)] mb-1">Currency</label>
                <select 
                  value={currency} onChange={e => setCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Scenario Label</label>
              <input 
                value={label} onChange={e => setLabel(e.target.value)}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Last Historical Year (Actuals Cutoff)</label>
              <input 
                type="number" value={historicalCutoffYear} onChange={e => setHistoricalCutoffYear(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
              <p className="text-label text-[var(--text-tertiary)] mt-1">Years after this will be projected.</p>
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Number of Forecast Years</label>
              <select 
                value={forecastYearsCount} onChange={e => setForecastYearsCount(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value={3}>3 Years</option>
                <option value={5}>5 Years (Standard)</option>
                <option value={7}>7 Years</option>
                <option value={10}>10 Years</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">WACC (Discount Rate) %</label>
              <input 
                type="number" step="0.1" value={wacc} onChange={e => setWacc(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
              {ticker && <p className="text-label text-[var(--accent-secondary)] mt-1">Suggested based on API Beta.</p>}
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Terminal Growth Rate %</label>
              <input 
                type="number" step="0.1" value={growthRate} onChange={e => setGrowthRate(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-label text-[var(--text-secondary)] mb-1">Corporate Tax Rate %</label>
              <input 
                type="number" step="0.5" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
                className="w-full bg-[var(--bg-surface-3)] text-[var(--text-primary)] border border-[var(--border-default)] rounded px-3 py-2 outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 border-t border-[var(--border-subtle)] pt-4">
        <button 
          onClick={step === 1 ? onClose : () => setStep(step - 1)}
          className="px-4 py-2 text-body-secondary text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button 
          onClick={step === 3 ? handleCreate : () => setStep(step + 1)}
          disabled={step === 1 && !companyName}
          className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] text-body-secondary font-medium rounded hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          {step === 3 ? 'Create Scenario' : 'Next'}
        </button>
      </div>
    </Modal>
  );
};
