import React, { useState } from 'react';
import { FocusSessionRecord, RealmConfig, TriageItem, VaultFile } from '../types/vault';
import {
  Inbox,
  Eye,
  Search,
  FolderPlus,
  Lock,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TriagePanel } from './TriagePanel';
import { PreviewPanel } from './PreviewPanel';
import { SearchPanel } from './SearchPanel';
import { NewProjectPanel } from './NewProjectPanel';
import { DungeonPanel } from './DungeonPanel';
import { StewardPanel } from './StewardPanel';

export type RightPanelTab =
  | 'triage'
  | 'preview'
  | 'search'
  | 'new-project'
  | 'dungeon'
  | 'steward'
  | null;

interface RightPanelProps {
  activeTab: RightPanelTab;
  onSelectTab: (tab: RightPanelTab) => void;
  activeRealm: RealmConfig;
  realms: RealmConfig[];
  activeNote?: VaultFile;
  files: VaultFile[];
  triageItems: TriageItem[];
  onDispatchTriageItem: (
    itemId: string,
    itemText: string,
    targetRealm: string,
    targetFile: string
  ) => void;
  onAddTriage: (text: string) => void;
  onApplyDiff: (path: string, newContent: string) => void;
  onAppendToNote: (path: string, appendedContent: string) => void;
  onSelectFile: (path: string) => void;
  onCreateProject: (realmId: string, projectName: string) => void;
  onSessionComplete: (record: FocusSessionRecord) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeTab,
  onSelectTab,
  activeRealm,
  realms,
  activeNote,
  files,
  triageItems,
  onDispatchTriageItem,
  onAddTriage,
  onApplyDiff,
  onAppendToNote,
  onSelectFile,
  onCreateProject,
  onSessionComplete,
}) => {
  const isExpanded = activeTab !== null;
  // User Request 11: The rail shrinks to a little icon sticking to the right edge and expands on hover
  const [isRailExpanded, setIsRailExpanded] = useState(false);

  return (
    <>
      {/* Floating Rail: Shrinks to icon at edge and expands on hover */}
      {!isRailExpanded ? (
        <div
          onMouseEnter={() => setIsRailExpanded(true)}
          className="fixed right-0 bottom-12 z-50 flex items-center"
        >
          <button
            onClick={() => setIsRailExpanded(true)}
            title="Expand Workspace Tools (Hover to expand)"
            className="h-10 px-2 rounded-l-xl bg-[#16171d]/95 border-y border-l border-slate-700 shadow-xl hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer transition-all hover:pr-3 text-slate-200 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            {triageItems.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>
      ) : (
        <div
          onMouseLeave={() => setIsRailExpanded(false)}
          className="fixed right-3 bottom-6 z-50 flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-[#16171d]/95 border border-slate-700/90 shadow-2xl backdrop-blur-md select-none transition-all text-slate-200"
        >
          {/* Collapse handle */}
          <button
            onClick={() => setIsRailExpanded(false)}
            title="Minimize rail"
            className="w-8 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Triage Rail Button */}
          <button
            onClick={() => onSelectTab(activeTab === 'triage' ? null : 'triage')}
            title="Triage Captured Items (Inbox.md)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === 'triage'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            {triageItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                {triageItems.length}
              </span>
            )}
          </button>

          {/* Note Preview & Backlinks */}
          <button
            onClick={() => onSelectTab(activeTab === 'preview' ? null : 'preview')}
            title="Rendered Note Preview & Backlinks"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-blue-300 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Global Search (Docked Panel) */}
          <button
            onClick={() => onSelectTab(activeTab === 'search' ? null : 'search')}
            title="Search Vault (Docked Panel)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-blue-300 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* + Project (Docked Panel) */}
          <button
            onClick={() => onSelectTab(activeTab === 'new-project' ? null : 'new-project')}
            title="New Project in current Realm"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'new-project'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-blue-300 hover:bg-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
          </button>

          {/* Focus Dungeon & Presets (Docked Panel) */}
          <button
            onClick={() => onSelectTab(activeTab === 'dungeon' ? null : 'dungeon')}
            title="Focus Dungeon & Timer (Docked Panel)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'dungeon'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Steward AI */}
          <button
            onClick={() => onSelectTab(activeTab === 'steward' ? null : 'steward')}
            title="Steward AI Assistant (Realm Scoped)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'steward'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-blue-300 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Docked Right Panel */}
      {isExpanded && (
        <aside className="w-92 shrink-0 h-full min-h-0 border-l border-slate-800 bg-[#16171d] text-slate-100 flex flex-col shadow-xl select-none">
          {activeTab === 'triage' && (
            <TriagePanel
              items={triageItems}
              realms={realms}
              files={files}
              onDispatchItem={onDispatchTriageItem}
              onAddTriage={onAddTriage}
              onClose={() => onSelectTab(null)}
            />
          )}

          {activeTab === 'preview' && (
            <PreviewPanel
              activeNote={activeNote}
              files={files}
              onClose={() => onSelectTab(null)}
              onSelectBacklink={(path) => {
                onSelectFile(path);
              }}
            />
          )}

          {activeTab === 'search' && (
            <SearchPanel
              files={files}
              onSelectFile={(path) => {
                onSelectFile(path);
                onSelectTab(null);
              }}
              onClose={() => onSelectTab(null)}
            />
          )}

          {activeTab === 'new-project' && (
            <NewProjectPanel
              activeRealm={activeRealm}
              onCreateProject={(pName) => {
                onCreateProject(activeRealm.id, pName);
                onSelectTab(null);
              }}
              onClose={() => onSelectTab(null)}
            />
          )}

          {activeTab === 'dungeon' && (
            <DungeonPanel
              activeRealm={activeRealm}
              onSessionComplete={onSessionComplete}
              onClose={() => onSelectTab(null)}
            />
          )}

          {activeTab === 'steward' && (
            <StewardPanel
              activeRealm={activeRealm}
              activeNote={activeNote}
              files={files}
              onApplyDiff={onApplyDiff}
              onAppendToNote={onAppendToNote}
              onClose={() => onSelectTab(null)}
            />
          )}
        </aside>
      )}
    </>
  );
};
