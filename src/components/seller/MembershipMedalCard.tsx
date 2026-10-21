// src/components/seller/MembershipMedalCard.tsx
import { motion } from "framer-motion";

type Tier = "free" | "silver" | "gold" | "platinum";
type Billing = "monthly" | "yearly";

interface Perk {
  label: string;
  included: boolean;
  highlight?: boolean;
}

interface CardProps {
  tier: Tier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  period: string;                     // ★ new prop
  perks: Perk[];
  isPopular?: boolean;
  isCurrent: boolean;
  onSubscribe: () => void;
  billing: Billing;
}

const tierConfig: Record<Tier, { glyph: string; pill: string; bar: string; pillBg: string; pillFg: string; ctaShadow: string }> = {
  free: {
    glyph: "🏪",
    pill: "Starter",
    bar: "linear-gradient(90deg,#d1d5db,#9ca3af,#6b7280)",
    pillBg: "#f3f4f6",
    pillFg: "#000",
    ctaShadow: "rgba(234,88,12,0.35)",
  },
  silver: {
    glyph: "🥈",
    pill: "Silver",
    bar: "linear-gradient(90deg,#94a3b8,#64748b,#475569)",
    pillBg: "#f1f5f9",
    pillFg: "#000",
    ctaShadow: "rgba(234,88,12,0.35)",
  },
  gold: {
    glyph: "🏆",
    pill: "Gold",
    bar: "linear-gradient(90deg,#fcd34d,#f59e0b,#d97706)",
    pillBg: "#fef3c7",
    pillFg: "#000",
    ctaShadow: "rgba(234,88,12,0.35)",
  },
  platinum: {
    glyph: "💎",
    pill: "Platinum",
    bar: "linear-gradient(90deg,#a78bfa,#7c3aed,#4f46e5)",
    pillBg: "#ede9fe",
    pillFg: "#000",
    ctaShadow: "rgba(234,88,12,0.35)",
  },
};

export default function MembershipMedalCard({
  tier,
  name,
  tagline,
  monthlyPrice,
  yearlyPrice,
  period,                            // ★ new prop
  perks,
  isPopular = false,
  isCurrent,
  onSubscribe,
  billing,
}: CardProps) {
  const config = tierConfig[tier] || tierConfig.free;
  const rawPrice = billing === "yearly" ? yearlyPrice : monthlyPrice;
  const price = typeof rawPrice === "number" ? rawPrice : 0;
  const isFree = price === 0;
  const save = !isFree
    ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 6px 24px -6px rgba(0,0,0,0.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ height: 6, background: config.bar }} />

      <div style={{ padding: "24px 24px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Badges – plain text */}
        <div style={{ display: "flex", justifyContent: "space-between", minHeight: 22, marginBottom: 20, fontSize: 13, fontWeight: 700, color: "#000" }}>
          <span>{isCurrent ? "Active plan" : ""}</span>
          <span>{isPopular ? "⭐ Most popular" : ""}</span>
        </div>

        {/* Emoji + Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12 }}>{config.glyph}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#000", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{name}</div>
          <div style={{ fontSize: 14, color: "#000", marginTop: 4, fontWeight: 600 }}>{tagline}</div>
          <span
            style={{
              display: "inline-block",
              background: config.pillBg,
              color: config.pillFg,
              borderRadius: 999,
              padding: "4px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 14,
            }}
          >
            {config.pill}
          </span>
        </div>

        {/* Price – uses period prop */}
        <div style={{ borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: "16px 0 14px", marginBottom: 22, textAlign: "center" }}>
          {isFree ? (
            <div style={{ fontSize: 28, fontWeight: 800, color: "#000", letterSpacing: "-0.04em", lineHeight: 1 }}>Free</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#000", paddingBottom: 6 }}>ETB</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#000", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {price.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, color: "#000", paddingBottom: 6, marginLeft: 3 }}>{period}</span>
            </div>
          )}
          {billing === "yearly" && save > 0 && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 999, padding: "4px 12px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Save {save}% yearly</span>
            </div>
          )}
        </div>

        {/* Feature list – plain text, no icons */}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 20 }}>
          {perks.map((perk, i) => (
            <li key={i}>
              <span
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: !perk.included ? "#9ca3af" : "#000",
                  fontWeight: perk.highlight && perk.included ? 700 : 400,
                  textDecoration: !perk.included ? "line-through" : "none",
                }}
              >
                {perk.label}
              </span>
            </li>
          ))}
        </ul>

        {/* Compact button */}
        <button
          onClick={onSubscribe}
          disabled={isCurrent}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 2,
            padding: "8px 0",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: isCurrent ? "not-allowed" : "pointer",
            transition: "all 0.18s",
            background: isCurrent ? "#f3f4f6" : "linear-gradient(135deg, #f97316, #ea580c)",
            color: isCurrent ? "#9ca3af" : "#ffffff",
            boxShadow: isCurrent ? "none" : `0 8px 20px -4px ${config.ctaShadow}`,
            outline: "none",
            marginTop: "auto",
          }}
          onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseDown={(e) => { if (!isCurrent) e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { if (!isCurrent) e.currentTarget.style.transform = "scale(1)"; }}
        >
          {isCurrent ? "Your current plan" : isFree ? "Get started" : `Upgrade to ${name}`}
        </button>
      </div>
    </motion.div>
  );
}