# Ascend Realms — Local-First Workspace Engine & UI Implementation Plan (Revision 2)

A refined local-first, notes-centered workspace structured around Realms (Core, Coding, Studying, Writing), incorporating user-directed adjustments to data topology, right panel docking, file management, and task aggregation.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following revisions have been incorporated:
> 1. **Inbox.md as Single Triage Source**: `Triage.md` is removed. All web clips and captured raw items reside exclusively in `Core/Inbox.md`. Items in `Inbox.md` are excluded from the Task Pool.
> 2. **Core Realm Task Pool Aggregation**: In Core Realm, the Task Pool aggregates unchecked tasks from **all** realms (`Coding/Tasks.md`, `Studying/Tasks.md`, `Writing/Tasks.md`, and all projects), grouped clearly by Realm.
> 3. **Notes Tab Strip `+` Button & Header Unblocking**: Added a dedicated `+` button on the Notes widget tab strip for rapid note creation in the active realm. Fixed the layout so the realm purpose description is never obscured.
> 4. **Working `+ Note` in Sidebar**: Implemented a responsive inline prompt/modal for the sidebar `+ Note` button that creates the note and immediately opens it in the editor.
> 5. **Folder & File Management (CRUD & Within-Realm Moves)**:
>    - Each folder features two quick buttons: `+ File` and `+ Folder` (subfolder creation), plus an Options ellipsis (`...`) for **Move** and **Delete**.
>    - Each file features an Options ellipsis (`...`) for **Move** (move to any folder within the same realm) and **Delete**.
> 6. **Rich Rendered Markdown Preview**: Replaced the raw text dump in the Preview panel with a richly rendered Markdown document (formatted headings, styled checklists, blockquotes, code blocks, lists) alongside backlinks.
> 7. **Docked Right Panel for Search & New Project**: Converted Search and New Project from floating screen overlays into dedicated docked views in the Right Panel.
> 8. **Docked Focus Dungeon in Rail**: The Dungeon (presets, countdown timer, and soft-block challenge) is now a primary rail button docking directly in the Right Panel.

---

## 1. Overview & Core Concept

**Ascend Realms** provides an uncompromising local-first workspace for sustained deep work. User data lives exclusively in Markdown files with YAML frontmatter. The embedded SQLite cache enables microsecond queries, backlinks, and full-text search without altering the canonical Markdown truth.

- **Unified Inbox Triage**: Raw incoming thoughts and web captures land in `Core/Inbox.md`. The Triage rail tool allows users to file each item directly into its appropriate Realm and note with one click.
- **Cross-Realm Task Aggregation in Core**: While individual Realms show only domain-scoped tasks, the Core Task Pool provides a bird's-eye view of all pending tasks across the entire vault, grouped by Realm.
- **Single-Elevation Docked Architecture**: Modal popups are eliminated in favor of a cohesive docked Right Panel that slides alongside the main canvas without covering the active note.

---

## 2. User Experience & Visual Design

The workspace topology consists of four tightly integrated zones:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [A] Ascend   [ Core 01 ]   [ Coding 02 ]   [ Studying 03 ]   [ Writing 04 ]   [ + ]  ● ⚙ │ Top Realm Bar
├────────────────┬───────────────────────────────────────────────────────┬───────────────┤
│ File Explorer  │ Yesterday's Review (Triage: Complete, Defer, Carry, Drop)│ Floating Rail:│
│ - Inbox.md (3) ├───────────────────────────────────────────────────────┤  [Inbox/Triage│
│ - Daily/       │ Notes Editor                                          │  [Preview]    │
│ - Presets.md   │ [ 2026-09-22 ▪ ] [ Goals.md ] [ + ] ◄─ New Note Tab   │  [Search]     │
│ - Projects/    │ Breadcrumb: Projects / bun-sqlite-engine / index.md   │  [+ Project]  │
│   ├── engine/  │ Live Preview with Clickable Checkboxes & Block IDs    │  [Dungeon]    │
│   │   [+f][+d] ├───────────────────────────────────────────────────────┤  [Steward AI] │
│   │   [···]    │ Task Pool (In Core: Aggregated from all Realms)       ├───────────────┤
│                ├───────────────────────────────────────────────────────┤ Docked Right  │
│                │ Inbox Triage Widget (Fast sorting from Inbox.md)      │ Panel Views:  │
│ [+ Note]       │                                                       │ • Triage      │
│                │                                                       │ • Search      │
│                │                                                       │ • + Project   │
│                │                                                       │ • Dungeon     │
│                │                                                       │ • Steward Chat│
│                │                                                       │ • Preview     │
└────────────────┴───────────────────────────────────────────────────────┴───────────────┘
```

### Visual Enhancements & Component Interactions
- **Notes Tab Strip `+` Button**: A clean `+` button directly to the right of the active note tabs. Clicking it creates a new note in the active realm and switches focus to it.
- **File Explorer Hover Actions**:
  - Folders display inline icons on hover: `+ File` (new note inside folder), `+ Folder` (nested subfolder), and `···` (Move folder, Delete folder).
  - Files display an inline `···` on hover with options to Move (opens folder destination selector restricted to the current realm) or Delete.
- **Rich Preview Panel**: Parses Markdown into typographic typography using Newsreader serif headings, clean body copy, rendered bullet hierarchies, styled checkboxes, and backlink references.
- **Docked Right Panel**: Houses 6 dedicated views, all opening alongside the note:
  1. **Triage Panel**: Items parsed from `Core/Inbox.md` with Realm and File destination pickers.
  2. **Search Panel**: Instant vault search with snippet highlighting and one-click jump.
  3. **New Project Panel**: Dedicated form to initialize a project folder and its `index.md`.
  4. **Focus Dungeon Panel**: Preset selector, countdown clock, challenge modal, and session logger.
  5. **Steward AI Panel**: Gemini 2.5 Flash chat with prompt context inspector and diff cards.
  6. **Preview Panel**: Formatted reading view of the active note with backlinks.

---

## 3. Key Product Decisions & Data Topology

- **Decision 1: Elimination of `Triage.md` in Favor of `Core/Inbox.md`**
  - *Chosen Approach*: `Core/Inbox.md` is the sole capture queue. The Triage panel reads and dispatches items directly from `Core/Inbox.md`. Lines in `Inbox.md` are filtered out from the Task Pool so capture triage does not contaminate task execution.
  - *Why*: Aligns with the core architecture invariant (ADR-0025: One inbox in Core, not one per realm, and no separate triage file).

- **Decision 2: Core Task Pool Cross-Realm Aggregation**
  - *Chosen Approach*: When in Core Realm, the Task Pool indexes open tasks from `Coding/Tasks.md`, `Studying/Tasks.md`, `Writing/Tasks.md`, and all project notes. In domain realms, the Task Pool strictly shows tasks within that realm.
  - *Why*: Allows the user to plan their entire day from the Core Daily Note while keeping individual Realm contexts pristine.

- **Decision 3: Zero-Overlay Workspace Principle**
  - *Chosen Approach*: Search, New Project, Dungeon, and Triage all dock inside the Right Panel rather than popping up as viewport-covering modal dialogs.
  - *Why*: Preserves continuous visibility of the active note while performing auxiliary operations like searching or configuring timers.

---

## 4. Technical Implementation & State Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Vault State Engine                           │
│                                                                        │
│  - files: VaultFile[] (localStorage + fallback IndexedDB)             │
│  - Core/Inbox.md (Exclusive capture queue, excluded from Task Pool)    │
│  - allChecklistItems: ChecklistItem[] (Indexed across vault)           │
│  - activeRealm: 'core' -> aggregates all realms in Task Pool           │
│                 '<realm>' -> filters tasks to active realm             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌──────────────────────────────────┐        ┌────────────────────────────┐
│      File Explorer System        │        │     Docked Right Panel     │
│ - Folder: [+File] [+Dir] [···]   │        │ - activeTab:               │
│ - File: [···] Move within realm  │        │   'triage' | 'search' |    │
│ - Note creation prompt           │        │   'new-project' | 'dungeon'│
│ - Delete with confirmation       │        │   'steward' | 'preview'    │
└──────────────────────────────────┘        └────────────────────────────┘
```

---

## 5. Verification & Testing Plan

1. **Inbox Triage Flow**:
   - Verify that `Triage.md` is removed and `Core/Inbox.md` contains the raw captures.
   - Verify that clicking Triage in the rail opens the docked panel, allows selecting target realm/file, and moves the item from `Inbox.md`.
2. **Core Task Pool Aggregation**:
   - In Core Realm, verify that open tasks from Coding, Studying, Writing, and Projects all appear in the Task Pool grouped by realm.
   - Switch to Coding Realm, verify that only Coding tasks appear.
3. **Notes Tab Strip `+` Button & Layout**:
   - Verify that the `+` button on the tab strip creates a new note in the active realm and opens it.
   - Verify that the realm description is clean and unblocked.
4. **File Explorer Folder & File Operations**:
   - Test creating a file inside a specific folder using `+ File`.
   - Test creating a subfolder using `+ Folder`.
   - Test Move option: select destination folder within the realm, verify file moves.
   - Test Delete option with confirmation.
5. **Rich Markdown Preview**:
   - Open Preview in right panel and verify that headers, bold text, lists, and checkboxes render as formatted HTML/React nodes instead of raw text.
6. **Docked Right Panel for Search, Project, and Dungeon**:
   - Click Search in rail: confirm Right Panel opens to Search with live filtering.
   - Click New Project in rail: confirm Right Panel opens with Project creation form.
   - Click Dungeon in rail: confirm Right Panel opens with timer controls.
7. **Compilation & Lint**:
   - Run `lint_applet` and `compile_applet` to confirm 100% clean build.
