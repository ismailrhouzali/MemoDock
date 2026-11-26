// Manifest V3 Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  // Context menu on extension icon: Open NoteBook in new tab
  chrome.contextMenus.create({
    id: 'notebook_open_tab',
    title: 'Open NoteBook in new tab',
    contexts: ['action'],
  });

  // Setup Context Menus for web clipping
  chrome.contextMenus.create({
    id: 'notebook_clip_selection',
    title: 'Save selection to NoteBook',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'notebook_clip_page',
    title: 'Save page link to NoteBook',
    contexts: ['page'],
  });

  // Setup side panel behavior if supported
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'notebook_open_tab') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    return;
  }

  const now = Date.now();
  const pageTitle = tab?.title || 'Web Research Note';
  const pageUrl = tab?.url || '';

  if (info.menuItemId === 'notebook_clip_selection' && info.selectionText) {
    const noteId = `clip-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const clippedContent = `
      <p><blockquote><p>${escapeHtml(info.selectionText)}</p></blockquote></p>
      <p>Captured from: <a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pageTitle)}</a></p>
      <p><small>Captured on: ${new Date(now).toLocaleString()}</small></p>
    `;

    const newClip = {
      id: noteId,
      title: `Clip: ${pageTitle.slice(0, 50)}`,
      content: clippedContent,
      plainText: `${info.selectionText}\n\nCaptured from: ${pageTitle} (${pageUrl})`,
      createdAt: now,
      updatedAt: now,
      folderId: null,
      tags: ['Web Clip'],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isTrash: false,
      sourceUrl: pageUrl,
      sourceTitle: pageTitle,
    };

    // Store in chrome.storage.local pending clips queue
    try {
      const result = await chrome.storage.local.get('pending_clips');
      const clips = result.pending_clips || [];
      clips.push(newClip);
      await chrome.storage.local.set({ pending_clips: clips });

      // Show temporary badge notification on extension icon
      if (chrome.action && chrome.action.setBadgeText) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to queue clipped note:', err);
    }
  } else if (info.menuItemId === 'notebook_clip_page') {
    const noteId = `clip-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const clippedContent = `
      <p>Bookmark reference:</p>
      <p><a href="${escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pageTitle)}</a></p>
      <p><small>Saved on: ${new Date(now).toLocaleString()}</small></p>
    `;

    const newClip = {
      id: noteId,
      title: `Bookmark: ${pageTitle.slice(0, 50)}`,
      content: clippedContent,
      plainText: `Bookmark: ${pageTitle}\n${pageUrl}`,
      createdAt: now,
      updatedAt: now,
      folderId: null,
      tags: ['Bookmarks'],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isTrash: false,
      sourceUrl: pageUrl,
      sourceTitle: pageTitle,
    };

    try {
      const result = await chrome.storage.local.get('pending_clips');
      const clips = result.pending_clips || [];
      clips.push(newClip);
      await chrome.storage.local.set({ pending_clips: clips });

      if (chrome.action && chrome.action.setBadgeText) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to queue clipped bookmark:', err);
    }
  }
});

// Handle Commands (Keyboard Shortcuts defined in manifest)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_full_notebook') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

// Handle ChatGPT Response Clipper messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'SAVE_CHATGPT_RESPONSE' && message.payload) {
    const { title, html, plainText, sourceUrl, sourceTitle } = message.payload;
    const now = Date.now();
    const noteId = `chatgpt-${now}-${Math.random().toString(36).substring(2, 7)}`;

    const safeHtmlAttr = escapeHtml(html || '');
    const noteContent = `<div data-type="html-lite-block" data-html="${safeHtmlAttr}" data-source-url="${escapeHtml(
      sourceUrl || ''
    )}" data-source-title="${escapeHtml(sourceTitle || 'ChatGPT Response')}"></div>`;

    const newNote = {
      id: noteId,
      title: title || 'ChatGPT Response',
      icon: '🤖',
      content: noteContent,
      plainText: plainText || '',
      createdAt: now,
      updatedAt: now,
      folderId: null,
      tags: ['ChatGPT'],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isTrash: false,
      sourceUrl: sourceUrl || '',
      sourceTitle: sourceTitle || 'ChatGPT',
    };

    chrome.storage.local
      .get('pending_clips')
      .then((res) => {
        const clips = res.pending_clips || [];
        clips.push(newNote);
        return chrome.storage.local.set({ pending_clips: clips });
      })
      .then(() => {
        if (chrome.action && chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ text: '✓' });
          chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
          setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
          }, 2500);
        }
        sendResponse({ ok: true, noteId });
      })
      .catch((err) => {
        console.error('Failed to save ChatGPT response:', err);
        sendResponse({ ok: false, error: String(err) });
      });

    return true; // keep message channel open for async sendResponse
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

