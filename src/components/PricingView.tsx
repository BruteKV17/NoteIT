/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  CheckCircle,
  Building,
  GraduationCap
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import { PRICING_PLANS } from '../data';
import { Button, Card, Badge } from './bauhaus';

interface PricingViewProps {
  settings: UserSettings;
  onUpgradePlan: (planName: 'BYOK' | 'Premium' | 'Institution', price: string, billingCycle: 'monthly' | 'yearly') => void;
  setActivePage: (page: PageId) => void;
}

export default function PricingView({
  settings,
  onUpgradePlan,
  setActivePage
}: PricingViewProps) {
  
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradedPlanName, setUpgradedPlanName] = useState<string | null>(null);

  const calculatePrice = (basePrice: string, planName: string) => {
    if (planName === 'BYOK') return '₹0';
    if (planName === 'Institution') return 'Custom';
    
    if (billingCycle === 'yearly') {
      return '₹320';
    }
    return '₹400';
  };

  const handleUpgradeSimulated = (planName: string, priceText: string) => {
    if (planName === 'Institution') {
      alert("Sales contact form activated. Our representative will contact your university administrators.");
      return;
    }

    const castPlan = planName as 'BYOK' | 'Premium';
    onUpgradePlan(castPlan, priceText, billingCycle);
    setUpgradedPlanName(planName);
    
    setTimeout(() => {
      setUpgradedPlanName(null);
      setActivePage('dashboard');
    }, 2800);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 bg-grid-paper p-4 md:p-8 select-none">
      
      {/* Header section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="yellow" size="md">
          COGNITIVE TIERS
        </Badge>
        <h2 className="font-heading font-extrabold text-2xl md:text-4xl text-[#111111] uppercase tracking-tight">
          ELEVATE YOUR ACADEMIC INTELLIGENCE
        </h2>
        <p className="text-xs md:text-sm font-mono text-[#666666] max-w-lg mx-auto">
          Scale your lecture outlines, citation catalogs, and active retention quizzes with advanced LLM models.
        </p>

        {/* Billing cycle switcher */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-1 bg-white p-1.5 rounded-[6px] border-2 border-[#111111] shadow-paper-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase rounded-[4px] transition-colors cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-[#FFC400] text-[#111111] border-2 border-[#111111] shadow-paper-sm' : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase rounded-[4px] relative flex items-center gap-1.5 transition-colors cursor-pointer ${
                billingCycle === 'yearly' ? 'bg-[#FFC400] text-[#111111] border-2 border-[#111111] shadow-paper-sm' : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              <span>Yearly billing</span>
              <span className="rounded bg-[#2F6BFF] text-white font-mono font-bold text-[9px] px-1.5 py-0.5 uppercase border border-[#111111]">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {upgradedPlanName && (
        <div className="max-w-md mx-auto rounded-[6px] bg-[#19B56B]/15 border-2 border-[#111111] p-4 text-center space-y-2 shadow-paper-md">
          <CheckCircle className="h-8 w-8 text-[#19B56B] mx-auto" />
          <h4 className="text-xs font-heading font-extrabold uppercase text-[#111111]">Plan Upgrade Successful!</h4>
          <p className="text-xs font-mono text-[#666666]">
            Your workspace has been upgraded to <strong className="text-[#111111]">{upgradedPlanName}</strong>. Recalibrating dashboard limits...
          </p>
        </div>
      )}

      {/* Grid mapping billing plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {PRICING_PLANS.map((plan) => {
          const isActive = settings.subscription.planName === plan.name;
          const displayPrice = calculatePrice(plan.price, plan.name);
          const isProPopular = plan.name === 'Premium';

          return (
            <Card 
              key={plan.name}
              shadow="lg"
              className={`p-6 flex flex-col justify-between border-2 relative transition-all ${
                isProPopular 
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[#FFC400] shadow-paper-yellow md:-translate-y-2' 
                  : 'bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border-main)] shadow-paper-md'
              }`}
            >
              {isProPopular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[4px] bg-[#FFC400] text-[#111111] text-[9px] font-mono font-bold px-3 py-1 uppercase tracking-widest border border-[#FFC400] shadow-paper-sm">
                  MOST POPULAR WORKSPACE
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest font-mono uppercase text-[var(--text-secondary)]">
                    {plan.tierLabel}
                  </span>
                  {isActive && (
                    <Badge variant="blue" size="sm">
                      Current Tier
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-heading font-extrabold text-xl uppercase text-[var(--text-primary)]">{plan.name} Plan</h3>
                  <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold font-mono text-[var(--text-primary)]">{displayPrice}</span>
                  {plan.period !== 'forever' && plan.period !== 'enterprise' && (
                    <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                      / {billingCycle === 'yearly' ? 'month (billed yearly)' : 'month'}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleUpgradeSimulated(plan.name, displayPrice)}
                    disabled={plan.name === 'Institution' || isActive}
                    className={`w-full py-3 px-4 font-mono text-xs font-bold uppercase rounded-[6px] border-2 border-[var(--border-main)] shadow-paper-sm transition-all ${
                      plan.name === 'Institution'
                        ? 'bg-[var(--panel-bg)] text-[var(--text-secondary)] cursor-not-allowed border-dashed'
                        : isProPopular
                          ? isActive 
                            ? 'bg-[var(--panel-bg)] text-[var(--text-secondary)] cursor-default' 
                            : 'bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] cursor-pointer'
                          : isActive
                            ? 'bg-[var(--panel-bg)] text-[var(--text-secondary)] cursor-default'
                            : 'bg-[#FFC400] text-[#111111] hover:bg-[#ffe066] cursor-pointer'
                    }`}
                  >
                    {plan.name === 'Institution' 
                      ? '🔒 UNDER DEVELOPMENT' 
                      : isActive 
                        ? 'Current Active Tier' 
                        : plan.ctaText}
                  </button>
                </div>
              </div>

              {/* Feature list */}
              <div className="border-t-2 border-[var(--border-main)] pt-6 mt-6 space-y-3 flex-1">
                <span className="section-label text-[10px] font-bold uppercase tracking-[2px] text-[var(--text-secondary)] block">
                  CORE BENEFITS INCLUDED:
                </span>
                <div className="grid gap-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-mono text-[var(--text-primary)]">
                      <div className="rounded-[3px] bg-[#19B56B] text-white h-4 w-4 flex items-center justify-center shrink-0 mt-0.5 border border-[var(--border-main)]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

            </Card>
          );
        })}
      </div>

    </div>
  );
}
