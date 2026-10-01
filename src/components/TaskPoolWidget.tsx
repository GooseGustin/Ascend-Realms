import React, { useState } from 'react';
import { ChecklistItem, RealmConfig } from '../types/vault';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  ArrowRight,
  Plus,
  Trash2,
  FolderGit2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

interface TaskPoolWidgetProps {
  tasks: ChecklistItem[];
  activeRealm: RealmConfig;
  onCommitTask: (task: ChecklistItem) => void;
  onToggleTask: (task: ChecklistItem) => void;
  onRemoveTask: (task: ChecklistItem) => void;
  onQuickCapture: (text: string) => void;
}

export const TaskPoolWidget: React.FC<TaskPoolWidgetProps> = ({
  tasks,
  activeRealm,
  onCommitTask,
  onToggleTask,
  onRemoveTask,
  onQuickCapture,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [committedIds, setCommittedIds] = useState<Record<string, boolean>>({});

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickCapture(quickInput.trim());
    setQuickInput('');
  };

  const handleCommit = (task: ChecklistItem) => {
    onCommitTask(task);
    setCommittedIds((prev) => ({ ...prev, [task.id]: true }));
    setTimeout(() => {
      setCommittedIds((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }, 1500);
  };

  // Group tasks by project or source file
  const groups: Record<string, ChecklistItem[]> = {};
  for (const t of tasks) {
    let groupKey = '';
    if (activeRealm.kind === 'core') {
      groupKey = t.project ? `${t.realm} / ${t.project}` : `${t.realm} Workspace`;
    } else {
      groupKey = t.project ? t.project : 'Realm Master Tasks';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(t);
  }

  const openCount = tasks.filter((t) => !t.isDone).length;

  return (
    <section className="rounded-lg border border-[#cbd0db] bg-[#e4e6ea] shadow-sm overflow-hidden mb-6">
      {/* Header with Title, Quick Add, and Collapse Toggle */}
      <div className="p-3.5 border-b border-[#cbd0db] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#dadce3]">
        <div className="flex items-center justify-between md:justify-start gap-2 flex-1">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900 text-sm">
              Task Pool — {activeRealm.name} Workspace
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#cbd0db] text-slate-800 font-semibold">
              {openCount} open
            </span>
          </div>

          {/* Collapse Toggle Button (Mobile) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Task Pool' : 'Collapse Task Pool'}
            className="md:hidden p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Capture Input & Desktop Collapse Toggle */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder={`Add task to ${activeRealm.name}/Tasks.md...`}
              className="h-7 px-3 text-xs rounded border border-[#cbd0db] bg-[#edeff4] focus:bg-white focus:outline-none focus:border-blue-500 w-full sm:w-64 transition-all text-slate-900 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="h-7 px-2.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </form>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Task Pool' : 'Collapse Task Pool'}
            className="hidden md:flex p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Task Groups (hidden when collapsed) */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {Object.keys(groups).length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs italic">
              No open tasks found in this realm. Use the quick input above or open a project Task.md to add tasks.
            </div>
          ) : (
            Object.entries(groups).map(([groupName, groupTasks]) => (
              <div key={groupName} className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-700 pb-1 border-b border-[#cbd0db]">
                  <FolderGit2 className="w-3 h-3 text-slate-500" />
                  <span className="uppercase tracking-wider">{groupName}</span>
                  <span className="text-slate-500">({groupTasks.length})</span>
                </div>

                <div className="space-y-1.5">
                  {groupTasks.map((task) => {
                    const isCommitted = committedIds[task.id];

                    return (
                      <div
                        key={task.id}
                        className={`group p-2 rounded-md border flex items-center justify-between gap-3 text-xs transition-colors ${
                          task.isDone
                            ? 'bg-[#dcdfe5]/60 border-[#cbd0db]/60 text-slate-400'
                            : 'bg-[#edeff4] border-[#cbd0db] hover:border-slate-400 hover:bg-[#f4f5f8] text-slate-900 shadow-2xs'
                        }`}
                      >
                        {/* Checkbox & Task label */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => onToggleTask(task)}
                            className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            {task.isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <span
                            className={`truncate ${
                              task.isDone ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.text}
                          </span>

                          {task.timeEstimate && (
                            <span className="font-mono text-[10px] text-slate-600 bg-[#cbd0db] px-1.5 py-0.2 rounded shrink-0">
                              {task.timeEstimate}
                            </span>
                          )}

                          {task.carryCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono shrink-0">
                              carried: {task.carryCount}x
                            </span>
                          )}
                        </div>

                        {/* Actions: Commit to Daily & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCommit(task)}
                            title="Commit task to Today's Daily Note"
                            className={`h-6 px-2 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border ${
                              isCommitted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                : 'bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 border-[#cbd0db]'
                            }`}
                          >
                            {isCommitted ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Committed</span>
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-3 h-3" />
                                <span>Commit</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onRemoveTask(task)}
                            title="Remove task from note"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};
