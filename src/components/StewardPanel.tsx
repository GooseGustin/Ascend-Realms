import React, { useState } from 'react';
import { ChatMessage, RealmConfig, VaultFile } from '../types/vault';
import {
  ContextPackage,
  buildContextPackage,
  generateStewardSummary,
  sendStewardMessage,
} from '../services/stewardService';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileDiff,
  Check,
  X,
  FileText,
  HelpCircle,
  Flame,
} from 'lucide-react';

interface StewardPanelProps {
  activeRealm: RealmConfig;
  activeNote?: VaultFile;
  files: VaultFile[];
  onApplyDiff: (path: string, newContent: string) => void;
  onAppendToNote: (path: string, appendedContent: string) => void;
  onClose: () => void;
}

export const StewardPanel: React.FC<StewardPanelProps> = ({
  activeRealm,
  activeNote,
  files,
  onApplyDiff,
  onAppendToNote,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your Steward AI partner, scoped to the **${activeRealm.name}** workspace.\n\nI have assembled context from \`Profile.md\`, \`Schedule.md\`, \`Goals.md\`, and your active note. How can I assist your workflow today?`,
      timestamp: 'Just now',
      realmId: activeRealm.id,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Pre-assemble context
  const contextPackage = buildContextPackage(files, activeRealm, activeNote);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: 'Just now',
      realmId: activeRealm.id,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendStewardMessage(userMsg.content, contextPackage, messages);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        timestamp: 'Just now',
        realmId: activeRealm.id,
        diffProposal: result.diffProposal,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiff = (msgId: string, path: string, proposed: string) => {
    onApplyDiff(path, proposed);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.diffProposal
          ? { ...m, diffProposal: { ...m.diffProposal, approved: true } }
          : m
      )
    );
  };

  const handleAppendSummary = async () => {
    if (!activeNote) return;
    setIsSummarizing(true);
    try {
      const summaryText = await generateStewardSummary(activeNote, contextPackage);
      onAppendToNote(activeNote.path, summaryText);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">
              Steward AI — {activeRealm.name}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              App-driven context retrieval
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

      {/* Context Assembly Inspector Accordion */}
      <div className="border-b border-slate-800 bg-[#121318]/50 text-xs">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full px-3 py-2 flex items-center justify-between text-slate-300 hover:text-white cursor-pointer"
        >
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Assembled Prompt Context</span>
          </div>
          {showContext ? (
            <ChevronDown className="w-3 h-3 text-slate-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-400" />
          )}
        </button>

        {showContext && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-[11px] font-mono max-h-48 overflow-y-auto text-slate-300">
            <div>
              <span className="font-semibold text-white">Active Scope:</span>{' '}
              {contextPackage.activeRealm} ({contextPackage.realmPurpose})
            </div>
            <div>
              <span className="font-semibold text-white">Active Note:</span>{' '}
              {contextPackage.activeNotePath}
            </div>
            <div>
              <span className="font-semibold text-white">Recent Carried Velocity:</span>{' '}
              {contextPackage.recentCarriedTasks.length > 0
                ? contextPackage.recentCarriedTasks.join(' | ')
                : 'Zero carried drift'}
            </div>
            <div>
              <span className="font-semibold text-white">Injected Sources:</span>{' '}
              Core/Profile.md, Schedule.md, Goals.md, Daily Notes
            </div>
          </div>
        )}
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col space-y-1.5 ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                {isUser ? <span className="text-blue-300 font-medium">You</span> : <span className="text-amber-300 font-medium">Steward</span>}
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] p-3 rounded-lg text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600/30 border border-blue-500/50 text-blue-100 rounded-br-2xs shadow-sm'
                    : 'bg-slate-800/90 text-slate-100 rounded-bl-2xs border border-slate-700 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Proposal Diff Card */}
                {msg.diffProposal && (
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-blue-300">
                      <FileDiff className="w-3.5 h-3.5 text-blue-400" />
                      <span>Proposed Note Modification: {msg.diffProposal.path}</span>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] max-h-36 overflow-y-auto text-slate-200">
                      <div className="text-emerald-400 font-semibold mb-1">
                        + Proposed Changes:
                      </div>
                      <pre className="whitespace-pre-wrap text-[10px] text-emerald-300">
                        {msg.diffProposal.proposed}
                      </pre>
                    </div>

                    {msg.diffProposal.approved ? (
                      <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Diff applied to note on disk</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() =>
                            handleApplyDiff(
                              msg.id,
                              msg.diffProposal!.path,
                              msg.diffProposal!.proposed
                            )
                          }
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve & Apply</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>Steward is assembling context and thinking...</span>
          </div>
        )}
      </div>

      {/* Action Footer: Append Summary & Input Form */}
      <div className="p-3 border-t border-slate-800 bg-[#121318]/90 space-y-2">
        {activeNote && messages.some((m) => m.role === 'assistant' && m.id !== 'init-1') && (
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={handleAppendSummary}
              disabled={isSummarizing}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>{isSummarizing ? 'Generating summary...' : 'Append summary to note'}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Steward about ${activeRealm.name}...`}
            className="flex-1 h-8 px-3 text-xs rounded border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
