import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  secondaryMessage?: string;
  secondaryLink?: string;
  onClose: () => void;
  duration?: number;
  variant?: 'success' | 'terreta' | 'error';
}

export const Toast: React.FC<ToastProps> = ({
  message,
  secondaryMessage,
  secondaryLink,
  onClose,
  duration = 4000,
  variant = 'success'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match fade-out duration
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Toast Container */}
      <div
        className={`relative w-[calc(100%-0.5rem)] min-w-0 max-w-[500px] rounded-[13px] shadow-2xl p-5 pointer-events-auto transition-all duration-300 ${
          variant === 'error' ? 'bg-[#B45309]' : variant === 'terreta' ? 'bg-[#D97706]' : 'bg-[#2D8659]'
        } ${
          isVisible && !isExiting
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 pr-6">
          {/* Success Icon */}
          <div className="flex-shrink-0">
            {variant === 'error' ? (
              <AlertCircle size={32} className="text-white" strokeWidth={2.5} />
            ) : (
              <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-1 font-serif ${
              variant === 'terreta' ? 'text-white' : 'text-[#D4A574]'
            }`}>
              {message}
            </h3>
            {secondaryMessage && (
              <p className="text-white/90 text-sm font-sans">
                {secondaryLink ? (
                  <a
                    href={secondaryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors font-mono"
                  >
                    {secondaryMessage}
                  </a>
                ) : (
                  secondaryMessage
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

