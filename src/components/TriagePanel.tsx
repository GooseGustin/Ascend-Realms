import React, { useState } from 'react';
import { TriageItem, RealmConfig, VaultFile } from '../types/vault';
import {
  Inbox,
  ArrowRight,
  ExternalLink,
  Plus,
  Send,
  FolderOpen,
  FileText,
  Check,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TriagePanelProps {
  items: TriageItem[];
  realms: RealmConfig[];
  files: VaultFile[];
  onDispatchItem: (
    itemId: string,
    itemText: string,
    targetRealmId: string,
    targetFilePath: string
  ) => void;
  onAddTriage: (text: string) => void;
  onClose: () => void;
}

export const TriagePanel: React.FC<TriagePanelProps> = ({
  items,
  realms,
  files,
  onDispatchItem,
  onAddTriage,
  onClose,
}) => {
  const [newCapture, setNewCapture] = useState('');
  const [selectedRealms, setSelectedRealms] = useState<Record<string, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, string>>({});
  const [dispatchedIds, setDispatchedIds] = useState<Record<string, boolean>>({});

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapture.trim()) return;
    onAddTriage(newCapture.trim());
    setNewCapture('');
  };

  const getTargetRealm = (itemId: string): string => {
    return selectedRealms[itemId] || 'coding';
  };

  const getFilesForRealm = (realmId: string): VaultFile[] => {
    return files.filter(
      (f) =>
        f.realm === realmId &&
        (f.path.endsWith('Tasks.md') || f.isProject || f.path.endsWith('.md'))
    );
  };

  const getTargetFile = (itemId: string, realmId: string): string => {
    if (selectedFiles[itemId]) return selectedFiles[itemId];
    const realmNotes = getFilesForRealm(realmId);
    const tasksNote = realmNotes.find((f) => f.path.endsWith('Tasks.md'));
    const firstProject = realmNotes.find((f) => f.isProject);
    return (tasksNote || firstProject || realmNotes[0])?.path || `${realmId}/Tasks.md`;
  };

  const handleDispatch = (item: TriageItem) => {
    const realmId = getTargetRealm(item.id);
    const filePath = getTargetFile(item.id, realmId);

    onDispatchItem(item.id, item.text, realmId, filePath);
    setDispatchedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setDispatchedIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }, 1200);
  };

  const pendingCount = items.filter((i) => !i.isTriaged).length;
  const triagedCount = items.filter((i) => i.isTriaged).length;

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
            <Inbox className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">
              Inbox Triage & Dispatcher
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {pendingCount} pending · {triagedCount} recently dispatched
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer border border-slate-700/60"
        >
          Close
        </button>
      </div>

      {/* Quick capture input at top (stamps current date and time) */}
      <div className="p-3 border-b border-slate-800 bg-[#121318]/50">
        <form onSubmit={handleAddSubmit} className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-200 flex items-center justify-between">
            <span>Quick Capture to Core/Inbox.md:</span>
            <span className="text-[10px] text-slate-400 font-mono">Saved with date/time</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newCapture}
              onChange={(e) => setNewCapture(e.target.value)}
              placeholder="Paste clip, task, or note URL..."
              className="flex-1 h-7 px-2.5 text-xs rounded border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newCapture.trim()}
              className="h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Triage Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No pending items in Core/Inbox.md.
            <br />
            Capture ideas on the fly and sort them here into target realms and files.
          </div>
        ) : (
          items.map((item) => {
            const currentRealmId = getTargetRealm(item.id);
            const availableFiles = getFilesForRealm(currentRealmId);
            const currentFilePath = getTargetFile(item.id, currentRealmId);
            const isDispatched = dispatchedIds[item.id] || item.isTriaged;

            // Render Dispatched Item (Fallen to bottom)
            if (item.isTriaged) {
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-md border border-emerald-800/60 bg-emerald-950/30 text-xs space-y-2 opacity-85 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-slate-300 line-through leading-relaxed flex-1 font-mono text-[11px]">
                      {item.text}
                    </div>
                    <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-semibold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Triaged</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-emerald-900/50">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>Saved: {item.savedAt || item.timestamp}</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      → {item.dispatchedTo || 'Target File'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 italic">
                    Noted as triaged in Inbox.md · Will disappear from panel after 1h (Settings)
                  </div>
                </div>
              );
            }

            // Render Untriaged Item
            return (
              <div
                key={item.id}
                className="p-3 rounded-md border border-slate-700 bg-slate-800/90 hover:bg-slate-800 hover:border-amber-500/60 transition-all shadow-md space-y-2.5 text-xs text-slate-200"
              >
                {/* Content Text */}
                <div className="text-white font-medium leading-relaxed">
                  {item.text}
                </div>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.sourceUrl}</span>
                  </a>
                )}

                {/* Saved Date & Time */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <span>Captured: {item.savedAt || item.timestamp}</span>
                </div>

                {/* Target Realm & File Selectors */}
                <div className="pt-2 border-t border-slate-700/80 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Target Realm
                    </label>
                    <select
                      value={currentRealmId}
                      onChange={(e) => {
                        const newRealm = e.target.value;
                        setSelectedRealms((prev) => ({
                          ...prev,
                          [item.id]: newRealm,
                        }));
                        const realmNotes = getFilesForRealm(newRealm);
                        if (realmNotes.length > 0) {
                          setSelectedFiles((prev) => ({
                            ...prev,
                            [item.id]: realmNotes[0].path,
                          }));
                        }
                      }}
                      className="w-full h-7 px-1.5 text-xs rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-blue-400 cursor-pointer"
                    >
                      {realms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                      Destination File
                    </label>
                    <select
                      value={currentFilePath}
                      onChange={(e) =>
                        setSelectedFiles((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="w-full h-7 px-1.5 text-xs rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:border-blue-400 truncate cursor-pointer font-mono"
                    >
                      {availableFiles.map((f) => (
                        <option key={f.path} value={f.path}>
                          {f.path.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => handleDispatch(item)}
                    disabled={isDispatched}
                    className={`h-7 px-3 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDispatched
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                    }`}
                  >
                    {isDispatched ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Dispatch to File</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
