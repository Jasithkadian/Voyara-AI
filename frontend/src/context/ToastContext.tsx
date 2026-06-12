import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Toast, ToastVariant } from '../components/Toast';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, variant, duration }];
      if (newToasts.length > 3) {
        // Remove oldest toast automatically
        return newToasts.slice(newToasts.length - 3);
      }
      return newToasts;
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container stacking top-right */}
      <div 
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 pointer-events-none"
        style={{ width: '320px', maxWidth: '90vw' }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <Toast
              id={toast.id}
              message={toast.message}
              variant={toast.variant}
              duration={toast.duration}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
