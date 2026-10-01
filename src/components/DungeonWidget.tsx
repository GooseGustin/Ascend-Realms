import React, { useState, useEffect } from 'react';
import { FocusPreset, FocusSessionRecord, RealmConfig } from '../types/vault';
import { vault } from '../services/vaultStore';
import {
  Lock,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  Settings,
  Plus,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DungeonWidgetProps {
  activeRealm: RealmConfig;
  onSessionComplete: (record: FocusSessionRecord) => void;
  onOpenSettings?: () => void;
}

export const DungeonWidget: React.FC<DungeonWidgetProps> = ({
  activeRealm,
  onSessionComplete,
  onOpenSettings,
}) => {
  const presets = vault.getPresets();
  const [selectedPresetName, setSelectedPresetName] = useState<string>(presets[0]?.name || 'Deep');

  // Find current preset
  const selectedPreset = presets.find((p) => p.name === selectedPresetName) || presets[0];

  const [secondsRemaining, setSecondsRemaining] = useState(
    (selectedPreset?.suggestedDurationMinutes || 50) * 60
  );
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [interruptions, setInterruptions] = useState(0);
  const [overrides, setOverrides] = useState(0);

  // Soft block site add input
  const [newSoftInput, setNewSoftInput] = useState('');

  // Soft block challenge modal state
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTargetDomain, setChallengeTargetDomain] = useState<string>('youtube.com');
  const [typedPhrase, setTypedPhrase] = useState('');
  const [phraseError, setPhraseError] = useState(false);

  // Total session target seconds
  const totalDurationSeconds = (selectedPreset?.suggestedDurationMinutes || 50) * 60;

  // Timer loop
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      handleCompleteSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleStart = () => {
    if (!sessionStartTime) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      setSessionStartTime(timeStr);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    setInterruptions((prev) => prev + 1);
  };

  const handleReset = (preset = selectedPreset) => {
    setIsRunning(false);
    setSecondsRemaining((preset?.suggestedDurationMinutes || 50) * 60);
    setSessionStartTime(null);
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPresetName(presetName);
    const p = presets.find((item) => item.name === presetName);
    if (p) {
      handleReset(p);
    }
  };

  const handleUpdateDuration = (mins: number) => {
    const validMins = Math.max(1, mins);
    vault.updatePreset(selectedPreset.name, { suggestedDurationMinutes: validMins });
    if (!isRunning) {
      setSecondsRemaining(validMins * 60);
    }
  };

  const handleAddSoftSite = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSoftInput.trim().toLowerCase();
    if (!clean || selectedPreset.soft.includes(clean)) return;
    const nextSoft = [...selectedPreset.soft, clean];
    const nextBlocklist = Array.from(new Set([...selectedPreset.blocklist, clean]));
    vault.updatePreset(selectedPreset.name, { soft: nextSoft, blocklist: nextBlocklist });
    setNewSoftInput('');
  };

  const handleRemoveSoftSite = (site: string) => {
    const nextSoft = selectedPreset.soft.filter((s) => s !== site);
    vault.updatePreset(selectedPreset.name, { soft: nextSoft });
  };

  const handleCompleteSession = () => {
    setIsRunning(false);
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
    setChallengeTargetDomain(domain);
    setTypedPhrase('');
    setPhraseError(false);
    setShowChallengeModal(true);
  };

  const handleVerifyChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedPhrase.trim() === selectedPreset.phrase.trim()) {
      setOverrides((prev) => prev + 1);
      setShowChallengeModal(false);
      setTypedPhrase('');
    } else {
      setPhraseError(true);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isPaused = !isRunning && secondsRemaining < totalDurationSeconds;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Combined allowlist
  const effectiveAllowlist = [
    ...(activeRealm.allowlist || []),
    ...(selectedPreset?.allowlist || []),
  ];

  return (
    <section className="rounded-lg border border-[#cbd0db] bg-[#e4e6ea] shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-3.5 border-b border-[#cbd0db] flex items-center justify-between bg-[#dadce3]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-800 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-semibold text-slate-900 text-sm">Focus / Dungeon Mode</h2>
          {isRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono text-[10px] font-bold animate-pulse">
              <Flame className="w-3 h-3 text-amber-700" />
              <span>Active ({selectedPreset.name})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1 bg-[#c8ccd6] p-0.5 rounded border border-[#b8bcc8] text-xs font-mono">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset.name)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedPreset.name === preset.name
                    ? 'bg-[#edeff4] text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Focus Dungeon' : 'Collapse Focus Dungeon'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Timer Clock Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#edeff4] rounded-lg border border-[#cbd0db] shadow-2xs">
          <div
            className={`font-mono text-4xl font-bold tracking-tight text-slate-900 mb-2 tabular-nums ${
              isRunning ? 'timer-ticking text-amber-800' : ''
            }`}
          >
            {timeFormatted}
          </div>

          {/* Quick Timer Duration Modifier */}
          <div className="flex items-center gap-1.5 mb-3 text-[11px] font-mono text-slate-600">
            <span>Duration:</span>
            <input
              type="number"
              min={1}
              max={240}
              value={selectedPreset.suggestedDurationMinutes}
              onChange={(e) => handleUpdateDuration(parseInt(e.target.value) || 1)}
              className="w-12 h-5 text-center font-bold rounded border border-[#cbd0db] bg-[#f8f9fb] focus:outline-none focus:border-amber-600 text-xs text-slate-900"
            />
            <span>min</span>
            <button
              onClick={() =>
                handleUpdateDuration(selectedPreset.suggestedDurationMinutes + 5)
              }
              title="Add 5 minutes"
              className="px-1.5 py-0.2 rounded bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 cursor-pointer text-[10px] font-medium"
            >
              +5m
            </button>
            <button
              onClick={() =>
                handleUpdateDuration(Math.max(5, selectedPreset.suggestedDurationMinutes - 5))
              }
              title="Subtract 5 minutes"
              className="px-1.5 py-0.2 rounded bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 cursor-pointer text-[10px] font-medium"
            >
              -5m
            </button>
          </div>

          {/* User Request 7: Start / Resume / Pause button, and a single Done button without redundant duplicate Restart icon */}
          <div className="flex items-center gap-2 text-xs">
            {isRunning ? (
              <button
                onClick={handlePause}
                className="h-8 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={handleStart}
                className="h-8 px-4 rounded-md bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="h-8 px-4 rounded-md bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Session</span>
              </button>
            )}

            {/* Single Done / Complete button */}
            <button
              onClick={handleCompleteSession}
              title={isPaused || isRunning ? 'Finish & log focus session' : 'Reset timer'}
              className="h-8 px-3 rounded-md border border-[#cbd0db] bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* Rule Resolution Details: Hard vs Soft sites */}
        <div className="space-y-2.5 text-xs">
          <div className="text-slate-800 font-medium flex items-center justify-between">
            <span className="font-semibold text-slate-900">Distraction Barrier Controls</span>
            <span className="font-mono text-[11px] text-slate-600">
              Overrides: {overrides}
            </span>
          </div>

          {/* Hard Blocked Sites (Modified in Settings) */}
          <div className="p-2.5 rounded bg-rose-100/60 border border-rose-300 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-950 flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-600" />
                <span>Hard Blocked:</span>
              </span>
            </div>
            <div className="font-mono text-rose-900 text-[11px] break-words">
              {selectedPreset.hard.length > 0
                ? selectedPreset.hard.join(', ')
                : 'No hard blocked sites in this preset'}
            </div>
          </div>

          {/* Soft Blocked Sites (Editable directly here) */}
          <div className="p-2.5 rounded bg-amber-100/60 border border-amber-300 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-950 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-700" />
                <span>Soft Blocked Sites (Edit below):</span>
              </span>
              <span className="text-amber-800 font-mono text-[10px]">Challenge deterrent</span>
            </div>

            {/* Soft site chips */}
            <div className="flex flex-wrap gap-1">
              {selectedPreset.soft.map((site) => (
                <span
                  key={site}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-mono text-[10px]"
                >
                  <span>{site}</span>
                  <button
                    onClick={() => handleRemoveSoftSite(site)}
                    title="Remove soft block"
                    className="hover:text-amber-950 p-0.2 rounded cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add soft block site input */}
            <form onSubmit={handleAddSoftSite} className="flex items-center gap-1 pt-0.5">
              <input
                type="text"
                value={newSoftInput}
                onChange={(e) => setNewSoftInput(e.target.value)}
                placeholder="Add soft site (e.g. reddit.com)..."
                className="flex-1 h-6 px-2 text-[11px] rounded border border-amber-300 bg-[#f8f9fb] font-mono focus:outline-none focus:border-amber-600 text-slate-900 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!newSoftInput.trim()}
                className="h-6 px-2 rounded bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-medium text-[10px] cursor-pointer"
              >
                + Add
              </button>
            </form>
          </div>

          {/* Test Soft-Block Simulator */}
          <div className="pt-0.5">
            <span className="text-[10px] text-slate-600 font-medium">Test Soft Challenge:</span>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {(selectedPreset.soft.length > 0 ? selectedPreset.soft : ['youtube.com']).map(
                (domain) => (
                  <button
                    key={domain}
                    onClick={() => handleTriggerChallenge(domain)}
                    className="px-2 py-0.5 rounded bg-[#dadce3] hover:bg-[#cdd1dc] text-slate-800 font-mono text-[10px] transition-colors cursor-pointer border border-[#cbd0db]"
                  >
                    Visit {domain}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Soft-Block Deterrent Challenge</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are attempting to visit{' '}
              <span className="font-mono font-semibold text-slate-900">
                {challengeTargetDomain}
              </span>{' '}
              during active focus ({selectedPreset.name} Preset).
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <span className="font-semibold text-amber-900 block mb-1">
                Required Penalty Phrase:
              </span>
              <p className="font-mono text-slate-800 italic select-all">
                "{selectedPreset.phrase}"
              </p>
            </div>

            <form onSubmit={handleVerifyChallenge} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Type phrase exactly to proceed:
                </label>
                <input
                  type="text"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder="Type the exact phrase above..."
                  className="w-full h-8 px-2.5 rounded border border-slate-300 font-mono text-xs focus:outline-none focus:border-amber-600"
                  autoFocus
                />
                {phraseError && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Phrase does not match. Stay focused!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="h-8 px-3 rounded text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Return to Focus
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs shadow-xs cursor-pointer"
                >
                  Override Barrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
