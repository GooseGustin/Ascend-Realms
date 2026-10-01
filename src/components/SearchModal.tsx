import React, { useState } from 'react';
import { VaultFile } from '../types/vault';
import { Search, X, FileText, Calendar, Folder } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: VaultFile[];
  onSelectFile: (path: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q
    ? files
        .filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.path.toLowerCase().includes(q) ||
            f.content.toLowerCase().includes(q)
        )
        .slice(0, 8)
    : files.slice(0, 6);

  const handleSelect = (path: string) => {
    onSelectFile(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-24 p-4 select-none">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden space-y-0">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tasks, or content across all realms..."
            className="flex-1 text-xs text-slate-800 focus:outline-none bg-transparent font-medium"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching notes found for "{query}".
            </div>
          ) : (
            results.map((file) => {
              const isDaily = file.isDaily || file.path.startsWith('Core/Daily/');
              const isProject = file.isProject;

              return (
                <button
                  key={file.path}
                  onClick={() => handleSelect(file.path)}
                  className="w-full p-2.5 rounded-lg text-left hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isDaily ? (
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : isProject ? (
                      <Folder className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                        {file.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {file.path}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                    {file.realm}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Search backed by SQLite FTS5 index cache</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
