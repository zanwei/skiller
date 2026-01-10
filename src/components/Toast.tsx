import { useEffect, useRef, useState } from 'react';
import { ToastData } from '../contexts/ToastContext';
import './Toast.css';

interface ToastProps {
  data: ToastData | null;
  onClose: () => void;
  onReveal: (path: string) => void;
  onOpenFile: (path: string) => void;
}

export function Toast({ data, onClose, onReveal, onOpenFile }: ToastProps) {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      if (currentToast) {
        // New toast coming in, animate out the old one
        setIsExiting(true);
        setTimeout(() => {
          setCurrentToast(data);
          setIsExiting(false);
        }, 150);
      } else {
        setCurrentToast(data);
      }
    } else {
      if (currentToast) {
        setIsExiting(true);
        setTimeout(() => {
          setCurrentToast(null);
          setIsExiting(false);
        }, 150);
      }
    }
  }, [data]);

  if (!currentToast) return null;

  return (
    <div className={`toast ${isExiting ? 'toast-exit' : 'toast-enter'}`} ref={toastRef}>
      <div className="toast-main">
        <div className="toast-icon">
          <CheckCircleIcon />
        </div>
        <div className="toast-content">
          <div className="toast-title">Download complete</div>
          <div className="toast-description">
            File <strong>{currentToast.fileName}</strong> was downloaded.
          </div>
          <div className="toast-actions">
            <button
              className="toast-btn toast-btn-outlined"
              onClick={() => onReveal(currentToast.filePath)}
            >
              Reveal in Finder
            </button>
            <button
              className="toast-btn toast-btn-text"
              onClick={() => onOpenFile(currentToast.filePath)}
            >
              Open file
            </button>
          </div>
        </div>
      </div>
      <button className="toast-close" onClick={onClose}>
        <CloseIcon />
      </button>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--chart-2))" stroke="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
