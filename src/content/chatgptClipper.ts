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

function injectButtons() {
  const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
  assistantMessages.forEach((msg) => {
    const msgEl = msg as HTMLElement;
    const container =
      msgEl.closest('article') ||
      msgEl.closest('[data-testid^="conversation-turn"]') ||
      msgEl.parentElement?.parentElement ||
      msgEl.parentElement ||
      msgEl;
    if (container.querySelector(`[${BUTTON_ATTR}]`)) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute(BUTTON_ATTR, 'true');
    btn.title = 'Save response to MemoDock (HTML Lite)';
    btn.innerHTML = `${MEMODOCK_SVG}<span style="font-size:11px;font-weight:600;">MemoDock</span>`;
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'flex-shrink:0',
      'gap:5px',
      'padding:4px 9px',
      'border-radius:8px',
      'border:1px solid rgba(120,113,108,0.28)',
      'background:rgba(255,255,255,0.92)',
      'color:#2563eb',
      'cursor:pointer',
      'font-family:system-ui,-apple-system,sans-serif',
      'line-height:1.2',
      'transition:all 0.15s ease',
      'margin-left:6px',
      'z-index:20',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#eff6ff';
      btn.style.borderColor = '#2563eb';
    });
    btn.addEventListener('mouseleave', () => {
      if (!btn.dataset.saved) {
        btn.style.background = 'rgba(255,255,255,0.9)';
        btn.style.borderColor = 'rgba(120,113,108,0.25)';
      }
    });

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
            btn.innerHTML = `<span style="font-size:11px;color:#dc2626;">Error</span>`;
            return;
          }
          btn.dataset.saved = 'true';
          btn.style.background = '#ecfdf5';
          btn.style.borderColor = '#16a34a';
          btn.style.color = '#16a34a';
          btn.innerHTML = `${CHECK_SVG}<span style="font-size:11px;font-weight:600;">Saved!</span>`;
          setTimeout(() => {
            delete btn.dataset.saved;
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.borderColor = 'rgba(120,113,108,0.25)';
            btn.style.color = '#2563eb';
            btn.innerHTML = `${MEMODOCK_SVG}<span style="font-size:11px;font-weight:600;">MemoDock</span>`;
          }, 2500);
        }
      );
    });

    // Try attaching inside ChatGPT's native action bar next to Copy button; fallback to top-right of message
    const copyBtn =
      container.querySelector('[data-testid="copy-turn-action-button"]') ||
      container.querySelector('button[aria-label*="Copy" i], button[aria-label*="Copier" i]');
    const actionBar =
      copyBtn?.closest('div.flex, div[class*="items-center"]') || copyBtn?.parentElement;

    if (actionBar) {
      actionBar.appendChild(btn);
    } else {
      msgEl.style.position = 'relative';
      btn.style.position = 'absolute';
      btn.style.top = '4px';
      btn.style.right = '4px';
      msgEl.appendChild(btn);
    }
  });
}

// Initial scan + MutationObserver for streaming ChatGPT responses
injectButtons();
let scanTimer: number | null = null;
const observer = new MutationObserver(() => {
  if (scanTimer) window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(injectButtons, 500);
});
observer.observe(document.body, { childList: true, subtree: true });
