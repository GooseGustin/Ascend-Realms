import React, { useState } from 'react';
import { RealmConfig, VaultFile } from '../types/vault';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Calendar,
  Clock,
  Sliders,
  User,
  Target,
  Inbox,
  Sparkles,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FilePlus,
  FolderPlus,
  FolderInput,
  Trash2,
} from 'lucide-react';

interface FileExplorerProps {
  activeRealm: RealmConfig;
  files: VaultFile[];
  activeNotePath: string;
  onSelectNote: (path: string) => void;
  onOpenNewNoteModal: (targetFolder?: string) => void;
  onOpenNewProjectModal: () => void;
  onCreateFolder: (parentFolderPath: string) => void;
  onMoveItem: (type: 'file' | 'folder', path: string) => void;
  onDeleteItem: (type: 'file' | 'folder', path: string) => void;
  triageCount: number;
}

interface TreeFileItem {
  type: 'file';
  name: string;
  fullPath: string;
  file: VaultFile;
}

interface TreeFolderItem {
  type: 'folder';
  name: string;
  fullPath: string;
  subfolders: TreeFolderItem[];
  files: TreeFileItem[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  activeRealm,
  files,
  activeNotePath,
  onSelectNote,
  onOpenNewNoteModal,
  onOpenNewProjectModal,
  onCreateFolder,
  onMoveItem,
  onDeleteItem,
  triageCount,
}) => {
  const [dailyExpanded, setDailyExpanded] = useState(true);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Track active context menu dropdown
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    type: 'file' | 'folder';
    path: string;
  } | null>(null);

  const isCore = activeRealm.kind === 'core';

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: prev[folderKey] === undefined ? false : !prev[folderKey],
    }));
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleDocumentClick = () => setActiveMenu(null);
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  // Filter files belonging to active realm
  const realmFiles = files.filter((f) => f.realm === activeRealm.id);

  // Build true recursive directory tree
  const rootFiles: VaultFile[] = [];
  const rootFolders: TreeFolderItem[] = [];
  const folderMap: Record<string, TreeFolderItem> = {};

  function getOrCreateFolder(folderParts: string[]): TreeFolderItem {
    const fullPath = `${activeRealm.name}/${folderParts.join('/')}`;
    if (folderMap[fullPath]) return folderMap[fullPath];

    const folderName = folderParts[folderParts.length - 1];
    const newFolder: TreeFolderItem = {
      type: 'folder',
      name: folderName,
      fullPath,
      subfolders: [],
      files: [],
    };
    folderMap[fullPath] = newFolder;

    if (folderParts.length === 1) {
      rootFolders.push(newFolder);
    } else {
      const parentParts = folderParts.slice(0, -1);
      const parentFolder = getOrCreateFolder(parentParts);
      if (!parentFolder.subfolders.some((f) => f.fullPath === fullPath)) {
        parentFolder.subfolders.push(newFolder);
      }
    }
    return newFolder;
  }

  for (const f of realmFiles) {
    if (f.isDaily || f.isSession || f.isInbox || f.path === 'Core/Inbox.md') {
      continue;
    }

    if (isCore) {
      rootFiles.push(f);
    } else {
      const relPath = f.path.startsWith(`${activeRealm.name}/`)
        ? f.path.substring(activeRealm.name.length + 1)
        : f.path;

      if (!relPath.includes('/')) {
        rootFiles.push(f);
      } else {
        const parts = relPath.split('/');
        const fileName = parts.pop()!;
        const folderParts = parts;
        const folder = getOrCreateFolder(folderParts);
        folder.files.push({
          type: 'file',
          name: f.title || fileName,
          fullPath: f.path,
          file: f,
        });
      }
    }
  }

  // Sort subfolders and files
  function sortFolder(folder: TreeFolderItem) {
    folder.subfolders.sort((a, b) => a.name.localeCompare(b.name));
    folder.files.sort((a, b) => a.name.localeCompare(b.name));
    folder.subfolders.forEach(sortFolder);
  }
  rootFolders.sort((a, b) => a.name.localeCompare(b.name));
  rootFolders.forEach(sortFolder);
  rootFiles.sort((a, b) => (a.title || a.path).localeCompare(b.title || b.path));

  // Core groupings
  const dailyNotes = files.filter((f) => f.path.startsWith('Core/Daily/'));
  const sessionNotes = files.filter((f) => f.path.startsWith('Core/Sessions/'));

  // Recursive Folder Renderer
  const renderFolderItem = (folder: TreeFolderItem, depth: number) => {
    const isExpanded = expandedFolders[folder.fullPath] !== false;

    return (
      <div key={folder.fullPath} className="pt-1">
        {/* Folder Header Row with: chevron, folder icon, folder name, + File, + Subfolder, ellipsis */}
        <div
          style={{ paddingLeft: `${depth * 12}px` }}
          className="group relative flex items-center justify-between px-1.5 py-1 rounded hover:bg-slate-800/80 transition-colors"
        >
          <button
            onClick={() => toggleFolder(folder.fullPath)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-100 hover:text-white cursor-pointer flex-1 truncate"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            )}
            <span className="truncate font-mono">{folder.name}/</span>
          </button>

          {/* Folder Action Buttons: + File, + Subfolder, Ellipsis */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewNoteModal(folder.fullPath);
              }}
              title="New file in this folder"
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <FilePlus className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(folder.fullPath);
              }}
              title="New subfolder in this folder"
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <FolderPlus className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(
                  activeMenu?.path === folder.fullPath
                    ? null
                    : { id: folder.fullPath, type: 'folder', path: folder.fullPath }
                );
              }}
              title="Folder options"
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Nested Content: Only shown when isExpanded is TRUE */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* Render nested subfolders first */}
            {folder.subfolders.map((sub) => renderFolderItem(sub, depth + 1))}

            {/* Render files in this folder */}
            {folder.files.map((child) => {
              const isActive = activeNotePath === child.fullPath;

              return (
                <div
                  key={child.fullPath}
                  style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
                  className={`group relative flex items-center justify-between pr-1 py-1 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 border-l-2 border-blue-400 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => onSelectNote(child.fullPath)}
                    className="flex-1 flex items-center gap-1.5 text-left truncate cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="truncate">{child.name}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(
                        activeMenu?.path === child.fullPath
                          ? null
                          : { id: child.fullPath, type: 'file', path: child.fullPath }
                      );
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-white cursor-pointer ml-1"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-60 shrink-0 bg-[#16171d] border-r border-slate-800 flex flex-col h-full min-h-0 text-xs select-none relative z-10 text-slate-100">
      {/* Realm Context Header */}
      <div className="p-3 border-b border-slate-800 bg-[#121318]/90">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              style={{ backgroundColor: activeRealm.view?.accent || (isCore ? '#f59e0b' : '#3b82f6') }}
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-white/20"
            />
            <span className="font-semibold text-white text-[13px] truncate">
              {activeRealm.name} Workspace
            </span>
          </div>

          {!isCore && (
            <button
              onClick={onOpenNewProjectModal}
              title="Create new project"
              className="p-1 rounded text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p
          className="text-[11px] text-slate-300 leading-normal line-clamp-2"
          title={activeRealm.purpose}
        >
          {activeRealm.purpose}
        </p>
      </div>

      {/* Directory Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Core Hierarchy */}
        {isCore && (
          <>
            {/* Inbox.md fixed first (ADR-0025) */}
            <div className="group relative flex items-center justify-between rounded px-2 py-1.5 hover:bg-slate-800 transition-colors">
              <button
                onClick={() => onSelectNote('Core/Inbox.md')}
                className={`flex-1 flex items-center justify-between text-left cursor-pointer ${
                  activeNotePath === 'Core/Inbox.md'
                    ? 'font-semibold text-amber-300'
                    : 'text-slate-100 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Inbox.md</span>
                </div>
                {triageCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {triageCount}
                  </span>
                )}
              </button>
            </div>

            {/* Daily Notes Folder */}
            <div className="pt-1">
              <div className="flex items-center justify-between px-1 py-1 group">
                <button
                  onClick={() => setDailyExpanded(!dailyExpanded)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200 hover:text-white cursor-pointer"
                >
                  {dailyExpanded ? (
                    <ChevronDown className="w-3 h-3 text-slate-300" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  )}
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daily/</span>
                </button>
              </div>

              {dailyExpanded && (
                <div className="pl-4 space-y-0.5">
                  {dailyNotes.map((d) => (
                    <div
                      key={d.path}
                      className={`group relative flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                        activeNotePath === d.path
                          ? 'bg-slate-800 border-l-2 border-amber-400 text-white font-semibold'
                          : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => onSelectNote(d.path)}
                        className="flex-1 text-left truncate cursor-pointer font-mono text-[11px]"
                      >
                        {d.path.split('/').pop()?.replace('.md', '')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sessions Folder */}
            <div className="pt-1">
              <div className="flex items-center justify-between px-1 py-1 group">
                <button
                  onClick={() => setSessionsExpanded(!sessionsExpanded)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200 hover:text-white cursor-pointer"
                >
                  {sessionsExpanded ? (
                    <ChevronDown className="w-3 h-3 text-slate-300" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  )}
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sessions/</span>
                </button>
              </div>

              {sessionsExpanded && (
                <div className="pl-4 space-y-0.5">
                  {sessionNotes.map((s) => (
                    <div
                      key={s.path}
                      className={`group relative flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                        activeNotePath === s.path
                          ? 'bg-slate-800 border-l-2 border-sky-400 text-white font-semibold'
                          : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => onSelectNote(s.path)}
                        className="flex-1 text-left truncate cursor-pointer"
                      >
                        {s.path.split('/').pop()?.replace('.md', '')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Standing Core Notes */}
            <div className="pt-3 border-t border-slate-800 space-y-0.5">
              <span className="px-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Standing Context
              </span>

              {[
                { path: 'Core/Presets.md', label: 'Presets.md', icon: Sliders, color: 'text-amber-400' },
                { path: 'Core/Profile.md', label: 'Profile.md', icon: User, color: 'text-sky-400' },
                { path: 'Core/Schedule.md', label: 'Schedule.md', icon: Calendar, color: 'text-amber-400' },
                { path: 'Core/Goals.md', label: 'Goals.md', icon: Target, color: 'text-emerald-400' },
                { path: 'Core/Welcome.md', label: 'Welcome.md', icon: Sparkles, color: 'text-purple-400' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNotePath === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => onSelectNote(item.path)}
                    className={`w-full px-2 py-1.5 rounded flex items-center gap-2 text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 border-l-2 border-amber-400 text-white font-semibold'
                        : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Non-Core Realm Hierarchy with Recursive Folder Actions */}
        {!isCore && (
          <div className="space-y-1">
            {/* Root Files (e.g. Tasks.md) */}
            {rootFiles.map((file) => {
              const isActive = activeNotePath === file.path;
              const isTaskFile = file.path.endsWith('Tasks.md');

              return (
                <div
                  key={file.path}
                  className={`group relative flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 border-l-2 border-blue-400 text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => onSelectNote(file.path)}
                    className="flex-1 flex items-center gap-2 text-left truncate cursor-pointer"
                  >
                    <FileText
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isTaskFile ? 'text-blue-400' : 'text-slate-300'
                      }`}
                    />
                    <span className="truncate">{file.title || file.path.split('/').pop()}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(
                        activeMenu?.path === file.path
                          ? null
                          : { id: file.path, type: 'file', path: file.path }
                      );
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-white cursor-pointer ml-1"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Subfolders in Realm (Recursively Nested) */}
            {rootFolders.map((folder) => renderFolderItem(folder, 0))}
          </div>
        )}
      </div>

      {/* Context Menu Dropdown for Move / Delete */}
      {activeMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 py-1 w-36 text-xs text-slate-200"
          style={{
            top: '40%',
            left: '50px',
          }}
        >
          <button
            onClick={() => {
              onMoveItem(activeMenu.type, activeMenu.path);
              setActiveMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-700 hover:text-white flex items-center gap-2 cursor-pointer"
          >
            <FolderInput className="w-3.5 h-3.5 text-blue-400" />
            <span>Move to...</span>
          </button>

          <button
            onClick={() => {
              if (
                confirm(
                  `Are you sure you want to delete ${
                    activeMenu.type === 'folder' ? 'folder and its contents' : 'file'
                  }?`
                )
              ) {
                onDeleteItem(activeMenu.type, activeMenu.path);
              }
              setActiveMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Footer: New Note Button */}
      <div className="p-2 border-t border-slate-800 bg-[#121318]/90">
        <button
          onClick={() => onOpenNewNoteModal()}
          className="w-full h-7 px-2.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-200" />
          <span>New Note</span>
        </button>
      </div>
    </aside>
  );
};
