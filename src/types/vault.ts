export type RealmKind = 'core' | 'realm';

export interface RealmConfig {
  id: string;
  name: string;
  number: string;
  kind: RealmKind;
  purpose: string;
  view: {
    background: string;
    accent: string;
    typography: 'mono' | 'sans' | 'serif';
  };
  widgets: Array<{
    id: string;
    open: boolean;
    span?: 'full' | 'half' | 'third';
  }>;
  defaultPreset?: string;
  allowlist?: string[];
  blocklist?: string[];
}

export interface VaultFile {
  path: string;
  id: string;
  realm: string;
  title: string;
  content: string;
  mtime: number;
  isProject?: boolean;
  projectName?: string;
  realmName?: string;
  isDaily?: boolean;
  isInbox?: boolean;
  isTriage?: boolean;
  isSession?: boolean;
  frontmatter?: Record<string, any>;
}

export interface ChecklistItem {
  id: string;
  blockRef?: string;
  rawText: string;
  text: string;
  isDone: boolean;
  isDeferred: boolean;
  carryCount: number;
  lineNumber: number;
  path: string;
  realm: string;
  parentId?: string;
  project?: string;
  timeEstimate?: string;
  tags?: string[];
}

export interface TriageItem {
  id: string;
  text: string;
  sourceUrl?: string;
  timestamp: string;
  savedAt?: string;
  isTriaged?: boolean;
  dispatchedAt?: number;
  dispatchedTo?: string;
  targetRealm?: string;
  targetFile?: string;
}

export interface FocusPreset {
  name: string;
  suggestedDurationMinutes: number;
  allowlist: string[];
  blocklist: string[];
  hard: string[];
  soft: string[];
  phrase: string;
}

export interface FocusSessionRecord {
  id: string;
  date: string;
  timeRange: string;
  realm: string;
  preset: string;
  durationMinutes: number;
  interruptions: number;
  overrides: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  realmId: string;
  diffProposal?: {
    original: string;
    proposed: string;
    path: string;
    approved?: boolean;
  };
}
