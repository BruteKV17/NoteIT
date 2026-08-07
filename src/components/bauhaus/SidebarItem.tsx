import React from 'react';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  active?: boolean;
  hasNotificationDot?: boolean;
  notificationColor?: 'red' | 'yellow' | 'green';
  onClick?: () => void;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  badge,
  active = false,
  hasNotificationDot = false,
  notificationColor = 'red',
  onClick,
  collapsed = false,
}) => {
  const dotColorClass = {
    red: 'bg-[#FF4D4D]',
    yellow: 'bg-[#FFC400]',
    green: 'bg-[#19B56B]',
  };

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] font-bold text-xs uppercase tracking-wider transition-all duration-150 border-2 select-none cursor-pointer ${
        active
          ? 'sidebar-item-active bg-[#FFC400] text-[#111111] border-[var(--border-main)] shadow-paper-sm font-extrabold translate-x-1'
          : 'bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--card-bg)] hover:border-[var(--border-main)] hover:shadow-paper-sm'
      }`}
    >
      <div className={`relative shrink-0 flex items-center justify-center w-5 h-5 ${active ? 'text-[#111111]' : 'text-[var(--text-primary)]'}`}>
        {icon}
        {hasNotificationDot && (
          <span 
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[var(--border-main)] ${dotColorClass[notificationColor]}`} 
          />
        )}
      </div>

      {!collapsed && (
        <span className={`sidebar-label truncate flex-1 text-left font-bold ${active ? 'text-[#111111]' : 'text-[var(--text-primary)]'}`}>
          {label}
        </span>
      )}

      {!collapsed && badge !== undefined && (
        <span className={`sidebar-badge px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-[4px] border ${
          active 
            ? 'bg-[#111111] text-[#FFC400] border-[#111111]' 
            : 'bg-[var(--panel-bg)] text-[var(--text-primary)] border-[var(--border-main)]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};
