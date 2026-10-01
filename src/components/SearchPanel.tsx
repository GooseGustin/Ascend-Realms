import React, { useState } from 'react';
import { VaultFile } from '../types/vault';
import { Search, FileText, Calendar, Folder, ArrowRight } from 'lucide-react';

interface SearchPanelProps {
  files: VaultFile[];
  onSelectFile: (path: string) => void;
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  files,
  onSelectFile,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();
  const results = q
    ? files
        .filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.path.toLowerCase().includes(q) ||
            f.content.toLowerCase().includes(q)
        )
        .slice(0, 15)
    : files.slice(0, 10);

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">Search Vault</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              FTS5 & checklist index
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

      {/* Search Input Field */}
      <div className="p-3 border-b border-slate-800 bg-[#121318]/50">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, tasks, block IDs..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 font-medium"
            autoFocus
          />
          <Search className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {results.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No matching files found for "{query}".
          </div>
        ) : (
          results.map((file) => {
            const isDaily = file.isDaily || file.path.startsWith('Core/Daily/');
            const isProject = file.isProject;

            return (
              <button
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                className="w-full p-2.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 text-left transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer group text-slate-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isDaily ? (
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : isProject ? (
                    <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="font-semibold text-white group-hover:text-blue-400 truncate">
                      {file.title}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {file.path}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 uppercase border border-slate-600">
                    {file.realm}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
