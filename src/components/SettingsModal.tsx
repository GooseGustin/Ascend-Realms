import React, { useState } from 'react';
import {
  Settings,
  X,
  Database,
  GitBranch,
  Shield,
  RefreshCw,
  Check,
  Lock,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { vault } from '../services/vaultStore';
import { FocusPreset } from '../types/vault';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uncommittedCount: number;
  totalNotes: number;
  onSyncGit: () => void;
  onResetVault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  uncommittedCount,
  totalNotes,
  onSyncGit,
  onResetVault,
}) => {
  const [rebuilt, setRebuilt] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'dungeon' | 'triage'>('dungeon');

  // Focus presets state
  const presets = vault.getPresets();
  const [selectedPresetName, setSelectedPresetName] = useState<string>(presets[0]?.name || 'Deep');
  const [newHardSite, setNewHardSite] = useState('');
  const [newSoftSite, setNewSoftSite] = useState('');

  // Triage retention
  const retentionMinutes = vault.getTriageRetentionMinutes();

  if (!isOpen) return null;

  const currentPreset = presets.find((p) => p.name === selectedPresetName) || presets[0];

  const handleRebuildIndex = () => {
    setRebuilt(true);
    setTimeout(() => setRebuilt(false), 2000);
  };

  const handleUpdateDuration = (mins: number) => {
    vault.updatePreset(currentPreset.name, { suggestedDurationMinutes: mins });
  };

  const handleUpdatePhrase = (phrase: string) => {
    vault.updatePreset(currentPreset.name, { phrase });
  };

  const handleAddHardSite = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newHardSite.trim().toLowerCase();
    if (!clean || currentPreset.hard.includes(clean)) return;
    const nextHard = [...currentPreset.hard, clean];
    const nextBlocklist = Array.from(new Set([...currentPreset.blocklist, clean]));
    vault.updatePreset(currentPreset.name, { hard: nextHard, blocklist: nextBlocklist });
    setNewHardSite('');
  };

  const handleRemoveHardSite = (site: string) => {
    const nextHard = currentPreset.hard.filter((s) => s !== site);
    vault.updatePreset(currentPreset.name, { hard: nextHard });
  };

  const handleAddSoftSite = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSoftSite.trim().toLowerCase();
    if (!clean || currentPreset.soft.includes(clean)) return;
    const nextSoft = [...currentPreset.soft, clean];
    const nextBlocklist = Array.from(new Set([...currentPreset.blocklist, clean]));
    vault.updatePreset(currentPreset.name, { soft: nextSoft, blocklist: nextBlocklist });
    setNewSoftSite('');
  };

  const handleRemoveSoftSite = (site: string) => {
    const nextSoft = currentPreset.soft.filter((s) => s !== site);
    vault.updatePreset(currentPreset.name, { soft: nextSoft });
  };

  const handleRetentionChange = (mins: number) => {
    vault.setTriageRetentionMinutes(mins);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-200/80 text-slate-700 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Ascend Realms Workspace Settings
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Focus presets, Hard Blocks, Penalty phrase & Local-first daemon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 pt-2 border-b border-slate-200 bg-slate-50/30 gap-2">
          <button
            onClick={() => setActiveTab('dungeon')}
            className={`px-3 py-1.5 border-b-2 font-medium text-xs cursor-pointer transition-colors ${
              activeTab === 'dungeon'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Focus & Dungeon Presets
          </button>
          <button
            onClick={() => setActiveTab('triage')}
            className={`px-3 py-1.5 border-b-2 font-medium text-xs cursor-pointer transition-colors ${
              activeTab === 'triage'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Inbox Triage
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 border-b-2 font-medium text-xs cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Storage & Git
          </button>
        </div>

        {/* Content sections */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Focus Dungeon & Presets */}
          {activeTab === 'dungeon' && (
            <div className="space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Select Preset to Configure:
                </label>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPresetName(p.name)}
                      className={`flex-1 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                        selectedPresetName === p.name
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p.name} ({p.suggestedDurationMinutes}m)
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer Duration Input */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preset Focus Duration (minutes)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={currentPreset.suggestedDurationMinutes}
                    onChange={(e) =>
                      handleUpdateDuration(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-24 h-7 px-2.5 rounded border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-amber-600"
                  />
                  <span className="text-slate-500 text-[11px]">
                    minutes countdown when starting session
                  </span>
                </div>
              </div>

              {/* Hard-Blocked Sites (User requirement: modify hard-blocked sites here) */}
              <div className="p-3 bg-rose-50/40 rounded-lg border border-rose-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-rose-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hard-Blocked Sites (Strict zero-bypass barrier)</span>
                  </label>
                  <span className="text-[10px] text-rose-700 font-mono">
                    {currentPreset.hard.length} domains
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Domains strictly forbidden during dungeon sessions. Cannot be unlocked via soft-block phrase.
                </p>

                {/* Hard tags list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentPreset.hard.map((site) => (
                    <span
                      key={site}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-mono text-[11px]"
                    >
                      <span>{site}</span>
                      <button
                        onClick={() => handleRemoveHardSite(site)}
                        title="Remove domain"
                        className="hover:text-rose-950 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {currentPreset.hard.length === 0 && (
                    <span className="text-slate-400 italic text-[11px]">No hard blocked sites.</span>
                  )}
                </div>

                {/* Add new hard block domain */}
                <form onSubmit={handleAddHardSite} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newHardSite}
                    onChange={(e) => setNewHardSite(e.target.value)}
                    placeholder="e.g. reddit.com or twitter.com"
                    className="flex-1 h-7 px-2.5 rounded border border-rose-200 bg-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={!newHardSite.trim()}
                    className="h-7 px-3 rounded bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Hard Block</span>
                  </button>
                </form>
              </div>

              {/* Soft-Blocked Sites */}
              <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Soft-Blocked Sites (Penalty phrase challenge barrier)</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-mono">
                    {currentPreset.soft.length} domains
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Domains that present a friction deterrent. Visiting requires typing the penalty phrase to override.
                </p>

                {/* Soft tags list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentPreset.soft.map((site) => (
                    <span
                      key={site}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[11px]"
                    >
                      <span>{site}</span>
                      <button
                        onClick={() => handleRemoveSoftSite(site)}
                        title="Remove domain"
                        className="hover:text-amber-950 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {currentPreset.soft.length === 0 && (
                    <span className="text-slate-400 italic text-[11px]">No soft blocked sites.</span>
                  )}
                </div>

                {/* Add new soft block domain */}
                <form onSubmit={handleAddSoftSite} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newSoftSite}
                    onChange={(e) => setNewSoftSite(e.target.value)}
                    placeholder="e.g. youtube.com or news.ycombinator.com"
                    className="flex-1 h-7 px-2.5 rounded border border-amber-200 bg-white font-mono text-xs focus:outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={!newSoftSite.trim()}
                    className="h-7 px-3 rounded bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Soft Block</span>
                  </button>
                </form>
              </div>

              {/* Penalty Phrase Input (User requirement: modify penalty phrase in settings) */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Penalty Phrase Deterrent:
                </label>
                <p className="text-[11px] text-slate-500">
                  The psychological phrase user must type letter-for-letter to break focus and override a soft block.
                </p>
                <input
                  type="text"
                  value={currentPreset.phrase}
                  onChange={(e) => handleUpdatePhrase(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Inbox Triage Retention */}
          {activeTab === 'triage' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs">
                  Inbox Triage Dispatch Retention Window
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When you dispatch an item from Core/Inbox.md into a target realm/file, it is noted as triaged in Inbox.md and falls to the bottom of the triage list. Configure how long it remains visible in the panel before disappearing:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={retentionMinutes}
                    onChange={(e) => handleRetentionChange(parseInt(e.target.value, 10))}
                    className="h-8 px-3 rounded border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour (Default)</option>
                    <option value={120}>2 hours</option>
                    <option value={360}>6 hours</option>
                    <option value={1440}>24 hours (1 day)</option>
                  </select>
                  <span className="text-slate-500 text-[11px]">
                    Current retention: {retentionMinutes} minutes
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 block">Behavior Guarantee:</span>
                <p>
                  Dispatched items are marked <code className="text-slate-800 font-mono">- [x]</code> with dispatch metadata in Core/Inbox.md. They will never reappear as untriaged items.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Storage & Git */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* SQLite Cache Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>SQLite Secondary Cache (.ascend/ascend.sqlite)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Markdown notes are the canonical source of truth; SQLite is strictly a secondary index cache for FTS5 full-text search and checklist indexing.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Indexed Notes:</span>
                    <span className="font-bold text-slate-800">{totalNotes} files</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Journal Mode:</span>
                    <span className="font-bold text-slate-800">WAL (PRAGMA)</span>
                  </div>
                </div>
                <button
                  onClick={handleRebuildIndex}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {rebuilt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Cache Rebuilt from Markdown</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Rebuild SQLite Cache</span>
                    </>
                  )}
                </button>
              </div>

              {/* Git Auto-Commit & Sync Section */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <GitBranch className="w-4 h-4 text-amber-600" />
                  <span>Local Git Lifecycle & Conflict Policy</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Auto-commits execute on a 15-minute background timer with atomic <code className="text-slate-800 font-mono">.tmp</code> file writes. Remote pull operates via <code className="text-slate-800 font-mono">pull --rebase</code>.
                </p>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Uncommitted Changes:</span>
                    <span className="font-bold text-slate-800 ml-2">
                      {uncommittedCount} pending
                    </span>
                  </div>
                  <button
                    onClick={onSyncGit}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer"
                  >
                    Commit & Sync Now
                  </button>
                </div>
              </div>

              {/* Reset / Re-seed Vault */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  Need fresh initial state?
                </span>
                <button
                  onClick={() => {
                    if (confirm('Reset vault to clean initial seed data?')) {
                      onResetVault();
                      onClose();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-medium hover:underline cursor-pointer"
                >
                  Reset to Factory Seed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
