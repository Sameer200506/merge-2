"use client";

import { useState } from "react";
import { Camera, Save, CreditCard } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { user, updatePaypalEmail } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [paypalEmail, setPaypalEmail] = useState(user?.paypalEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Profile updated successfully");
  };

  const handleSavePaypal = async () => {
    if (!paypalEmail.trim()) {
      toast.error("Please enter a valid PayPal email address");
      return;
    }
    setSavingPaypal(true);
    await new Promise((r) => setTimeout(r, 800));
    updatePaypalEmail(paypalEmail.trim());
    setSavingPaypal(false);
    toast.success("PayPal email saved successfully");
  };

  return (
    <div className="space-y-4">
      {/* Avatar section */}
      <div className="sos-card p-5">
        <h2 className="text-[14px] font-semibold text-[var(--foreground)] mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-[20px] font-bold text-white">
              {user ? getInitials(user.displayName) : "U"}
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-md hover:bg-[var(--primary-hover)] transition-colors">
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[var(--foreground)]">{user?.displayName}</p>
            <p className="text-[12px] text-[var(--foreground-muted)] capitalize">{user?.role.replace("_", " ")}</p>
            <button className="mt-1 text-[12px] text-[var(--primary)] hover:underline">
              Upload new photo
            </button>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="sos-card p-5">
        <h2 className="text-[14px] font-semibold text-[var(--foreground)] mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="sos-input"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="sos-input"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Role</label>
            <input
              value={user?.role.replace("_", " ") ?? ""}
              readOnly
              className="sos-input opacity-60 cursor-not-allowed capitalize"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Organization</label>
            <input
              value="Acme Corp"
              readOnly
              className="sos-input opacity-60 cursor-not-allowed"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="sos-btn sos-btn-primary"
          >
            <Save size={13} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="sos-card p-5">
        <h2 className="text-[14px] font-semibold text-[var(--foreground)] mb-4">Change Password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Current Password</label>
            <input type="password" placeholder="••••••••" className="sos-input" />
          </div>
          <div />
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">New Password</label>
            <input type="password" placeholder="••••••••" className="sos-input" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="sos-input" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="sos-btn sos-btn-outline">Update Password</button>
        </div>
      </div>

      {/* PayPal Payment Settings */}
      <div className="sos-card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003087 0%, #009cde 100%)" }}>
            <CreditCard size={13} className="text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Payment Settings</h2>
            <p className="text-[11px] text-[var(--foreground-muted)]">Your PayPal email is used to receive payments from the owner</p>
          </div>
        </div>

        {user?.paypalEmail && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0, 156, 222, 0.08)", border: "1px solid rgba(0, 156, 222, 0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] text-[var(--foreground-muted)]">
              Current PayPal email: <strong className="text-[var(--foreground)]">{user.paypalEmail}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">PayPal Email Address</label>
            <input
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              type="email"
              placeholder="your-email@paypal.com"
              className="sos-input"
            />
            <p className="text-[11px] text-[var(--foreground-muted)] mt-1.5">
              Payments from your employer will be sent to this email via PayPal.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSavePaypal}
            disabled={savingPaypal}
            className="sos-btn sos-btn-primary"
          >
            <Save size={13} />
            {savingPaypal ? "Saving..." : "Save PayPal Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
