import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../../store';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../../../shared/utils/format';
import { calculateDCF } from '../../dcf/lib/fcf';
import { MoreVertical, Copy, Trash2, Share2, Plus, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { useToast } from '../../../shared/components/Toast';
import { NewScenarioModal } from './NewScenarioModal';

export const ScenarioList: React.FC = () => {
  const { scenarios, deleteScenario, cloneScenario, setActiveScenario } = useAppStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [sortParam, setSortParam] = useState<'recent' | 'alpha' | 'ev'>('recent');

  const handleCardClick = (id: string) => {
    setActiveScenario(id);
    navigate(`/scenario/${id}/dcf`);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteScenario(id);
      showToast('Scenario deleted', 'info');
    }
  };

  const handleClone = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    cloneScenario(id);
    showToast('Scenario cloned', 'success');
  };

  const sortedScenarios = useMemo(() => {
    const withEv = scenarios.map(s => {
      let ev = 0;
      try {
        const projected = s.forecastYears.filter(y => y > s.historicalCutoffYear);
        // Only calculate if we have at least one year and valid params
        if (projected.length >= 3 && s.parameters.discountRate > s.parameters.perpetuityRate) {
          ev = calculateDCF(s).enterpriseValue;
        }
      } catch (err) {}
      return { ...s, ev };
    });

    return withEv.sort((a, b) => {
      if (sortParam === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortParam === 'alpha') {
        return a.companyName.localeCompare(b.companyName);
      } else {
        return b.ev - a.ev;
      }
    });
  }, [scenarios, sortParam]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-section-header font-display tracking-tight text-[var(--text-primary)]">Scenarios</h1>
          <p className="text-body-secondary text-[var(--text-secondary)]">Manage and compare your valuation models</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[var(--bg-surface-2)] p-1 rounded-md border border-[var(--border-subtle)]">
            <button 
              onClick={() => setSortParam('recent')}
              className={`px-3 py-1 text-label font-medium rounded ${sortParam === 'recent' ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setSortParam('alpha')}
              className={`px-3 py-1 text-label font-medium rounded ${sortParam === 'alpha' ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              A-Z
            </button>
            <button 
              onClick={() => setSortParam('ev')}
              className={`px-3 py-1 text-label font-medium rounded ${sortParam === 'ev' ? 'bg-[var(--bg-surface-3)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Size (EV)
            </button>
          </div>

          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent-primary)] text-[var(--bg-base)] px-4 py-2 rounded font-medium hover:bg-opacity-90 transition-opacity"
          >
            <Plus size={18} />
            New Scenario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedScenarios.map(scenario => (
          <div 
            key={scenario.id}
            onClick={() => handleCardClick(scenario.id)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] rounded-lg p-5 cursor-pointer shadow-card transition-all duration-200 group relative flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-card-title font-medium text-[var(--text-primary)] mb-1 flex items-center gap-2">
                  {scenario.companyName}
                  {scenario.ticker && <span className="text-label bg-[var(--bg-surface-2)] px-1.5 py-0.5 rounded text-[var(--text-tertiary)] border border-[var(--border-subtle)]">{scenario.ticker}</span>}
                </h3>
                <p className="text-body-secondary text-[var(--text-secondary)]">{scenario.label}</p>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleClone(e, scenario.id)} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] rounded" title="Clone">
                  <Copy size={16} />
                </button>
                <button onClick={(e) => handleDelete(e, scenario.id, scenario.companyName)} className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--bg-surface-2)] rounded" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-section-header font-display text-[var(--text-primary)] data-number tracking-tight">
                {scenario.ev ? formatCurrency(scenario.ev, scenario.currency, true) : <span className="text-[var(--text-tertiary)] text-body-secondary">Add data to calculate</span>}
              </span>
              {scenario.ev ? <span className="text-label text-[var(--text-tertiary)] uppercase">EV</span> : null}
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {scenario.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
                {(!scenario.tags || scenario.tags.length === 0) && (
                   <span className="flex items-center gap-1 text-xs px-2 py-1 bg-[var(--bg-surface-2)] text-[var(--text-secondary)] rounded opacity-0 group-hover:opacity-100 transition-opacity">
                   <Tag size={10} /> Add tag
                 </span>
                )}
              </div>
              <div className="flex justify-between items-center text-label text-[var(--text-tertiary)] pt-3 border-t border-[var(--border-subtle)]">
                <span>Updated {new Date(scenario.updatedAt).toLocaleDateString()}</span>
                <span>{scenario.forecastYears.length} yr projection</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]">
          <div className="text-[var(--text-tertiary)] mb-4"><Plus size={48} /></div>
          <h3 className="text-card-title text-[var(--text-primary)] mb-2">No scenarios yet</h3>
          <p className="text-[var(--text-secondary)] mb-6 text-center max-w-md">Create your first DCF scenario to start modeling valuations.</p>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-[var(--accent-primary)] text-[var(--bg-base)] px-6 py-2.5 rounded-md font-medium hover:bg-opacity-90 transition-opacity"
          >
            Create Scenario
          </button>
        </div>
      )}

      <NewScenarioModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
    </div>
  );
};
