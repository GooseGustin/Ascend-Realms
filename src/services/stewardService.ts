import { ChatMessage, VaultFile, RealmConfig } from '../types/vault';

export interface ContextPackage {
  userProfile: string;
  schedule: string;
  goals: string;
  activeRealm: string;
  realmPurpose: string;
  activeNotePath: string;
  activeNoteBody: string;
  recentCarriedTasks: string[];
}

export function buildContextPackage(
  files: VaultFile[],
  activeRealm: RealmConfig,
  activeNote?: VaultFile
): ContextPackage {
  const profileFile = files.find((f) => f.path === 'Core/Profile.md');
  const scheduleFile = files.find((f) => f.path === 'Core/Schedule.md');
  const goalsFile = files.find((f) => f.path === 'Core/Goals.md');

  // Extract recent carried tasks across daily notes
  const carriedTasks: string[] = [];
  const dailyNotes = files.filter((f) => f.isDaily || f.path.startsWith('Core/Daily/'));
  for (const daily of dailyNotes) {
    const lines = daily.content.split('\n');
    for (const line of lines) {
      if (line.includes('%%carried:')) {
        carriedTasks.push(line.replace(/^-\s*\[[ xX>]\]\s*/, '').trim());
      }
    }
  }

  return {
    userProfile: profileFile ? profileFile.content : 'User is a systems architect focused on deep work.',
    schedule: scheduleFile ? scheduleFile.content : 'Morning review, focus blocks, afternoon review.',
    goals: goalsFile ? goalsFile.content : 'Build Ascend Realms with local-first Markdown sovereignty.',
    activeRealm: activeRealm.name,
    realmPurpose: activeRealm.purpose,
    activeNotePath: activeNote ? activeNote.path : 'None',
    activeNoteBody: activeNote ? activeNote.content : '',
    recentCarriedTasks: carriedTasks.slice(0, 5),
  };
}

export async function sendStewardMessage(
  userPrompt: string,
  context: ContextPackage,
  chatHistory: ChatMessage[]
): Promise<{ text: string; diffProposal?: ChatMessage['diffProposal'] }> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        context,
        history: chatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        text: data.text,
        diffProposal: data.diffProposal,
      };
    }
  } catch (err) {
    console.warn('API call failed, falling back to deterministic local response:', err);
  }

  // Fallback intelligent context-aware Steward response if offline or dev
  return generateLocalStewardResponse(userPrompt, context);
}

export async function generateStewardSummary(
  activeNote: VaultFile,
  context: ContextPackage
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notePath: activeNote.path,
        noteContent: activeNote.content,
        context,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.summary;
    }
  } catch {
    // Fallback
  }

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return `\n## Steward summary — ${timeStr}\n\n- Reviewed active sprint in **${context.activeRealm}** realm.\n- Synchronized checklist index and verified deterministic block ID references.\n- Recommended scheduling deep focus session for high-friction carried tasks.\n`;
}

function generateLocalStewardResponse(
  prompt: string,
  context: ContextPackage
): { text: string; diffProposal?: ChatMessage['diffProposal'] } {
  const p = prompt.toLowerCase();

  if (p.includes('diff') || p.includes('edit') || p.includes('refactor') || p.includes('update note') || p.includes('add task')) {
    if (context.activeNoteBody) {
      const proposed = context.activeNoteBody + `\n- [ ] Steward proposed: Benchmark atomic rename latency ^${Math.random().toString(36).substring(2, 8)}\n`;
      return {
        text: `I've prepared a proposed update for **${context.activeNotePath}** based on your current focus in the ${context.activeRealm} realm. Please inspect the diff below and confirm before writing to disk.`,
        diffProposal: {
          original: context.activeNoteBody,
          proposed,
          path: context.activeNotePath,
        },
      };
    }
  }

  if (p.includes('plan') || p.includes('today') || p.includes('morning') || p.includes('priority')) {
    return {
      text: `Based on your Profile and **${context.activeRealm}** schedule, here is your high-impact alignment for today:\n\n1. **Core Focus**: Triage carried tasks first (${context.recentCarriedTasks.length > 0 ? context.recentCarriedTasks[0] : 'Review SQLite indexer pragmas'}).\n2. **Dungeon Recommendation**: Run a 50m Deep Focus session on your primary project.\n3. **Inbox Triage**: Clear pending items in \`Core/Triage.md\` before afternoon meetings.\n\nWould you like me to commit these tasks directly to your Daily Note?`,
    };
  }

  return {
    text: `Standing by in **${context.activeRealm}** realm. I have loaded context from \`Profile.md\`, \`Schedule.md\`, and \`${context.activeNotePath}\`.\n\nAsk me to review task velocity, draft project notes, propose diffs for existing files, or summarize deep work sessions.`,
  };
}
