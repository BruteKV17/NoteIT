/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle,
  Building,
  GraduationCap,
  Bookmark
} from 'lucide-react';
import { PageId, UserSettings } from '../types';
import { PRICING_PLANS } from '../data';

interface PricingViewProps {
  settings: UserSettings;
  onUpgradePlan: (planName: 'Scholar' | 'Researcher' | 'Institution', price: string, billingCycle: 'monthly' | 'yearly') => void;
  setActivePage: (page: PageId) => void;
}

export default function PricingView({
  settings,
  onUpgradePlan,
  setActivePage
}: PricingViewProps) {
  
  // Billing cycle state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradedPlanName, setUpgradedPlanName] = useState<string | null>(null);

  const calculatePrice = (basePrice: string, planName: string) => {
    if (planName === 'Scholar') return '$0';
    if (planName === 'Institution') return 'Custom';
    
    // Researcher Plan details
    if (billingCycle === 'yearly') {
      return '$10'; // 20% discount on yearly
    }
    return '$12';
  };

  const handleUpgradeSimulated = (planName: string, priceText: string) => {
    if (planName === 'Institution') {
      alert("Sales contact form activated. Our representative will contact your university administrators.");
      return;
    }

    const castPlan = planName as 'Scholar' | 'Researcher';
    onUpgradePlan(castPlan, priceText, billingCycle);
    setUpgradedPlanName(planName);
    
    setTimeout(() => {
      setUpgradedPlanName(null);
      setActivePage('dashboard');
    }, 2800);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Dynamic Selector Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-gray-700 tracking-wider font-mono">
          CHOOSE COGNITIVE TIERS
        </span>
        <h2 className="font-sans font-bold text-2.5xl md:text-4xl text-gray-900 tracking-tight leading-tighter">
          Elevate Your Academic Intelligence
        </h2>
        <p className="text-sm font-medium text-gray-500 max-w-lg mx-auto">
          Scale your lecture outlines, citation catalogs, and active retention quizzes with advanced LLM analysis models.
        </p>

        {/* Sync Duration billing switcher */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 font-sans text-xs font-bold rounded-lg transition-all focus:outline-none ${
                billingCycle === 'monthly' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 font-sans text-xs font-bold rounded-lg relative flex items-center gap-1.5 transition-all focus:outline-none ${
                billingCycle === 'yearly' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Yearly billing</span>
              <span className="rounded bg-sky-500 text-white font-bold text-[9px] px-1.5 py-0.5 tracking-wide scale-95 uppercase">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {upgradedPlanName && (
        <div className="max-w-md mx-auto rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center space-y-2 animate-bounce">
          <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
          <h4 className="text-sm font-bold text-emerald-800">Checkout Completed Successfully!</h4>
          <p className="text-xs text-emerald-700 leading-normal">
            Your Note-IT AI student workspace has been successfully upgraded to the <strong className="font-bold">{upgradedPlanName}</strong> plan. Recalibrating dashboard limits...
          </p>
        </div>
      )}

      {/* Grid mapping billing plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {PRICING_PLANS.map((plan) => {
          const isActive = settings.subscription.planName === plan.name;
          const displayPrice = calculatePrice(plan.price, plan.name);
          const isProPopular = plan.name === 'Researcher';

          return (
            <div 
              key={plan.name}
              className={`rounded-2xl p-6.5 flex flex-col justify-between border relative transition-all tracking-normal ${
                isProPopular 
                  ? 'bg-[#121318] text-white border-neutral-800 shadow-xl scale-102 z-10' 
                  : 'bg-white text-gray-900 border-gray-200'
              }`}
            >
              {isProPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm">
                  MOST POPULAR WORKSPACE
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold tracking-widest font-mono uppercase ${
                    isProPopular ? 'text-indigo-400' : 'text-gray-400'
                  }`}>
                    {plan.tierLabel}
                  </span>
                  {isActive && (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                      Current Tier
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-sans font-bold text-lg">{plan.name} Plan</h3>
                  <p className={`text-xs mt-1 leading-normal ${isProPopular ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {plan.tagline}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold font-mono tracking-tight">{displayPrice}</span>
                  {plan.period !== 'forever' && plan.period !== 'enterprise' && (
                    <span className={`text-xs font-medium ${isProPopular ? 'text-neutral-400' : 'text-gray-400'}`}>
                      / {billingCycle === 'yearly' ? 'mo, billed anchor' : 'month'}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleUpgradeSimulated(plan.name, displayPrice)}
                    disabled={isActive && plan.name !== 'Institution'}
                    className={`w-full py-3.5 px-4 font-sans text-xs font-bold rounded-xl transition-all active:scale-98 cursor-pointer focus:outline-none ${
                      isProPopular
                        ? isActive 
                          ? 'bg-neutral-800 text-neutral-400' 
                          : 'bg-white text-black hover:bg-neutral-100'
                        : isActive
                          ? 'bg-gray-100 text-gray-400 border border-gray-150'
                          : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {isActive ? 'Current Active Tier' : plan.ctaText}
                  </button>
                </div>
              </div>

              {/* Feature checkboxes block list */}
              <div className="border-t border-neutral-700/30 pt-6 mt-6 space-y-3 flex-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isProPopular ? 'text-neutral-400' : 'text-gray-400'
                }`}>
                  Core benefits included:
                </span>
                <div className="grid gap-3.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-sans font-medium line-clamp-2">
                      <div className="rounded-full bg-emerald-500/10 text-emerald-500 h-4 w-4 flex items-center justify-center p-0.5 flex-shrink-0 mt-0.5">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className={isProPopular ? 'text-neutral-350' : 'text-gray-650'}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
