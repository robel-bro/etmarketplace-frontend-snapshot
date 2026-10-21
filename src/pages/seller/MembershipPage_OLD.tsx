// src/pages/seller/MembershipPage.tsx
import { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  CheckBadgeIcon,
  SparklesIcon,
  StarIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  TagIcon,
} from '@heroicons/react/24/solid';
import confetti from 'canvas-confetti';
import api from '../../lib/axios';

// ---------- Plan color mapping ----------
const planColors: Record<string, { bg: string; border: string; badge: string; text: string; icon: string }> = {
  Free: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-900', icon: '🥉' },
  Standard: { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-200 text-slate-700', text: 'text-slate-800', icon: '🥈' },
  Silver: { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-200 text-slate-700', text: 'text-slate-800', icon: '🥈' },
  Gold: { bg: 'bg-yellow-50', border: 'border-yellow-300', badge: 'bg-yellow-200 text-yellow-800', text: 'text-yellow-900', icon: '🥇' },
  Platinum: { bg: 'bg-indigo-50', border: 'border-indigo-300', badge: 'bg-indigo-200 text-indigo-800', text: 'text-indigo-900', icon: '💎' },
};

const getPlanStyle = (planName: string) =>
  planColors[planName] || { bg: 'bg-white', border: 'border-gray-100', badge: 'bg-gray-100 text-gray-600', text: 'text-gray-900', icon: '📦' };

const MembershipPage = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data: plans, isLoading, error } = useQuery(
    'membershipPlans',
    () => api.get('/api/v1/membership_plans').then(res => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  const handleSubscribe = async (planId: number) => {
    try {
      await api.post('/vendor_subscription', {
        membership_plan_id: planId,
        payment_method: 'telebirr', // can be made dynamic later
      });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      alert('Successfully subscribed! Your perks are now active.');
      // Optionally refetch plans or redirect
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Subscription failed. Please try again.';
      alert(msg);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-pulse text-gray-400">Loading plans…</div></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-sm text-red-500">Failed to load membership plans.</div>;
  }

  const formattedPlans = (plans || []).map((plan: any) => {
    const priceMonthly = Number(plan.price);
    const yearlyPrice = billingCycle === 'yearly' ? Math.round(priceMonthly * 12 * 0.8) : null;

    // Build feature list with icons
    const perks: { label: string; icon: JSX.Element; highlight?: boolean }[] = [];

    if (plan.commission_rate != null) {
      perks.push({
        label: `${plan.commission_rate}% commission`,
        icon: <TagIcon className="w-4 h-4 text-gray-500" />,
      });
    }

    if (plan.featured_included) {
      const dur = plan.featured_duration_days ? ` for ${plan.featured_duration_days} days` : '';
      perks.push({
        label: `Featured seller${dur}`,
        icon: <MegaphoneIcon className="w-4 h-4 text-yellow-600" />,
        highlight: true,
      });
    }

    if (plan.sponsored_product_limit > 0) {
      perks.push({
        label: `${plan.sponsored_product_limit} sponsored product slots`,
        icon: <SparklesIcon className="w-4 h-4 text-blue-600" />,
        highlight: true,
      });
    }

    if (plan.analytics_access) {
      perks.push({
        label: 'Advanced analytics',
        icon: <ChartBarIcon className="w-4 h-4 text-purple-600" />,
      });
    }

    if (plan.priority_support) {
      perks.push({
        label: 'Priority support',
        icon: <ShieldCheckIcon className="w-4 h-4 text-green-600" />,
      });
    }

    const textPerks: string[] = plan.features || [];

    return {
      id: plan.id,
      name: plan.name,
      priceMonthly,
      yearlyPrice,
      badge_text: plan.badge_text || plan.name,
      perks,
      textPerks,
      popular: plan.name === 'Gold', // can be dynamic later
    };
  });

  if (selectedPlanId === null && formattedPlans.length > 0) {
    setSelectedPlanId(formattedPlans[0].id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
        <p className="text-sm text-gray-600 mt-1">Choose the plan that fits your business</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          {['monthly', 'yearly'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle as any)}
              className={`px-5 py-2 text-xs font-medium rounded-md transition ${
                billingCycle === cycle
                  ? 'bg-white text-[var(--color-orange-600)] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly (Save 20%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards – Tall Professional Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {formattedPlans.map((plan, index) => {
          const isCurrent = plan.id === selectedPlanId;
          const style = getPlanStyle(plan.name);
          const priceDisplay = billingCycle === 'monthly'
            ? `ETB ${plan.priceMonthly.toLocaleString()}`
            : `ETB ${plan.yearlyPrice!.toLocaleString()}`;
          const period = billingCycle === 'monthly' ? '/mo' : '/yr';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card p-6 relative flex flex-col ${style.border} ${style.bg} ${
                plan.popular ? 'ring-2 ring-[var(--color-orange-500)]' : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-orange-500)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" /> Most Popular
                </div>
              )}

              {/* Icon & Name */}
              <div className="text-3xl mb-2">{style.icon}</div>
              <h3 className={`text-xl font-bold ${style.text} mb-1`}>{plan.name}</h3>
              {plan.badge_text && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-4 ${style.badge}`}>
                  <StarIcon className="w-3 h-3" /> {plan.badge_text}
                </span>
              )}

              {/* Price */}
              <div className="mb-6">
                <span className={`text-3xl font-bold ${style.text}`}>{priceDisplay}</span>
                <span className="text-sm text-gray-500 ml-1">{period}</span>
                {billingCycle === 'yearly' && (
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    Save 20% (ETB {Math.round(plan.priceMonthly * 12 * 0.2).toLocaleString()}/yr)
                  </div>
                )}
              </div>

              {/* Vertical List of Perks (System‑Enforced) */}
              <div className="mb-6 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  What’s included
                </p>
                <ul className="space-y-3">
                  {plan.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0">{perk.icon}</span>
                      <span className={`text-sm ${perk.highlight ? 'font-medium text-gray-800' : 'text-gray-700'}`}>
                        {perk.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Text Perks (Display Only) */}
              {plan.textPerks.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Also includes
                  </p>
                  <ul className="space-y-1">
                    {plan.textPerks.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckBadgeIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition mt-auto ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500">
        <p>All plans include a 14‑day money‑back guarantee.</p>
        <p className="mt-1">
          Need a custom plan?{' '}
          <button className="text-[var(--color-orange-500)] hover:underline">Contact us</button>
        </p>
      </div>
    </div>
  );
};

export default MembershipPage;