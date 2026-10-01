import React, { useState, useEffect } from 'react';
import {
  getDarkHueForRealm,
  isTaskPoolSourceFile,
  parseChecklistItems,
  parseTriageItems,
  vault,
} from './services/vaultStore';
import { ChecklistItem, FocusSessionRecord } from './types/vault';
import { TopBar } from './components/TopBar';
import { FileExplorer } from './components/FileExplorer';
import { ReviewWidget } from './components/ReviewWidget';
import { NotesWidget } from './components/NotesWidget';
import { TaskPoolWidget } from './components/TaskPoolWidget';
import { DungeonWidget } from './components/DungeonWidget';
import { InboxTriageWidget } from './components/InboxTriageWidget';
import { RightPanel, RightPanelTab } from './components/RightPanel';
import { NewNoteModal } from './components/NewNoteModal';
import { NewFolderModal } from './components/NewFolderModal';
import { MoveModal } from './components/MoveModal';
import { NewRealmModal } from './components/NewRealmModal';
import { SettingsModal } from './components/SettingsModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);

  // Modals state
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [newNoteFolder, setNewNoteFolder] = useState<string | undefined>(undefined);

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState<string>('');

  const [moveTarget, setMoveTarget] = useState<{
    type: 'file' | 'folder';
    path: string;
  } | null>(null);

  const [isNewRealmModalOpen, setIsNewRealmModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Right Panel docked tab state
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>(null);

  // Left Sidebar Collapse state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ascend_vault_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ascend_vault_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to VaultManager updates
  useEffect(() => {
    return vault.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const realms = vault.getRealms();
  const activeRealm = vault.getActiveRealm();
  const files = vault.getFiles();
  const activeNote = vault.getActiveNote();
  const openTabs = vault.getOpenTabs();
  const uncommittedCount = vault.getUncommittedChanges();

  // Extract checklist items across all notes
  const allChecklistItems = parseChecklistItems(files);

  // Filter tasks for active Realm:
  // User Request 10: Task Pool reads ONLY from project Task.md files in addition to the realm master Tasks.md
  const realmTasks = allChecklistItems.filter((t) => {
    if (!isTaskPoolSourceFile(t.path)) return false;
    if (activeRealm.kind === 'core') return true;
    return t.realm === activeRealm.id;
  });

  // Yesterday's uncompleted items for Review Widget
  const yesterdayFile = files.find((f) => f.path.includes('2026-09-21'));
  const yesterdayPendingTasks = yesterdayFile
    ? parseChecklistItems([yesterdayFile]).filter((t) => !t.isDone && !t.isDeferred)
    : [];

  // Triage items consolidated in Core/Inbox.md
  const inboxFile = files.find((f) => f.path === 'Core/Inbox.md' || f.isInbox);
  const triageRetention = vault.getTriageRetentionMinutes();
  const triageItems = inboxFile ? parseTriageItems(inboxFile.content, triageRetention) : [];

  // Handlers
  const handleSelectRealm = (realmId: string) => {
    vault.setActiveRealm(realmId);
  };

  const handleSelectNote = (path: string) => {
    vault.setActiveNote(path);
  };

  const handleCloseTab = (path: string) => {
    vault.closeTab(path);
  };

  const handleUpdateContent = (path: string, content: string) => {
    vault.updateNoteContent(path, content);
  };

  const handleToggleTaskLine = (blockRef: string, targetState: boolean) => {
    const item = allChecklistItems.find((i) => i.blockRef === blockRef);
    if (item) {
      vault.toggleTask(item);
    }
  };

  const handleCommitTask = (task: ChecklistItem) => {
    vault.commitTaskToDaily(task);
  };

  const handleToggleTask = (task: ChecklistItem) => {
    vault.toggleTask(task);
  };

  const handleRemoveTask = (task: ChecklistItem) => {
    vault.removeTask(task);
  };

  const handleTriageReviewItem = (
    action: 'complete' | 'defer' | 'carry' | 'drop',
    item: ChecklistItem
  ) => {
    vault.triageReviewItem(action, item, 'Core/Daily/2026-09-21.md');
  };

  const handleTriageAllCarry = () => {
    yesterdayPendingTasks.forEach((item) => {
      vault.triageReviewItem('carry', item, 'Core/Daily/2026-09-21.md');
    });
  };

  const handleQuickCaptureTask = (text: string) => {
    vault.captureTask(text, `${activeRealm.name}/Tasks.md`);
  };

  const handleDispatchTriage = (
    itemId: string,
    itemText: string,
    targetRealm: string,
    targetFile: string
  ) => {
    vault.dispatchTriageItem(itemId, itemText, targetRealm, targetFile);
  };

  const handleAddTriageItem = (text: string) => {
    vault.captureInboxItem(text);
  };

  const handleSessionComplete = (record: FocusSessionRecord) => {
    vault.logFocusSession(record);
  };

  const handleApplyDiff = (path: string, newContent: string) => {
    vault.updateNoteContent(path, newContent);
  };

  const handleAppendToNote = (path: string, appendedContent: string) => {
    const note = files.find((f) => f.path === path);
    if (note) {
      vault.updateNoteContent(path, note.content + appendedContent);
    }
  };

  const handleCreateProject = (realmId: string, projectName: string) => {
    vault.createProject(realmId, projectName);
  };

  const handleCreateRealm = (
    name: string,
    purpose: string,
    accent?: string,
    background?: string
  ) => {
    vault.createRealm(name, purpose, accent, background);
  };

  const handleOpenNewNoteModal = (targetFolder?: string) => {
    setNewNoteFolder(targetFolder || activeRealm.name);
    setIsNewNoteModalOpen(true);
  };

  const handleCreateNoteInFolder = (folderPath: string, noteName: string) => {
    vault.createFileInFolder(activeRealm.id, folderPath, noteName);
  };

  const handleOpenNewFolderModal = (parentFolderPath: string) => {
    setNewFolderParent(parentFolderPath);
    setIsNewFolderModalOpen(true);
  };

  const handleCreateFolder = (parentFolderPath: string, folderName: string) => {
    vault.createFolderInFolder(activeRealm.id, parentFolderPath, folderName);
  };

  const handleMoveItem = (sourcePath: string, destinationFolderPath: string) => {
    if (moveTarget?.type === 'folder') {
      vault.moveFolder(sourcePath, destinationFolderPath);
    } else {
      vault.moveFile(sourcePath, destinationFolderPath);
    }
    setMoveTarget(null);
  };

  const handleDeleteItem = (type: 'file' | 'folder', path: string) => {
    if (type === 'folder') {
      vault.deleteFolder(path);
    } else {
      vault.deleteFile(path);
    }
  };

  const handleSyncGit = () => {
    vault.syncGit();
  };

  const handleResetVault = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isCore = activeRealm.kind === 'core';
  const availableRealmFolders = vault.getFoldersForRealm(activeRealm.id);

  return (
    <div
      style={{
        backgroundColor: activeRealm.view.background || '#fafafa',
      }}
      className="h-screen w-screen flex flex-col font-sans text-slate-800 antialiased overflow-hidden fixed inset-0"
    >
      {/* Pinned Top Realm Bar */}
      <TopBar
        realms={realms}
        activeRealm={activeRealm}
        onSelectRealm={handleSelectRealm}
        onOpenNewRealmModal={() => setIsNewRealmModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        uncommittedCount={uncommittedCount}
        onSyncGit={handleSyncGit}
      />

      {/* Main Layout Quadrants */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
        {/* Left Column: File Explorer with Folder CRUD & Options */}
        <div
          className={`shrink-0 h-full transition-[width,opacity] duration-200 ease-in-out ${
            isSidebarCollapsed
              ? 'w-0 overflow-hidden opacity-0 pointer-events-none'
              : 'w-60 opacity-100'
          }`}
        >
          <FileExplorer
            activeRealm={activeRealm}
            files={files}
            activeNotePath={activeNote?.path || ''}
            onSelectNote={handleSelectNote}
            onOpenNewNoteModal={handleOpenNewNoteModal}
            onOpenNewProjectModal={() => setRightPanelTab('new-project')}
            onCreateFolder={handleOpenNewFolderModal}
            onMoveItem={(type, path) => setMoveTarget({ type, path })}
            onDeleteItem={handleDeleteItem}
            triageCount={triageItems.length}
          />
        </div>

        {/* Small toggle icon between the sidebar and the widgets */}
        <div className="relative z-20 flex items-start pt-3 shrink-0">
          <button
            onClick={toggleSidebar}
            title={
              isSidebarCollapsed
                ? 'Expand sidebar (Ctrl+B)'
                : 'Collapse sidebar to maximize space for notes (Ctrl+B)'
            }
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="group -ml-3 h-8 w-6 rounded-r-md bg-[#16171d] hover:bg-[#20222a] border border-slate-700/90 border-l-0 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition-all cursor-pointer focus:outline-none"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            )}
          </button>
        </div>

        {/* Central Scrolling Canvas (Scrolls independently while sidebars remain fixed) */}
        {/* User Request 4: sidebar and side panel remain fixed while middle scrolls */}
        {/* User Request 8: whitespace between widgets is a dark hue of realm's theme colour */}
        <div
          style={{
            backgroundColor: getDarkHueForRealm(activeRealm),
          }}
          className="flex-1 h-full min-h-0 overflow-y-auto"
        >
          <main className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
            {/* Yesterday's Review: Displayed in Core when uncompleted tasks exist */}
            {isCore && yesterdayPendingTasks.length > 0 && (
              <ReviewWidget
                pendingItems={yesterdayPendingTasks}
                yesterdayDate="2026-09-21"
                onTriageItem={handleTriageReviewItem}
                onTriageAllCarry={handleTriageAllCarry}
              />
            )}

            {/* Central Notes Widget (CodeMirror Live Preview Editor with tab + button) */}
            <NotesWidget
              openTabs={openTabs}
              activeNote={activeNote}
              onSelectTab={handleSelectNote}
              onCloseTab={handleCloseTab}
              onUpdateContent={handleUpdateContent}
              onToggleTaskLine={handleToggleTaskLine}
              onNewNote={() => handleOpenNewNoteModal()}
              onTogglePin={(path) => vault.togglePinNote(path)}
              isNotePinned={(path) => vault.isNotePinned(path)}
            />

            {/* Task Pool Widget (In Core: pools from all other realms' Tasks.md & projects) */}
            <TaskPoolWidget
              tasks={realmTasks}
              activeRealm={activeRealm}
              onCommitTask={handleCommitTask}
              onToggleTask={handleToggleTask}
              onRemoveTask={handleRemoveTask}
              onQuickCapture={handleQuickCaptureTask}
            />

            {/* Focus Dungeon Widget */}
            <DungeonWidget
              activeRealm={activeRealm}
              onSessionComplete={handleSessionComplete}
            />

            {/* Inbox Triage Widget (Core Realm) */}
            {isCore && (
              <InboxTriageWidget
                items={triageItems}
                realms={realms}
                onDispatch={handleDispatchTriage}
                onAddTriage={handleAddTriageItem}
              />
            )}
          </main>
        </div>

        {/* Docked Right Panel & Floating Rail (Triage, Preview, Search, New Project, Dungeon, Steward) */}
        <RightPanel
          activeTab={rightPanelTab}
          onSelectTab={setRightPanelTab}
          activeRealm={activeRealm}
          realms={realms}
          activeNote={activeNote}
          files={files}
          triageItems={triageItems}
          onDispatchTriageItem={handleDispatchTriage}
          onAddTriage={handleAddTriageItem}
          onApplyDiff={handleApplyDiff}
          onAppendToNote={handleAppendToNote}
          onSelectFile={handleSelectNote}
          onCreateProject={handleCreateProject}
          onSessionComplete={handleSessionComplete}
        />
      </div>

      {/* In-App Modals for Notes, Subfolders, Intra-Realm Move, and Realms */}
      <NewNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        activeRealm={activeRealm}
        defaultFolder={newNoteFolder}
        availableFolders={availableRealmFolders}
        onCreateNote={handleCreateNoteInFolder}
      />

      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        parentFolderPath={newFolderParent}
        onCreateFolder={handleCreateFolder}
      />

      <MoveModal
        isOpen={moveTarget !== null}
        onClose={() => setMoveTarget(null)}
        itemType={moveTarget?.type || 'file'}
        sourcePath={moveTarget?.path || ''}
        realmName={activeRealm.name}
        availableFolders={availableRealmFolders}
        onMove={handleMoveItem}
      />

      <NewRealmModal
        isOpen={isNewRealmModalOpen}
        onClose={() => setIsNewRealmModalOpen(false)}
        onCreateRealm={handleCreateRealm}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        uncommittedCount={uncommittedCount}
        totalNotes={files.length}
        onSyncGit={handleSyncGit}
        onResetVault={handleResetVault}
      />
    </div>
  );
}
