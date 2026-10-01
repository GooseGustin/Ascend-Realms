import React, { useState } from 'react';
import { VaultFile } from '../types/vault';
import katex from 'katex';
import {
  Eye,
  Link2,
  FileText,
  Check,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Hash,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface PreviewPanelProps {
  activeNote?: VaultFile;
  files: VaultFile[];
  onClose: () => void;
  onSelectBacklink: (path: string) => void;
}

function parseNoteFrontmatter(content: string) {
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

      if (val.startsWith('[') && val.endsWith(']')) {
        const items = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        properties[key] = items;
      } else {
        val = val.replace(/^['"]|['"]$/g, '');
        properties[key] = val;
      }
    }
  }

  return { properties, bodyContent };
}

function renderKaTeX(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
    });
  } catch (e) {
    return `<span class="text-rose-600 font-mono text-xs">[Math error]</span>`;
  }
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  activeNote,
  files,
  onClose,
  onSelectBacklink,
}) => {
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  if (!activeNote) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        No active note selected for preview.
      </div>
    );
  }

  const { properties, bodyContent } = parseNoteFrontmatter(activeNote.content);
  const propKeys = Object.keys(properties);
  const hasProperties = propKeys.length > 0;

  // Find backlinks (other notes that mention activeNote.title or path)
  const backlinks = files.filter(
    (f) =>
      f.path !== activeNote.path &&
      (f.content.includes(activeNote.title) ||
        f.content.includes(activeNote.path.split('/').pop()?.replace('.md', '') || ''))
  );

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 1500);
  };

  const renderInlineFormatted = (text: string) => {
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
          className="inline-katex px-0.5 font-mono align-baseline text-slate-900"
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

  const renderTextFormatting = (raw: string, keyPrefix: string): React.ReactNode => {
    const regex = /(`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^\)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|(?<!\w)\*[^*]+(?<!\w)\*|(?<!\w)_[^_]+(?<!\w)_|~~[^~]+~~)/g;
    const pieces = raw.split(regex);

    return pieces.map((piece, i) => {
      const key = `${keyPrefix}-${i}`;
      if (!piece) return null;

      if (piece.startsWith('`') && piece.endsWith('`') && piece.length >= 2) {
        return (
          <code
            key={key}
            className="px-1 py-0.2 rounded bg-slate-100 text-slate-800 font-mono text-[10px] border border-slate-200/80 mx-0.5"
          >
            {piece.slice(1, -1)}
          </code>
        );
      }

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
            onClick={() => onSelectBacklink(resolvedPath)}
            title={`Open note: ${target}`}
            className="inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 font-medium hover:underline bg-blue-50/80 px-1 py-0.2 rounded text-[11px] cursor-pointer"
          >
            <span>{displayLabel}</span>
          </button>
        );
      }

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

      if (piece.startsWith('~~') && piece.endsWith('~~') && piece.length >= 4) {
        return (
          <del key={key} className="line-through text-slate-400">
            {piece.slice(2, -2)}
          </del>
        );
      }

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

  const renderFormattedMarkdown = (content: string) => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBlockLines: string[] = [];

    let inMathBlock = false;
    let mathBlockLines: string[] = [];

    const flushCodeBlock = (key: string) => {
      const codeString = codeBlockLines.join('\n');
      const lang = codeLanguage || 'text';
      const blockIdx = elements.length;
      elements.push(
        <div key={key} className="my-2 rounded-md overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 text-[11px]">
          <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
            <span>{lang}</span>
            <button
              onClick={() => handleCopyCode(codeString, blockIdx)}
              className="hover:text-white cursor-pointer"
            >
              {copiedCodeIdx === blockIdx ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-2.5 font-mono text-[11px] leading-relaxed overflow-x-auto">
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
          className="my-2 py-2 px-3 bg-slate-900 border border-slate-800 rounded-md overflow-x-auto text-center font-mono text-xs text-white"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      );
      mathBlockLines = [];
      inMathBlock = false;
    };

    for (let idx = 0; idx < rawLines.length; idx++) {
      const line = rawLines[idx];
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
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

      if (trimmed === '$$') {
        if (inMathBlock) {
          flushMathBlock(`math-${idx}`);
        } else {
          inMathBlock = true;
          mathBlockLines = [];
        }
        continue;
      }

      if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
        const mathContent = trimmed.slice(2, -2);
        const renderedHtml = renderKaTeX(mathContent, true);
        elements.push(
          <div
            key={`math-line-${idx}`}
            className="my-2 py-2 px-3 bg-slate-900 border border-slate-800 rounded-md overflow-x-auto text-center font-mono text-xs text-white"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        );
        continue;
      }

      if (inMathBlock) {
        mathBlockLines.push(line);
        continue;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${idx}`} className="font-serif text-lg font-bold text-white pt-2 pb-1 border-b border-slate-800 mt-2 mb-1">
            {renderInlineFormatted(line.replace('# ', ''))}
          </h1>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="font-serif text-sm font-semibold text-slate-100 pt-2 pb-0.5 border-b border-slate-800 mt-2 mb-1">
            {renderInlineFormatted(line.replace('## ', ''))}
          </h2>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="font-semibold text-xs text-slate-200 pt-1.5 pb-0.5">
            {renderInlineFormatted(line.replace('### ', ''))}
          </h3>
        );
        continue;
      }

      if (line.startsWith('>')) {
        elements.push(
          <blockquote key={`q-${idx}`} className="pl-3 py-1 my-1 border-l-2 border-amber-400 bg-amber-950/20 text-slate-200 italic text-xs font-serif">
            {renderInlineFormatted(line.replace(/^>\s?/, ''))}
          </blockquote>
        );
        continue;
      }

      const checkMatch = line.match(/^(\s*)-\s*\[([ xX>])\]\s*(.*)$/);
      if (checkMatch) {
        const isDone = checkMatch[2].toLowerCase() === 'x';
        elements.push(
          <div key={`task-${idx}`} className="flex items-start gap-1.5 py-0.5 text-xs text-slate-200">
            <span className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] shrink-0 border ${
              isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-800 border-slate-600 text-white'
            }`}>
              {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span className={isDone ? 'line-through text-slate-500' : 'text-slate-200'}>
              {renderInlineFormatted(checkMatch[3])}
            </span>
          </div>
        );
        continue;
      }

      if (line.startsWith('- ')) {
        elements.push(
          <li key={`li-${idx}`} className="ml-4 list-disc text-xs text-slate-200 py-0.5">
            {renderInlineFormatted(line.replace('- ', ''))}
          </li>
        );
        continue;
      }

      if (trimmed === '') {
        elements.push(<div key={`empty-${idx}`} className="h-1.5" />);
        continue;
      }

      elements.push(
        <p key={`p-${idx}`} className="text-xs text-slate-200 leading-relaxed font-serif">
          {renderInlineFormatted(line)}
        </p>
      );
    }

    if (inCodeBlock) flushCodeBlock('code-end');
    if (inMathBlock) flushMathBlock('math-end');

    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-[#16171d] text-slate-100 select-none">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#121318]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-xs">Note Preview</h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Live rendered Markdown
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

      {/* Rendered Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Note Breadcrumb & Metadata */}
        <div className="pb-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="truncate text-slate-300">{activeNote.path}</span>
          <span className="shrink-0">{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
        </div>

        {/* Collapsible Note Properties */}
        {hasProperties && (
          <div className="rounded-lg border border-slate-700/80 bg-slate-800/80 overflow-hidden shadow-xs">
            <button
              onClick={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-left text-xs font-mono text-slate-200 hover:text-white hover:bg-slate-750 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5">
                {isPropertiesCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-300" />
                )}
                <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                <span className="font-semibold text-slate-100">Properties</span>
                <span className="text-[10px] text-slate-200 px-1.5 py-0.2 rounded-full bg-slate-700 font-bold border border-slate-600">
                  {propKeys.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                {isPropertiesCollapsed ? 'Expand' : 'Collapse'}
              </span>
            </button>

            {!isPropertiesCollapsed && (
              <div className="p-2.5 border-t border-slate-700/80 space-y-1 text-xs font-mono bg-slate-900/90">
                {propKeys.map((k) => {
                  const val = properties[k];
                  const isTags = k === 'tags' || Array.isArray(val);

                  return (
                    <div
                      key={k}
                      className="flex items-start gap-2 p-1 rounded bg-slate-800/80 border border-slate-700/60"
                    >
                      <span className="text-slate-400 font-semibold shrink-0 text-[10px] min-w-[60px]">
                        {k}:
                      </span>
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {isTags && Array.isArray(val) ? (
                          val.map((tagItem: string) => (
                            <span
                              key={tagItem}
                              className="inline-flex items-center gap-0.5 px-1 py-0.1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-medium"
                            >
                              <Hash className="w-2 h-2 text-amber-400" />
                              <span>{tagItem}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-100 font-medium text-[10px] break-all">
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

        {/* Content Elements */}
        <div className="space-y-1 text-slate-200">{renderFormattedMarkdown(bodyContent)}</div>

        {/* Backlinks Section */}
        <div className="pt-6 border-t border-slate-800 space-y-2 mt-4">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-[11px] text-slate-300 uppercase tracking-wider">
            <Link2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Connected Backlinks ({backlinks.length})</span>
          </div>

          {backlinks.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              No other notes reference this note yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {backlinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => onSelectBacklink(link.path)}
                  className="w-full p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 text-left transition-colors cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-blue-400 text-xs truncate">
                    {link.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {link.path}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
