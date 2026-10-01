import React, { useState } from 'react';
import { ChecklistItem } from '../types/vault';
import {
  Check,
  Clock,
  ArrowRight,
  Trash2,
  CalendarCheck,
  CheckCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ReviewWidgetProps {
  pendingItems: ChecklistItem[];
  yesterdayDate: string;
  onTriageItem: (
    action: 'complete' | 'defer' | 'carry' | 'drop',
    item: ChecklistItem
  ) => void;
  onTriageAllCarry: () => void;
}

export const ReviewWidget: React.FC<ReviewWidgetProps> = ({
  pendingItems,
  yesterdayDate,
  onTriageItem,
  onTriageAllCarry,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Record<string, string>>({});

  if (pendingItems.length === 0) {
    return null;
  }

  const handleAction = (
    action: 'complete' | 'defer' | 'carry' | 'drop',
    item: ChecklistItem
  ) => {
    setAnimatingIds((prev) => ({ ...prev, [item.id]: action }));
    setTimeout(() => {
      onTriageItem(action, item);
      setAnimatingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }, 280);
  };

  return (
    <section className="mb-6 rounded-lg border border-[#cbd0db] bg-[#e4e6ea] p-4 shadow-sm">
      {/* Header */}
      <div className={`flex items-center justify-between ${isCollapsed ? '' : 'pb-3 border-b border-[#cbd0db] mb-3'}`}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs">
            <CalendarCheck className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <h2 className="font-semibold text-slate-900 text-sm tracking-tight">
            Yesterday's Review — {yesterdayDate}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono text-[10px] font-bold">
            {pendingItems.length} open
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriageAllCarry}
            className="text-xs font-medium text-amber-900 hover:text-amber-950 hover:bg-[#dadce3] px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Carry all forward</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Yesterday Review' : 'Collapse Yesterday Review'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Checklist items */}
      {!isCollapsed && (
        <div className="space-y-2">
          {pendingItems.map((item) => {
            const isAnimating = animatingIds[item.id];

            return (
              <div
                key={item.id}
                className={`p-2.5 rounded-md bg-[#edeff4] border border-[#cbd0db] flex items-center justify-between gap-3 text-xs transition-all duration-300 ${
                  isAnimating
                    ? 'opacity-0 translate-x-4 scale-95 pointer-events-none'
                    : 'hover:border-slate-400 hover:bg-[#f4f5f8] shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-400 font-semibold">↳</span>
                  <span className="text-slate-900 truncate font-medium">{item.text}</span>
                  {item.timeEstimate && (
                    <span className="font-mono text-[10px] text-slate-800 bg-[#cbd0db] px-1 py-0.2 rounded font-medium">
                      {item.timeEstimate}
                    </span>
                  )}
                  {item.carryCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 text-[10px] font-mono font-medium">
                      carried: {item.carryCount}x
                    </span>
                  )}
                </div>

                {/* Quick 4-Way Triage Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleAction('carry', item)}
                    title="Carry forward to Today's Daily Plan"
                    className="h-6 px-2 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-amber-400"
                  >
                    <ArrowRight className="w-3 h-3 text-amber-800" />
                    <span>Carry</span>
                  </button>

                  <button
                    onClick={() => handleAction('complete', item)}
                    title="Mark completed yesterday"
                    className="h-6 px-2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-emerald-300"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Done</span>
                  </button>

                  <button
                    onClick={() => handleAction('defer', item)}
                    title="Defer to Task Pool"
                    className="h-6 px-2 rounded bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-[#cbd0db]"
                  >
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>Defer</span>
                  </button>

                  <button
                    onClick={() => handleAction('drop', item)}
                    title="Drop task permanently"
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
