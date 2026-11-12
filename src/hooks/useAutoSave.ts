import { useState, useRef, useEffect, useCallback } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export function useAutoSave<T>(
  onSave: (data: T) => Promise<void> | void,
  delay: number = 600
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<T | null>(null);

  const saveImmediately = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingDataRef.current !== null) {
      try {
        setSaveStatus('saving');
        await onSave(pendingDataRef.current);
        pendingDataRef.current = null;
        setSaveStatus('saved');
      } catch (err) {
        console.error('AutoSave failed:', err);
        setSaveStatus('error');
      }
    }
  }, [onSave]);

  const queueSave = useCallback(
    (data: T) => {
      pendingDataRef.current = data;
      setSaveStatus('unsaved');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
        if (pendingDataRef.current !== null) {
          try {
            setSaveStatus('saving');
            await onSave(pendingDataRef.current);
            pendingDataRef.current = null;
            setSaveStatus('saved');
          } catch (err) {
            console.error('AutoSave failed:', err);
            setSaveStatus('error');
          }
        }
      }, delay);
    },
    [onSave, delay]
  );

  // Flush pending save before unmounting or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingDataRef.current !== null) {
        onSave(pendingDataRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingDataRef.current !== null) {
        onSave(pendingDataRef.current);
      }
    };
  }, [onSave]);

  return {
    saveStatus,
    queueSave,
    saveImmediately,
  };
}

