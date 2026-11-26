import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Sparkles, ExternalLink, Copy, Check, Trash2, Code2, Eye, Download, X } from 'lucide-react';

function buildStandaloneInteractiveHtml(rawHtml: string, title: string, sourceUrl: string): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeUrl = sourceUrl.replace(/"/g, '&quot;');
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --accent: #2563eb;
      --code-bg: #0f172a;
      --code-fg: #e2e8f0;
    }
    html.dark {
      --bg: #09090b;
      --surface: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --accent: #60a5fa;
      --code-bg: #020617;
      --code-fg: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      backdrop-filter: blur(8px);
    }
    .topbar-title {
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topbar-meta { font-size: 12px; color: var(--muted); }
    .topbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .search-input {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      min-width: 190px;
    }
    .btn {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .btn:hover { border-color: var(--accent); color: var(--accent); }
    .layout {
      max-width: 1120px;
      margin: 24px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; }
      .toc { position: static !important; }
    }
    .toc {
      position: sticky;
      top: 76px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px;
      font-size: 13px;
    }
    .toc h4 { margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .toc a {
      display: block;
      color: var(--muted);
      text-decoration: none;
      padding: 4px 6px;
      border-radius: 6px;
      margin-bottom: 2px;
    }
    .toc a:hover { background: var(--bg); color: var(--accent); }
    .toc a.lvl-3 { padding-left: 16px; font-size: 12px; }
    .progress-box {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      display: none;
    }
    .progress-track {
      height: 7px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-fill { height: 100%; background: #16a34a; width: 0%; transition: width .2s ease; }
    .card-main {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
      overflow-x: auto;
    }
    .card-main h1, .card-main h2, .card-main h3, .card-main h4 { scroll-margin-top: 84px; margin-top: 1.4em; margin-bottom: .5em; }
    .card-main p { margin: .6em 0; }
    .card-main ul, .card-main ol { padding-left: 1.4em; margin: .6em 0; }
    .card-main li { margin: .3em 0; }
    .card-main table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    .card-main th, .card-main td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    .card-main th { background: rgba(100,116,139,.08); font-weight: 600; }
    .card-main pre {
      position: relative;
      background: var(--code-bg);
      color: var(--code-fg);
      padding: 14px 16px;
      border-radius: 10px;
      overflow-x: auto;
      font-size: 13px;
    }
    .card-main img { max-width: 100%; height: auto; border-radius: 10px; cursor: zoom-in; }
    .copy-code-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,.2);
      background: rgba(255,255,255,.1);
      color: #fff;
      cursor: pointer;
    }
    .highlight-hit { outline: 2px solid #f59e0b; border-radius: 4px; background: rgba(245,158,11,.15); }
    .lightbox {
      position: fixed; inset: 0; background: rgba(0,0,0,.82);
      display: none; align-items: center; justify-content: center; z-index: 100; padding: 24px;
    }
    .lightbox.open { display: flex; }
    .lightbox img { max-width: 95vw; max-height: 90vh; border-radius: 12px; background: #fff; }
    @media print {
      .topbar, .toc { display: none !important; }
      .layout { display: block; margin: 0; padding: 0; }
      .card-main { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div>
      <div class="topbar-title">✨ ${safeTitle}</div>
      <div class="topbar-meta">Exporté depuis MemoDock • ${dateStr}</div>
    </div>
    <div class="topbar-actions">
      <input id="searchBox" class="search-input" type="search" placeholder="Rechercher dans la note..." />
      <button id="themeBtn" class="btn" type="button">🌙 Thème</button>
      <button onclick="window.print()" class="btn" type="button">🖨️ Imprimer / PDF</button>
      ${safeUrl ? `<a class="btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer">↗ ChatGPT</a>` : ''}
    </div>
  </header>

  <div class="layout">
    <aside class="toc">
      <h4>Sommaire</h4>
      <nav id="tocNav"></nav>
      <div id="progressBox" class="progress-box">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;">
          <span>Progression</span>
          <span id="progressText">0%</span>
        </div>
        <div class="progress-track"><div id="progressFill" class="progress-fill"></div></div>
      </div>
    </aside>
    <main id="content" class="card-main">
      ${rawHtml}
    </main>
  </div>

  <div id="lightbox" class="lightbox" onclick="this.classList.remove('open')">
    <img id="lightboxImg" src="" alt="Preview" />
  </div>

  <script>
    (function () {
      const content = document.getElementById('content');
      const tocNav = document.getElementById('tocNav');

      // 1. Build interactive Table of Contents
      const headings = content.querySelectorAll('h1, h2, h3');
      if (headings.length === 0) {
        tocNav.innerHTML = '<span style="color:var(--muted);font-size:12px;">Aucune section</span>';
      } else {
        headings.forEach((h, i) => {
          if (!h.id) h.id = 'sec-' + i;
          const a = document.createElement('a');
          a.href = '#' + h.id;
          a.textContent = h.textContent.trim();
          if (h.tagName === 'H3') a.className = 'lvl-3';
          tocNav.appendChild(a);
        });
      }

      // 2. Interactive Checklists + Progress Bar
      const checkboxes = Array.from(content.querySelectorAll('input[type="checkbox"]'));
      function updateProgress() {
        if (!checkboxes.length) return;
        document.getElementById('progressBox').style.display = 'block';
        const done = checkboxes.filter(c => c.checked).length;
        const pct = Math.round((done / checkboxes.length) * 100);
        document.getElementById('progressText').textContent = done + '/' + checkboxes.length + ' (' + pct + '%)';
        document.getElementById('progressFill').style.width = pct + '%';
      }
      checkboxes.forEach(cb => cb.addEventListener('change', updateProgress));
      updateProgress();

      // 3. Copy buttons on Code Blocks
      content.querySelectorAll('pre').forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copier';
        btn.onclick = () => {
          navigator.clipboard.writeText(pre.innerText.replace(/Copier$/, '').trim());
          btn.textContent = 'Copié ✓';
          setTimeout(() => btn.textContent = 'Copier', 1500);
        };
        pre.appendChild(btn);
      });

      // 4. Image / Diagram Zoom Lightbox
      content.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', (e) => {
          if (img.closest('a')) return;
          e.preventDefault();
          document.getElementById('lightboxImg').src = img.src;
          document.getElementById('lightbox').classList.add('open');
        });
      });

      // 5. Search filter
      document.getElementById('searchBox').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        content.querySelectorAll('.highlight-hit').forEach(el => el.classList.remove('highlight-hit'));
        if (!q) return;
        const blocks = content.querySelectorAll('p, li, h1, h2, h3, h4, tr');
        let first = null;
        blocks.forEach(b => {
          if (b.textContent.toLowerCase().includes(q)) {
            b.classList.add('highlight-hit');
            if (!first) first = b;
          }
        });
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      // 6. Dark / Light Theme toggle
      document.getElementById('themeBtn').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
      });
    })();
  </script>
</body>
</html>`;
}

const HtmlLiteComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const { html = '', sourceUrl = '', sourceTitle = 'ChatGPT Response' } = node.attrs;
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleCopyHtml = async () => {
    const fullHtml = buildStandaloneInteractiveHtml(html, sourceTitle, sourceUrl);
    await navigator.clipboard.writeText(fullHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const fullHtml = buildStandaloneInteractiveHtml(html, sourceTitle, sourceUrl);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (sourceTitle || 'chatgpt-note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    a.href = url;
    a.download = `${slug || 'chatgpt-note'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <NodeViewWrapper className="my-3 select-text">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/60 shadow-2xs">
        {/* Subtle Header Bar */}
        <div className="no-print flex items-center justify-between px-3 py-1.5 bg-stone-50/80 dark:bg-zinc-950/50 border-b border-stone-200/60 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-zinc-300 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{sourceTitle || 'Captured Interactive HTML'}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
              title="Télécharger en HTML interactif autonome (.html)"
            >
              <Download className="w-3 h-3" />
              <span>HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              className="px-1.5 py-0.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500 flex items-center gap-1"
              title={showSource ? 'Show Rendered View' : 'View HTML Source'}
            >
              {showSource ? <Eye className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
              <span>{showSource ? 'View' : 'Code'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyHtml}
              className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500"
              title="Copy Interactive HTML"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500"
                title="Open original chat"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500"
              title="Remove block"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Body */}
        {showSource ? (
          <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-96 bg-stone-50 dark:bg-zinc-950 text-stone-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {html}
          </pre>
        ) : (
          <div
            ref={bodyRef}
            className="p-4 md:p-5 memodock-html-lite text-sm leading-relaxed text-stone-800 dark:text-stone-200 overflow-x-auto [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3 [&_img]:cursor-zoom-in"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const link = target?.closest('a');
              if (link && link.href) {
                e.preventDefault();
                window.open(link.href, '_blank', 'noopener,noreferrer');
                return;
              }
              if (target?.tagName === 'IMG') {
                setZoomSrc((target as HTMLImageElement).src);
              }
            }}
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              if (input?.type === 'checkbox' && bodyRef.current) {
                if (input.checked) input.setAttribute('checked', 'checked');
                else input.removeAttribute('checked');
                updateAttributes({ html: bodyRef.current.innerHTML });
              }
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      {/* Image / Diagram Lightbox Modal */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setZoomSrc(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={zoomSrc}
            alt="Zoomed preview"
            className="max-w-[92vw] max-h-[88vh] rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const HtmlLiteBlock = Node.create({
  name: 'htmlLiteBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      html: { default: '' },
      sourceUrl: { default: '' },
      sourceTitle: { default: 'ChatGPT Response' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-lite-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            html: el.getAttribute('data-html') || el.innerHTML || '',
            sourceUrl: el.getAttribute('data-source-url') || '',
            sourceTitle: el.getAttribute('data-source-title') || 'ChatGPT Response',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'html-lite-block',
        'data-html': HTMLAttributes.html,
        'data-source-url': HTMLAttributes.sourceUrl,
        'data-source-title': HTMLAttributes.sourceTitle,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlLiteComponent);
  },
});
