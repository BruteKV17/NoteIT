import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-150 rounded-[6px] border border-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 shadow-paper-sm hover:-translate-y-0.5 hover:shadow-paper active:translate-y-0 active:shadow-paper-sm',
    md: 'px-4 py-2 text-xs md:text-sm gap-2 shadow-paper hover:-translate-y-0.5 hover:shadow-paper-md active:translate-y-0 active:shadow-paper-sm',
    lg: 'px-6 py-3 text-sm md:text-base gap-2.5 shadow-paper-md hover:-translate-y-0.5 hover:shadow-paper-lg active:translate-y-0 active:shadow-paper',
  };

  const variantStyles = {
    primary: 'bg-[#111111] text-white hover:bg-[#222222]',
    secondary: 'bg-[#FFC400] text-[#111111] hover:bg-[#ffe066]',
    tertiary: 'bg-white text-[#111111] hover:bg-[#FFF8D6]',
    danger: 'bg-[#FF4D4D] text-white hover:bg-[#ff6666]',
    ghost: 'bg-transparent text-[#111111] border-transparent shadow-none hover:bg-[#111111]/10 hover:shadow-none hover:translate-y-0',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2" />
      ) : icon && iconPosition === 'left' ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};
