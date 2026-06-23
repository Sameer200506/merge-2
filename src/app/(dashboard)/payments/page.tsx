"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  Send,
  Wallet,
  TrendingUp,
  Users,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useShiftsStore } from "@/stores/shifts.store";
import { usePaymentsStore } from "@/stores/payments.store";
import { mockUsers } from "@/lib/mock-data";
import type { Payment, PaymentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "overview" | "history";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: "Pending",    color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20",   dot: "bg-amber-500" },
  initiated:  { label: "Initiated",  color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20",     dot: "bg-blue-500" },
  processing: { label: "Processing", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500 animate-pulse" },
  paid:       { label: "Paid",       color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20",   dot: "bg-green-500" },
  failed:     { label: "Failed",     color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/20",       dot: "bg-red-500" },
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

function useUserHours() {
  const { shifts } = useShiftsStore();
  const hours: Record<string, number> = {};
  shifts.forEach((s) => {
    if (s.isCompleted) {
      hours[s.userId] = (hours[s.userId] || 0) + s.durationSeconds / 3600;
    }
  });
  return hours;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { employeeRates, setHourlyRate, initiatePayment, payments, processingIds } = usePaymentsStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState<string>("");
  const [initiatingFor, setInitiatingFor] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<PaymentStatus | "all">("all");
  const userHours = useUserHours();

  useEffect(() => {
    if (user && user.role !== "owner") {
      router.replace("/payments/status");
    }
  }, [user, router]);

  if (!user || user.role !== "owner") return null;

  const employees = mockUsers.filter((u) => u.id !== user.id && u.role !== "client");

  const handleApproveAndPay = async (emp: (typeof employees)[0]) => {
    const rate = employeeRates[emp.id] ?? 0;
    const hours = parseFloat((userHours[emp.id] || 0).toFixed(2));
    const total = parseFloat((rate * hours).toFixed(2));
    if (!emp.paypalEmail) { toast.error(emp.displayName + " has not set a PayPal email yet."); return; }
    if (hours === 0) { toast.error(emp.displayName + " has no logged hours this period."); return; }
    if (rate === 0) { toast.error("Please set an hourly rate for " + emp.displayName + " first."); return; }
    setInitiatingFor(emp.id);
    toast.loading("Initiating PayPal payment to " + emp.displayName + "...", { id: "pay-" + emp.id });
    try {
      await initiatePayment({
        employeeId: emp.id, employeeName: emp.displayName, employeeRole: emp.role,
        paypalEmail: emp.paypalEmail,
        periodStart: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        periodEnd: new Date().toISOString(),
        totalHours: hours, hourlyRate: rate, totalAmount: total,
        note: "Payment for " + emp.displayName + " - " + hours + "h @ $" + rate + "/hr",
      });
      toast.success("Payment of " + formatCurrency(total) + " sent to " + emp.displayName + "!", { id: "pay-" + emp.id });
    } catch { toast.error("Payment failed. Please try again.", { id: "pay-" + emp.id }); }
    finally { setInitiatingFor(null); }
  };

  const filteredHistory = historyFilter === "all" ? payments : payments.filter((p) => p.status === historyFilter);
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.totalAmount, 0);
  const totalInitiated = payments.filter((p) => p.status === "initiated" || p.status === "processing").reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Wallet size={20} className="text-[var(--primary)]" />
            Payments
          </h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">Manage employee payroll and send payments via PayPal</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium" style={{ background: "rgba(0,156,222,0.1)", color: "#009cde" }}>
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Demo Mode - PayPal API not connected
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Total Paid</span>
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle size={13} className="text-green-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{payments.filter((p) => p.status === "paid").length} payments completed</p>
        </div>
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center"><RefreshCw size={13} className="text-blue-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{formatCurrency(totalInitiated)}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{payments.filter((p) => p.status === "initiated" || p.status === "processing").length} payments in flight</p>
        </div>
        <div className="sos-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Pending Approval</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertCircle size={13} className="text-amber-500" /></div>
          </div>
          <p className="text-[22px] font-bold text-[var(--foreground)]">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-[var(--foreground-muted)] mt-1">{payments.filter((p) => p.status === "pending").length} awaiting approval</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--background-subtle)" }}>
        {(["overview", "history"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-1.5 rounded-md text-[13px] font-medium transition-all capitalize " + (tab === t ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}>
            {t === "overview" ? "Employee Overview" : "Payment History"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="sos-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
            <Users size={15} className="text-[var(--foreground-muted)]" />
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Employee Payroll</h2>
            <span className="ml-auto text-[12px] text-[var(--foreground-muted)]">{employees.length} employees</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--background-subtle)" }}>
                  {["Employee","Role","Hours Logged","Hourly Rate","Total Owed","PayPal Email","Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {employees.map((emp) => {
                  const rate = employeeRates[emp.id] ?? 0;
                  const hours = parseFloat((userHours[emp.id] || 0).toFixed(2));
                  const total = parseFloat((rate * hours).toFixed(2));
                  const isProcessing = initiatingFor === emp.id || payments.some((p) => p.employeeId === emp.id && (p.status === "initiated" || p.status === "processing") && processingIds.includes(p.id));
                  return (
                    <tr key={emp.id} className="hover:bg-[var(--background-subtle)] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                            {emp.displayName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--foreground)]">{emp.displayName}</p>
                            <p className="text-[11px] text-[var(--foreground-muted)]">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[12px] text-[var(--foreground-muted)] capitalize">{emp.role.replace("_", " ")}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[var(--foreground-muted)]" />
                          <span className="text-[13px] font-medium text-[var(--foreground)]">{hours.toFixed(1)}h</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {editingRate === emp.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] text-[var(--foreground-muted)]">$</span>
                            <input type="number" value={rateInput} onChange={(e) => setRateInput(e.target.value)} className="sos-input w-20 py-1 text-[13px]" autoFocus min={0} />
                            <button onClick={() => { const p = parseFloat(rateInput); if (!isNaN(p) && p >= 0) { setHourlyRate(emp.id, p); toast.success("Rate updated to $" + p + "/hr for " + emp.displayName); } setEditingRate(null); }} className="text-[11px] font-semibold text-[var(--primary)] hover:underline">Save</button>
                            <button onClick={() => setEditingRate(null)} className="text-[11px] text-[var(--foreground-muted)] hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingRate(emp.id); setRateInput(String(rate)); }} className="flex items-center gap-1 group">
                            <span className="text-[13px] font-medium text-[var(--foreground)]">/hr</span>
                            <span className="text-[10px] text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity ml-1">Edit</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={"text-[13px] font-semibold " + (total > 0 ? "text-green-600" : "text-[var(--foreground-muted)]")}>{formatCurrency(total)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {emp.paypalEmail ? (
                          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[12px] text-[var(--foreground)]">{emp.paypalEmail}</span></div>
                        ) : (
                          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-[12px] text-[var(--foreground-muted)] italic">Not set</span></div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => handleApproveAndPay(emp)} disabled={isProcessing || !emp.paypalEmail || hours === 0}
                          className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all " + (isProcessing ? "opacity-50 cursor-not-allowed bg-[var(--background-subtle)] text-[var(--foreground-muted)]" : (!emp.paypalEmail || hours === 0) ? "opacity-40 cursor-not-allowed bg-[var(--background-subtle)] text-[var(--foreground-muted)]" : "gradient-primary text-white hover:opacity-90 active:scale-95 shadow-sm")}>
                          {isProcessing ? (<><RefreshCw size={11} className="animate-spin" />Sending...</>) : (<><Send size={11} />Approve &amp; Pay</>)}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="sos-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[var(--foreground-muted)]" />
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Payment History</h2>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {(["all","pending","initiated","processing","paid","failed"] as const).map((f) => (
                <button key={f} onClick={() => setHistoryFilter(f)}
                  className={"px-3 py-1 rounded-full text-[11px] font-semibold capitalize transition-all " + (historyFilter === f ? "gradient-primary text-white shadow-sm" : "bg-[var(--background-subtle)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}>
                  {f === "all" ? "All" : STATUS_CONFIG[f].label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--background-subtle)" }}>
                  {["Employee","Period","Hours","Rate","Amount","Status","Initiated","Paid At","Transaction"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredHistory.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-10 text-center text-[13px] text-[var(--foreground-muted)]">No payments found.</td></tr>
                ) : filteredHistory.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[var(--background-subtle)] transition-colors">
                    <td className="px-4 py-3.5"><p className="text-[13px] font-semibold text-[var(--foreground)]">{pay.employeeName}</p><p className="text-[11px] text-[var(--foreground-muted)]">{pay.paypalEmail}</p></td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--foreground)]">{formatPeriod(pay.periodStart, pay.periodEnd)}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[var(--foreground)]">{pay.totalHours.toFixed(1)}h</td>
                    <td className="px-4 py-3.5 text-[13px] text-[var(--foreground)]">/hr</td>
                    <td className="px-4 py-3.5"><span className="text-[13px] font-semibold text-green-600">{formatCurrency(pay.totalAmount)}</span></td>
                    <td className="px-4 py-3.5"><StatusBadge status={pay.status} /></td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--foreground-muted)]">{formatDate(pay.initiatedAt)}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[var(--foreground-muted)]">{formatDate(pay.paidAt)}</td>
                    <td className="px-4 py-3.5">{pay.transactionId ? <span className="text-[11px] font-mono text-[var(--primary)]">{pay.transactionId}</span> : <span className="text-[11px] text-[var(--foreground-muted)]">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}