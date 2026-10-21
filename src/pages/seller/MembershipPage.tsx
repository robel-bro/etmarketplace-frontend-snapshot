// src/pages/seller/MembershipPage.tsx
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import api from "../../lib/axios";
import MembershipMedalCard from "../../components/seller/MembershipMedalCard";

const MembershipPage = () => {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  // Available plans
  const { data: plans, isLoading, error } = useQuery(
    "membershipPlans",
    () => api.get("/api/v1/membership_plans").then((res) => res.data),
    { staleTime: 5 * 60 * 1000 }
  );

  // Current vendor membership info
  const { data: vendorData, isLoading: vendorLoading } = useQuery(
    "currentVendorMembership",
    () => api.get("/api/v1/vendors/me").then((res) => res.data),
    { staleTime: 60_000 }
  );

  // Once both queries resolve, set the selected plan to the vendor's actual plan
  useEffect(() => {
    if (plans && vendorData?.membership_plan?.id) {
      const currentPlanId = vendorData.membership_plan.id;
      // Only set if it's in the plans list
      const found = Array.isArray(plans) && plans.some((p: any) => p.id === currentPlanId);
      if (found) {
        setSelectedPlanId(currentPlanId);
      }
    }
  }, [plans, vendorData]);

  const handleSubscribe = async (planId: number) => {
    try {
      const res = await api.post("/vendor_subscription", {
        membership_plan_id: planId,
        payment_method: "telebirr",
        billing_cycle: billing,
      });
      if (res.data.redirect_url) {
        window.location.href = res.data.redirect_url;
      } else {
        alert("Unexpected response. Please try again.");
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || "Subscription failed. Please try again.");
    }
  };

  if (isLoading || vendorLoading)
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading plans…</div>;
  if (error)
    return <div className="text-center py-10 text-red-500">Failed to load plans.</div>;

  const allPlans = Array.isArray(plans) ? plans : [];
  if (allPlans.length === 0)
    return <div className="text-center py-10 text-gray-500">No membership plans available.</div>;

  const formattedPlans = allPlans.map((plan: any) => {
    const tierKey = plan.name.toLowerCase();
    const monthlyPrice = parseFloat(plan.price) || 0;

    const yearlyPrice = plan.yearly_price != null
      ? parseFloat(plan.yearly_price)
      : Math.round(monthlyPrice * 12 * 0.8);

    const period = billing === "yearly" ? "/ yr" : "/ mo";

    const perks: { label: string; included: boolean; highlight?: boolean }[] = [];

    const commRate = parseFloat(plan.commission_rate);
    if (!isNaN(commRate) && commRate > 0) {
      perks.push({ label: `${commRate}% commission`, included: true });
    }

    if (plan.featured_included) {
      const dur = plan.featured_duration_days ? ` for ${plan.featured_duration_days} days` : "";
      perks.push({ label: `Featured seller${dur}`, included: true, highlight: true });
    }

    if (plan.sponsored_product_limit > 0) {
      perks.push({
        label: `${plan.sponsored_product_limit} sponsored product slots`,
        included: true,
        highlight: true,
      });
    }

    if (plan.analytics_access) {
      perks.push({ label: "Advanced analytics", included: true });
    }

    if (plan.priority_support) {
      perks.push({ label: "Priority support", included: true });
    }

    (plan.features || []).forEach((feat: string) => {
      perks.push({ label: feat, included: true });
    });

    // Determine if this is the vendor's current plan
    const isCurrent = plan.id === vendorData?.membership_plan?.id;

    return {
      id: plan.id,
      tier: tierKey,
      name: plan.name,
      tagline: plan.description || "",
      monthlyPrice,
      yearlyPrice,
      period,
      perks,
      isPopular: false,
      isCurrent,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* ★ Current membership banner – only show if vendor has a plan, without duplicating card */}
        {vendorData?.membership_plan && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-center shadow-sm">
            <p className="text-sm text-gray-500">Your current plan</p>
            <h3 className="text-xl font-bold text-gray-900 capitalize">
              {vendorData.membership_plan.name}
            </h3>
            {vendorData.membership_expires_at && (
              <p className="text-xs text-gray-400 mt-1">
                Expires {new Date(vendorData.membership_expires_at).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Commission rate: {vendorData.commission_rate ?? vendorData.membership_plan.commission_rate}%
            </p>
            {vendorData.featured && (
              <p className="text-xs text-yellow-600 mt-1">⭐ Your store is featured</p>
            )}
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-black">Choose your membership</h1>
        <p className="text-center text-gray-500 mt-2">A plan for every stage of growth.</p>

        {/* Billing toggle */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex bg-white border border-gray-200 rounded-full p-1">
            {["monthly", "yearly"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b as any)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition ${
                  billing === b ? "bg-gray-900 text-white shadow" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && (
                  <span className="ml-1.5 bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-bold">
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {formattedPlans.map((plan) => (
            <MembershipMedalCard
              key={plan.id}
              tier={plan.tier as any}
              name={plan.name}
              tagline={plan.tagline}
              monthlyPrice={plan.monthlyPrice}
              yearlyPrice={plan.yearlyPrice}
              period={plan.period}
              perks={plan.perks}
              isPopular={plan.isPopular}
              isCurrent={plan.isCurrent}
              onSubscribe={() => handleSubscribe(plan.id)}
              billing={billing}
            />
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          All plans include a 14‑day money‑back guarantee. Need a custom plan?{" "}
          <button className="underline hover:text-gray-600">Contact us</button>.
        </p>
      </div>
    </div>
  );
};

export default MembershipPage;