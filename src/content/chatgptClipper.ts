/**
 * MemoDock ChatGPT Response Clipper Content Script
 * Injects a "Save to MemoDock" icon button on every ChatGPT assistant response
 * and captures the rendered HTML Lite (preserving images, Mermaid/SVG graphs,
 * checklists, tables, cards, badges, code blocks & structure).
 */

const BUTTON_ATTR = 'data-memodock-btn';

const MEMODOCK_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  <path d="M8 7h6"/>
  <path d="M8 11h8"/>
</svg>`;

const CHECK_SVG = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>`;

/**
 * Converts a live DOM <svg> (e.g. Mermaid diagram) into a self-contained data-URI <img>
 * so it renders crisply inside MemoDock without leaking page <style> tags.
 */
function serializeSvgToImage(liveSvg: SVGSVGElement, cloneSvg: Element) {
  try {
    const rect = liveSvg.getBoundingClientRect();
    const w = Math.max(24, Math.round(rect.width || Number(liveSvg.getAttribute('width')) || 400));
    const h = Math.max(24, Math.round(rect.height || Number(liveSvg.getAttribute('height')) || 200));

    // Inline computed styles on SVG text/shapes for Mermaid diagrams
    const liveClone = liveSvg.cloneNode(true) as SVGSVGElement;
    liveClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!liveClone.getAttribute('viewBox')) {
      liveClone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    liveClone.setAttribute('width', String(w));
    liveClone.setAttribute('height', String(h));

    // Copy essential fill/stroke/font styles for Mermaid nodes & labels
    const liveEls = liveSvg.querySelectorAll('rect, path, polygon, circle, ellipse, text, tspan, line');
    const cloneEls = liveClone.querySelectorAll('rect, path, polygon, circle, ellipse, text, tspan, line');
    liveEls.forEach((el, idx) => {
      const target = cloneEls[idx] as HTMLElement | undefined;
      if (!target) return;
      const cs = window.getComputedStyle(el);
      if (cs.fill && cs.fill !== 'none') target.style.fill = cs.fill;
      if (cs.stroke && cs.stroke !== 'none') target.style.stroke = cs.stroke;
      if (cs.strokeWidth) target.style.strokeWidth = cs.strokeWidth;
      if (el.tagName === 'text' || el.tagName === 'tspan') {
        target.style.fontFamily = cs.fontFamily || 'sans-serif';
        target.style.fontSize = cs.fontSize || '13px';
        target.style.fontWeight = cs.fontWeight || '500';
      }
    });

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(liveClone);
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;

    const img = document.createElement('img');
    img.src = dataUri;
    img.alt = 'Diagram';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '12px auto';
    cloneSvg.replaceWith(img);
  } catch {
    // Keep cloned SVG fallback if serialization fails
  }
}

/**
 * Produces a lightweight, sanitized HTML Lite snapshot of a ChatGPT response,
 * preserving images, diagrams, checklists, tables, cards, badges, and progress bars.
 */
function captureResponseHtmlLite(messageEl: HTMLElement): {
  title: string;
  html: string;
  plainText: string;
} {
  // Always pick the actual assistant .markdown block, never a full conversation wrapper with user prompts
  const markdowns = Array.from(messageEl.querySelectorAll('.markdown')).filter(
    (el) => !el.closest('[data-message-author-role="user"]')
  );
  const contentRoot =
    (messageEl.classList.contains('markdown') ? messageEl : null) ||
    (markdowns[markdowns.length - 1] as HTMLElement) ||
    (messageEl.querySelector('[data-message-id]') as HTMLElement) ||
    messageEl;

  const clone = contentRoot.cloneNode(true) as HTMLElement;

  // 1. Walk liveNodes & cloneNodes 1-to-1 BEFORE any removals so indices NEVER shift!
  const liveNodes = Array.from(contentRoot.querySelectorAll('*'));
  const cloneNodes = Array.from(clone.querySelectorAll('*'));
  const svgsToSerialize: Array<{ live: SVGSVGElement; clone: Element }> = [];
  const svgsToRemove: Element[] = [];

  const SKIP_FLEX_TAGS = new Set([
    'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
    'P', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'STRONG', 'EM', 'B', 'I', 'CODE', 'PRE', 'BLOCKQUOTE', 'A',
  ]);

  liveNodes.forEach((liveNode, idx) => {
    const cNode = cloneNodes[idx];
    if (!cNode) return;

    // Collect diagram SVGs (skip small UI icons inside buttons)
    if (liveNode.tagName.toLowerCase() === 'svg') {
      if (liveNode.closest('button, [data-memodock-btn]')) return;
      const liveSvg = liveNode as unknown as SVGSVGElement;
      const r = liveSvg.getBoundingClientRect();
      const isDiagram =
        liveSvg.id.includes('mermaid') ||
        !!liveSvg.closest('[class*="mermaid"]') ||
        r.width > 80 ||
        r.height > 80;
      if (isDiagram) {
        svgsToSerialize.push({ live: liveSvg, clone: cNode });
      } else if (r.width === 0 && r.height === 0) {
        svgsToRemove.push(cNode);
      }
      return;
    }

    // Skip SVG internals & IMG
    if (liveNode.closest('svg') || cNode.tagName === 'IMG') return;

    const cEl = cNode as HTMLElement;
    const cs = window.getComputedStyle(liveNode);
    const liveInlineWidth = (liveNode as HTMLElement).style?.width || '';

    // Clear raw ChatGPT inline styles (which contain broken var(--...) / aspect-ratio / height:100%)
    // and rebuild only clean, resolved styles from getComputedStyle
    cEl.removeAttribute('style');

    if (cEl.tagName === 'HR') {
      cEl.style.border = 'none';
      cEl.style.borderTop = '1px solid #e5e7eb';
      cEl.style.margin = '16px 0';
      return;
    }

    // Preserve card/badge/code backgrounds, borders & shadows (resolved RGB values)
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      cEl.style.backgroundColor = bg;
    }
    if (cs.borderTopWidth && parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') {
      cEl.style.borderTop = `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`;
    }
    if (cs.borderBottomWidth && parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== 'none') {
      cEl.style.borderBottom = `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`;
    }
    if (cs.borderLeftWidth && parseFloat(cs.borderLeftWidth) > 0 && cs.borderLeftStyle !== 'none') {
      cEl.style.borderLeft = `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`;
    }
    if (cs.borderRightWidth && parseFloat(cs.borderRightWidth) > 0 && cs.borderRightStyle !== 'none') {
      cEl.style.borderRight = `${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor}`;
    }
    if (cs.borderRadius && parseFloat(cs.borderRadius) > 0 && !SKIP_FLEX_TAGS.has(cEl.tagName)) {
      cEl.style.borderRadius = cs.borderRadius;
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') {
      cEl.style.boxShadow = cs.boxShadow;
    }
    if (cs.padding && cs.padding !== '0px' && !cEl.querySelector('table') && (cEl.tagName === 'DIV' || cEl.tagName === 'SPAN' || cEl.tagName === 'PRE' || cEl.tagName === 'BLOCKQUOTE')) {
      cEl.style.padding = cs.padding;
    }
    if (cs.color) {
      cEl.style.color = cs.color;
    }
    if (cs.fontWeight && Number(cs.fontWeight) >= 600) {
      cEl.style.fontWeight = cs.fontWeight;
    }
    if (cs.fontSize && (cEl.tagName === 'SPAN' || cEl.tagName === 'DIV') && parseFloat(cs.fontSize) <= 13) {
      cEl.style.fontSize = cs.fontSize;
    }

    // Preserve flex/grid ONLY on layout containers (never on table rows, cells, paragraphs or headings)
    if (!SKIP_FLEX_TAGS.has(cEl.tagName)) {
      if (cs.display === 'flex' || cs.display === 'inline-flex' || cs.display === 'grid') {
        cEl.style.display = cs.display;
        if (cs.display !== 'grid' && cs.flexDirection && cs.flexDirection !== 'row') {
          cEl.style.flexDirection = cs.flexDirection;
        }
        if (cs.gap && cs.gap !== 'normal') cEl.style.gap = cs.gap;
        if (cs.flexWrap === 'wrap') cEl.style.flexWrap = 'wrap';
        if (cs.alignItems && cs.alignItems !== 'normal') cEl.style.alignItems = cs.alignItems;
        if (cs.justifyContent && cs.justifyContent !== 'normal') cEl.style.justifyContent = cs.justifyContent;
        if (cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none') {
          cEl.style.gridTemplateColumns = cs.gridTemplateColumns;
        }
        // Keep pill badges compact instead of stretching 100%
        if (cs.borderRadius && parseFloat(cs.borderRadius) >= 999 && cs.display === 'flex') {
          cEl.style.display = 'inline-flex';
          cEl.style.width = 'fit-content';
        }
      }
      if (liveInlineWidth && liveInlineWidth.includes('%')) {
        cEl.style.width = liveInlineWidth;
      }
      if (cs.height && parseFloat(cs.height) <= 12 && parseFloat(cs.height) >= 4 && bg && bg !== 'rgba(0, 0, 0, 0)') {
        cEl.style.height = cs.height;
      }
    }

    if (cEl.tagName === 'INPUT' && (liveNode as HTMLInputElement).type === 'checkbox') {
      cEl.style.width = '15px';
      cEl.style.height = '15px';
      cEl.style.accentColor = '#2563eb';
      cEl.style.cursor = 'pointer';
      cEl.style.flexShrink = '0';
      cEl.style.marginRight = '8px';
      if ((liveNode as HTMLInputElement).checked) {
        cEl.setAttribute('checked', 'checked');
      } else {
        cEl.removeAttribute('checked');
      }
    }
  });

  // 2. Convert Mermaid/diagram SVGs to crisp self-contained <img>
  svgsToSerialize.forEach(({ live, clone: cSvg }) => serializeSvgToImage(live, cSvg));
  svgsToRemove.forEach((el) => el.remove());

  // 3. Remove ChatGPT interactive buttons, user prompt bubbles, hidden placeholders & raw <style>/<script> tags AFTER style sync
  clone
    .querySelectorAll('button, script, style, [data-memodock-btn], [data-message-author-role="user"], .sr-only, [hidden], [aria-hidden="true"]')
    .forEach((el) => el.remove());

  // 4. Clean up class attributes and ensure images/tables look great
  clone.querySelectorAll('img').forEach((img) => {
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';
    img.style.margin = '8px 0';
  });
  clone.querySelectorAll('table').forEach((tbl) => {
    tbl.style.width = '100%';
    tbl.style.borderCollapse = 'collapse';
    tbl.style.margin = '12px 0';
  });
  clone.querySelectorAll('th, td').forEach((cell) => {
    const el = cell as HTMLElement;
    el.style.border = '1px solid #e5e7eb';
    el.style.padding = '6px 10px';
    el.style.textAlign = 'left';
  });

  // Remove noisy attributes
  clone.querySelectorAll('*').forEach((el) => {
    el.removeAttribute('class');
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('data-') || attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  // Extract clean title
  const heading = contentRoot.querySelector('h1, h2, h3');
  const rawTitle =
    heading?.textContent?.trim() ||
    document.title.replace(/\s*[-|]\s*ChatGPT.*$/i, '').trim() ||
    'ChatGPT Note';
  const title = rawTitle.length > 70 ? `${rawTitle.slice(0, 70)}...` : rawTitle;

  return {
    title,
    html: clone.innerHTML,
    plainText: (contentRoot.innerText || '').trim(),
  };
}

function createMemoDockButton(msgEl: HTMLElement): HTMLElement {
  const host = document.createElement('span');
  host.setAttribute(BUTTON_ATTR, 'true');
  host.style.cssText = 'display:inline-flex !important;align-items:center !important;flex-shrink:0 !important;margin-left:6px !important;vertical-align:middle !important;z-index:20 !important;';

  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .md-btn {
      all: initial;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 10px;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1d4ed8;
      cursor: pointer;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      box-sizing: border-box;
      transition: all 0.15s ease;
    }
    .md-btn:hover {
      background: #dbeafe;
      border-color: #2563eb;
    }
    .md-btn.saved {
      background: #ecfdf5;
      border-color: #16a34a;
      color: #15803d;
    }
    .md-btn.error {
      background: #fef2f2;
      border-color: #dc2626;
      color: #dc2626;
    }
    .md-btn svg {
      display: block;
      flex-shrink: 0;
    }
  `;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'md-btn';
  btn.title = 'Save response to MemoDock (HTML Lite)';
  btn.innerHTML = `${MEMODOCK_SVG}<span>MemoDock</span>`;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const payload = captureResponseHtmlLite(msgEl);
    chrome.runtime.sendMessage(
      {
        action: 'SAVE_CHATGPT_RESPONSE',
        payload: {
          ...payload,
          sourceUrl: window.location.href,
          sourceTitle: document.title || 'ChatGPT',
        },
      },
      (resp) => {
        if (chrome.runtime.lastError || !resp?.ok) {
          btn.className = 'md-btn error';
          btn.innerHTML = `<span>Error</span>`;
          setTimeout(() => {
            btn.className = 'md-btn';
            btn.innerHTML = `${MEMODOCK_SVG}<span>MemoDock</span>`;
          }, 2500);
          return;
        }
        btn.className = 'md-btn saved';
        btn.innerHTML = `${CHECK_SVG}<span>Saved!</span>`;
        setTimeout(() => {
          btn.className = 'md-btn';
          btn.innerHTML = `${MEMODOCK_SVG}<span>MemoDock</span>`;
        }, 2500);
      }
    );
  });

  shadow.appendChild(style);
  shadow.appendChild(btn);
  return host;
}

function findAssistantMessages(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  // 1. Primary: explicit assistant role elements
  document.querySelectorAll('[data-message-author-role="assistant"], [data-turn="assistant"]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!seen.has(htmlEl)) {
      seen.add(htmlEl);
      results.push(htmlEl);
    }
  });

  // 2. Fallback: .markdown / .prose blocks not inside a user message
  if (results.length === 0) {
    document.querySelectorAll('.markdown, .prose').forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.closest('[data-message-author-role="user"]')) return;
      if (!seen.has(htmlEl)) {
        seen.add(htmlEl);
        results.push(htmlEl);
      }
    });
  }

  // 3. Universal fallback: find assistant-only action buttons (Good/Bad response, Read aloud, Copy turn)
  if (results.length === 0) {
    const actionBtns = document.querySelectorAll(
      '[data-testid="good-response-turn-action-button"], [data-testid="copy-turn-action-button"], button[aria-label*="Good response" i], button[aria-label*="Bonne réponse" i], button[aria-label*="Read aloud" i], button[aria-label*="Lire" i]'
    );
    actionBtns.forEach((btn) => {
      const turn =
        (btn.closest('article') as HTMLElement) ||
        (btn.closest('[data-testid*="turn"]') as HTMLElement) ||
        (btn.parentElement?.parentElement?.parentElement as HTMLElement);
      if (turn && !turn.querySelector('[data-message-author-role="user"]') && !seen.has(turn)) {
        seen.add(turn);
        results.push(turn);
      }
    });
  }

  return results;
}

function findToolbarForContainer(scope: Element): Element | null {
  const actionBtn =
    scope.querySelector('[data-testid="copy-turn-action-button"]') ||
    scope.querySelector('[data-testid="good-response-turn-action-button"]') ||
    scope.querySelector('button[aria-label*="Good response" i], button[aria-label*="Bonne réponse" i], button[aria-label*="Read aloud" i]') ||
    Array.from(scope.querySelectorAll('button[aria-label*="Copy" i], button[aria-label*="Copier" i]'))
      .filter((el) => !el.closest('.markdown, pre, code'))
      .pop() ||
    null;

  if (!actionBtn) return null;

  // Walk up until we find the row containing multiple action buttons
  let cur: Element | null = actionBtn.parentElement;
  for (let i = 0; i < 4 && cur; i++) {
    if (cur.querySelectorAll('button').length >= 3) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return actionBtn.parentElement;
}

function injectFloatingFallback() {
  if (document.getElementById('memodock-floating-clipper')) return;
  const fab = document.createElement('div');
  fab.id = 'memodock-floating-clipper';
  fab.style.cssText = [
    'position:fixed !important',
    'bottom:22px !important',
    'right:22px !important',
    'z-index:2147483647 !important',
    'display:flex !important',
    'align-items:center !important',
  ].join(';');

  const shadow = fab.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .md-fab {
      all: initial;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 36px;
      padding: 0 14px;
      border-radius: 9999px;
      border: 1px solid #2563eb;
      background: #2563eb;
      color: #ffffff;
      cursor: pointer;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      transition: all 0.15s ease;
    }
    .md-fab:hover { background: #1d4ed8; transform: translateY(-1px); }
    .md-fab.saved { background: #16a34a; border-color: #16a34a; }
    .md-fab.error { background: #dc2626; border-color: #dc2626; }
    .md-fab svg { display: block; flex-shrink: 0; }
  `;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'md-fab';
  btn.title = 'Save latest ChatGPT response to MemoDock';
  btn.innerHTML = `${MEMODOCK_SVG}<span>Save to MemoDock</span>`;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const msgs = findAssistantMessages();
    const target = msgs[msgs.length - 1] || (document.querySelector('main') as HTMLElement) || document.body;
    const payload = captureResponseHtmlLite(target);
    chrome.runtime.sendMessage(
      {
        action: 'SAVE_CHATGPT_RESPONSE',
        payload: {
          ...payload,
          sourceUrl: window.location.href,
          sourceTitle: document.title || 'ChatGPT',
        },
      },
      (resp) => {
        if (chrome.runtime.lastError || !resp?.ok) {
          btn.className = 'md-fab error';
          btn.innerHTML = `<span>Error</span>`;
          setTimeout(() => {
            btn.className = 'md-fab';
            btn.innerHTML = `${MEMODOCK_SVG}<span>Save to MemoDock</span>`;
          }, 2500);
          return;
        }
        btn.className = 'md-fab saved';
        btn.innerHTML = `${CHECK_SVG}<span>Saved!</span>`;
        setTimeout(() => {
          btn.className = 'md-fab';
          btn.innerHTML = `${MEMODOCK_SVG}<span>Save to MemoDock</span>`;
        }, 2500);
      }
    );
  });

  shadow.appendChild(style);
  shadow.appendChild(btn);
  document.body.appendChild(fab);
}

function injectButtons() {
  injectFloatingFallback();

  const messages = findAssistantMessages();
  let injected = 0;

  messages.forEach((msgEl) => {
    const scope =
      msgEl.closest('article') ||
      msgEl.closest('[data-testid^="conversation-turn"]') ||
      msgEl.parentElement ||
      msgEl;

    if (scope.querySelector(`[${BUTTON_ATTR}]`) || msgEl.nextElementSibling?.hasAttribute(BUTTON_ATTR)) {
      return;
    }

    const toolbar = findToolbarForContainer(scope);
    const btnHost = createMemoDockButton(msgEl);

    if (toolbar) {
      toolbar.appendChild(btnHost);
    } else {
      const bar = document.createElement('div');
      bar.setAttribute(BUTTON_ATTR, 'true');
      bar.style.cssText = 'display:flex !important;justify-content:flex-end !important;margin:8px 0 4px 0 !important;opacity:1 !important;visibility:visible !important;z-index:30 !important;';
      bar.appendChild(btnHost);
      const anchor = (msgEl.querySelector('.markdown') as HTMLElement) || msgEl;
      if (anchor.parentElement) {
        anchor.insertAdjacentElement('afterend', bar);
      } else {
        msgEl.appendChild(bar);
      }
    }
    injected++;
  });

  if (injected > 0) {
    console.info(`[MemoDock] Injected ${injected} button(s) (messages: ${messages.length})`);
  }
}

console.info('[MemoDock] ChatGPT Clipper active');

// Initial scan + MutationObserver + periodic fallback for SPA navigation/hydration
injectButtons();
window.setInterval(injectButtons, 2000);
let scanTimer: number | null = null;
const observer = new MutationObserver(() => {
  if (scanTimer) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(injectButtons, 500);
});
observer.observe(document.body, { childList: true, subtree: true });
