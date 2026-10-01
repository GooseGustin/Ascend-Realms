import React, { useState } from 'react';
import { RealmConfig } from '../types/vault';
import { FolderPlus, Sparkles } from 'lucide-react';

interface NewProjectPanelProps {
  activeRealm: RealmConfig;
  onCreateProject: (realmId: string, projectName: string) => void;
  onClose: () => void;
}

export const NewProjectPanel: React.FC<NewProjectPanelProps> = ({
  activeRealm,
  onCreateProject,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject(activeRealm.id, name.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FolderPlus className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">New Project</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              In {activeRealm.name}/Projects/
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

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Project Name (Folder Name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. bun-sqlite-engine"
              className="w-full h-8 px-3 text-xs rounded border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 font-mono"
              autoFocus
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Direct child folder under <span className="font-mono text-slate-300">{activeRealm.name}/Projects/</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Initial Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary milestone or goal for this project initiative..."
              rows={3}
              className="w-full p-2.5 text-xs rounded border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none font-sans"
            />
          </div>

          <div className="p-3 bg-blue-950/40 rounded-lg border border-blue-800/60 text-[11px] text-blue-200 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Project Template Invariant (ADR-0021)</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Creates <code className="font-mono text-blue-300">index.md</code> and <code className="font-mono text-blue-300">Task.md</code> with standard YAML frontmatter, description block, and initial <code className="font-mono text-blue-300">## Tasks</code> section.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-colors cursor-pointer shadow-xs"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
