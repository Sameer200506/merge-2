"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { mockUsers } from "@/lib/mock-data";
import { cn, getInitials } from "@/lib/utils";
import { Zap, Mail, Lock, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email.");
      return;
    }

    setErrorMsg(null);
    try {
      await login(email, password);
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      toast.error("Failed to sign in.");
    }
  };

  const selectMockUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password123");
    setErrorMsg(null);
  };

  // We filter out super_owners or duplicate roles to show one clean profile per role
  const quickProfiles = mockUsers.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] select-none text-[var(--foreground)]">
      <div className="w-full max-w-[420px] bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight">StartupOS</h1>
            <p className="text-[12.5px] text-slate-400 mt-1">Sign in to your employee portal</p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[12px] leading-relaxed">
            <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11.5px] font-medium text-slate-400">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.io"
                className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-[#6366f1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white focus:outline-none transition-all placeholder:text-slate-600"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11.5px] font-medium text-slate-400">Password</label>
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/40 border border-slate-800 hover:border-slate-700 focus:border-[#6366f1] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-white focus:outline-none transition-all placeholder:text-slate-600"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:opacity-95 transition-opacity py-2.5 rounded-xl font-semibold text-[13px] text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80" />
          </div>
          <span className="relative px-3 bg-[#0f172a] text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick demo logins
          </span>
        </div>

        {/* Quick Profiles Switcher */}
        <div className="grid grid-cols-2 gap-2">
          {quickProfiles.map((p) => {
            const isSelected = email.toLowerCase() === p.email.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectMockUser(p.email)}
                className={cn(
                  "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer bg-slate-950/20",
                  isSelected
                    ? "border-[#6366f1] bg-slate-950/40 shadow-sm"
                    : "border-slate-800/60 hover:border-slate-800 hover:bg-slate-950/30"
                )}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-900/60 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">
                  {getInitials(p.displayName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-white truncate leading-snug">
                    {p.displayName.split(" ")[0]}
                  </p>
                  <p className="text-[9.5px] text-slate-500 truncate capitalize leading-tight">
                    {p.role.replace("_", " ")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
