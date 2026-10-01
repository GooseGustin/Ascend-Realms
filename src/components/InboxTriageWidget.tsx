import React, { useState } from 'react';
import { TriageItem, RealmConfig } from '../types/vault';
import {
  Inbox,
  ArrowRight,
  ExternalLink,
  Archive,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InboxTriageWidgetProps {
  items: TriageItem[];
  realms: RealmConfig[];
  onDispatch: (itemId: string, itemText: string, targetRealm: string, targetFile: string) => void;
  onAddTriage: (text: string) => void;
}

export const InboxTriageWidget: React.FC<InboxTriageWidgetProps> = ({
  items,
  realms,
  onDispatch,
  onAddTriage,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newCapture, setNewCapture] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapture.trim()) return;
    onAddTriage(newCapture.trim());
    setNewCapture('');
  };

  const pendingItems = items.filter((i) => !i.isTriaged);
  const triagedItems = items.filter((i) => i.isTriaged);

  return (
    <section className="rounded-lg border border-[#cbd0db] bg-[#e4e6ea] shadow-sm overflow-hidden mb-6">
      <div className="p-3.5 border-b border-[#cbd0db] flex items-center justify-between bg-[#dadce3]">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-amber-600" />
          <h2 className="font-semibold text-slate-900 text-sm">
            Inbox Triage & Web Capture
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold">
            {pendingItems.length} unfiled
          </span>
          {triagedItems.length > 0 && (
            <span className="text-[10px] font-mono text-slate-500">
              ({triagedItems.length} triaged)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            One-click Realm sorting
          </span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Inbox Triage' : 'Collapse Inbox Triage'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Quick Capture Bar */}
          <div className="p-3 bg-[#dcdfe6] border-b border-[#cbd0db]">
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                type="text"
                value={newCapture}
                onChange={(e) => setNewCapture(e.target.value)}
                placeholder="Capture raw thought, url, snippet into Core/Inbox.md..."
                className="flex-1 h-8 px-3 text-xs rounded border border-[#cbd0db] bg-[#edeff4] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-amber-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newCapture.trim()}
                className="h-8 px-3 rounded bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Capture</span>
              </button>
            </form>
          </div>

          {/* Triage Items List */}
          <div className="p-4 space-y-2.5">
            {items.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs italic">
                No items pending triage. Capture unfiled thoughts or snippets above.
              </div>
            ) : (
              items.map((item) => {
                if (item.isTriaged) {
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg border border-[#cbd0db]/70 bg-[#dcdfe5]/60 flex items-center justify-between gap-3 text-xs opacity-60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-through text-slate-500 truncate">{item.text}</span>
                        {item.savedAt && (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{item.savedAt}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                        Triaged → {item.dispatchedTo || 'Realm'}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-[#cbd0db] bg-[#edeff4] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:border-slate-400 hover:bg-[#f4f5f8] transition-colors shadow-2xs"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-medium">{item.text}</span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 text-[11px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Source</span>
                          </a>
                        )}
                      </div>

                      {item.savedAt && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Saved: {item.savedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Dispatch Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <button
                        onClick={() =>
                          onDispatch(
                            item.id,
                            item.text,
                            'coding',
                            'Coding/Projects/bun-sqlite-engine/Task.md'
                          )
                        }
                        className="px-2 py-1 rounded bg-[#dadce3] hover:bg-blue-100 text-blue-900 border border-[#cbd0db] font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        → Coding
                      </button>
                      <button
                        onClick={() =>
                          onDispatch(
                            item.id,
                            item.text,
                            'studying',
                            'Studying/Projects/distributed-systems/Task.md'
                          )
                        }
                        className="px-2 py-1 rounded bg-[#dadce3] hover:bg-emerald-100 text-emerald-900 border border-[#cbd0db] font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        → Studying
                      </button>
                      <button
                        onClick={() =>
                          onDispatch(
                            item.id,
                            item.text,
                            'writing',
                            'Writing/Projects/local-first-architecture/Task.md'
                          )
                        }
                        className="px-2 py-1 rounded bg-[#dadce3] hover:bg-amber-100 text-amber-900 border border-[#cbd0db] font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        → Writing
                      </button>
                      <button
                        onClick={() =>
                          onDispatch(
                            item.id,
                            item.text,
                            'core',
                            'Core/Inbox.md'
                          )
                        }
                        title="Archive in Core Inbox"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-[#cdd1dc] cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </section>
  );
};
