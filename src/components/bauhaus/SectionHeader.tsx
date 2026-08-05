import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111] mb-6 ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-tight text-[#111111]">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs md:text-sm text-[#666666] font-medium max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
