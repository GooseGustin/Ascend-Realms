import React from 'react';
import { RealmConfig } from '../types/vault';
import { RefreshCw, Settings, Plus, CheckCircle2, GitBranch } from 'lucide-react';

interface TopBarProps {
  realms: RealmConfig[];
  activeRealm: RealmConfig;
  onSelectRealm: (realmId: string) => void;
  onOpenNewRealmModal: () => void;
  onOpenSettingsModal: () => void;
  uncommittedCount: number;
  onSyncGit: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  realms,
  activeRealm,
  onSelectRealm,
  onOpenNewRealmModal,
  onOpenSettingsModal,
  uncommittedCount,
  onSyncGit,
}) => {
  return (
    <header className="h-12 bg-[#121318]/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 select-none shadow-md text-slate-100">
      {/* Brand & Realm Tabs */}
      <div className="flex items-center gap-3">
        {/* Brand Mark */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-serif font-bold text-sm border border-amber-500/30 shadow-xs">
            A
          </div>
          <span className="font-semibold text-xs tracking-tight text-white hidden sm:inline">
            Ascend
          </span>
        </div>

        {/* Realm Tab Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {realms.map((realm) => {
            const isActive = realm.id === activeRealm.id;
            const isCore = realm.kind === 'core';
            const accent = realm.view?.accent || (isCore ? '#f59e0b' : '#3b82f6');

            return (
              <button
                key={realm.id}
                onClick={() => onSelectRealm(realm.id)}
                style={
                  isActive
                    ? {
                        borderColor: accent,
                        backgroundColor: `${accent}22`,
                      }
                    : {}
                }
                className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 text-xs transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'text-white font-semibold shadow-xs'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span
                  style={{ backgroundColor: accent }}
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                />
                <span>{realm.name}</span>
                <span
                  className={`px-1 py-0.2 rounded text-[9px] font-mono leading-none ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {realm.number}
                </span>
              </button>
            );
          })}

          {/* + Realm Trigger */}
          <button
            onClick={onOpenNewRealmModal}
            title="Create new Realm"
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </nav>
      </div>

      {/* Right Controls: Git Status & Settings */}
      <div className="flex items-center gap-2 text-xs">
        {/* Sync Indicator */}
        <button
          onClick={onSyncGit}
          title={
            uncommittedCount > 0
              ? `${uncommittedCount} uncommitted changes. Click to sync.`
              : 'Vault synced with local git.'
          }
          className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
            uncommittedCount > 0
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-900/50'
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-750 hover:text-white'
          }`}
        >
          <GitBranch className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-[11px] hidden md:inline">
            {uncommittedCount > 0 ? `${uncommittedCount} pending` : 'Synced git'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              uncommittedCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </button>

        {/* Settings Gear */}
        <button
          onClick={onOpenSettingsModal}
          title="System & Vault Settings"
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
