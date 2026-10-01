import React, { useState, useEffect } from 'react';
import { FocusPreset, FocusSessionRecord, RealmConfig } from '../types/vault';
import { vault } from '../services/vaultStore';
import {
  Lock,
  Play,
  Pause,
  RotateCcw,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
  Settings,
  Plus,
  X,
  CheckCircle,
} from 'lucide-react';

interface DungeonPanelProps {
  activeRealm: RealmConfig;
  onSessionComplete: (record: FocusSessionRecord) => void;
  onClose: () => void;
}

export const DungeonPanel: React.FC<DungeonPanelProps> = ({
  activeRealm,
  onSessionComplete,
  onClose,
}) => {
  const presets = vault.getPresets();
  const [selectedPresetName, setSelectedPresetName] = useState<string>(presets[0]?.name || 'Deep');
  const selectedPreset = presets.find((p) => p.name === selectedPresetName) || presets[0];

  const [secondsRemaining, setSecondsRemaining] = useState(
    (selectedPreset?.suggestedDurationMinutes || 50) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [interruptions, setInterruptions] = useState(0);
  const [overrides, setOverrides] = useState(0);

  // Soft-block site adding
  const [newSoftInput, setNewSoftInput] = useState('');

  // Soft-block challenge modal
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeDomain, setChallengeDomain] = useState('youtube.com');
  const [typedPhrase, setTypedPhrase] = useState('');
  const [phraseError, setPhraseError] = useState(false);

  const totalDurationSeconds = (selectedPreset?.suggestedDurationMinutes || 50) * 60;

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      handleCompleteSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleSelectPreset = (name: string) => {
    setSelectedPresetName(name);
    const p = presets.find((item) => item.name === name);
    if (p) {
      setIsRunning(false);
      setSecondsRemaining(p.suggestedDurationMinutes * 60);
      setSessionStartTime(null);
    }
  };

  const handleStart = () => {
    if (!isRunning) {
      if (!sessionStartTime) {
        const now = new Date();
        setSessionStartTime(
          `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}`
        );
      }
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    setInterruptions((prev) => prev + 1);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining((selectedPreset?.suggestedDurationMinutes || 50) * 60);
    setSessionStartTime(null);
    setInterruptions(0);
    setOverrides(0);
  };

  const handleUpdateDuration = (mins: number) => {
    const valid = Math.max(1, Math.min(240, mins));
    vault.updatePresetDuration(selectedPreset.name, valid);
    if (!isRunning) {
      setSecondsRemaining(valid * 60);
    }
  };

  const handleAddSoftSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSoftInput.trim()) return;
    vault.addSoftBlockedSite(selectedPreset.name, newSoftInput.trim().toLowerCase());
    setNewSoftInput('');
  };

  const handleRemoveSoftSite = (site: string) => {
    vault.removeSoftBlockedSite(selectedPreset.name, site);
  };

  const handleCompleteSession = () => {
    const now = new Date();
    const endTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const startTimeStr = sessionStartTime || endTimeStr;

    const totalMinutes = Math.max(
      1,
      Math.round((totalDurationSeconds - secondsRemaining) / 60)
    );

    const record: FocusSessionRecord = {
      id: `session-${Date.now()}`,
      date: '2026-09-22',
      timeRange: `${startTimeStr}–${endTimeStr}`,
      realm: activeRealm.name,
      preset: selectedPreset.name,
      durationMinutes: totalMinutes,
      interruptions,
      overrides,
    };

    onSessionComplete(record);
    handleReset();
  };

  const handleTriggerChallenge = (domain: string) => {
    setChallengeDomain(domain);
    setTypedPhrase('');
    setPhraseError(false);
    setShowChallenge(true);
  };

  const handleVerifyChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedPhrase.trim() === selectedPreset.phrase.trim()) {
      setOverrides((prev) => prev + 1);
      setShowChallenge(false);
      setTypedPhrase('');
    } else {
      setPhraseError(true);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isPaused = !isRunning && secondsRemaining < totalDurationSeconds;

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">Focus Dungeon</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Presets & timer controls
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Preset Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Select Focus Preset
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset.name)}
                className={`py-1 rounded text-center transition-colors cursor-pointer ${
                  selectedPreset.name === preset.name
                    ? 'bg-slate-750 text-white font-bold shadow-xs border border-slate-600'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {preset.name} ({preset.suggestedDurationMinutes}m)
              </button>
            ))}
          </div>
        </div>

        {/* Big Countdown Timer with Inline Duration Modifiers */}
        <div className="p-5 bg-slate-850 rounded-xl border border-slate-750 flex flex-col items-center justify-center text-center space-y-2.5 shadow-md">
          {isRunning && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold animate-pulse">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Dungeon Active ({selectedPreset.name})</span>
            </div>
          )}

          <div
            className={`font-mono text-5xl font-bold tracking-tight text-white tabular-nums ${
              isRunning ? 'timer-ticking text-amber-400' : ''
            }`}
          >
            {timeFormatted}
          </div>

          {/* Quick Timer Duration Modifier */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <span>Timer:</span>
            <input
              type="number"
              min={1}
              max={240}
              value={selectedPreset.suggestedDurationMinutes}
              onChange={(e) => handleUpdateDuration(parseInt(e.target.value) || 1)}
              className="w-12 h-6 text-center font-bold rounded border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-amber-400"
            />
            <span>min</span>
            <button
              onClick={() =>
                handleUpdateDuration(selectedPreset.suggestedDurationMinutes + 5)
              }
              title="Add 5 minutes"
              className="px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-200 cursor-pointer text-[10px] border border-slate-600"
            >
              +5m
            </button>
            <button
              onClick={() =>
                handleUpdateDuration(Math.max(5, selectedPreset.suggestedDurationMinutes - 5))
              }
              title="Subtract 5 minutes"
              className="px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-200 cursor-pointer text-[10px] border border-slate-600"
            >
              -5m
            </button>
          </div>

          {/* Timer Actions: Resume / Pause / Start, single Done button */}
          <div className="flex items-center gap-2 pt-1">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="h-8 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border border-slate-700"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={handleStart}
                className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="h-8 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session</span>
              </button>
            )}

            {/* Single Done button */}
            <button
              onClick={handleCompleteSession}
              title={isPaused || isRunning ? 'Finish & log session' : 'Reset timer'}
              className="h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* Blocking Rules Details */}
        <div className="space-y-3 text-xs">
          {/* Hard Blocked */}
          <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-800/60 space-y-1.5 text-rose-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-300 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Hard Blocked Sites:</span>
              </span>
            </div>
            <div className="font-mono text-rose-200 text-[11px] break-words">
              {selectedPreset.hard.length > 0
                ? selectedPreset.hard.join(', ')
                : 'No hard blocked sites in this preset'}
            </div>
          </div>

          {/* Soft Blocked Sites */}
          <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-800/60 space-y-2 text-amber-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Soft Blocked Sites (Edit below):</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Friction challenge</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {selectedPreset.soft.map((site) => (
                <span
                  key={site}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 font-mono text-[11px] border border-amber-700/60"
                >
                  <span>{site}</span>
                  <button
                    onClick={() => handleRemoveSoftSite(site)}
                    title="Remove soft block"
                    className="hover:text-white p-0.2 rounded cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add soft block site input */}
            <form onSubmit={handleAddSoftSite} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSoftInput}
                onChange={(e) => setNewSoftInput(e.target.value)}
                placeholder="Add soft domain (e.g. reddit.com)..."
                className="flex-1 h-7 px-2.5 text-xs rounded border border-amber-700/80 bg-slate-900 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!newSoftInput.trim()}
                className="h-7 px-2.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium text-xs cursor-pointer transition-colors"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Penalty Phrase Preview */}
          <div className="p-3 bg-slate-850 rounded-lg border border-slate-750 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Penalty Phrase Deterrent:</span>
            </div>
            <p className="font-mono text-slate-300 text-[11px] italic">
              "{selectedPreset.phrase}"
            </p>
          </div>
        </div>

        {/* Soft-Block Simulation */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-300 block mb-1">
            Test Soft-Block Challenge Deterrent:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(selectedPreset.soft.length > 0 ? selectedPreset.soft : ['youtube.com']).map(
              (site) => (
                <button
                  key={site}
                  onClick={() => handleTriggerChallenge(site)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-[11px] transition-colors cursor-pointer border border-slate-700"
                >
                  Simulate {site}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallenge && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-2xl border border-slate-750 p-5 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Soft-Block Deterrent Challenge</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are attempting to visit{' '}
              <span className="font-mono font-semibold text-white">{challengeDomain}</span>{' '}
              during active focus ({selectedPreset.name} Preset).
            </p>

            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200">
              <span className="font-semibold text-amber-300 block mb-1">
                Required Penalty Phrase:
              </span>
              <p className="font-mono text-white italic select-all">
                "{selectedPreset.phrase}"
              </p>
            </div>

            <form onSubmit={handleVerifyChallenge} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-200 mb-1">
                  Type phrase exactly to proceed:
                </label>
                <input
                  type="text"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder="Type the exact phrase above..."
                  className="w-full h-8 px-2.5 rounded border border-slate-700 bg-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {phraseError && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    Phrase does not match. Stay focused!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallenge(false)}
                  className="h-8 px-3 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Return to Focus
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  Override Barrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
