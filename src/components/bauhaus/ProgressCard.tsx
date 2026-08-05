import React from 'react';

export interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  unit?: string;
  statusLabel?: string;
  color?: 'yellow' | 'green' | 'blue' | 'red';
  className?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  max = 100,
  unit = '%',
  statusLabel,
  color = 'yellow',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const barColor = {
    yellow: 'bg-[#FFC400]',
    green: 'bg-[#19B56B]',
    blue: 'bg-[#2F6BFF]',
    red: 'bg-[#FF4D4D]',
  };

  return (
    <div className={`p-4 bg-white rounded-[6px] border-2 border-[#111111] shadow-paper-sm flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="section-label text-xs font-bold text-[#111111] uppercase tracking-wider">
          {title}
        </span>
        <span className="font-mono text-xs font-bold text-[#111111]">
          {value} / {max} {unit}
        </span>
      </div>

      <div className="w-full bg-[#F6F2EA] h-3.5 rounded-[4px] border-2 border-[#111111] overflow-hidden p-0.5 relative">
        <div
          className={`h-full ${barColor[color]} rounded-[2px] transition-all duration-300 border-r border-[#111111]`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {statusLabel && (
        <div className="flex justify-between items-center text-[10px] font-mono text-[#666666] uppercase mt-0.5">
          <span>STATUS</span>
          <span className="font-bold text-[#111111]">{statusLabel}</span>
        </div>
      )}
    </div>
  );
};
