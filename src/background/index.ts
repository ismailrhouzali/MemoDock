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

if (chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (!alarm.name.startsWith('memodock-reminder-')) return;
    chrome.storage.local.get(alarm.name).then((res) => {
      const info = res[alarm.name] as { title?: string; message?: string } | undefined;
      if (chrome.notifications && chrome.notifications.create) {
        chrome.notifications.create(alarm.name, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: info?.title || 'MemoDock Reminder',
          message: info?.message || 'Scheduled note reminder',
          priority: 2,
        });
      }
      chrome.storage.local.remove(alarm.name).catch(() => {});
    });
  });
}

if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.action === 'SET_REMINDER' && msg.noteId && msg.when) {
      const alarmName = `memodock-reminder-${msg.noteId}`;
      chrome.storage.local
        .set({ [alarmName]: { title: msg.title || 'MemoDock Reminder', message: msg.message || '' } })
        .then(() => {
          chrome.alarms?.create(alarmName, { when: Number(msg.when) });
          sendResponse({ ok: true });
        })
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true;
    }
    if (msg?.action === 'CLEAR_REMINDER' && msg.noteId) {
      const alarmName = `memodock-reminder-${msg.noteId}`;
      chrome.alarms?.clear(alarmName);
      chrome.storage.local.remove(alarmName).catch(() => {});
      sendResponse({ ok: true });
    }
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

