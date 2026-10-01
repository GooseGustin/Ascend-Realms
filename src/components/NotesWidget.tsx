import React, { useState, useEffect, useMemo } from 'react';
import { VaultFile } from '../types/vault';
import katex from 'katex';
import {
  FileText,
  X,
  Code,
  Eye,
  Copy,
  Check,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Pin,
  SlidersHorizontal,
  Tag,
  Hash,
  ExternalLink,
  ChevronUp,
} from 'lucide-react';

interface NotesWidgetProps {
  openTabs: VaultFile[];
  activeNote?: VaultFile;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onUpdateContent: (path: string, content: string) => void;
  onToggleTaskLine: (blockRefOrLineText: string, targetState: boolean) => void;
  onNewNote?: () => void;
  onTogglePin?: (path: string) => void;
  isNotePinned?: (path: string) => boolean;
}

interface ParsedFrontmatter {
  properties: Record<string, any>;
  bodyContent: string;
}

// Parse YAML frontmatter between --- and ---
function parseNoteFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { properties: {}, bodyContent: content };
  }

  const rawYaml = match[1];
  const bodyContent = match[2];
  const properties: Record<string, any> = {};

  const lines = rawYaml.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      // Handle array: [a, b, c]
      if (val.startsWith('[') && val.endsWith(']')) {
        const items = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        properties[key] = items;
      } else {
        // Strip quotes
        val = val.replace(/^['"]|['"]$/g, '');
        properties[key] = val;
      }
    }
  }

  return { properties, bodyContent };
}

// Safely render KaTeX inline math
function renderKaTeX(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch (e) {
    return `<span class="text-rose-600 font-mono text-xs">[Math error: ${latex}]</span>`;
  }
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({
  openTabs,
  activeNote,
  onSelectTab,
  onCloseTab,
  onUpdateContent,
  onToggleTaskLine,
  onNewNote,
  onTogglePin,
  isNotePinned,
}) => {
  const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  
  // User Request 3: Files remember which mode (raw/preview) they are in
  const [fileModes, setFileModes] = useState<Record<string, 'raw' | 'preview'>>(() => {
    try {
      const stored = localStorage.getItem('ascend_vault_file_modes_v1');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // Mode is stored per file path, defaulting to 'preview'
  const activePath = activeNote?.path || '';
  const currentMode: 'raw' | 'preview' = (activePath && fileModes[activePath]) || 'preview';
  const isRawMode = currentMode === 'raw';

  const setModeForCurrentFile = (mode: 'raw' | 'preview') => {
    if (!activePath) return;
    setFileModes((prev) => {
      const next = { ...prev, [activePath]: mode };
      try {
        localStorage.setItem('ascend_vault_file_modes_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (activeNote) {
      setEditContent(activeNote.content);
    }
  }, [activeNote?.path, activeNote?.content]);

  const { properties, bodyContent } = useMemo(() => {
    if (!activeNote) return { properties: {}, bodyContent: '' };
    return parseNoteFrontmatter(activeNote.content);
  }, [activeNote?.content]);

  if (!activeNote) {
    return (
      <div className="p-8 text-center text-slate-600 bg-[#e4e6ea] rounded-lg border border-[#cbd0db] shadow-sm">
        No active note open. Select a note from the explorer to begin.
      </div>
    );
  }

  const isDaily = activeNote.isDaily || activeNote.path.startsWith('Core/Daily/');
  const isProject = activeNote.isProject;
  const projectBreadcrumb = activeNote.path.match(/Projects\/([^/]+)/)?.[1];

  const handleCopyBlock = (blockId: string) => {
    navigator.clipboard.writeText(`[[${activeNote.title}#^${blockId}]]`);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 1500);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 1500);
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditContent(val);
    onUpdateContent(activeNote.path, val);
  };

  // Toggle checkbox directly in Live Preview mode
  const handleCheckboxClick = (targetBlockRef: string | undefined, currentCheckState: boolean, rawLineText: string) => {
    const lines = activeNote.content.split('\n');
    const newChecked = !currentCheckState;

    let updated = false;
    const newLines = lines.map((l) => {
      if (updated) return l;
      if (targetBlockRef && l.includes(`^${targetBlockRef}`)) {
        updated = true;
        return newChecked
          ? l.replace(/-\s*\[[ >]\]/, '- [x]')
          : l.replace(/-\s*\[[xX]\]/, '- [ ]');
      }
      if (!targetBlockRef && l === rawLineText) {
        updated = true;
        return newChecked
          ? l.replace(/-\s*\[[ >]\]/, '- [x]')
          : l.replace(/-\s*\[[xX]\]/, '- [ ]');
      }
      return l;
    });

    const newFullContent = newLines.join('\n');
    onUpdateContent(activeNote.path, newFullContent);

    if (targetBlockRef) {
      onToggleTaskLine(targetBlockRef, newChecked);
    }
  };

  // Inline Markdown Parser: handles math ($...$), bold, italics, bold+italics, strikethrough, inline code, wikilinks, links
  const renderInlineFormatted = (text: string) => {
    // Tokenize text into math ($...$) vs regular text first to prevent styling inside LaTeX formulas
    const parts: React.ReactNode[] = [];
    const mathRegex = /\$([^\$]+?)\$/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = mathRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(renderTextFormatting(text.slice(lastIdx, match.index), `txt-${lastIdx}`));
      }
      const mathStr = match[1];
      const html = renderKaTeX(mathStr, false);
      parts.push(
        <span
          key={`math-${match.index}`}
          className="inline-katex px-1 font-mono align-baseline text-slate-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      parts.push(renderTextFormatting(text.slice(lastIdx), `txt-${lastIdx}`));
    }

    return parts;
  };

  // Helper for bold, italics, code, wikilinks within regular text
  const renderTextFormatting = (raw: string, keyPrefix: string): React.ReactNode => {
    // Regex for:
    // 1. `inline code`
    // 2. [[wikilink|alias]] or [[wikilink]]
    // 3. [label](url)
    // 4. ***bold italic***
    // 5. **bold** or __bold__
    // 6. *italic* or _italic_
    // 7. ~~strikethrough~~
    const regex = /(`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^\)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|(?<!\w)\*[^*]+(?<!\w)\*|(?<!\w)_[^_]+(?<!\w)_|~~[^~]+~~)/g;
    const pieces = raw.split(regex);

    return pieces.map((piece, i) => {
      const key = `${keyPrefix}-${i}`;
      if (!piece) return null;

      // Inline code: `code`
      if (piece.startsWith('`') && piece.endsWith('`') && piece.length >= 2) {
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200/80 mx-0.5"
          >
            {piece.slice(1, -1)}
          </code>
        );
      }

      // Obsidian Wikilink: [[Target|Alias]] or [[Target]]
      if (piece.startsWith('[[') && piece.endsWith(']]')) {
        const inner = piece.slice(2, -2);
        const [target, alias] = inner.split('|');
        const displayLabel = alias || target.split('/').pop()?.replace('.md', '') || target;
        let resolvedPath = target.trim();
        if (!resolvedPath.endsWith('.md')) {
          resolvedPath += '.md';
        }

        return (
          <button
            key={key}
            onClick={() => onSelectTab(resolvedPath)}
            title={`Open note: ${target}`}
            className="inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 font-medium hover:underline bg-blue-50/80 hover:bg-blue-100 px-1 py-0.2 rounded text-[12px] cursor-pointer transition-colors mx-0.5 align-baseline"
          >
            <span>{displayLabel}</span>
          </button>
        );
      }

      // Standard markdown link: [label](url)
      if (piece.startsWith('[') && piece.includes('](') && piece.endsWith(')')) {
        const linkMatch = piece.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={key}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-0.5"
            >
              <span>{linkMatch[1]}</span>
              <ExternalLink className="w-2.5 h-2.5 inline" />
            </a>
          );
        }
      }

      // Bold + Italic: ***text*** or ___text___
      if (
        (piece.startsWith('***') && piece.endsWith('***') && piece.length >= 6) ||
        (piece.startsWith('___') && piece.endsWith('___') && piece.length >= 6)
      ) {
        return (
          <strong key={key} className="font-bold italic text-slate-900">
            {piece.slice(3, -3)}
          </strong>
        );
      }

      // Bold: **text** or __text__
      if (
        (piece.startsWith('**') && piece.endsWith('**') && piece.length >= 4) ||
        (piece.startsWith('__') && piece.endsWith('__') && piece.length >= 4)
      ) {
        return (
          <strong key={key} className="font-bold text-slate-900">
            {piece.slice(2, -2)}
          </strong>
        );
      }

      // Strikethrough: ~~text~~
      if (piece.startsWith('~~') && piece.endsWith('~~') && piece.length >= 4) {
        return (
          <del key={key} className="line-through text-slate-400">
            {piece.slice(2, -2)}
          </del>
        );
      }

      // Italic: *text* or _text_
      if (
        (piece.startsWith('*') && piece.endsWith('*') && piece.length >= 2) ||
        (piece.startsWith('_') && piece.endsWith('_') && piece.length >= 2)
      ) {
        return (
          <em key={key} className="italic text-slate-800">
            {piece.slice(1, -1)}
          </em>
        );
      }

      return piece;
    });
  };

  // Render Live Preview Lines (Headings, Math blocks, Code blocks, Blockquotes, Checklists, Tables)
  const renderLivePreview = () => {
    const rawLines = bodyContent.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBlockLines: string[] = [];

    let inMathBlock = false;
    let mathBlockLines: string[] = [];

    let inTable = false;
    let tableLines: string[] = [];

    const flushCodeBlock = (key: string) => {
      const codeString = codeBlockLines.join('\n');
      const lang = codeLanguage || 'text';
      const blockIdx = elements.length;
      elements.push(
        <div key={key} className="my-3 rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 text-slate-100 shadow-xs">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="uppercase tracking-wider font-semibold text-slate-300">{lang}</span>
            <button
              onClick={() => handleCopyCode(codeString, blockIdx)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-slate-400 text-[10px]"
            >
              {copiedCodeIdx === blockIdx ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 font-mono text-[12px] leading-relaxed overflow-x-auto text-slate-200">
            <code>{codeString}</code>
          </pre>
        </div>
      );
      codeBlockLines = [];
      codeLanguage = '';
      inCodeBlock = false;
    };

    const flushMathBlock = (key: string) => {
      const latex = mathBlockLines.join('\n');
      const renderedHtml = renderKaTeX(latex, true);
      elements.push(
        <div
          key={key}
          className="my-3 py-3 px-4 bg-[#edeff4] border border-[#cbd0db] text-slate-900 rounded-lg overflow-x-auto text-center font-mono shadow-2xs"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      );
      mathBlockLines = [];
      inMathBlock = false;
    };

    const flushTable = (key: string) => {
      if (tableLines.length === 0) return;
      // Parse markdown table
      const rows = tableLines.map((line) =>
        line
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim())
      );

      const headerRow = rows[0];
      const dataRows = rows.slice(2); // Skip separator row (---)

      elements.push(
        <div key={key} className="my-3 overflow-x-auto rounded-lg border border-[#cbd0db] shadow-2xs">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-[#dadce3] border-b border-[#cbd0db] text-slate-900 font-semibold font-mono text-[11px]">
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="px-3 py-2 border-r last:border-r-0 border-[#cbd0db]">
                    {renderInlineFormatted(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cbd0db]">
              {dataRows.map((r, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-[#edeff4]' : 'bg-[#e4e6ea]'}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 border-r last:border-r-0 border-[#cbd0db] text-slate-800">
                      {renderInlineFormatted(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableLines = [];
      inTable = false;
    };

    for (let idx = 0; idx < rawLines.length; idx++) {
      const line = rawLines[idx];
      const trimmed = line.trim();

      // Code block start / end
      if (trimmed.startsWith('```')) {
        if (inTable) flushTable(`table-${idx}`);
        if (inMathBlock) flushMathBlock(`math-${idx}`);

        if (inCodeBlock) {
          flushCodeBlock(`code-${idx}`);
        } else {
          inCodeBlock = true;
          codeLanguage = trimmed.slice(3).trim();
          codeBlockLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Display Math block: $$
      if (trimmed === '$$') {
        if (inTable) flushTable(`table-${idx}`);
        if (inMathBlock) {
          flushMathBlock(`math-${idx}`);
        } else {
          inMathBlock = true;
          mathBlockLines = [];
        }
        continue;
      }

      // Single line display math: $$ formula $$
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
        if (inTable) flushTable(`table-${idx}`);
        const mathContent = trimmed.slice(2, -2);
        const renderedHtml = renderKaTeX(mathContent, true);
        elements.push(
          <div
            key={`math-line-${idx}`}
            className="my-3 py-3 px-4 bg-slate-50/80 border border-slate-200/80 rounded-lg overflow-x-auto text-center font-mono shadow-2xs"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        );
        continue;
      }

      if (inMathBlock) {
        mathBlockLines.push(line);
        continue;
      }

      // Table line (starts and ends with |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableLines.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${idx}`}
            className="font-serif text-xl font-bold text-slate-900 pt-3 pb-1 border-b border-slate-200/90 mt-2 mb-2"
          >
            {renderInlineFormatted(line.replace('# ', ''))}
          </h1>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${idx}`}
            className="font-serif text-base font-semibold text-slate-800 pt-3 pb-1 border-b border-slate-100 flex items-center gap-1.5 mt-2 mb-1"
          >
            {renderInlineFormatted(line.replace('## ', ''))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="font-semibold text-sm text-slate-700 pt-2 pb-0.5 mt-1">
            {renderInlineFormatted(line.replace('### ', ''))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${idx}`} className="font-medium text-xs text-slate-600 uppercase tracking-wide pt-1">
            {renderInlineFormatted(line.replace('#### ', ''))}
          </h4>
        );
        continue;
      }

      // Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<hr key={`hr-${idx}`} className="my-4 border-t border-slate-200" />);
        continue;
      }

      // Blockquotes (> quote)
      if (line.startsWith('>')) {
        const quoteText = line.replace(/^>\s?/, '');
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="border-l-4 border-amber-600 bg-[#dadce3]/80 pl-3.5 pr-2 py-1.5 my-1.5 text-slate-800 italic rounded-r text-[13px] border-y border-r border-[#cbd0db]/50"
          >
            {renderInlineFormatted(quoteText)}
          </blockquote>
        );
        continue;
      }

      // Checklist item: - [ ] or - [x] or - [>]
      const taskMatch = line.match(/^(\s*)-\s*\[([ xX>])\]\s*(.*)$/);
      if (taskMatch) {
        const indentSpaces = taskMatch[1].length;
        const statusChar = taskMatch[2];
        const rest = taskMatch[3];

        const isChecked = statusChar === 'x' || statusChar === 'X';
        const isDeferred = statusChar === '>';

        const blockMatch = rest.match(/\^([a-z0-9]{5,10})$/i);
        const blockId = blockMatch ? blockMatch[1] : undefined;

        const carryMatch = rest.match(/%%carried:(\d+)%%/);
        const carryCount = carryMatch ? carryMatch[1] : null;

        const timeMatch = rest.match(/^(\d{1,2}:\d{2})\s+/);
        const timeText = timeMatch ? timeMatch[1] : null;

        const cleanText = rest
          .replace(/\^[a-z0-9]{5,10}$/i, '')
          .replace(/%%carried:\d+%%/, '')
          .replace(/^\d{1,2}:\d{2}\s+/, '')
          .trim();

        elements.push(
          <div
            key={`task-${idx}`}
            style={{ paddingLeft: `${Math.max(0, indentSpaces * 8)}px` }}
            className="group flex items-start gap-2.5 py-1 px-1.5 rounded hover:bg-[#dadce3]/70 transition-colors"
          >
            {/* Custom Checkbox */}
            <button
              onClick={() => handleCheckboxClick(blockId, isChecked, line)}
              className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors cursor-pointer border ${
                isChecked
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isDeferred
                  ? 'bg-amber-100 border-amber-500 text-amber-800'
                  : 'border-[#cbd0db] hover:border-slate-500 bg-[#edeff4]'
              }`}
            >
              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
              {isDeferred && <span className="text-[10px] font-bold">›</span>}
            </button>

            {/* Task Content with formatting */}
            <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
              {timeText && (
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded font-medium">
                  {timeText}
                </span>
              )}

              <span
                className={`text-[13px] ${
                  isChecked
                    ? 'line-through text-slate-400'
                    : isDeferred
                    ? 'text-slate-600 italic'
                    : 'text-slate-800'
                }`}
              >
                {renderInlineFormatted(cleanText)}
              </span>

              {/* Carry Badge */}
              {carryCount && (
                <span className="px-1.5 py-0.2 rounded bg-amber-100/90 text-amber-800 text-[10px] font-mono font-medium">
                  carried: {carryCount}x
                </span>
              )}

              {/* Block ID hover affordance */}
              {blockId && (
                <button
                  onClick={() => handleCopyBlock(blockId)}
                  title="Copy Obsidian Block ID reference"
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 hover:text-slate-900 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  <span>^{blockId}</span>
                  {copiedBlock === blockId ? (
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        );
        continue;
      }

      // Unordered list item (- item)
      if (line.match(/^(\s*)-\s+(.*)$/)) {
        const listMatch = line.match(/^(\s*)-\s+(.*)$/)!;
        const indent = listMatch[1].length;
        const text = listMatch[2];
        elements.push(
          <div
            key={`ul-${idx}`}
            style={{ paddingLeft: `${Math.max(0, indent * 8 + 6)}px` }}
            className="flex items-start gap-2 py-0.5 text-[13px] text-slate-700"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span className="leading-relaxed">{renderInlineFormatted(text)}</span>
          </div>
        );
        continue;
      }

      // Ordered list item (1. item)
      if (line.match(/^(\s*)(\d+)\.\s+(.*)$/)) {
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)!;
        const num = numMatch[2];
        const text = numMatch[3];
        elements.push(
          <div
            key={`ol-${idx}`}
            className="flex items-start gap-2 py-0.5 text-[13px] text-slate-700 pl-2"
          >
            <span className="font-mono text-xs text-slate-400 font-semibold shrink-0 w-4 text-right">
              {num}.
            </span>
            <span className="leading-relaxed">{renderInlineFormatted(text)}</span>
          </div>
        );
        continue;
      }

      // Empty blank line
      if (trimmed === '') {
        elements.push(<div key={`empty-${idx}`} className="h-2" />);
        continue;
      }

      // Standard paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-slate-700 font-serif leading-relaxed px-1 text-[13.5px]">
          {renderInlineFormatted(line)}
        </p>
      );
    }

    if (inCodeBlock) flushCodeBlock(`code-end`);
    if (inMathBlock) flushMathBlock(`math-end`);
    if (inTable) flushTable(`table-end`);

    return elements;
  };

  // User Request 9: Obsidian Note Properties (Collapsible at top of note)
  const propKeys = Object.keys(properties);
  const hasProperties = propKeys.length > 0;

  return (
    <article className="rounded-lg border border-[#cbd0db] bg-[#e4e6ea] shadow-sm overflow-hidden mb-6">
      {/* Tab Strip */}
      <div className="bg-[#dadce3] border-b border-[#cbd0db] px-2 pt-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeNote.path;
            const isTabDaily = tab.isDaily || tab.path.startsWith('Core/Daily/');
            const tabPinned = isNotePinned ? isNotePinned(tab.path) : false;

            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab.path)}
                className={`group h-7 px-2.5 rounded-t-md text-xs flex items-center gap-1.5 cursor-pointer transition-colors border-t border-x ${
                  isActive
                    ? 'bg-[#e4e6ea] text-slate-900 font-semibold border-[#cbd0db] border-b-transparent shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-[#cdd1dc]/60 border-transparent'
                }`}
              >
                {isTabDaily ? (
                  <Calendar className="w-3 h-3 text-amber-600" />
                ) : (
                  <FileText className="w-3 h-3 text-blue-600" />
                )}
                <span className="truncate max-w-[130px] font-mono text-[11px]">
                  {tab.title}
                </span>

                {/* User Request 2: ONLY ONE WAY to pin/unpin — in the tab title icon */}
                {onTogglePin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(tab.path);
                    }}
                    title={tabPinned ? 'Unpin note (stays in this realm)' : 'Pin note (follows across all realms)'}
                    className={`p-0.5 rounded cursor-pointer transition-colors ${
                      tabPinned
                        ? 'text-amber-600 hover:text-amber-800'
                        : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    <Pin className={`w-2.5 h-2.5 ${tabPinned ? 'fill-current rotate-45' : ''}`} />
                  </button>
                )}

                {openTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-[#c8ccd6] text-slate-500 hover:text-slate-800 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* + New Note Button */}
          {onNewNote && (
            <button
              onClick={onNewNote}
              title="Create new note in realm"
              className="h-7 w-7 rounded-t-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* User Request 7: Collapse/Expand Widget Toggle */}
        <div className="flex items-center gap-1 pb-1">
          <button
            onClick={() => setIsWidgetCollapsed(!isWidgetCollapsed)}
            title={isWidgetCollapsed ? 'Expand Notes Widget' : 'Collapse Notes Widget'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#cdd1dc] transition-colors cursor-pointer"
          >
            {isWidgetCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isWidgetCollapsed && (
        <>
          {/* File Detail Bar (Breadcrumb + Stats + Shrunk Mode Buttons) */}
          <div className="px-3.5 py-1.5 bg-[#dcdfe6] border-b border-[#cbd0db] flex items-center justify-between text-xs text-slate-600 font-mono gap-2">
            <div className="flex items-center gap-2 text-[11px] min-w-0">
              <div className="flex items-center gap-1 truncate">
                {isProject && projectBreadcrumb ? (
                  <>
                    <span className="text-slate-500">Projects</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-blue-700 font-medium truncate">{projectBreadcrumb}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium">{activeNote.path.split('/').pop()}</span>
                  </>
                ) : (
                  <span className="text-slate-800 font-medium truncate">{activeNote.path}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
              <span className="hidden sm:inline">{activeNote.content.split('\n').length} lines</span>
              <span className="hidden sm:inline">
                {activeNote.content.split(/\s+/).filter(Boolean).length} words
              </span>
              <span className="hidden sm:flex items-center gap-1 text-emerald-700 font-medium">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>

              {/* Shrunk Icon + Label Preview / Raw Mode Buttons with Per-File Memory */}
              <div className="flex items-center bg-[#c8ccd6] p-0.5 rounded border border-[#b8bcc8] text-slate-700">
                <button
                  onClick={() => setModeForCurrentFile('preview')}
                  title="Live Preview Mode (Remembered for this note)"
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    !isRawMode
                      ? 'bg-[#edeff4] text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  onClick={() => setModeForCurrentFile('raw')}
                  title="Raw Markdown Editor (Remembered for this note)"
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    isRawMode
                      ? 'bg-[#edeff4] text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span className="hidden sm:inline">Raw</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Note Canvas: Live Preview or Raw TextArea */}
          <div className="p-4 md:p-6 min-h-[460px] bg-[#e4e6ea]">
            {isRawMode ? (
              <textarea
                value={editContent}
                onChange={handleRawChange}
                placeholder="Write Markdown here..."
                className="w-full h-full min-h-[440px] font-mono text-xs text-slate-900 bg-[#edeff4] p-4 rounded-lg border border-[#cbd0db] focus:border-blue-500 focus:outline-none resize-none leading-relaxed shadow-xs"
                spellCheck={false}
              />
            ) : (
              <div className="space-y-4">
                {/* User Request 9: Collapsible Obsidian Note Properties (at top of note in preview mode) */}
                {hasProperties && (
                  <div className="rounded-lg border border-[#cbd0db] bg-[#edeff4] overflow-hidden shadow-2xs">
                    {/* Collapsible Properties Header */}
                    <button
                      onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-left text-xs font-mono text-slate-700 hover:text-slate-900 hover:bg-[#e4e6ea] transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {isPropertiesCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold text-slate-800">Properties</span>
                        <span className="text-[10px] text-slate-700 px-1.5 py-0.2 rounded-full bg-[#cbd0db] font-bold">
                          {propKeys.length}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {isPropertiesCollapsed ? 'Click to expand' : 'Collapse'}
                      </span>
                    </button>

                    {/* Properties Key-Value Table (hidden when collapsed) */}
                    {!isPropertiesCollapsed && (
                      <div className="p-3 border-t border-[#cbd0db] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-[#edeff4]">
                        {propKeys.map((k) => {
                          const val = properties[k];
                          const isTags = k === 'tags' || Array.isArray(val);

                          return (
                            <div
                              key={k}
                              className="flex items-start gap-2 p-1.5 rounded bg-[#e4e6ea] border border-[#cbd0db]"
                            >
                              <span className="text-slate-500 font-semibold shrink-0 text-[11px] min-w-[70px]">
                                {k}:
                              </span>
                              <div className="flex flex-wrap gap-1 min-w-0">
                                {isTags && Array.isArray(val) ? (
                                  val.map((tagItem: string) => (
                                    <span
                                      key={tagItem}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-medium"
                                    >
                                      <Hash className="w-2.5 h-2.5 text-amber-600" />
                                      <span>{tagItem}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-900 font-medium text-[11px] break-all">
                                    {String(val)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Rendered Live Preview Content */}
                <div className="space-y-1 font-sans text-[13px] leading-relaxed select-text text-slate-900">
                  {renderLivePreview()}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
};
