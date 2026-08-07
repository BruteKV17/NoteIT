import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'yellow' | 'red' | 'blue';
  interactive?: boolean;
  active?: boolean;
  accentBorder?: 'yellow' | 'red' | 'blue' | 'green' | 'black';
}

export const Card: React.FC<CardProps> = ({
  children,
  shadow = 'md',
  interactive = false,
  active = false,
  accentBorder = 'black',
  className = '',
  ...props
}) => {
  const shadowStyles = {
    none: 'shadow-none',
    sm: 'shadow-paper-sm',
    md: 'shadow-paper-md',
    lg: 'shadow-paper-lg',
    yellow: 'shadow-paper-yellow',
    red: 'shadow-paper-red',
    blue: 'shadow-paper-blue',
  };

  const accentStyles = {
    black: 'border-[var(--border-main)]',
    yellow: 'border-[#FFC400]',
    red: 'border-[#FF4D4D]',
    blue: 'border-[#2F6BFF]',
    green: 'border-[#19B56B]',
  };

  const activeStyles = active 
    ? 'bg-[var(--hover-bg)] ring-2 ring-[#FFC400] text-[var(--text-primary)]' 
    : 'bg-[var(--card-bg)] text-[var(--text-primary)]';
  const interactiveStyles = interactive ? 'transition-all duration-150 hover:-translate-y-0.5 hover:shadow-paper-lg cursor-pointer' : '';

  return (
    <div
      className={`rounded-[6px] border ${accentStyles[accentBorder]} ${shadowStyles[shadow]} ${activeStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
