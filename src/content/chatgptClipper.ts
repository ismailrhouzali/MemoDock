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
  const contentRoot =
    (messageEl.querySelector('.markdown') as HTMLElement) ||
    (messageEl.querySelector('[data-message-id]') as HTMLElement) ||
    messageEl;

  const clone = contentRoot.cloneNode(true) as HTMLElement;

  // 1. Remove ChatGPT interactive buttons, toolbars & raw <style>/<script> tags
  clone
    .querySelectorAll('button, script, style, [data-memodock-btn], .sr-only')
    .forEach((el) => el.remove());

  // 2. Convert large/diagram SVGs (like Mermaid charts) to crisp self-contained <img>
  const liveSvgs = Array.from(contentRoot.querySelectorAll('svg'));
  const cloneSvgs = Array.from(clone.querySelectorAll('svg'));
  liveSvgs.forEach((liveSvg, idx) => {
    const cSvg = cloneSvgs[idx];
    if (!cSvg) return;
    const r = liveSvg.getBoundingClientRect();
    const isDiagram =
      liveSvg.id.includes('mermaid') ||
      !!liveSvg.closest('[class*="mermaid"]') ||
      r.width > 80 ||
      r.height > 80;
    if (isDiagram) {
      serializeSvgToImage(liveSvg, cSvg);
    } else if (r.width === 0 && r.height === 0) {
      cSvg.remove();
    }
  });

  // 3. Inline essential visual styles on cards, tables, badges, progress bars & images
  const liveNodes = Array.from(contentRoot.querySelectorAll('*'));
  const cloneNodes = Array.from(clone.querySelectorAll('*'));
  liveNodes.forEach((liveNode, idx) => {
    const cNode = cloneNodes[idx] as HTMLElement | undefined;
    if (!cNode || cNode.tagName === 'IMG' || cNode.tagName === 'SVG') return;
    const cs = window.getComputedStyle(liveNode);

    // Preserve card backgrounds, borders, badges & progress bar fills
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      cNode.style.backgroundColor = bg;
    }
    if (cs.borderWidth && parseFloat(cs.borderWidth) > 0 && cs.borderStyle !== 'none') {
      cNode.style.border = `${cs.borderWidth} ${cs.borderStyle} ${cs.borderColor}`;
    }
    if (cs.borderRadius && parseFloat(cs.borderRadius) > 0) {
      cNode.style.borderRadius = cs.borderRadius;
    }
    // Preserve flex/grid & progress bar widths
    if (cs.display === 'flex' || cs.display === 'inline-flex' || cs.display === 'grid') {
      cNode.style.display = cs.display;
      if (cs.gap && cs.gap !== 'normal') cNode.style.gap = cs.gap;
      if (cs.flexWrap === 'wrap') cNode.style.flexWrap = 'wrap';
      if (cs.alignItems && cs.alignItems !== 'normal') cNode.style.alignItems = cs.alignItems;
      if (cs.justifyContent && cs.justifyContent !== 'normal') cNode.style.justifyContent = cs.justifyContent;
    }
    if ((liveNode as HTMLElement).style?.width) {
      cNode.style.width = (liveNode as HTMLElement).style.width;
    }
    if (cs.height && parseFloat(cs.height) <= 12 && bg && bg !== 'rgba(0, 0, 0, 0)') {
      cNode.style.height = cs.height;
    }
  });

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

function findAssistantTurns(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const results: HTMLElement[] = [];

  const direct = document.querySelectorAll(
    '[data-message-author-role="assistant"], article[data-turn="assistant"]'
  );
  direct.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const container =
      (htmlEl.closest('article') as HTMLElement) ||
      (htmlEl.closest('[data-testid^="conversation-turn"]') as HTMLElement) ||
      htmlEl;
    if (!seen.has(container)) {
      seen.add(container);
      results.push(container);
    }
  });

  // Fallback: conversation turns that contain markdown response and are not user turns
  if (results.length === 0) {
    document.querySelectorAll('[data-testid^="conversation-turn"], article').forEach((turn) => {
      const t = turn as HTMLElement;
      if (t.querySelector('[data-message-author-role="user"]')) return;
      if (t.querySelector('.markdown, [data-testid="copy-turn-action-button"]') && !seen.has(t)) {
        seen.add(t);
        results.push(t);
      }
    });
  }

  return results;
}

function injectButtons() {
  const turns = findAssistantTurns();
  let injected = 0;

  turns.forEach((container) => {
    if (container.querySelector(`[${BUTTON_ATTR}]`)) return;

    const msgEl =
      (container.querySelector('[data-message-author-role="assistant"]') as HTMLElement) ||
      (container.querySelector('.markdown') as HTMLElement) ||
      container;

    const btnHost = createMemoDockButton(msgEl);

    // Prefer the turn-level bottom action bar (never a code-block Copy button inside .markdown)
    const turnCopyBtn = container.querySelector('[data-testid="copy-turn-action-button"]');
    const allCopyBtns = Array.from(
      container.querySelectorAll('button[aria-label*="Copy" i], button[aria-label*="Copier" i]')
    ).filter((el) => !el.closest('.markdown, pre, code'));
    const copyBtn = turnCopyBtn || allCopyBtns[allCopyBtns.length - 1] || null;

    // Walk up only to the immediate flex toolbar row holding the action icons
    let actionBar: Element | null = copyBtn?.parentElement || null;
    if (actionBar && actionBar.children.length === 1 && actionBar.parentElement) {
      // Unwrap single-button tooltip wrapper <span>/<div>
      actionBar = actionBar.parentElement;
    }

    if (actionBar) {
      actionBar.appendChild(btnHost);
    } else {
      msgEl.style.position = 'relative';
      btnHost.style.position = 'absolute';
      btnHost.style.bottom = '4px';
      btnHost.style.right = '4px';
      msgEl.appendChild(btnHost);
    }
    injected++;
  });

  if (injected > 0) {
    console.info(`[MemoDock] Injected ${injected} button(s) (turns detected: ${turns.length})`);
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
