import { RealmConfig, VaultFile } from '../types/vault';

export const INITIAL_REALMS: RealmConfig[] = [
  {
    id: 'core',
    name: 'Core',
    number: '01',
    kind: 'core',
    purpose: 'Global scope: daily planning, standing profile, routine schedule, high-level goals, and unassigned triage.',
    view: {
      background: '#4d2d14', // Warm noticeable dark amber bronze hue (distinct rich hue, not black)
      accent: '#f59e0b',
      typography: 'sans',
    },
    widgets: [
      { id: 'yesterday-review', open: true, span: 'full' },
      { id: 'notes', open: true, span: 'full' },
      { id: 'task-pool', open: true, span: 'full' },
      { id: 'dungeon', open: true, span: 'half' },
      { id: 'inbox-triage', open: true, span: 'half' },
    ],
    defaultPreset: 'Deep',
  },
  {
    id: 'coding',
    name: 'Coding',
    number: '02',
    kind: 'realm',
    purpose: 'Software engineering, SQLite indexing engine, git driver commands, and native extension limbs.',
    view: {
      background: '#1d4475', // Noticeable deep dark sapphire blue hue (distinct rich hue, not black)
      accent: '#3b82f6',
      typography: 'mono',
    },
    widgets: [
      { id: 'notes', open: true, span: 'full' },
      { id: 'task-pool', open: true, span: 'full' },
      { id: 'dungeon', open: true, span: 'half' },
      { id: 'projects', open: true, span: 'half' },
    ],
    defaultPreset: 'Deep',
    allowlist: ['github.com', 'localhost', 'developer.mozilla.org', 'bun.sh'],
  },
  {
    id: 'studying',
    name: 'Studying',
    number: '03',
    kind: 'realm',
    purpose: 'Academic research, distributed consensus papers, and conceptual flashcard synthesis.',
    view: {
      background: '#185c44', // Noticeable deep dark pine forest green hue (distinct rich hue, not black)
      accent: '#10b981',
      typography: 'serif',
    },
    widgets: [
      { id: 'notes', open: true, span: 'full' },
      { id: 'task-pool', open: true, span: 'full' },
      { id: 'dungeon', open: true, span: 'half' },
    ],
    defaultPreset: 'Deep',
    allowlist: ['arxiv.org', 'scholar.google.com', 'wikipedia.org'],
  },
  {
    id: 'writing',
    name: 'Writing',
    number: '04',
    kind: 'realm',
    purpose: 'Technical architecture specifications, architectural decision records (ADRs), and long-form prose.',
    view: {
      background: '#4a2162', // Noticeable deep dark plum violet hue (distinct rich hue, not black)
      accent: '#a855f7',
      typography: 'serif',
    },
    widgets: [
      { id: 'notes', open: true, span: 'full' },
      { id: 'task-pool', open: true, span: 'full' },
      { id: 'dungeon', open: true, span: 'half' },
    ],
    defaultPreset: 'Mild',
  },
];

export const INITIAL_FILES: VaultFile[] = [
  // Core / Daily
  {
    path: 'Core/Daily/2026-09-22.md',
    id: 'd-2026-09-22',
    realm: 'core',
    title: '2026-09-22 — Daily Plan',
    isDaily: true,
    mtime: Date.now(),
    content: `# 2026-09-22 — Daily Plan

## Plan
- [ ] 09:30 Refactor SQLite indexer for WAL pragma adherence ^t7f3a2
- [ ] 11:00 Finalize MV3 declarativeNetRequest blocking ruleset ^k9b1c4
- [ ] 14:30 Audit loopback native messaging discovery handshake ^m4x8e2
- [x] 08:30 Review yesterday's carried sprint items ^w2q1a9

## Notes & Observations
Observed that Bun SQLite mmap allocation avoids browser tab throttling when running as headless loopback daemon.
Git auto-commit timer calibrated to 15m intervals with atomic .tmp rename flush.
`,
  },
  {
    path: 'Core/Daily/2026-09-21.md',
    id: 'd-2026-09-21',
    realm: 'core',
    title: '2026-09-21 — Daily Plan',
    isDaily: true,
    mtime: Date.now() - 86400000,
    content: `# 2026-09-21 — Daily Plan

## Plan
- [x] Initial monorepo scaffolding for packages/service and packages/app ^y1k2m3
- [ ] Implement deterministic fallback block ID hash calculation %%carried:1%% ^h8j3p1
- [ ] Benchmark WebP capture pipeline at 80 quality cap 1600px ^v5c7n2
- [x] Setup Core folder structure with Presets and Profile ^b2n4m8
`,
  },
  // Core Standing notes
  {
    path: 'Core/Inbox.md',
    id: 'c-inbox',
    realm: 'core',
    title: 'Inbox & Raw Captures',
    isInbox: true,
    mtime: Date.now(),
    content: `# Core Inbox

Captured web snippets, links, and quick unfiled thoughts land here for rapid triage into Realms.

- [ ] Inspect Paxos Made Simple paper on consensus invariants (Source: https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) [saved: 2026-09-22 09:15]
- [ ] Review Bun.serve() WebSocket backpressure handling documentation (Source: https://bun.sh/docs/api/websockets) [saved: 2026-09-22 10:20]
- [ ] Draft ADR-0027: Browser tab single-elevation grid vs multi-window layout [saved: 2026-09-22 11:05]
- [ ] Research WebCrypto API for Native Messaging token validation [saved: 2026-09-22 11:45]
- [ ] Outline thesis on local-first note sovereignty vs cloud SaaS sync locks [saved: 2026-09-22 12:30]
- [x] Audit SQLite secondary indexer WAL journaling [saved: 2026-09-22 08:45] <!-- triaged: 2026-09-22T08:50:00.000Z -> Coding/Projects/bun-sqlite-engine/index.md -->
`,
  },
  {
    path: 'Core/Presets.md',
    id: 'c-presets',
    realm: 'core',
    title: 'Focus Presets Specification',
    mtime: Date.now(),
    content: `---
presets:
  - name: Deep
    suggested-duration-minutes: 50
    allowlist: []
    blocklist:
      - x.com
      - twitter.com
      - reddit.com
      - youtube.com
      - news.ycombinator.com
      - instagram.com
    hard: [x.com, instagram.com, reddit.com]
    soft: [youtube.com, news.ycombinator.com]
    phrase: "I am choosing distraction over my goal"
  - name: Mild
    suggested-duration-minutes: 25
    allowlist: []
    blocklist:
      - instagram.com
      - tiktok.com
    hard: [instagram.com]
    soft: [tiktok.com]
    phrase: "I am choosing distraction over my goal"
  - name: Hardcore
    suggested-duration-minutes: 90
    allowlist: []
    blocklist:
      - "*"
    hard: ["*"]
    soft: []
    phrase: "I am deliberately breaking deep focus"
---

# Focus Presets Specification

User-level focus presets governing the Dungeon distraction barrier.
Effective allowlist resolves as:
\`Global Blocklist → Realm Allowlist ∪ Preset Allowlist → Blocked\`.
`,
  },
  {
    path: 'Core/Profile.md',
    id: 'c-profile',
    realm: 'core',
    title: 'User Profile & Identity',
    mtime: Date.now(),
    content: `# User Profile — Steward AI Context

## Identity & Principles
- Senior Full-Stack Engineer and Systems Architect building Ascend Realms.
- Primary values: deep sustained flow, local data sovereignty, transparent file persistence, zero context switching.
- Preferred working methodology: daily planning note as single truth, tasks linked via block IDs, strict morning triage.
`,
  },
  {
    path: 'Core/Schedule.md',
    id: 'c-schedule',
    realm: 'core',
    title: 'Weekly Routine & Schedule',
    mtime: Date.now(),
    content: `# Schedule & Routine

- 08:30 - 09:00: Morning Yesterday's Review triage & Daily Note plan commitment
- 09:00 - 12:00: Deep Focus Dungeon — Architecture & Core Systems (Coding Realm)
- 13:30 - 15:30: Secondary Focus Block — Research & Synthesis (Studying Realm)
- 16:00 - 17:30: Technical Writing & ADR Documentation (Writing Realm)
`,
  },
  {
    path: 'Core/Goals.md',
    id: 'c-goals',
    realm: 'core',
    title: 'Standing Goals',
    mtime: Date.now(),
    content: `# Goals & Milestones

- Q3 Objective: Complete Stage 1 Local Workspace Spine for Ascend Realms.
- Target: Microsecond query latencies on SQLite cache; zero note corruption via atomic rename.
- Quality Goal: 100% adherence to Markdown source of truth with bidirectional block ID linking.
`,
  },
  {
    path: 'Core/Sessions/2026-09-22.md',
    id: 'c-session-today',
    realm: 'core',
    title: '2026-09-22 Focus Sessions',
    isSession: true,
    mtime: Date.now(),
    content: `# Focus Sessions — 2026-09-22

## Session — 09:15–10:05 (Coding · Deep)
- Focus minutes: 50
- Interruptions: 1
- Overrides: 0
- Notes: Implemented SQLite PRAGMA journal_mode = WAL; tested concurrent read performance.
`,
  },
  {
    path: 'Core/Welcome.md',
    id: 'c-welcome',
    realm: 'core',
    title: 'Welcome to Ascend Realms',
    mtime: Date.now(),
    content: `# Welcome to Ascend Realms

Ascend is a local-first workspace for focused work, organized around **Realms** — a pinned browser tab backed by a background service.

### 1. What this is
Your content lives in plain Markdown notes on your machine. Nothing is sent to cloud servers without your explicit intent.

### 2. Realms
A Realm is an operational area of work:
- **Core**: Your daily planning, standing profile, schedule, goals, and triage queue.
- **Coding**: Code architecture, repositories, and technical execution.
- **Studying**: Research papers, notes, and academic synthesis.
- **Writing**: Specs, long-form prose, and architectural records.

### 3. The Daily Note & Task Pool
- The **Daily Note** is your plan for today.
- The **Task Pool** reads from the master \`Tasks.md\` and each project's dedicated \`Task.md\`.
- Use **Commit** in the pool to copy a task to your daily plan. Both lines receive an Obsidian block ID (\`^blockid\`) and stay synchronized!
`,
  },

  // Markdown Syntax & KaTeX Test Note (User Request 6 & 9)
  {
    path: 'Core/Markdown-Syntax-Test.md',
    id: 'c-markdown-test',
    realm: 'core',
    title: 'Markdown Syntax & Math Test',
    mtime: Date.now(),
    content: `---
title: Markdown Syntax & Math Test
created: 2026-09-22
tags: [markdown, latex, math, testing, obsidian]
status: active
priority: high
math-engine: KaTeX 0.18.9
---

# Markdown Syntax & Math Comprehensive Test

This document verifies the live preview rendering capabilities of the Ascend engine across typography, formatting, mathematics, quotes, code, tables, and collapsible Obsidian note properties.

## 1. Typography & Inline Styles
- **Bold text using double asterisks** and __bold text using underscores__
- *Italic text using single asterisks* and _italic text using underscores_
- ***Combined bold and italic styling*** for prominent emphasis
- ~~Strikethrough text~~ for deprecated specifications
- Inline code snippet: \`const sqlite = new Database('.ascend/cache.sqlite');\`
- Obsidian internal link: [[Core/Goals|Standing Goals]] and [[Coding/Tasks]]

## 2. Blockquotes & Callouts
> "Premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%."
> — Donald Knuth

> Multi-line architectural rule:
> First line: SQLite WAL journaling must be enabled on connection initialization.
> Second line: Secondary indexer queries must run via read-only worker threads.

## 3. Mathematical Expressions (KaTeX)
### Inline Mathematics
- The mass-energy equivalence: $E = mc^2$, where $c \\approx 3 \\times 10^8 \\text{ m/s}$.
- The Gaussian normal distribution formula is $f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$.
- Spectral peak relation: $\\lambda_{max} T = b$ where $b$ is Wien's displacement constant.

### Display / Block Mathematics
The Fourier transform inversion theorem states:
$$
\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\,e^{-2\\pi i x \\xi}\\,dx
$$

Standard deviation of sample population:
$$
\\sigma = \\sqrt{\\frac{1}{N}\\sum_{i=1}^N (x_i - \\mu)^2}
$$

The 2x2 matrix inverse formula:
$$
\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}
$$

## 4. Code Blocks
\`\`\`typescript
interface VaultIndexer {
  path: string;
  checksum: string;
  mtime: number;
  reindex(): Promise<number>;
}

export function computeBlockId(content: string): string {
  return Math.random().toString(36).slice(2, 8);
}
\`\`\`

\`\`\`bash
# Run local daemon with WAL mode enabled
bun run --hot packages/service/src/index.ts --port 3456
\`\`\`

## 5. Structured Data & Tables
| Component | Technology | Primary Role | Latency |
| :--- | :--- | :--- | :--- |
| Core Service | Bun + SQLite | Native OS limb & cache | < 1ms |
| Frontend | React + Tailwind | Realm Quad Canvas | 16ms (60fps) |
| Live Preview | KaTeX + Parser | Live Markdown rendering | Instant |

## 6. Task List & Checklists
- [x] Initial syntax specifications defined ^s7a1b2
- [ ] Verify blockquote and italic rendering in preview mode ^s7a1b3
- [>] Defer complex 3D WebGL graph view to Stage 2 %%carried:1%% ^s7a1b4
`,
  },

  // Coding Realm
  {
    path: 'Coding/Tasks.md',
    id: 'code-tasks',
    realm: 'coding',
    title: 'Master Tasks — Coding',
    mtime: Date.now(),
    content: `# Tasks — Coding Realm

- [ ] Write integration test suite for atomic .tmp file write loop ^c1a2b3
- [ ] Implement FTS5 tokenization for cross-vault note search ^c4d5e6
- [ ] Profile Bun.serve memory footprint during long-lived WebSocket sessions ^c7f8a9
`,
  },
  {
    path: 'Coding/Projects/bun-sqlite-engine/index.md',
    id: 'p-bun-sqlite',
    realm: 'coding',
    realmName: 'Coding',
    projectName: 'bun-sqlite-engine',
    isProject: true,
    title: 'Core Indexer Architecture',
    mtime: Date.now(),
    content: `---
project: true
realm: Coding
created: 2026-09-22
deadline: 2026-10-15
status: active
---

# bun-sqlite-engine / Core Indexer Architecture

## Description
High-performance background indexing engine built on top of bun:sqlite and file system listeners.

## Notes
The SQLite database file must remain outside the vault repository at \`<configDir>/.ascend/ascend.sqlite\` to ensure the Markdown vault is 100% human-readable and clean of hidden artifacts.
`,
  },
  // Dedicated Project Task File (User Request 10)
  {
    path: 'Coding/Projects/bun-sqlite-engine/Task.md',
    id: 'p-bun-sqlite-tasks',
    realm: 'coding',
    realmName: 'Coding',
    projectName: 'bun-sqlite-engine',
    isProject: true,
    title: 'Tasks — bun-sqlite-engine',
    mtime: Date.now(),
    content: `# Tasks — bun-sqlite-engine

- [ ] Refactor SQLite indexer for WAL pragma adherence ^t7f3a2
- [ ] Implement deterministic fallback block ID hash calculation %%carried:1%% ^h8j3p1
- [ ] Add composite index on checklist_index(block_ref, path, realm) ^x9m2k1
- [x] Enable synchronous = NORMAL for high-throughput write performance ^q3w4e5
`,
  },
  {
    path: 'Coding/Projects/ascend-mv3-extension/index.md',
    id: 'p-mv3-ext',
    realm: 'coding',
    realmName: 'Coding',
    projectName: 'ascend-mv3-extension',
    isProject: true,
    title: 'MV3 Extension Limb',
    mtime: Date.now(),
    content: `---
project: true
realm: Coding
created: 2026-09-22
deadline: 2026-10-30
status: active
---

# ascend-mv3-extension / Enforcement Limb

## Description
Manifest V3 browser extension communicating with the Bun daemon via authenticated WebSocket to enforce declarativeNetRequest site blocking and display the side panel countdown.
`,
  },
  // Dedicated Project Task File (User Request 10)
  {
    path: 'Coding/Projects/ascend-mv3-extension/Task.md',
    id: 'p-mv3-ext-tasks',
    realm: 'coding',
    realmName: 'Coding',
    projectName: 'ascend-mv3-extension',
    isProject: true,
    title: 'Tasks — ascend-mv3-extension',
    mtime: Date.now(),
    content: `# Tasks — ascend-mv3-extension

- [ ] Finalize MV3 declarativeNetRequest blocking ruleset ^k9b1c4
- [ ] Audit loopback native messaging discovery handshake ^m4x8e2
- [ ] Connect side panel timer to master session clock ^j1k2l3
`,
  },

  // Studying Realm
  {
    path: 'Studying/Tasks.md',
    id: 'study-tasks',
    realm: 'studying',
    title: 'Master Tasks — Studying',
    mtime: Date.now(),
    content: `# Tasks — Studying Realm

- [ ] Read Raft consensus algorithm paper sections 5 through 7 ^s1a2b3
- [ ] Create flashcards for Byzantine Fault Tolerance quorum formulas ^s4d5e6
`,
  },
  {
    path: 'Studying/Projects/distributed-systems/index.md',
    id: 'p-dist-sys',
    realm: 'studying',
    realmName: 'Studying',
    projectName: 'distributed-systems',
    isProject: true,
    title: 'Distributed Systems & Consensus',
    mtime: Date.now(),
    content: `---
project: true
realm: Studying
created: 2026-09-22
status: active
---

# distributed-systems / Consensus Invariants

## Description
Systematic study of Paxos, Raft, and Viewstamped Replication protocols.
`,
  },
  // Dedicated Project Task File (User Request 10)
  {
    path: 'Studying/Projects/distributed-systems/Task.md',
    id: 'p-dist-sys-tasks',
    realm: 'studying',
    realmName: 'Studying',
    projectName: 'distributed-systems',
    isProject: true,
    title: 'Tasks — distributed-systems',
    mtime: Date.now(),
    content: `# Tasks — distributed-systems

- [ ] Inspect Paxos Made Simple paper on consensus invariants ^p1a2b3
- [ ] Compare log compaction strategies between Raft and Multi-Paxos ^p4d5e6
`,
  },

  // Writing Realm
  {
    path: 'Writing/Tasks.md',
    id: 'writing-tasks',
    realm: 'writing',
    title: 'Master Tasks — Writing',
    mtime: Date.now(),
    content: `# Tasks — Writing Realm

- [ ] Draft ADR-0027: Browser tab single-elevation grid vs multi-window layout ^w1a2b3
- [ ] Finalize Ascend Realms v1 whitepaper introduction ^w4d5e6
`,
  },
  {
    path: 'Writing/Projects/local-first-architecture/index.md',
    id: 'p-local-first',
    realm: 'writing',
    realmName: 'Writing',
    projectName: 'local-first-architecture',
    isProject: true,
    title: 'Local-First Architecture Principles',
    mtime: Date.now(),
    content: `---
project: true
realm: Writing
created: 2026-09-22
status: active
---

# local-first-architecture / Technical Monograph

## Description
A comprehensive guide to building service-backed desktop workspaces with plain text truth and disposable SQL caches.
`,
  },
  // Dedicated Project Task File (User Request 10)
  {
    path: 'Writing/Projects/local-first-architecture/Task.md',
    id: 'p-local-first-tasks',
    realm: 'writing',
    realmName: 'Writing',
    projectName: 'local-first-architecture',
    isProject: true,
    title: 'Tasks — local-first-architecture',
    mtime: Date.now(),
    content: `# Tasks — local-first-architecture

- [ ] Document 6-module architecture boundaries ^m1a2b3
- [ ] Write section on bi-directional block ID linking and atomic write guarantees ^m4d5e6
`,
  },
];
