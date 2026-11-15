import { Note, Folder, Tag, AppSettings, ConflictRecord } from '../db/types';
import { db, settingsStorage } from '../db/db';

export interface DriveSyncResult {
  success: boolean;
  uploadedCount: number;
  downloadedCount: number;
  conflictsCount: number;
  error?: string;
  folderId?: string;
}

// In-memory token cache for active session
let sessionAccessToken: string | null = null;

export const googleDriveService = {
  // Check if Chrome Identity API is available
  isIdentityAvailable: (): boolean => {
    return typeof chrome !== 'undefined' && !!chrome.identity;
  },

  // Get the extension's redirect URL for Google Cloud OAuth configuration
  getRedirectUrl: (): string => {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getRedirectURL) {
      return chrome.identity.getRedirectURL();
    }
    return `${window.location.origin}/`;
  },

  // Verify a Google OAuth token by querying the userinfo endpoint
  verifyToken: async (token: string): Promise<{ valid: boolean; email?: string; error?: string }> => {
    if (!token || !token.trim()) {
      return { valid: false, error: 'Token is empty.' };
    }
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      if (res.ok) {
        const data = await res.json();
        return { valid: true, email: data.email || 'google-user@gmail.com' };
      }
      const errData = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: errData?.error?.message || `HTTP ${res.status}: Invalid or expired token.`,
      };
    } catch (err: any) {
      return { valid: false, error: err?.message || 'Network error verifying token.' };
    }
  },

  // Connect using a direct Access Token (e.g. from OAuth Playground or Cloud Console)
  connectWithToken: async (token: string): Promise<{ token: string; email: string }> => {
    const cleanToken = token.trim();
    const verification = await googleDriveService.verifyToken(cleanToken);
    if (!verification.valid) {
      throw new Error(verification.error || 'Invalid Google OAuth Token');
    }

    const email = verification.email || 'user@gmail.com';
    sessionAccessToken = cleanToken;

    const current = await settingsStorage.get();
    await settingsStorage.set({
      googleDrive: {
        ...current.googleDrive,
        isConnected: true,
        userEmail: email,
        accessToken: cleanToken,
        folderName: current.googleDrive.folderName || 'MemoDock Data',
        syncStatus: 'idle',
        lastError: null,
      },
    });

    return { token: cleanToken, email };
  },

  // Connect using Chrome Web Auth Flow (for local unpacked extensions with custom OAuth Web Client ID)
  connectWithWebAuthFlow: async (clientId: string): Promise<{ token: string; email: string }> => {
    if (!googleDriveService.isIdentityAvailable() || !chrome.identity.launchWebAuthFlow) {
      throw new Error('Chrome Identity launchWebAuthFlow is not available in this environment.');
    }

    const cleanClientId = clientId.trim();
    if (!cleanClientId) {
      throw new Error('Please enter a valid Google OAuth Client ID.');
    }

    const redirectUri = googleDriveService.getRedirectUrl();
    const scopes = encodeURIComponent(
      'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email'
    );
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      cleanClientId
    )}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        async (responseUrl) => {
          if (chrome.runtime.lastError || !responseUrl) {
            return reject(
              new Error(
                chrome.runtime.lastError?.message ||
                  'User cancelled Google authorization or window closed.'
              )
            );
          }

          try {
            const url = new URL(responseUrl);
            const hash = url.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');

            if (!token) {
              return reject(new Error('No access_token found in Google redirect response.'));
            }

            const connected = await googleDriveService.connectWithToken(token);
            // Save client ID for subsequent refreshes
            const current = await settingsStorage.get();
            await settingsStorage.set({
              googleDrive: {
                ...current.googleDrive,
                clientId: cleanClientId,
              },
            });

            resolve(connected);
          } catch (err: any) {
            reject(new Error(`Failed to parse auth response: ${err.message}`));
          }
        }
      );
    });
  },

  // Authorize with Google Account
  connectAccount: async (
    interactive: boolean = true,
    customToken?: string,
    customClientId?: string
  ): Promise<{ token: string; email?: string }> => {
    // 1. Direct custom token provided
    if (customToken && customToken.trim().length > 0) {
      return googleDriveService.connectWithToken(customToken);
    }

    // 2. Custom Client ID provided -> use launchWebAuthFlow
    if (customClientId && customClientId.trim().length > 0) {
      return googleDriveService.connectWithWebAuthFlow(customClientId);
    }

    // Check if we already have a saved clientId in settings
    const current = await settingsStorage.get();
    if (current.googleDrive.clientId) {
      return googleDriveService.connectWithWebAuthFlow(current.googleDrive.clientId);
    }

    // 3. Try standard Chrome Identity getAuthToken (works if extension is packaged / manifest client_id configured)
    if (googleDriveService.isIdentityAvailable() && chrome.identity.getAuthToken) {
      return new Promise((resolve, reject) => {
        try {
          chrome.identity.getAuthToken({ interactive }, async (token) => {
            if (chrome.runtime.lastError || !token) {
              const err = chrome.runtime.lastError?.message || 'Failed to obtain OAuth token';
              return reject(
                new Error(
                  `Chrome Identity Error: ${err}. En mode extension locale, veuillez saisir votre Client ID Google Cloud ou un jeton d'accès (voir Guide d'aide ci-dessous).`
                )
              );
            }

            try {
              const connected = await googleDriveService.connectWithToken(token);
              resolve(connected);
            } catch (err: any) {
              reject(err);
            }
          });
        } catch (err: any) {
          reject(err);
        }
      });
    }

    throw new Error(
      "Chrome Identity API non disponible. Veuillez saisir un jeton d'accès Google Drive."
    );
  },

  // Retrieve valid active access token
  getActiveToken: async (): Promise<string | null> => {
    if (sessionAccessToken) {
      const check = await googleDriveService.verifyToken(sessionAccessToken);
      if (check.valid) return sessionAccessToken;
    }

    const current = await settingsStorage.get();
    if (current.googleDrive.accessToken) {
      const check = await googleDriveService.verifyToken(current.googleDrive.accessToken);
      if (check.valid) {
        sessionAccessToken = current.googleDrive.accessToken;
        return sessionAccessToken;
      }
    }

    // Try background getAuthToken if available
    if (googleDriveService.isIdentityAvailable() && chrome.identity.getAuthToken) {
      return new Promise((resolve) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
          if (!chrome.runtime.lastError && token) {
            sessionAccessToken = token;
            resolve(token);
          } else {
            resolve(null);
          }
        });
      });
    }

    return null;
  },

  // Disconnect Google Account
  disconnectAccount: async () => {
    sessionAccessToken = null;
    if (googleDriveService.isIdentityAvailable() && chrome.identity.clearAllCachedAuthTokens) {
      try {
        chrome.identity.clearAllCachedAuthTokens(() => {});
      } catch {
        // ignore
      }
    }

    const current = await settingsStorage.get();
    await settingsStorage.set({
      googleDrive: {
        ...current.googleDrive,
        isConnected: false,
        userEmail: null,
        accessToken: undefined,
        folderId: null,
        syncStatus: 'idle',
        lastError: null,
      },
    });
  },

  // Find or create dedicated MemoDock folder in Google Drive
  getOrCreateFolder: async (folderName: string, token: string): Promise<string> => {
    // Search for existing folder
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      folderName
    )}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id, name)`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!searchRes.ok) {
      const err = await searchRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to search folder (HTTP ${searchRes.status})`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create folder in Google Drive (HTTP ${createRes.status})`);
    }

    const newFolder = await createRes.json();
    return newFolder.id;
  },

  // Synchronize notes with Google Drive
  syncWithDrive: async (): Promise<DriveSyncResult> => {
    const settings = await settingsStorage.get();
    if (!settings.googleDrive.isConnected) {
      return {
        success: false,
        uploadedCount: 0,
        downloadedCount: 0,
        conflictsCount: 0,
        error: 'Google Drive is not connected.',
      };
    }

    const token = await googleDriveService.getActiveToken();
    if (!token) {
      const errMsg =
        'Jeton Google expiré ou non configuré. Veuillez reconnecter votre compte ou saisir un nouveau jeton dans les paramètres.';
      await settingsStorage.set({
        googleDrive: {
          ...settings.googleDrive,
          syncStatus: 'error',
          lastError: errMsg,
        },
      });
      return {
        success: false,
        uploadedCount: 0,
        downloadedCount: 0,
        conflictsCount: 0,
        error: errMsg,
      };
    }

    try {
      await settingsStorage.set({
        googleDrive: {
          ...settings.googleDrive,
          syncStatus: 'syncing',
          lastError: null,
        },
      });

      const folderName = settings.googleDrive.folderName || 'MemoDock Data';
      const folderId = await googleDriveService.getOrCreateFolder(folderName, token);

      const allNotes = await db.notes.toArray();
      const allFolders = await db.folders.toArray();
      const allTags = await db.tags.toArray();

      // Export local snapshot
      const backupData = {
        app: 'MemoDock',
        version: '2.0',
        syncedAt: Date.now(),
        notesCount: allNotes.length,
        notes: allNotes,
        folders: allFolders,
        tags: allTags,
      };

      const backupString = JSON.stringify(backupData, null, 2);

      // Search if memodock_backup.json already exists in target folder
      const fileSearchUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name='memodock_backup.json' and trashed=false&fields=files(id, name)`;
      const fileSearchRes = await fetch(fileSearchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let backupFileId: string | null = null;
      if (fileSearchRes.ok) {
        const fileSearchData = await fileSearchRes.json();
        if (fileSearchData.files && fileSearchData.files.length > 0) {
          backupFileId = fileSearchData.files[0].id;
        }
      }

      if (backupFileId) {
        // Update existing backup file content
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${backupFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: backupString,
          }
        );

        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Failed to update backup file (HTTP ${updateRes.status})`);
        }
      } else {
        // Create new backup file via multipart upload
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadata = {
          name: 'memodock_backup.json',
          parents: [folderId],
          mimeType: 'application/json',
        };

        const multipartBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          backupString +
          closeDelimiter;

        const createRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartBody,
          }
        );

        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Failed to create backup file (HTTP ${createRes.status})`);
        }
      }

      // Save sync snapshot to local storage cache as redundant safety
      try {
        localStorage.setItem(
          'memodock_cloud_sync_cache',
          JSON.stringify({
            syncedAt: Date.now(),
            count: allNotes.length,
          })
        );
      } catch {
        // ignore quota
      }

      const updatedSettings = await settingsStorage.get();
      await settingsStorage.set({
        googleDrive: {
          ...updatedSettings.googleDrive,
          folderId,
          syncStatus: 'success',
          lastSyncTimestamp: Date.now(),
          lastError: null,
        },
      });

      return {
        success: true,
        uploadedCount: allNotes.length,
        downloadedCount: 0,
        conflictsCount: 0,
        folderId,
      };
    } catch (err: any) {
      console.error('Google Drive Sync Error:', err);
      const updatedSettings = await settingsStorage.get();
      const errorMessage = err?.message || 'Sync failed due to unexpected error.';
      await settingsStorage.set({
        googleDrive: {
          ...updatedSettings.googleDrive,
          syncStatus: 'error',
          lastError: errorMessage,
        },
      });
      return {
        success: false,
        uploadedCount: 0,
        downloadedCount: 0,
        conflictsCount: 0,
        error: errorMessage,
      };
    }
  },

  // Conflict detection helper
  detectAndRecordConflict: async (localNote: Note, remoteNote: Note): Promise<ConflictRecord | null> => {
    if (localNote.id !== remoteNote.id) return null;

    if (
      localNote.content !== remoteNote.content &&
      Math.abs(localNote.updatedAt - remoteNote.updatedAt) > 1000
    ) {
      const conflict: ConflictRecord = {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        noteId: localNote.id,
        localNote,
        remoteNote,
        detectedAt: Date.now(),
        resolved: false,
      };

      await db.conflicts.add(conflict);
      return conflict;
    }

    return null;
  },

  // Resolve conflict: Keep local, keep remote, or keep both
  resolveConflict: async (
    conflictId: string,
    choice: 'keep_local' | 'keep_remote' | 'keep_both'
  ) => {
    const conflict = await db.conflicts.get(conflictId);
    if (!conflict) return;

    if (choice === 'keep_remote') {
      await db.notes.put(conflict.remoteNote);
    } else if (choice === 'keep_both') {
      const duplicated: Note = {
        ...conflict.remoteNote,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `${conflict.remoteNote.title} (Cloud Copy)`,
        updatedAt: Date.now(),
      };
      await db.notes.add(duplicated);
    }

    await db.conflicts.update(conflictId, { resolved: true });
  },
};
