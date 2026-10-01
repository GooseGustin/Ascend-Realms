import React, { useState } from 'react';
import { FolderInput, X, AlertCircle } from 'lucide-react';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'file' | 'folder';
  sourcePath: string;
  realmName: string;
  availableFolders: string[];
  onMove: (sourcePath: string, targetFolderPath: string) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  itemType,
  sourcePath,
  realmName,
  availableFolders,
  onMove,
}) => {
  // Exclude folder moving into itself or children
  const validFolders = availableFolders.filter((f) => {
    if (itemType === 'folder') {
      return f !== sourcePath && !f.startsWith(`${sourcePath}/`);
    }
    return true;
  });

  const [destination, setDestination] = useState(validFolders[0] || realmName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    onMove(sourcePath, destination);
    onClose();
  };

  const displayName = sourcePath.split('/').pop() || sourcePath;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center">
              <FolderInput className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Move {itemType === 'file' ? 'File' : 'Folder'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                {displayName}
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
              Select Destination Folder (within {realmName} realm)
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono cursor-pointer"
            >
              {validFolders.map((f) => (
                <option key={f} value={f}>
                  {f}/
                </option>
              ))}
            </select>
          </div>

          <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 text-[11px] text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Per workspace rules, items can only be moved within the <span className="font-semibold">{realmName}</span> realm to maintain directory authority.
            </span>
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
              className="px-4 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Move {itemType === 'file' ? 'File' : 'Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
