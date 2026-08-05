import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="section-label text-[#111111] text-xs font-bold uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-[#666666] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-white text-[#111111] font-medium text-sm rounded-[6px] border-2 border-[#111111] ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${
            rightIcon ? 'pr-9' : 'pr-3'
          } py-2 shadow-paper-sm placeholder:text-[#888888] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC400] focus-visible:border-[#111111] transition-all duration-150 disabled:bg-[#EAE5D9] disabled:cursor-not-allowed ${
            error ? 'border-[#FF4D4D] focus-visible:ring-[#FF4D4D]' : ''
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[#666666] flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs font-bold text-[#FF4D4D] tracking-wide mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#666666] mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
