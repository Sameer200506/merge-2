"use client";

import { CreditCard, Zap, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for small teams getting started.",
    features: ["Up to 5 users", "10 projects", "Basic CRM", "Email support"],
    cta: "Downgrade",
    highlight: false,
  },
  {
    name: "Growth",
    price: 99,
    description: "The complete platform for growing teams.",
    features: ["Up to 20 users", "Unlimited projects", "Full CRM + Workflow", "Priority support", "Automations", "Advanced analytics"],
    cta: "Current Plan",
    highlight: true,
    current: true,
  },
  {
    name: "Enterprise",
    price: 299,
    description: "For large organizations with advanced needs.",
    features: ["Unlimited users", "Unlimited projects", "SSO + SAML", "Dedicated support", "Custom integrations", "SLA guarantee"],
    cta: "Upgrade",
    highlight: false,
  },
];

export default function BillingSettingsPage() {
  const { organization } = useAuthStore();

  return (
    <div className="space-y-4">
      {/* Current subscription */}
      <div className="sos-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Current Subscription</h2>
          <span className="badge-success text-[12px] font-medium px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[var(--foreground)] capitalize">{organization?.plan} Plan</p>
            <p className="text-[12.5px] text-[var(--foreground-muted)]">Billed monthly · Next renewal Jun 15, 2027</p>
          </div>
          <p className="ml-auto text-[22px] font-bold text-[var(--foreground)]">$99<span className="text-[14px] font-normal text-[var(--foreground-muted)]">/mo</span></p>
        </div>
        <div className="flex items-center gap-4 mt-4 p-3 bg-[var(--background-subtle)] rounded-lg border border-[var(--border)]">
          <CreditCard size={15} className="text-[var(--foreground-muted)]" />
          <p className="text-[13px] text-[var(--foreground-muted)]">Visa ending in <span className="font-medium text-[var(--foreground)]">4242</span></p>
          <button className="ml-auto text-[12px] text-[var(--primary)] hover:underline">Update</button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "sos-card p-5 relative",
              plan.highlight && "ring-2 ring-[var(--primary)]"
            )}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[11px] font-semibold px-3 py-1 rounded-full gradient-primary text-white shadow-sm">
                  Current Plan
                </span>
              </div>
            )}
            <h3 className="text-[14px] font-bold text-[var(--foreground)] mb-1">{plan.name}</h3>
            <p className="text-[12px] text-[var(--foreground-muted)] mb-3">{plan.description}</p>
            <p className="text-[28px] font-bold text-[var(--foreground)] mb-4">
              ${plan.price}<span className="text-[14px] font-normal text-[var(--foreground-muted)]">/mo</span>
            </p>
            <ul className="space-y-2 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-[var(--foreground-muted)]">
                  <Check size={13} className="text-[#22c55e] flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={cn(
                "sos-btn w-full justify-center",
                plan.current ? "sos-btn-ghost" : "sos-btn-primary"
              )}
              disabled={plan.current}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Invoice history */}
      <div className="sos-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Invoice History</h2>
        </div>
        {[
          { date: "May 15, 2026", amount: "$99.00", status: "Paid" },
          { date: "Apr 15, 2026", amount: "$99.00", status: "Paid" },
          { date: "Mar 15, 2026", amount: "$99.00", status: "Paid" },
        ].map((invoice, i) => (
          <div key={i} className="flex items-center px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--background-subtle)]">
            <CreditCard size={14} className="text-[var(--foreground-muted)] mr-3" />
            <p className="flex-1 text-[13px] text-[var(--foreground)]">{invoice.date}</p>
            <p className="text-[13px] font-medium text-[var(--foreground)] mr-4">{invoice.amount}</p>
            <span className="text-[11.5px] badge-success font-medium px-2 py-0.5 rounded-full mr-3">{invoice.status}</span>
            <button className="text-[12px] text-[var(--primary)] hover:underline">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}
