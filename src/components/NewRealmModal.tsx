import React, { useState, useEffect } from 'react';
import { Layers, X, Sparkles, RefreshCw, Palette } from 'lucide-react';
import { REALM_COLOR_PALETTES, RealmColorPalette } from '../services/vaultStore';

interface NewRealmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRealm: (
    name: string,
    purpose: string,
    accent?: string,
    background?: string
  ) => void;
}

export const NewRealmModal: React.FC<NewRealmModalProps> = ({
  isOpen,
  onClose,
  onCreateRealm,
}) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [assignedPalette, setAssignedPalette] = useState<RealmColorPalette>(
    REALM_COLOR_PALETTES[0]
  );

  // Pick a random realm colour each time the modal opens
  useEffect(() => {
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * REALM_COLOR_PALETTES.length);
      setAssignedPalette(REALM_COLOR_PALETTES[randomIndex]);
    }
  }, [isOpen]);

  const handleShuffleColor = () => {
    let nextIndex = Math.floor(Math.random() * REALM_COLOR_PALETTES.length);
    if (REALM_COLOR_PALETTES[nextIndex].accent === assignedPalette.accent) {
      nextIndex = (nextIndex + 1) % REALM_COLOR_PALETTES.length;
    }
    setAssignedPalette(REALM_COLOR_PALETTES[nextIndex]);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateRealm(
      name.trim(),
      purpose.trim() || 'Custom operational domain',
      assignedPalette.accent,
      assignedPalette.darkHue
    );
    setName('');
    setPurpose('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-6 space-y-4 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: assignedPalette.darkHue, color: assignedPalette.accent }}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 shadow-xs"
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                Create New Realm
              </h3>
              <p className="text-xs text-slate-400">
                A long-lived operational scope with its own notes & identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Realm Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Research, Philosophy, Business, Health"
              className="w-full h-9 px-3 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Purpose & Intent (Read by Steward AI)
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What focus or outcome belongs in this realm? e.g. Systematic synthesis of peer-reviewed papers on distributed systems..."
              rows={3}
              className="w-full p-3 text-xs rounded-lg border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>

          {/* Random Realm Colour Badge & Re-roll */}
          <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{ backgroundColor: assignedPalette.accent }}
                className="w-4 h-4 rounded-full ring-2 ring-white/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-300" />
                  <span>Random Realm Colour: {assignedPalette.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Accent: <code className="font-mono text-slate-200">{assignedPalette.accent}</code></span>
                  <span>·</span>
                  <span>Dark hue: <code className="font-mono text-slate-200">{assignedPalette.darkHue}</code></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShuffleColor}
              title="Grant another random realm colour"
              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-600"
            >
              <RefreshCw className="w-3 h-3 text-slate-200" />
              <span>Shuffle</span>
            </button>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Creating a Realm automatically generates a directory at{' '}
              <code className="font-mono text-slate-100">/{'{Name}'}/</code> containing{' '}
              <code className="font-mono text-slate-100">Tasks.md</code> and a{' '}
              <code className="font-mono text-slate-100">Projects/</code> container with its dedicated realm color theme.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{ backgroundColor: assignedPalette.accent }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer font-sans shadow-md"
            >
              Initialize Realm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
