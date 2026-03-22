import { useCallback, useEffect, useRef, useState } from 'react';
import { updateDocument } from '@/lib/documents';
import type { Document } from '@/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(documentId: string) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (data: Partial<Pick<Document, 'title' | 'content'>>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        const { error } = await updateDocument(documentId, data);
        setSaveStatus(error ? 'error' : 'saved');
        // Reset to idle after 2s
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
    },
    [documentId]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { save, saveStatus };
}
