import React from 'react';
import { useAppStore } from '../../store';
import { useParams } from 'react-router-dom';
import { Download, Share2, Save, Cloud, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { exportToPDF, exportToExcel } from '../../features/export/lib/exportUtils';

export const TopBar: React.FC = () => {
  const { scenarios, updateScenario, theme, setTheme } = useAppStore();
  const { id: activeScenarioId } = useParams<{ id: string }>();
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const { showToast } = useToast();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeScenarioId) return;
    updateScenario(activeScenarioId, s => ({ ...s, label: e.target.value }));
  };

  const handleShare = () => {
    // Generate mock share link
    const token = crypto.randomUUID().substring(0, 16);
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    showToast('Share link copied to clipboard!', 'success');
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!activeScenario) return;
    
    try {
      showToast(`Exporting to ${type.toUpperCase()}...`, 'info');
      if (type === 'pdf') {
        await exportToPDF(activeScenario);
      } else {
        exportToExcel(activeScenario);
      }
      showToast(`Successfully exported to ${type.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(`Failed to export: ${err}`, 'error');
    }
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {activeScenario ? (
          <input
            type="text"
            value={activeScenario.label}
            onChange={handleNameChange}
            className="text-card-title font-medium text-[var(--text-primary)] bg-transparent border-none outline-none focus:ring-0 w-1/3 hover:bg-[var(--bg-surface-2)] px-2 py-1 rounded transition-colors"
            placeholder="Scenario Name"
          />
        ) : (
          <div className="text-card-title font-medium text-[var(--text-secondary)]">
            Dashboard
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {activeScenario && (
          <>
            <div className="flex items-center gap-1.5 text-label text-[var(--positive)]">
              <Save size={14} />
              <span>Saved</span>
            </div>

            <div className="h-6 w-px bg-[var(--border-strong)] mx-2"></div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 text-body-secondary text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] rounded-md transition-colors">
                <Download size={16} />
                <span>Export</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-surface-3)] border border-[var(--border-strong)] rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-base)] transition-colors rounded-t-md">
                  PDF Report
                </button>
                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--bg-base)] transition-colors rounded-b-md">
                  Excel Model
                </button>
              </div>
            </div>

            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-primary)] text-[var(--bg-base)] font-medium text-body-secondary rounded-md hover:bg-opacity-90 transition-opacity"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
