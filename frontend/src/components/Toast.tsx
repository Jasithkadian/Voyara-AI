import React, { useEffect, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = 'success',
  duration = 3000,
  onClose
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 200); // Wait for exit animation (200ms toastOut keyframe)
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 shrink-0 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 shrink-0 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 shrink-0 text-white" />;
      case 'error':
        return <XCircle className="w-5 h-5 shrink-0 text-white" />;
      default:
        return null;
    }
  };

  // Depleting progress bar style
  const progressBarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '3px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: '100%',
    transformOrigin: 'left',
    animation: `toastProgress ${duration}ms linear forwards`
  };

  const toastClass = `toast toast-${variant} ${isExiting ? 'exit' : ''} relative overflow-hidden`;

  return (
    <div className={toastClass}>
      {/* Inject custom style for progress bar animation keyframe locally if needed */}
      <style>{`
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
      
      <div className="flex items-center gap-3 pr-2">
        {getIcon()}
        <span className="text-sm font-sans tracking-wide leading-tight text-white">{message}</span>
      </div>
      
      <button 
        onClick={handleClose} 
        className="ml-auto p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-all focus:outline-none focus:ring-1 focus:ring-white/50"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* depletes in real time */}
      <div style={progressBarStyle} />
    </div>
  );
};
