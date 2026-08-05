import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`w-full p-8 md:p-12 bg-white rounded-[6px] border-2 border-dashed border-[#111111] shadow-paper-sm flex flex-col items-center justify-center text-center ${className}`}>
      <div className="w-16 h-16 rounded-[6px] bg-[#F6F2EA] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-[#111111] mb-4">
        {icon}
      </div>
      <h3 className="font-heading text-lg font-bold uppercase tracking-tight text-[#111111] mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-[#666666] max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
