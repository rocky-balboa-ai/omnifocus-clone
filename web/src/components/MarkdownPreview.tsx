'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import clsx from 'clsx';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

// Simple markdown parser (no external dependencies)
function parseMarkdown(text: string): string {
  let html = text;

  // Escape HTML
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // Headers (## Header)
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<del class="opacity-60">$1</del>');

  // Inline code (`code`)
  html = html.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">$1</code>');

  // Links ([text](url))
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-omnifocus-purple hover:underline">$1</a>');

  // Checkboxes (- [ ] or - [x])
  html = html.replace(/^- \[x\] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-green-500">✓</span><span class="line-through opacity-60">$1</span></div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-gray-400">○</span><span>$1</span></div>');

  // Unordered lists (- item)
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Blockquotes (> text)
  html = html.replace(/^> (.+)$/gm, '<blockquote class="pl-3 border-l-2 border-gray-300 dark:border-gray-600 italic text-gray-600 dark:text-gray-400 my-2">$1</blockquote>');

  // Horizontal rule (---)
  html = html.replace(/^---$/gm, '<hr class="my-4 border-gray-200 dark:border-gray-700" />');

  // Line breaks (double newline = paragraph)
  html = html.replace(/\n\n/g, '</p><p class="my-2">');

  // Single line breaks
  html = html.replace(/\n/g, '<br />');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p class="my-2">' + html + '</p>';
  }

  return html;
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const { theme } = useAppStore();

  const html = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      className={clsx(
        'prose prose-sm max-w-none',
        theme === 'dark'
          ? 'prose-invert text-gray-300'
          : 'text-gray-700',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Utility to detect if content contains markdown
export function hasMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#+ /m,          // Headers
    /\*\*.+\*\*/,     // Bold
    /\[.+\]\(.+\)/,   // Links
    /^- \[[ x]\]/m,   // Checkboxes
    /^>/m,            // Blockquotes
    /`[^`]+`/,        // Inline code
    /^---$/m,         // Horizontal rule
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}
