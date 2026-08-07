import React from 'react';
import { Badge } from './Badge';

export interface TimelineItemProps {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
  description: string;
  category?: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  action?: React.ReactNode;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  title,
  timestamp,
  description,
  category = 'ACTIVITY',
  type = 'info',
  action,
}) => {
  const typeBadgeVariant = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    alert: 'red',
  } as const;

  return (
    <div className="flex gap-4 p-4 bg-[var(--card-bg)] rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-sm relative">
      <div className="w-10 h-10 rounded-[6px] bg-[#FFC400] border-2 border-[var(--border-main)] shadow-paper-sm flex items-center justify-center text-[#111111] shrink-0">
        {icon}
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={typeBadgeVariant[type]} size="sm">
              {category}
            </Badge>
            <h4 className="font-heading text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
              {title}
            </h4>
          </div>
          <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)]">
            {timestamp}
          </span>
        </div>

        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mt-1">
          {description}
        </p>

        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
};
