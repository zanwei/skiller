import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export interface ToastData {
  message: string;
  filePath: string;
  fileName: string;
}

interface ToastContextType {
  toast: ToastData | null;
  showToast: (data: ToastData) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Preload audio for better performance
const downloadedSound = new Audio('/downloaded.wav');
downloadedSound.volume = 0.3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const isPlayingRef = useRef(false);

  const playDownloadSound = useCallback(() => {
    // Prevent playing multiple times for the same download
    if (isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    downloadedSound.currentTime = 0;
    downloadedSound.play().catch(err => {
      console.error('Failed to play sound:', err);
    }).finally(() => {
      // Reset flag after sound finishes or after a short delay
      setTimeout(() => {
        isPlayingRef.current = false;
      }, 500);
    });
  }, []);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
    playDownloadSound();
  }, [playDownloadSound]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
