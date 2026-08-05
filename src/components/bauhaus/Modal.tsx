import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70 backdrop-blur-[2px] animate-fadeIn">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div 
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-[8px] border-2 border-[#111111] shadow-paper-lg flex flex-col max-h-[90vh] overflow-hidden z-10`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#FFC400] border-b-2 border-[#111111] flex items-center justify-between gap-4">
          <div>
            <h2 id="modal-title" className="font-heading text-lg font-bold uppercase tracking-tight text-[#111111]">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[#111111]/80 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 hover:bg-[#111111]/20 border-transparent text-[#111111]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-[#111111]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 bg-[#F6F2EA] border-t-2 border-[#111111] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
