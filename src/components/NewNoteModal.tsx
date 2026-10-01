import React, { useState, useEffect } from 'react';
import { RealmConfig } from '../types/vault';
import { FileText, X } from 'lucide-react';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: RealmConfig;
  defaultFolder?: string;
  availableFolders: string[];
  onCreateNote: (folderPath: string, noteName: string) => void;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({
  isOpen,
  onClose,
  activeRealm,
  defaultFolder,
  availableFolders,
  onCreateNote,
}) => {
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState(defaultFolder || activeRealm.name);

  useEffect(() => {
    if (defaultFolder) {
      setFolder(defaultFolder);
    } else {
      setFolder(activeRealm.name);
    }
  }, [defaultFolder, activeRealm.name, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateNote(folder, title.trim());
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-800 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Create New Note</h3>
              <p className="text-[11px] text-slate-500">
                In <span className="font-semibold text-slate-800">{activeRealm.name}</span> realm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Note Title / Filename
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. system-architecture-notes"
              className="w-full h-8 px-3 text-xs rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-600 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Destination Folder
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-600 font-mono cursor-pointer"
            >
              {availableFolders.map((f) => (
                <option key={f} value={f}>
                  {f}/
                </option>
              ))}
            </select>
          </div>

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
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-colors cursor-pointer"
            >
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
