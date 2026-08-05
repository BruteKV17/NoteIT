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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] font-bold text-xs uppercase tracking-wider transition-all duration-150 border-2 select-none ${
        active
          ? 'bg-[#FFC400] text-[#111111] border-[#111111] shadow-paper-sm font-extrabold translate-x-1'
          : 'bg-transparent text-[#111111] border-transparent hover:bg-white hover:border-[#111111] hover:shadow-paper-sm'
      }`}
    >
      <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
        {icon}
        {hasNotificationDot && (
          <span 
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#111111] ${dotColorClass[notificationColor]}`} 
          />
        )}
      </div>

      {!collapsed && (
        <span className="truncate flex-1 text-left">{label}</span>
      )}

      {!collapsed && badge !== undefined && (
        <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[4px] border border-[#111111] ${
          active ? 'bg-[#111111] text-white' : 'bg-[#EAE5D9] text-[#111111]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};
