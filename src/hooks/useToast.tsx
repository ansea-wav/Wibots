import { useCallback } from 'react';
import { toast as globalToast } from '@/components/DynamicIsland';

export type ToastType = 'success' | 'error' | 'info';

export function useToast() {
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    globalToast(message, type);
  }, []);

  return { showToast, toastElement: null };
}
