import React from 'react';

export interface StatusPillProps {
  status: 'green' | 'yellow' | 'red' | 'muted';
  label: string;
  pulse?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  pulse = true,
}) => {
  const dotColor = {
    green: 'bg-[#19B56B]',
    yellow: 'bg-[#FFC400]',
    red: 'bg-[#FF4D4D]',
    muted: 'bg-[#666666]',
  };

  const borderBg = {
    green: 'bg-[#19B56B]/10 text-[#111111] border-[#111111]',
    yellow: 'bg-[#FFC400]/20 text-[#111111] border-[#111111]',
    red: 'bg-[#FF4D4D]/10 text-[#111111] border-[#111111]',
    muted: 'bg-[#EAE5D9] text-[#666666] border-[#111111]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border-2 font-mono text-[11px] font-bold uppercase tracking-wider ${borderBg[status]}`}>
      <span className={`w-2 h-2 rounded-full border border-[#111111] ${dotColor[status]} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{label}</span>
    </span>
  );
};
