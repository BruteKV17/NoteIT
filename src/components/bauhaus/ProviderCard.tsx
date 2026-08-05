import React, { useState } from 'react';
import { ExternalLink, Key, CheckCircle, RefreshCw, Trash2, Cpu, ShieldCheck, Activity, Zap } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Input } from './Input';
import { StatusPill } from './StatusPill';

export interface ProviderCardProps {
  id: string;
  name: string;
  logo: React.ReactNode;
  description: string;
  supportedModels: string[];
  selectedModel: string;
  onSelectModel?: (model: string) => void;
  status: 'active' | 'configured' | 'unconfigured' | 'error';
  latencyMs?: number;
  pricingTier?: string;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  onDeleteApiKey?: () => void;
  docUrl?: string;
  getKeyUrl?: string;
  lastValidationTime?: string;
  requestsCount?: number;
  tokensCount?: number;
  dailyQuota?: string;
  monthlyQuota?: string;
  usagePercentage?: number;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  id,
  name,
  logo,
  description,
  supportedModels,
  selectedModel,
  onSelectModel,
  status,
  latencyMs = 120,
  pricingTier = 'PAY-AS-YOU-GO',
  apiKey,
  onSaveApiKey,
  onDeleteApiKey,
  docUrl,
  getKeyUrl,
  lastValidationTime = 'JUST NOW',
  requestsCount = 1420,
  tokensCount = 845200,
  dailyQuota = '10,000 reqs',
  monthlyQuota = '1,000,000 tokens',
  usagePercentage = 34,
}) => {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [isEditingKey, setIsEditingKey] = useState(!apiKey);

  const isConfigured = !!apiKey || status === 'configured' || status === 'active';

  const handleSave = () => {
    onSaveApiKey(inputKey);
    setIsEditingKey(false);
  };

  return (
    <div className="bg-white rounded-[6px] border-2 border-[#111111] shadow-paper-md p-5 flex flex-col gap-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-[#111111] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#F6F2EA] border-2 border-[#111111] shadow-paper-sm flex items-center justify-center text-[#111111]">
            {logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-[#111111] uppercase tracking-tight">
                {name}
              </h3>
              <Badge variant={pricingTier.includes('FREE') ? 'green' : 'blue'} size="sm">
                {pricingTier}
              </Badge>
            </div>
            <p className="text-xs text-[#666666] font-medium mt-0.5 line-clamp-1">{description}</p>
          </div>
        </div>

        <StatusPill
          status={isConfigured ? 'green' : 'yellow'}
          label={isConfigured ? 'CONNECTED' : 'UNCONFIGURED'}
        />
      </div>

      {/* Models & Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#F6F2EA] p-3 rounded-[6px] border-2 border-[#111111]">
        <div>
          <label className="section-label text-[10px] font-bold text-[#666666] uppercase block mb-1">
            Active Selected Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel?.(e.target.value)}
            className="w-full bg-white text-[#111111] font-mono font-bold text-xs p-2 rounded-[4px] border-2 border-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
          >
            {supportedModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="section-label text-[10px] font-bold text-[#666666] uppercase block mb-1">
            Supported Architecture
          </label>
          <div className="flex flex-wrap gap-1 mt-1">
            {supportedModels.slice(0, 3).map((m) => (
              <span key={m} className="px-1.5 py-0.5 bg-white text-[#111111] border border-[#111111] rounded-[3px] text-[10px] font-mono font-bold">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="p-2 bg-white rounded-[4px] border-2 border-[#111111]">
          <span className="text-[10px] text-[#666666] block uppercase">LATENCY</span>
          <span className="font-bold text-[#111111]">{latencyMs} ms</span>
        </div>
        <div className="p-2 bg-white rounded-[4px] border-2 border-[#111111]">
          <span className="text-[10px] text-[#666666] block uppercase">REQUESTS</span>
          <span className="font-bold text-[#111111]">{requestsCount.toLocaleString()}</span>
        </div>
        <div className="p-2 bg-white rounded-[4px] border-2 border-[#111111]">
          <span className="text-[10px] text-[#666666] block uppercase">TOKENS</span>
          <span className="font-bold text-[#111111]">{(tokensCount / 1000).toFixed(1)}k</span>
        </div>
        <div className="p-2 bg-white rounded-[4px] border-2 border-[#111111]">
          <span className="text-[10px] text-[#666666] block uppercase">HEALTH</span>
          <span className="font-bold text-[#19B56B]">100% OK</span>
        </div>
      </div>

      {/* Usage Meter */}
      <div className="flex flex-col gap-1 bg-white p-2.5 rounded-[6px] border-2 border-[#111111]">
        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase">
          <span>DAILY / MONTHLY QUOTA UTILIZATION</span>
          <span>{usagePercentage}%</span>
        </div>
        <div className="w-full bg-[#F6F2EA] h-2.5 rounded-[3px] border border-[#111111] overflow-hidden p-0.5">
          <div
            className="h-full bg-[#FFC400] rounded-[2px]"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[#666666] mt-0.5">
          <span>Daily: {dailyQuota}</span>
          <span>Monthly: {monthlyQuota}</span>
        </div>
      </div>

      {/* API Key Form & Management */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="section-label text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#111111]" />
            API Key Configuration
          </label>

          {isConfigured && !isEditingKey && (
            <button
              onClick={() => setIsEditingKey(true)}
              className="text-xs font-bold text-[#2F6BFF] hover:underline uppercase font-mono"
            >
              Replace Key
            </button>
          )}
        </div>

        {isEditingKey ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder={`Enter your ${name} API key...`}
              className="font-mono text-xs"
            />
            <Button variant="secondary" size="sm" onClick={handleSave} className="shrink-0">
              Save Key
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 bg-[#F6F2EA] rounded-[4px] border-2 border-[#111111] font-mono text-xs">
            <span className="text-[#111111] font-bold">••••••••••••••••{apiKey.slice(-4) || 'KEY-SET'}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#19B56B] font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Validated ({lastValidationTime})
              </span>
              {onDeleteApiKey && (
                <button
                  onClick={onDeleteApiKey}
                  className="text-[#FF4D4D] hover:bg-[#FF4D4D]/10 p-1 rounded"
                  title="Delete API key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Links Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-[#111111] text-[11px] font-mono font-bold">
        {getKeyUrl ? (
          <a
            href={getKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#111111] hover:text-[#2F6BFF] inline-flex items-center gap-1 hover:underline"
          >
            Get API Key <ExternalLink className="w-3 h-3" />
          </a>
        ) : <span />}

        {docUrl && (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#666666] hover:text-[#111111] inline-flex items-center gap-1 hover:underline"
          >
            Documentation <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
