"use client";

import { CheckCircle, AlertCircle, Wallet, Clock, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { usePaymentsStore } from "@/stores/payments.store";
import type { PaymentStatus } from "@/types";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  pending:    { label: "Pending",    color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20",   dot: "bg-amber-500",               icon: AlertCircle },
  initiated:  { label: "Initiated",  color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20",     dot: "bg-blue-500",                icon: RefreshCw },
  processing: { label: "Processing", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500 animate-pulse", icon: RefreshCw },
  paid:       { label: "Paid",       color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20",   dot: "bg-green-500",               icon: CheckCircle },
  failed:     { label: "Failed",     color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20",       dot: "bg-red-500",                 icon: AlertCircle },
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold " + cfg.bg + " " + cfg.color}>
      <span className={"w-1.5 h-1.5 rounded-full " + cfg.dot} />
      {cfg.label}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return s + " - " + e;
}

export default function PaymentStatusPage() {
  const { user } = useAuthStore();
  const { payments } = usePaymentsStore();

  const myPayments = user
    ? payments
        .filter((p) => p.employeeId === user.id)
        .sort((a, b) => new Date(b.initiatedAt ?? b.periodStart).getTime() - new Date(a.initiatedAt ?? a.periodStart).getTime())
    : [];

  const totalEarned = myPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = myPayments.filter((p) => ["pending","initiated","processing"].includes(p.status)).reduce((s, p) => s + p.totalAmount, 0);
  const totalHours = myPayments.reduce((s, p) => s + p.totalHours, 0);
  const latestPayment = myPayments[0];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Wallet size={20} className="text-[var(--primary)]" />
            My Payments
          </h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">Track your payment history and status from your employer</p>
        </div>
      </div>

      {user && (
        <div className="sos-card p-4 flex items-center gap-3" style={user.paypalEmail ? { borderLeft: "3px solid #22c55e" } : { borderLeft: "3px solid #f59e0b" }}>
          <div className={"w-8 h-8 rounded-full flex items-center justify-center " + (user.paypalEmail ? "bg-green-500/10" : "bg-amber-500/10")}>
            {user.paypalEmail ? <CheckCircle size={15} className="text-green-500" /> : <AlertCircle size={15} className="text-amber-500" />}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[var(--foreground)]">{user.paypalEmail ? "PayPal Connected" : "PayPal Email Not Set"}</p>
            <p className="text-[12px] text-[var(--foreground-muted)]">{user.paypalEmail ? "Payments will be sent to: " + user.paypalEmail : "Go to Settings > Profile to add your PayPal email so you can receive payments"}</p>
          </div>
          {!user.paypalEmail && <a href="/settings/profile" className="sos-btn sos-btn-outline text-[12px] py-1.5">Set PayPal Email</a>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Total Earned</span>
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle size={13} className="text-green-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{formatCurrency(totalEarned)}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{myPayments.filter((p) => p.status === "paid").length} payments received</p>
        </div>
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Pending / In Flight</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertCircle size={13} className="text-amber-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{myPayments.filter((p) => p.status !== "paid" && p.status !== "failed").length} in progress</p>
        </div>
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Total Hours Logged</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><Clock size={13} className="text-blue-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{totalHours.toFixed(1)}h</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">Across all payment periods</p>
        </div>
      </div>

      {latestPayment && (
        <div className="sos-card p-5" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)", color: "#fff" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70 mb-2">Most Recent Payment</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[26px] font-bold">{formatCurrency(latestPayment.totalAmount)}</p>
              <p className="text-[13px] opacity-80 mt-0.5">{formatPeriod(latestPayment.periodStart, latestPayment.periodEnd)} | {latestPayment.totalHours.toFixed(1)}h @ /hr</p>
            </div>
            <StatusBadge status={latestPayment.status} />
          </div>
          {latestPayment.transactionId && <p className="text-[11px] font-mono opacity-70 mt-3">Transaction: {latestPayment.transactionId}</p>}
        </div>
      )}

      <div className="sos-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Payment History</h2>
          <p className="text-[12px] text-[var(--foreground-muted)] mt-0.5">All payments initiated by your employer</p>
        </div>
        {myPayments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--background-subtle)] flex items-center justify-center mx-auto mb-3"><Wallet size={20} className="text-[var(--foreground-muted)]" /></div>
            <p className="text-[14px] font-semibold text-[var(--foreground)]">No payments yet</p>
            <p className="text-[13px] text-[var(--foreground-muted)] mt-1">Payments initiated by your employer will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--background-subtle)" }}>
                  {["Pay Period","Hours","Rate","Amount","Status","Initiated","Paid At","Transaction ID"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {myPayments.map((pay) => {
                  const cfg = STATUS_CONFIG[pay.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={pay.id} className="hover:bg-[var(--background-subtle)] transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-[var(--foreground)]">{formatPeriod(pay.periodStart, pay.periodEnd)}</span>
                        {pay.note && <p className="text-[11px] text-[var(--foreground-muted)] mt-0.5">{pay.note}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-[var(--foreground-muted)]" />
                          <span className="text-[13px] text-[var(--foreground)]">{pay.totalHours.toFixed(1)}h</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[var(--foreground)]">/hr</td>
                      <td className="px-4 py-3.5"><span className="text-[13px] font-bold text-green-600">{formatCurrency(pay.totalAmount)}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Icon size={12} className={cfg.color + (pay.status === "processing" ? " animate-spin" : "")} />
                          <StatusBadge status={pay.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[12px] text-[var(--foreground-muted)]">{formatDate(pay.initiatedAt)}</td>
                      <td className="px-4 py-3.5 text-[12px] text-[var(--foreground-muted)]">{formatDate(pay.paidAt)}</td>
                      <td className="px-4 py-3.5">
                        {pay.transactionId ? (
                          <span className="text-[11px] font-mono text-[var(--primary)] bg-[var(--background-subtle)] px-2 py-0.5 rounded">{pay.transactionId}</span>
                        ) : (
                          <span className="text-[12px] text-[var(--foreground-muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}