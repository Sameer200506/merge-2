"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Payment, PaymentStatus } from "@/types";
import { mockPayments } from "@/lib/mock-data";

// Default hourly rates per employee (USD)
const DEFAULT_RATES: Record<string, number> = {
  user_2: 55, // Sarah Chen - Sales Manager
  user_3: 45, // James Park - Project Manager
  user_4: 35, // Priya Sharma - Team Member
  user_5: 40, // Mike Torres - Team Member
};

interface PaymentsState {
  payments: Payment[];
  employeeRates: Record<string, number>;
  processingIds: string[];
  setHourlyRate: (userId: string, rate: number) => void;
  initiatePayment: (payment: Omit<Payment, "id" | "status" | "initiatedAt">) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, extra?: Partial<Payment>) => void;
  addPayment: (payment: Payment) => void;
}

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    (set) => ({
      payments: mockPayments,
      employeeRates: DEFAULT_RATES,
      processingIds: [],

      setHourlyRate: (userId, rate) =>
        set((state) => ({
          employeeRates: { ...state.employeeRates, [userId]: rate },
        })),

      initiatePayment: async (paymentData) => {
        const newPayment: Payment = {
          ...paymentData,
          id: "pay_" + Date.now(),
          status: "initiated",
          initiatedAt: new Date().toISOString(),
        };

        set((state) => ({
          payments: [newPayment, ...state.payments],
          processingIds: [...state.processingIds, newPayment.id],
        }));

        await new Promise((resolve) => setTimeout(resolve, 2000));

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === newPayment.id ? { ...p, status: "processing" } : p
          ),
        }));

        await new Promise((resolve) => setTimeout(resolve, 2500));

        const mockTransactionId = "PAYID-MOCK-" + Math.random().toString(36).substr(2, 8).toUpperCase();

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === newPayment.id
              ? { ...p, status: "paid", paidAt: new Date().toISOString(), transactionId: mockTransactionId }
              : p
          ),
          processingIds: state.processingIds.filter((id) => id !== newPayment.id),
        }));
      },

      updatePaymentStatus: (paymentId, status, extra = {}) =>
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId ? { ...p, status, ...extra } : p
          ),
        })),

      addPayment: (payment) =>
        set((state) => ({ payments: [payment, ...state.payments] })),
    }),
    {
      name: "startupos-payments-store",
      partialize: (state) => ({
        payments: state.payments,
        employeeRates: state.employeeRates,
      }),
    }
  )
);