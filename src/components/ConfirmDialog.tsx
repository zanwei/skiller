import { ReactNode, useState } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  detail?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  copyCommand?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  detail,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  copyCommand,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyCommand) return;
    try {
      await navigator.clipboard.writeText(copyCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">{title}</h2>
        </div>
        
        <div className="dialog-content">
          <p className="dialog-message">{message}</p>
          {detail && <div className="dialog-detail">{detail}</div>}
        </div>
        
        <div className="dialog-actions">
          {copyCommand && (
            <button 
              className="btn btn-secondary btn-copy"
              onClick={handleCopy}
              disabled={loading}
            >
              {copied ? (
                <>
                  <CopyCheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </button>
          )}
          <div className="dialog-actions-right">
            <button 
              className="btn btn-secondary dialog-cancel-btn" 
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button 
              className="btn btn-primary dialog-confirm-btn" 
              onClick={onConfirm}
              disabled={loading}
              aria-label={loading ? `${confirmText} in progress` : confirmText}
            >
              {loading ? <span className="btn-spinner" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  );
}

function CopyCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}
