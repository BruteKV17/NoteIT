import React from 'react';
import { Clock, Volume2, ArrowUpRight, Play, FileText } from 'lucide-react';
import { Card } from './Card';
import { Badge } from './Badge';

export interface LectureCardProps {
  id: string;
  title: string;
  subject?: string;
  date: string;
  duration?: string;
  status?: 'synthesized' | 'processing' | 'raw';
  audioUrl?: string;
  onClick?: () => void;
  onPlayClick?: (e: React.MouseEvent) => void;
}

export const LectureCard: React.FC<LectureCardProps> = ({
  id,
  title,
  subject = 'GENERAL',
  date,
  duration = '45 mins',
  status = 'synthesized',
  audioUrl,
  onClick,
  onPlayClick,
}) => {
  const badgeVariant = subject.includes('DBMS')
    ? 'blue'
    : subject.includes('SECURITY')
    ? 'red'
    : subject.includes('AI')
    ? 'yellow'
    : 'black';

  return (
    <Card
      interactive
      shadow="md"
      onClick={onClick}
      className="p-4 bg-white flex flex-col justify-between h-full group"
    >
      <div className="flex flex-col gap-3">
        {/* Category & Audio Badges Header */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#111111] pb-2.5">
          <Badge variant={badgeVariant} size="sm">
            {subject}
          </Badge>
          {audioUrl && (
            <div className="w-7 h-7 rounded-[4px] bg-[#F6F2EA] border-2 border-[#111111] flex items-center justify-center text-[#111111] group-hover:bg-[#FFC400]">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Lecture Title Box */}
        <div className="p-3 bg-[#F6F2EA] rounded-[4px] border-2 border-[#111111] group-hover:bg-[#FFF8D6] transition-colors">
          <h3 className="font-heading text-sm md:text-base font-bold uppercase tracking-tight text-[#111111] line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-[#666666]">
            <Clock className="w-3 h-3 text-[#111111]" />
            <span>{date}</span>
            <span>•</span>
            <span>{duration}</span>
          </div>
        </div>
      </div>

      {/* Action Footer Badge */}
      <div className="mt-4 pt-2.5 border-t-2 border-[#111111] flex items-center justify-between text-xs font-bold uppercase">
        <span className={`px-2 py-0.5 rounded-[3px] border border-[#111111] text-[10px] font-mono ${
          status === 'synthesized' ? 'bg-[#FFC400] text-[#111111]' : 'bg-[#EAE5D9] text-[#666666]'
        }`}>
          ✓ {status.toUpperCase()}
        </span>

        <span className="inline-flex items-center gap-1 text-[#111111] group-hover:translate-x-1 transition-transform">
          VIEW <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Card>
  );
};
