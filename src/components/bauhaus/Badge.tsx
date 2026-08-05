import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'yellow' | 'red' | 'blue' | 'green' | 'black' | 'white' | 'muted';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'yellow',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    yellow: 'bg-[#FFC400] text-[#111111] border-[#111111]',
    red: 'bg-[#FF4D4D] text-white border-[#111111]',
    blue: 'bg-[#2F6BFF] text-white border-[#111111]',
    green: 'bg-[#19B56B] text-white border-[#111111]',
    black: 'bg-[#111111] text-white border-[#111111]',
    white: 'bg-white text-[#111111] border-[#111111]',
    muted: 'bg-[#EAE5D9] text-[#666666] border-[#111111]',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider border-2 rounded-[4px] shadow-paper-sm select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
