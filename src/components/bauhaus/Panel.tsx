import React from 'react';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'muted';
}

export const Panel: React.FC<PanelProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  className = '',
  ...props
}) => {
  const bgStyles = {
    default: 'bg-[var(--card-bg)] text-[var(--text-primary)]',
    highlight: 'bg-[#FFC400]/15 text-[var(--text-primary)]',
    muted: 'bg-[var(--panel-bg)] text-[var(--text-primary)]',
  };

  return (
    <div
      className={`rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-md flex flex-col overflow-hidden ${bgStyles[variant]} ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-4 py-3 bg-[var(--panel-bg)] border-b-2 border-[var(--border-main)] flex items-center justify-between gap-3 shrink-0">
          <div>
            {title && (
              <h3 className="section-label text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className="p-4 flex-1 overflow-auto">{children}</div>

      {footer && (
        <div className="px-4 py-3 bg-[var(--panel-bg)] border-t-2 border-[var(--border-main)] shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
};
