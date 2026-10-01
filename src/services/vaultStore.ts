import { ChecklistItem, FocusPreset, FocusSessionRecord, RealmConfig, TriageItem, VaultFile } from '../types/vault';
import { INITIAL_FILES, INITIAL_REALMS } from './vaultSeed';

const STORAGE_KEY_FILES = 'ascend_vault_files_v1';
const STORAGE_KEY_REALMS = 'ascend_vault_realms_v1';
const STORAGE_KEY_ACTIVE_REALM = 'ascend_vault_active_realm_v1';
const STORAGE_KEY_TABS_BY_REALM = 'ascend_vault_tabs_by_realm_v3';
const STORAGE_KEY_PINNED_TABS = 'ascend_vault_pinned_tabs_v3';
const STORAGE_KEY_PRESETS = 'ascend_vault_presets_v3';
const STORAGE_KEY_TRIAGE_RETENTION = 'ascend_vault_triage_retention_v3';
const STORAGE_KEY_ACTIVE_NOTE_BY_REALM = 'ascend_vault_active_note_by_realm_v4';

// User Request: Color palettes for realms with vibrant accents and noticeable dark hues
export interface RealmColorPalette {
  name: string;
  accent: string;
  darkHue: string;
}

export const REALM_COLOR_PALETTES: RealmColorPalette[] = [
  { name: 'Amber Bronze', accent: '#f59e0b', darkHue: '#4d2d14' },
  { name: 'Sapphire Blue', accent: '#3b82f6', darkHue: '#1d4475' },
  { name: 'Emerald Pine', accent: '#10b981', darkHue: '#185c44' },
  { name: 'Plum Violet', accent: '#a855f7', darkHue: '#4a2162' },
  { name: 'Crimson Rose', accent: '#f43f5e', darkHue: '#5c1d30' },
  { name: 'Sunset Orange', accent: '#f97316', darkHue: '#572912' },
  { name: 'Teal Lagoon', accent: '#14b8a6', darkHue: '#144e4b' },
  { name: 'Electric Indigo', accent: '#6366f1', darkHue: '#2c3072' },
  { name: 'Cyan Sky', accent: '#06b6d4', darkHue: '#134e5e' },
  { name: 'Fuchsia Orchid', accent: '#d946ef', darkHue: '#591d63' },
  { name: 'Lime Citrus', accent: '#84cc16', darkHue: '#3e5114' },
  { name: 'Ruby Wine', accent: '#e11d48', darkHue: '#5a1728' },
];

export function deriveDarkHue(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#1d4475';
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Target lightness ~24% with high saturation (55-70%) so the realm color is clearly visible and never black
  const targetL = 0.24;
  const targetS = Math.max(0.55, Math.min(s, 0.70));

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = targetL < 0.5 ? targetL * (1 + targetS) : targetL + targetS - targetL * targetS;
  const p = 2 * targetL - q;
  const red = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const green = Math.round(hue2rgb(p, q, h) * 255);
  const blue = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  const toHex = (x: number) => x.toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

export function getDarkHueForRealm(realm: RealmConfig): string {
  // Near-black or overly dark legacy backgrounds to replace
  const oldNearBlacks = [
    '#14100c', '#090e1a', '#061510', '#160a18',
    '#18130e', '#0c1322', '#091814', '#190e1b',
    '#2d1f14', '#132440', '#103326', '#2b1738',
    '#361522', '#382012', '#103030', '#1c1e42',
    '#112d38', '#35163b', '#243013', '#38131e',
    '#fcfcfd', '#fafafa', '#ffffff', '#000000',
  ];

  if (realm.kind === 'core' || realm.id === 'core') return '#4d2d14';
  if (realm.id === 'coding') return '#1d4475';
  if (realm.id === 'studying') return '#185c44';
  if (realm.id === 'writing') return '#4a2162';

  const match = REALM_COLOR_PALETTES.find(
    (p) => p.accent.toLowerCase() === realm.view?.accent?.toLowerCase()
  );
  if (match) return match.darkHue;

  if (realm.view?.background && !oldNearBlacks.includes(realm.view.background.toLowerCase())) {
    return realm.view.background;
  }

  return deriveDarkHue(realm.view?.accent || '#3b82f6');
}

// Generate 6-char base-36 block ID (e.g. ^t7f3a2)
export function generateBlockId(): string {
  return Math.random().toString(36).substring(2, 8);
}

// User Request 10: Task Pool reads ONLY from project Task.md files in addition to realm master Tasks.md
export function isTaskPoolSourceFile(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  // Project task file: e.g. "Coding/Projects/bun-sqlite-engine/Task.md" or "Tasks.md"
  if (normalized.match(/Projects\/[^/]+\/Tasks?\.md$/i)) return true;
  // Master realm task file: e.g. "Coding/Tasks.md" or "Core/Tasks.md"
  if (normalized.match(/^[^/]+\/Tasks?\.md$/i)) return true;
  return false;
}

export function parseChecklistItems(files: VaultFile[]): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  for (const file of files) {
    // Exclude sessions, inbox/triage files, and dotfiles from task pool
    if (
      file.isSession ||
      file.isInbox ||
      file.isTriage ||
      file.path.endsWith('/Inbox.md') ||
      file.path.endsWith('/Triage.md') ||
      file.path.includes('/.')
    )
      continue;

    const lines = file.content.split('\n');
    let projectTitle = '';
    const projMatch = file.path.match(/Projects\/([^/]+)/);
    if (projMatch) {
      projectTitle = projMatch[1];
    } else if (file.isProject) {
      projectTitle = file.projectName || file.title;
    }

    lines.forEach((line, idx) => {
      const match = line.match(/^(\s*)-\s*\[([ xX>])\]\s*(.*)$/);
      if (!match) return;

      const indent = match[1].length;
      const statusChar = match[2];
      const rest = match[3].trim();

      const isDone = statusChar === 'x' || statusChar === 'X';
      const isDeferred = statusChar === '>';

      // Extract block ID: ^[a-z0-9]{6}
      const blockMatch = rest.match(/\^([a-z0-9]{5,10})$/i);
      const blockRef = blockMatch ? blockMatch[1] : undefined;

      // Extract carry count: %%carried:N%%
      const carryMatch = rest.match(/%%carried:(\d+)%%/);
      const carryCount = carryMatch ? parseInt(carryMatch[1], 10) : 0;

      // Extract time: e.g. 09:30
      const timeMatch = rest.match(/^(\d{1,2}:\d{2})\s+/);
      const timeEstimate = timeMatch ? timeMatch[1] : undefined;

      // Extract tags: #tag
      const tags = [...rest.matchAll(/#([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

      // Clean display text
      let cleanText = rest
        .replace(/\^([a-z0-9]{5,10})$/i, '')
        .replace(/%%carried:\d+%%/, '')
        .replace(/^\d{1,2}:\d{2}\s+/, '')
        .trim();

      // Deterministic fallback ID if not yet stamped
      const id = blockRef || `${file.path}:${idx}`;

      items.push({
        id,
        blockRef,
        rawText: line,
        text: cleanText,
        isDone,
        isDeferred,
        carryCount,
        lineNumber: idx + 1,
        path: file.path,
        realm: file.realm,
        project: projectTitle || undefined,
        timeEstimate,
        tags,
      });
    });
  }

  return items;
}

export function parseTriageItems(triageFileContent: string, retentionMinutes: number = 60): TriageItem[] {
  const items: TriageItem[] = [];
  const lines = triageFileContent.split('\n');

  lines.forEach((line, i) => {
    const match = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
    if (!match) return;

    const statusChar = match[1];
    const isTriaged = statusChar === 'x' || statusChar === 'X';
    const raw = match[2].trim();

    // Parse optional source url
    const urlMatch = raw.match(/\(Source:\s*([^\)]+)\)/i);
    const sourceUrl = urlMatch ? urlMatch[1] : undefined;

    // Parse saved timestamp: e.g. [saved: 2026-09-22 09:15] or <!-- saved: ... -->
    const savedMatch =
      raw.match(/\[saved:\s*([^\]]+)\]/i) ||
      raw.match(/<!--\s*saved:\s*([^>]+)-->/i) ||
      raw.match(/\(Saved:\s*([^)]+)\)/i) ||
      raw.match(/\(Captured:\s*([^)]+)\)/i);
    const savedAt = savedMatch ? savedMatch[1].trim() : '2026-09-22 09:15';

    // Parse triaged info: <!-- triaged: <iso> -> <target> -->
    const triagedMatch = raw.match(/<!--\s*triaged:\s*([^-\s>]+(?:\s+[^-\s>]+)?)(?:\s*->\s*([^>]+))?-->/i);
    let dispatchedAt: number | undefined = undefined;
    let dispatchedTo: string | undefined = undefined;

    if (triagedMatch) {
      const parsedTime = Date.parse(triagedMatch[1]);
      dispatchedAt = isNaN(parsedTime) ? Date.now() : parsedTime;
      dispatchedTo = triagedMatch[2]?.trim();
    } else if (isTriaged) {
      dispatchedAt = Date.now();
    }

    // Check retention window for triaged items:
    // Dispatched items disappear from panel after retentionMinutes (default 60 mins)
    if (isTriaged && dispatchedAt) {
      const elapsedMinutes = (Date.now() - dispatchedAt) / (1000 * 60);
      if (elapsedMinutes > retentionMinutes) {
        return; // Filter out from active panel, but preserved in Inbox.md
      }
    }

    const text = raw
      .replace(/\(Source:\s*[^\)]+\)/i, '')
      .replace(/\[saved:\s*[^\]]+\]/gi, '')
      .replace(/<!--\s*saved:\s*[^>]+-->/gi, '')
      .replace(/\(Saved:\s*[^)]+\)/gi, '')
      .replace(/\(Captured:\s*[^)]+\)/gi, '')
      .replace(/<!--\s*triaged:[^>]+-->/gi, '')
      .trim();

    items.push({
      id: `triage-${i}-${text.substring(0, 10).replace(/\s+/g, '')}`,
      text,
      sourceUrl,
      timestamp: savedAt,
      savedAt,
      isTriaged,
      dispatchedAt,
      dispatchedTo,
    });
  });

  // Sort: Unfiled items appear at top; dispatched items fall to the bottom of the triage list
  return items.sort((a, b) => {
    if (a.isTriaged === b.isTriaged) return 0;
    return a.isTriaged ? 1 : -1;
  });
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_PRESETS: FocusPreset[] = [
  {
    name: 'Deep',
    suggestedDurationMinutes: 50,
    allowlist: [],
    blocklist: ['x.com', 'twitter.com', 'reddit.com', 'youtube.com', 'instagram.com'],
    hard: ['x.com', 'instagram.com', 'reddit.com'],
    soft: ['youtube.com', 'news.ycombinator.com'],
    phrase: 'I am choosing distraction over my goal',
  },
  {
    name: 'Mild',
    suggestedDurationMinutes: 25,
    allowlist: [],
    blocklist: ['instagram.com', 'tiktok.com'],
    hard: ['instagram.com'],
    soft: ['tiktok.com'],
    phrase: 'I am choosing distraction over my goal',
  },
  {
    name: 'Hardcore',
    suggestedDurationMinutes: 90,
    allowlist: [],
    blocklist: ['*'],
    hard: ['*'],
    soft: [],
    phrase: 'I am deliberately breaking deep focus',
  },
];

export class VaultManager {
  private files: VaultFile[] = [];
  private realms: RealmConfig[] = [];
  private activeRealmId: string = 'core';
  private openTabsByRealm: Record<string, string[]> = {
    core: ['Core/Daily/2026-09-22.md'],
    coding: ['Coding/Tasks.md', 'Coding/Projects/bun-sqlite-engine/index.md'],
    studying: ['Studying/Tasks.md'],
    writing: ['Writing/Tasks.md'],
  };
  private pinnedPaths: string[] = ['Core/Daily/2026-09-22.md'];
  private presets: FocusPreset[] = [...DEFAULT_PRESETS];
  private triageRetentionMinutes: number = 60;
  private activeNotePath: string = 'Core/Daily/2026-09-22.md';
  private activeNoteByRealm: Record<string, string> = {
    core: 'Core/Daily/2026-09-22.md',
    coding: 'Coding/Projects/bun-sqlite-engine/index.md',
    studying: 'Studying/Tasks.md',
    writing: 'Writing/Tasks.md',
  };
  private uncommittedChanges: number = 0;
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedFiles = localStorage.getItem(STORAGE_KEY_FILES);
      if (storedFiles) {
        this.files = JSON.parse(storedFiles);
      } else {
        this.files = [...INITIAL_FILES];
      }

      const storedRealms = localStorage.getItem(STORAGE_KEY_REALMS);
      if (storedRealms) {
        this.realms = JSON.parse(storedRealms);
      } else {
        this.realms = [...INITIAL_REALMS];
      }

      const storedActiveRealm = localStorage.getItem(STORAGE_KEY_ACTIVE_REALM);
      if (storedActiveRealm && this.realms.some((r) => r.id === storedActiveRealm)) {
        this.activeRealmId = storedActiveRealm;
      }

      const storedTabsByRealm = localStorage.getItem(STORAGE_KEY_TABS_BY_REALM);
      if (storedTabsByRealm) {
        this.openTabsByRealm = JSON.parse(storedTabsByRealm);
      }

      const storedPinned = localStorage.getItem(STORAGE_KEY_PINNED_TABS);
      if (storedPinned) {
        this.pinnedPaths = JSON.parse(storedPinned);
      }

      const storedPresets = localStorage.getItem(STORAGE_KEY_PRESETS);
      if (storedPresets) {
        this.presets = JSON.parse(storedPresets);
      }

      const storedRetention = localStorage.getItem(STORAGE_KEY_TRIAGE_RETENTION);
      if (storedRetention) {
        this.triageRetentionMinutes = parseInt(storedRetention, 10) || 60;
      }

      const storedActiveNoteByRealm = localStorage.getItem(STORAGE_KEY_ACTIVE_NOTE_BY_REALM);
      if (storedActiveNoteByRealm) {
        this.activeNoteByRealm = JSON.parse(storedActiveNoteByRealm);
      }

      // Merge any new seed files that don't exist yet
      for (const initial of INITIAL_FILES) {
        if (!this.files.some((f) => f.path === initial.path)) {
          this.files.push(initial);
        }
      }

      // Refresh realm view backgrounds for rich noticeable dark hues
      for (const realm of this.realms) {
        realm.view.background = getDarkHueForRealm(realm);
      }

      // Restore active note based on active realm's remembered tab
      const visible = this.getOpenTabs();
      const remembered = this.activeNoteByRealm[this.activeRealmId];
      if (remembered && visible.some((t) => t.path === remembered)) {
        this.activeNotePath = remembered;
      } else if (visible.length > 0) {
        const realmTab = visible.find(
          (t) => t.realm === this.activeRealmId && !t.isDaily && !t.path.startsWith('Core/Daily/')
        );
        this.activeNotePath = realmTab?.path || visible[0].path;
      }
    } catch {
      this.files = [...INITIAL_FILES];
      this.realms = [...INITIAL_REALMS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(this.files));
      localStorage.setItem(STORAGE_KEY_REALMS, JSON.stringify(this.realms));
      localStorage.setItem(STORAGE_KEY_ACTIVE_REALM, this.activeRealmId);
      localStorage.setItem(STORAGE_KEY_TABS_BY_REALM, JSON.stringify(this.openTabsByRealm));
      localStorage.setItem(STORAGE_KEY_PINNED_TABS, JSON.stringify(this.pinnedPaths));
      localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(this.presets));
      localStorage.setItem(STORAGE_KEY_TRIAGE_RETENTION, String(this.triageRetentionMinutes));
      localStorage.setItem(STORAGE_KEY_ACTIVE_NOTE_BY_REALM, JSON.stringify(this.activeNoteByRealm));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getRealms(): RealmConfig[] {
    return this.realms;
  }

  public getActiveRealm(): RealmConfig {
    return this.realms.find((r) => r.id === this.activeRealmId) || this.realms[0];
  }

  public setActiveRealm(realmId: string) {
    this.activeRealmId = realmId;
    const realmTabs = this.openTabsByRealm[realmId] || [];
    const visibleTabs = this.getOpenTabs();

    // User Request 1: Remember the last tab the user was on in that realm, never force-land on daily note
    let targetPath = this.activeNoteByRealm[realmId];

    // For non-core realm, if targetPath was not set or was set to Daily Note, find a realm-specific tab or file
    if (realmId !== 'core' && (!targetPath || targetPath.startsWith('Core/Daily/'))) {
      const realmSpecificTab = visibleTabs.find(
        (t) => t.realm === realmId && !t.isDaily && !t.path.startsWith('Core/Daily/')
      );
      if (realmSpecificTab) {
        targetPath = realmSpecificTab.path;
      } else {
        const realmFile = this.files.find(
          (f) => f.realm === realmId && !f.path.startsWith('Core/Daily/')
        );
        if (realmFile) {
          targetPath = realmFile.path;
          if (!realmTabs.includes(targetPath)) {
            realmTabs.push(targetPath);
            this.openTabsByRealm[realmId] = realmTabs;
          }
        }
      }
    }

    if (targetPath && this.files.some((f) => f.path === targetPath)) {
      this.activeNotePath = targetPath;
      this.activeNoteByRealm[realmId] = targetPath;
    } else {
      const realmTab = visibleTabs.find(
        (t) => t.realm === realmId && !t.isDaily && !t.path.startsWith('Core/Daily/')
      );
      this.activeNotePath =
        realmTab?.path || (realmId === 'core' ? 'Core/Daily/2026-09-22.md' : visibleTabs[0]?.path || 'Core/Daily/2026-09-22.md');
      this.activeNoteByRealm[realmId] = this.activeNotePath;
    }
    this.saveToStorage();
  }

  public getFiles(): VaultFile[] {
    return this.files;
  }

  public getFilesForActiveRealm(): VaultFile[] {
    return this.files.filter((f) => f.realm === this.activeRealmId);
  }

  public getActiveNote(): VaultFile | undefined {
    return this.files.find((f) => f.path === this.activeNotePath);
  }

  // Pinned Notes (User Request: Pin & Unpin, stay across all realms)
  public isNotePinned(path: string): boolean {
    return this.pinnedPaths.includes(path);
  }

  public pinNote(path: string) {
    if (!this.pinnedPaths.includes(path)) {
      this.pinnedPaths.push(path);
      this.saveToStorage();
    }
  }

  public unpinNote(path: string) {
    this.pinnedPaths = this.pinnedPaths.filter((p) => p !== path);
    this.saveToStorage();
  }

  public togglePinNote(path: string) {
    if (this.isNotePinned(path)) {
      this.unpinNote(path);
    } else {
      this.pinNote(path);
    }
  }

  // Open Tabs: Scoped strictly per realm, plus pinned notes and the Daily tasks note that follow everywhere
  public getOpenTabs(): VaultFile[] {
    const realmTabs = this.openTabsByRealm[this.activeRealmId] || [];

    // Daily tasks note always stays accessible across realms
    const dailyNote = this.files.find(
      (f) => f.isDaily || f.path === 'Core/Daily/2026-09-22.md' || f.path.startsWith('Core/Daily/')
    );
    const dailyPath = dailyNote?.path;

    const tabSet = new Set<string>();
    if (dailyPath) {
      tabSet.add(dailyPath);
    }
    for (const p of this.pinnedPaths) {
      tabSet.add(p);
    }
    for (const p of realmTabs) {
      tabSet.add(p);
    }

    return Array.from(tabSet)
      .map((path) => this.files.find((f) => f.path === path))
      .filter((f): f is VaultFile => Boolean(f));
  }

  public setActiveNote(path: string) {
    const file = this.files.find((f) => f.path === path);
    if (!file) return;

    const isDaily = file.isDaily || path.startsWith('Core/Daily/');

    if (!this.isNotePinned(path) && !isDaily) {
      if (!this.openTabsByRealm[file.realm]) {
        this.openTabsByRealm[file.realm] = [];
      }
      if (!this.openTabsByRealm[file.realm].includes(path)) {
        this.openTabsByRealm[file.realm].push(path);
      }
    }

    this.activeNotePath = path;
    if (file.realm !== this.activeRealmId && !this.isNotePinned(path) && !isDaily) {
      this.activeRealmId = file.realm;
    }
    // Record active note for the current realm
    this.activeNoteByRealm[this.activeRealmId] = path;
    this.saveToStorage();
  }

  public closeTab(path: string) {
    if (this.isNotePinned(path)) {
      this.unpinNote(path);
    }
    if (this.openTabsByRealm[this.activeRealmId]) {
      this.openTabsByRealm[this.activeRealmId] = this.openTabsByRealm[this.activeRealmId].filter(
        (p) => p !== path
      );
    }
    if (this.activeNotePath === path) {
      const remaining = this.getOpenTabs();
      this.activeNotePath = remaining[0]?.path || '';
      this.activeNoteByRealm[this.activeRealmId] = this.activeNotePath;
    }
    this.saveToStorage();
  }

  // Presets & Distraction Settings
  public getPresets(): FocusPreset[] {
    return this.presets;
  }

  public updatePreset(name: string, updates: Partial<FocusPreset>) {
    this.presets = this.presets.map((p) => (p.name === name ? { ...p, ...updates } : p));
    this.saveToStorage();
  }

  public updatePresetDuration(name: string, suggestedDurationMinutes: number) {
    this.updatePreset(name, { suggestedDurationMinutes });
  }

  public addSoftBlockedSite(presetName: string, site: string) {
    const preset = this.presets.find((p) => p.name === presetName);
    if (!preset) return;
    const clean = site.trim().toLowerCase();
    if (!clean || preset.soft.includes(clean)) return;
    const nextSoft = [...preset.soft, clean];
    const nextBlocklist = Array.from(new Set([...preset.blocklist, clean]));
    this.updatePreset(presetName, { soft: nextSoft, blocklist: nextBlocklist });
  }

  public removeSoftBlockedSite(presetName: string, site: string) {
    const preset = this.presets.find((p) => p.name === presetName);
    if (!preset) return;
    const nextSoft = preset.soft.filter((s) => s !== site);
    this.updatePreset(presetName, { soft: nextSoft });
  }

  public getTriageRetentionMinutes(): number {
    return this.triageRetentionMinutes;
  }

  public setTriageRetentionMinutes(mins: number) {
    this.triageRetentionMinutes = mins;
    this.saveToStorage();
  }

  public updateNoteContent(path: string, newContent: string) {
    const file = this.files.find((f) => f.path === path);
    if (file) {
      file.content = newContent;
      file.mtime = Date.now();
      this.uncommittedChanges++;
      this.saveToStorage();
    }
  }

  // Toggle a checklist line by block reference or line number
  public toggleTask(item: ChecklistItem) {
    const targetIsDone = !item.isDone;

    if (item.blockRef) {
      for (const file of this.files) {
        let changed = false;
        const lines = file.content.split('\n');
        const updatedLines = lines.map((line) => {
          if (line.includes(`^${item.blockRef}`)) {
            changed = true;
            return targetIsDone
              ? line.replace(/-\s*\[[ >]\]/, '- [x]')
              : line.replace(/-\s*\[[xX]\]/, '- [ ]');
          }
          return line;
        });

        if (changed) {
          file.content = updatedLines.join('\n');
          file.mtime = Date.now();
        }
      }
    } else {
      const file = this.files.find((f) => f.path === item.path);
      if (file) {
        const lines = file.content.split('\n');
        if (lines[item.lineNumber - 1]) {
          lines[item.lineNumber - 1] = targetIsDone
            ? lines[item.lineNumber - 1].replace(/-\s*\[[ >]\]/, '- [x]')
            : lines[item.lineNumber - 1].replace(/-\s*\[[xX]\]/, '- [ ]');
          file.content = lines.join('\n');
          file.mtime = Date.now();
        }
      }
    }

    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Commit a task from Task Pool into Today's Daily Note
  public commitTaskToDaily(item: ChecklistItem) {
    let blockRef = item.blockRef;
    const sourceFile = this.files.find((f) => f.path === item.path);

    if (sourceFile) {
      const lines = sourceFile.content.split('\n');
      const lineIdx = item.lineNumber - 1;
      let line = lines[lineIdx];

      if (!blockRef) {
        blockRef = generateBlockId();
        line = `${line.trim()} ^${blockRef}`;
        lines[lineIdx] = line;
        sourceFile.content = lines.join('\n');
        sourceFile.mtime = Date.now();
      }
    }

    if (!blockRef) {
      blockRef = generateBlockId();
    }

    const todayDaily = this.files.find((f) => f.path.startsWith('Core/Daily/2026-09-22') || f.isDaily);
    if (todayDaily) {
      const newLine = `- [ ] ${item.text} ^${blockRef}`;
      if (!todayDaily.content.includes(`^${blockRef}`)) {
        if (todayDaily.content.includes('## Plan')) {
          todayDaily.content = todayDaily.content.replace('## Plan', `## Plan\n${newLine}`);
        } else {
          todayDaily.content += `\n## Plan\n${newLine}\n`;
        }
        todayDaily.mtime = Date.now();
      }
    }

    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Remove task permanently from disk
  public removeTask(item: ChecklistItem) {
    for (const file of this.files) {
      if (item.blockRef && file.content.includes(`^${item.blockRef}`)) {
        const lines = file.content.split('\n').filter((l) => !l.includes(`^${item.blockRef}`));
        file.content = lines.join('\n');
        file.mtime = Date.now();
      } else if (file.path === item.path) {
        const lines = file.content.split('\n');
        lines.splice(item.lineNumber - 1, 1);
        file.content = lines.join('\n');
        file.mtime = Date.now();
      }
    }
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Morning Yesterday's Review triage actions
  public triageReviewItem(
    action: 'complete' | 'defer' | 'carry' | 'drop',
    item: ChecklistItem,
    yesterdayFilePath: string
  ) {
    const yesterdayFile = this.files.find((f) => f.path === yesterdayFilePath);
    const todayFile = this.files.find((f) => f.path.startsWith('Core/Daily/2026-09-22') || f.isDaily);

    if (action === 'complete') {
      this.toggleTask(item);
    } else if (action === 'defer') {
      if (yesterdayFile) {
        yesterdayFile.content = yesterdayFile.content.replace(
          new RegExp(`-\\s*\\[[ ]\\]\\s*.*${item.blockRef ? `\\^${item.blockRef}` : ''}`),
          `- [>] ${item.text} ${item.blockRef ? `^${item.blockRef}` : ''}`
        );
        yesterdayFile.mtime = Date.now();
      }
    } else if (action === 'carry') {
      if (yesterdayFile) {
        yesterdayFile.content = yesterdayFile.content.replace(
          new RegExp(`-\\s*\\[[ ]\\]\\s*.*${item.blockRef ? `\\^${item.blockRef}` : ''}`),
          `- [>] ${item.text} ${item.blockRef ? `^${item.blockRef}` : ''}`
        );
        yesterdayFile.mtime = Date.now();
      }
      const nextCarry = (item.carryCount || 0) + 1;
      const blockId = item.blockRef || generateBlockId();
      const carriedLine = `- [ ] ${item.text} %%carried:${nextCarry}%% ^${blockId}`;

      if (todayFile && !todayFile.content.includes(`^${blockId}`)) {
        if (todayFile.content.includes('## Plan')) {
          todayFile.content = todayFile.content.replace('## Plan', `## Plan\n${carriedLine}`);
        } else {
          todayFile.content += `\n## Plan\n${carriedLine}\n`;
        }
        todayFile.mtime = Date.now();
      }
    } else if (action === 'drop') {
      this.removeTask(item);
    }

    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Quick Task Capture
  public captureTask(text: string, destinationPath: string) {
    const blockRef = generateBlockId();
    const taskLine = `- [ ] ${text.trim()} ^${blockRef}`;

    const targetFile = this.files.find((f) => f.path === destinationPath);
    if (targetFile) {
      if (targetFile.content.includes('## Tasks')) {
        targetFile.content = targetFile.content.replace('## Tasks', `## Tasks\n${taskLine}`);
      } else {
        targetFile.content += `\n${taskLine}\n`;
      }
      targetFile.mtime = Date.now();
      this.uncommittedChanges++;
      this.saveToStorage();
    }
  }

  // Quick capture into Core/Inbox.md with saved date and time
  public captureInboxItem(text: string, sourceUrl?: string) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const savedTimestamp = `${y}-${m}-${d} ${hh}:${mm}`;

    const inboxFile = this.files.find((f) => f.path === 'Core/Inbox.md' || f.isInbox);
    if (inboxFile) {
      const sourcePart = sourceUrl ? ` (Source: ${sourceUrl})` : '';
      inboxFile.content += `\n- [ ] ${text.trim()}${sourcePart} [saved: ${savedTimestamp}]\n`;
      inboxFile.mtime = Date.now();
      this.uncommittedChanges++;
      this.saveToStorage();
    }
  }

  // Triage Queue dispatching (User Request 8: Note as triaged in Inbox.md, so it falls to bottom and disappears after retention window)
  public dispatchTriageItem(itemId: string, itemText: string, targetRealmId: string, targetFilePath: string) {
    const inboxFile = this.files.find((f) => f.path === 'Core/Inbox.md' || f.isInbox);
    const nowIso = new Date().toISOString();

    if (inboxFile) {
      const lines = inboxFile.content.split('\n');
      const updatedLines = lines.map((l) => {
        if (l.includes(itemText) && l.includes('- [ ]')) {
          return l.replace(/-\s*\[\s*\]/, '- [x]') + ` <!-- triaged: ${nowIso} -> ${targetFilePath} -->`;
        }
        return l;
      });
      inboxFile.content = updatedLines.join('\n');
      inboxFile.mtime = Date.now();
    }

    // Append to target file
    const blockRef = generateBlockId();
    const newLine = `- [ ] ${itemText.trim()} ^${blockRef}`;
    let target = this.files.find((f) => f.path === targetFilePath);

    if (!target) {
      target = {
        path: targetFilePath,
        id: `file-${Date.now()}`,
        realm: targetRealmId,
        title: targetFilePath.split('/').pop()?.replace('.md', '') || 'Note',
        content: `# ${targetFilePath.split('/').pop()?.replace('.md', '')}\n\n- [ ] ${itemText.trim()} ^${blockRef}\n`,
        mtime: Date.now(),
      };
      this.files.push(target);
    } else {
      if (target.content.includes('## Tasks')) {
        target.content = target.content.replace('## Tasks', `## Tasks\n${newLine}`);
      } else {
        target.content += `\n${newLine}\n`;
      }
      target.mtime = Date.now();
    }

    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Focus Session logging
  public logFocusSession(record: FocusSessionRecord) {
    const sessionFile = this.files.find((f) => f.path === 'Core/Sessions/2026-09-22.md' || f.isSession);
    const sessionEntry = `\n## Session — ${record.timeRange} (${record.realm} · ${record.preset})\n- Focus minutes: ${record.durationMinutes}\n- Interruptions: ${record.interruptions}\n- Overrides: ${record.overrides}\n`;

    if (sessionFile) {
      sessionFile.content += sessionEntry;
      sessionFile.mtime = Date.now();
    } else {
      this.files.push({
        path: 'Core/Sessions/2026-09-22.md',
        id: `s-${Date.now()}`,
        realm: 'core',
        title: '2026-09-22 Focus Sessions',
        isSession: true,
        content: `# Focus Sessions — 2026-09-22\n${sessionEntry}`,
        mtime: Date.now(),
      });
    }

    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Create Project in active Realm
  public createProject(realmId: string, projectName: string) {
    const cleanName = projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const realm = this.realms.find((r) => r.id === realmId) || this.getActiveRealm();
    const folderPath = `${realm.name}/Projects/${cleanName}`;
    const indexPath = `${folderPath}/index.md`;

    const existing = this.files.find((f) => f.path === indexPath);
    if (existing) {
      this.setActiveNote(indexPath);
      return;
    }

    const newIndexFile: VaultFile = {
      path: indexPath,
      id: `p-${Date.now()}`,
      realm: realm.id,
      realmName: realm.name,
      projectName: cleanName,
      title: `${cleanName} / Overview`,
      isProject: true,
      mtime: Date.now(),
      content: `---
project: true
realm: ${realm.name}
created: ${getTodayDateString()}
status: active
---

# ${cleanName} / Project Overview

## Description
Active project initiative in ${realm.name} workspace.

## Backlog
Project tasks are maintained in [[${folderPath}/Task|Task.md]].
`,
    };

    const taskPath = `${folderPath}/Task.md`;
    const newTaskFile: VaultFile = {
      path: taskPath,
      id: `task-${Date.now()}`,
      realm: realm.id,
      realmName: realm.name,
      projectName: cleanName,
      title: `Tasks — ${cleanName}`,
      isProject: true,
      mtime: Date.now(),
      content: `# Tasks — ${cleanName}

- [ ] Initial project milestone breakdown ^${generateBlockId()}
- [ ] Define core architectural boundaries ^${generateBlockId()}
`,
    };

    this.files.push(newIndexFile);
    this.files.push(newTaskFile);
    this.setActiveNote(taskPath);
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Create new Realm - grants a random realm colour (or uses specified custom color)
  public createRealm(name: string, purpose: string, chosenAccent?: string, chosenBackground?: string) {
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = this.realms.find((r) => r.id === id);
    if (existing) {
      this.setActiveRealm(existing.id);
      return;
    }

    const number = String(this.realms.length + 1).padStart(2, '0');
    // User Request: When a realm is created, grant it a random realm colour
    const usedAccents = new Set(this.realms.map((r) => r.view?.accent?.toLowerCase()));
    const unusedPalettes = REALM_COLOR_PALETTES.filter((p) => !usedAccents.has(p.accent.toLowerCase()));
    const pool = unusedPalettes.length > 0 ? unusedPalettes : REALM_COLOR_PALETTES;
    const randomPalette = pool[Math.floor(Math.random() * pool.length)];

    const accent = chosenAccent || randomPalette.accent;
    const background = chosenBackground || randomPalette.darkHue || deriveDarkHue(accent);

    const newRealm: RealmConfig = {
      id,
      name,
      number,
      kind: 'realm',
      purpose,
      view: {
        background,
        accent,
        typography: 'sans',
      },
      widgets: [
        { id: 'notes', open: true, span: 'full' },
        { id: 'task-pool', open: true, span: 'full' },
        { id: 'dungeon', open: true, span: 'half' },
        { id: 'projects', open: true, span: 'half' },
      ],
      defaultPreset: 'Deep',
    };

    const tasksFile: VaultFile = {
      path: `${name}/Tasks.md`,
      id: `tasks-${id}`,
      realm: id,
      title: `Master Tasks — ${name}`,
      mtime: Date.now(),
      content: `# Tasks — ${name} Realm\n\n- [ ] Initial setup and goal alignment ^${generateBlockId()}\n`,
    };

    this.realms.push(newRealm);
    this.files.push(tasksFile);
    this.setActiveRealm(id);
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Create single Note in active Realm
  public createNote(realmId: string, title: string) {
    const realm = this.realms.find((r) => r.id === realmId) || this.getActiveRealm();
    const cleanTitle = title.trim();
    const filename = cleanTitle.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const path = `${realm.name}/${filename}.md`;

    const newNote: VaultFile = {
      path,
      id: `note-${Date.now()}`,
      realm: realm.id,
      title: cleanTitle,
      mtime: Date.now(),
      content: `# ${cleanTitle}\n\nCreated ${getTodayDateString()}\n\n- [ ] Next action ^${generateBlockId()}\n`,
    };

    this.files.push(newNote);
    this.setActiveNote(path);
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Create File in a specific folder within a Realm
  public createFileInFolder(realmId: string, folderPath: string, fileName: string) {
    const realm = this.realms.find((r) => r.id === realmId) || this.getActiveRealm();
    const cleanName = fileName.trim().replace(/\.md$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const targetPath = `${folderPath.replace(/\/$/, '')}/${cleanName}.md`;

    const existing = this.files.find((f) => f.path === targetPath);
    if (existing) {
      this.setActiveNote(targetPath);
      return;
    }

    const newFile: VaultFile = {
      path: targetPath,
      id: `file-${Date.now()}`,
      realm: realm.id,
      title: cleanName,
      mtime: Date.now(),
      content: `# ${cleanName}\n\nCreated ${getTodayDateString()}\n\n- [ ] Initial thought ^${generateBlockId()}\n`,
    };

    this.files.push(newFile);
    this.setActiveNote(targetPath);
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Create Subfolder in a specific folder within a Realm
  public createFolderInFolder(realmId: string, parentFolderPath: string, folderName: string) {
    const cleanName = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const targetPath = `${parentFolderPath.replace(/\/$/, '')}/${cleanName}/index.md`;

    const existing = this.files.find((f) => f.path === targetPath);
    if (existing) {
      this.setActiveNote(targetPath);
      return;
    }

    const newFile: VaultFile = {
      path: targetPath,
      id: `folder-index-${Date.now()}`,
      realm: realmId,
      title: `${cleanName} / index`,
      mtime: Date.now(),
      content: `# ${cleanName}\n\nSubfolder index created ${getTodayDateString()}\n\n- [ ] Milestone ^${generateBlockId()}\n`,
    };

    this.files.push(newFile);
    this.setActiveNote(targetPath);
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Move file to another folder within the same realm
  public moveFile(sourceFilePath: string, destinationFolderPath: string): boolean {
    const file = this.files.find((f) => f.path === sourceFilePath);
    if (!file) return false;

    const destFolderClean = destinationFolderPath.replace(/\/$/, '');
    const fileName = sourceFilePath.split('/').pop() || 'note.md';
    const newPath = `${destFolderClean}/${fileName}`;

    if (newPath === sourceFilePath) return false;

    file.path = newPath;
    file.mtime = Date.now();

    if (this.activeNotePath === sourceFilePath) {
      this.activeNotePath = newPath;
    }

    this.pinnedPaths = this.pinnedPaths.map((p) => (p === sourceFilePath ? newPath : p));
    for (const rId of Object.keys(this.openTabsByRealm)) {
      this.openTabsByRealm[rId] = this.openTabsByRealm[rId].map((p) =>
        p === sourceFilePath ? newPath : p
      );
    }
    for (const rId of Object.keys(this.activeNoteByRealm)) {
      if (this.activeNoteByRealm[rId] === sourceFilePath) {
        this.activeNoteByRealm[rId] = newPath;
      }
    }

    this.uncommittedChanges++;
    this.saveToStorage();
    return true;
  }

  // Move folder to another parent folder within the same realm
  public moveFolder(sourceFolderPath: string, destinationParentFolderPath: string): boolean {
    const sourceClean = sourceFolderPath.replace(/\/$/, '');
    const destClean = destinationParentFolderPath.replace(/\/$/, '');
    const folderName = sourceClean.split('/').pop() || 'folder';
    const newFolderPath = `${destClean}/${folderName}`;

    if (newFolderPath === sourceClean) return false;

    for (const file of this.files) {
      if (file.path.startsWith(`${sourceClean}/`)) {
        const subRelative = file.path.substring(sourceClean.length);
        const updatedPath = `${newFolderPath}${subRelative}`;

        if (this.activeNotePath === file.path) {
          this.activeNotePath = updatedPath;
        }
        this.pinnedPaths = this.pinnedPaths.map((p) => (p === file.path ? updatedPath : p));
        for (const rId of Object.keys(this.openTabsByRealm)) {
          this.openTabsByRealm[rId] = this.openTabsByRealm[rId].map((p) =>
            p === file.path ? updatedPath : p
          );
        }
        for (const rId of Object.keys(this.activeNoteByRealm)) {
          if (this.activeNoteByRealm[rId] === file.path) {
            this.activeNoteByRealm[rId] = updatedPath;
          }
        }

        file.path = updatedPath;
        file.mtime = Date.now();
      }
    }

    this.uncommittedChanges++;
    this.saveToStorage();
    return true;
  }

  // Delete file
  public deleteFile(filePath: string) {
    this.files = this.files.filter((f) => f.path !== filePath);
    this.pinnedPaths = this.pinnedPaths.filter((p) => p !== filePath);
    for (const rId of Object.keys(this.openTabsByRealm)) {
      this.openTabsByRealm[rId] = this.openTabsByRealm[rId].filter((p) => p !== filePath);
    }
    for (const rId of Object.keys(this.activeNoteByRealm)) {
      if (this.activeNoteByRealm[rId] === filePath) {
        this.activeNoteByRealm[rId] = this.openTabsByRealm[rId]?.[0] || '';
      }
    }

    if (this.activeNotePath === filePath) {
      const remaining = this.getOpenTabs();
      this.activeNotePath = remaining[0]?.path || '';
    }
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Delete folder and all files inside it
  public deleteFolder(folderPath: string) {
    const cleanFolder = folderPath.replace(/\/$/, '');
    this.files = this.files.filter((f) => !f.path.startsWith(`${cleanFolder}/`));
    this.pinnedPaths = this.pinnedPaths.filter((p) => !p.startsWith(`${cleanFolder}/`));
    for (const rId of Object.keys(this.openTabsByRealm)) {
      this.openTabsByRealm[rId] = this.openTabsByRealm[rId].filter(
        (p) => !p.startsWith(`${cleanFolder}/`)
      );
    }
    for (const rId of Object.keys(this.activeNoteByRealm)) {
      if (this.activeNoteByRealm[rId].startsWith(`${cleanFolder}/`)) {
        this.activeNoteByRealm[rId] = this.openTabsByRealm[rId]?.[0] || '';
      }
    }

    if (this.activeNotePath.startsWith(`${cleanFolder}/`)) {
      const remaining = this.getOpenTabs();
      this.activeNotePath = remaining[0]?.path || '';
    }
    this.uncommittedChanges++;
    this.saveToStorage();
  }

  // Get all unique folder paths for a realm
  public getFoldersForRealm(realmId: string): string[] {
    const realm = this.realms.find((r) => r.id === realmId) || this.getActiveRealm();
    const folderSet = new Set<string>();
    folderSet.add(realm.name);

    for (const f of this.files) {
      if (f.realm === realmId) {
        const parts = f.path.split('/');
        parts.pop(); // remove filename
        let current = '';
        for (const part of parts) {
          current = current ? `${current}/${part}` : part;
          folderSet.add(current);
        }
      }
    }

    return Array.from(folderSet).sort();
  }

  public getUncommittedChanges(): number {
    return this.uncommittedChanges;
  }

  public syncGit() {
    this.uncommittedChanges = 0;
    this.notify();
  }
}

export const vault = new VaultManager();
