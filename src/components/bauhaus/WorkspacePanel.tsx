import React from 'react';

export interface WorkspacePanelProps {
  title: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  title,
  badge,
  headerAction,
  children,
  className = '',
  footer,
}) => {
  return (
    <div className={`flex flex-col bg-[var(--card-bg)] rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-md overflow-hidden h-full ${className}`}>
      {/* Panel Header Bar */}
      <div className="px-4 py-3 bg-[var(--panel-bg)] border-b-2 border-[var(--border-main)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#FFC400] rounded-sm border border-[var(--border-main)]" />
          <h3 className="font-heading text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            {title}
          </h3>
          {badge}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-[var(--card-bg)] text-[var(--text-primary)]">
        {children}
      </div>

      {/* Optional Sticky Footer */}
      {footer && (
        <div className="p-3 bg-[var(--panel-bg)] border-t-2 border-[var(--border-main)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};
