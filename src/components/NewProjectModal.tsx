import React, { useState } from 'react';
import { RealmConfig } from '../types/vault';
import { FolderPlus, X } from 'lucide-react';

interface NewProjectModalProps {
  activeRealm: RealmConfig;
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (realmId: string, projectName: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  activeRealm,
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject(activeRealm.id, name.trim());
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">New Project</h3>
              <p className="text-[11px] text-slate-500">
                Created in <span className="font-semibold text-blue-700">{activeRealm.name}</span>/Projects/
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Project Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. distributed-consensus-engine"
              className="w-full h-8 px-3 text-xs rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono"
              autoFocus
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Initializes an <code className="text-slate-600">index.md</code> landing note with frontmatter and tasks section.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
