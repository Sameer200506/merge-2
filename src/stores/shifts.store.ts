"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Shift } from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";

const INITIAL_MOCK_SHIFTS: Shift[] = [
  {
    id: "shift_1",
    userId: "user_4", // Priya Sharma
    startTime: "2026-06-15T09:00:00.000Z",
    endTime: "2026-06-15T17:00:00.000Z",
    durationSeconds: 28800, // 8 hours
    isCompleted: true,
  },
  {
    id: "shift_2",
    userId: "user_4", // Priya Sharma
    startTime: "2026-06-16T09:00:00.000Z",
    endTime: "2026-06-16T17:30:00.000Z",
    durationSeconds: 30600, // 8.5 hours
    isCompleted: true,
  },
  {
    id: "shift_3",
    userId: "user_5", // Mike Torres
    startTime: "2026-06-16T08:30:00.000Z",
    endTime: "2026-06-16T16:30:00.000Z",
    durationSeconds: 28800, // 8 hours
    isCompleted: true,
  },
  {
    id: "shift_4",
    userId: "user_3", // James Park
    startTime: "2026-06-16T10:00:00.000Z",
    endTime: "2026-06-16T18:00:00.000Z",
    durationSeconds: 28800,
    isCompleted: true,
  },
  {
    id: "shift_5",
    userId: "user_1", // Alex Morgan
    startTime: "2026-06-14T09:00:00.000Z",
    endTime: "2026-06-14T17:00:00.000Z",
    durationSeconds: 28800, // 8 hours
    isCompleted: true,
  },
  {
    id: "shift_6",
    userId: "user_1", // Alex Morgan
    startTime: "2026-06-15T08:45:00.000Z",
    endTime: "2026-06-15T17:15:00.000Z",
    durationSeconds: 30600, // 8.5 hours
    isCompleted: true,
  },
  {
    id: "shift_7",
    userId: "user_1", // Alex Morgan
    startTime: "2026-06-16T09:15:00.000Z",
    endTime: "2026-06-16T18:00:00.000Z",
    durationSeconds: 31500, // 8.75 hours
    isCompleted: true,
  },
];

interface ShiftsState {
  activeShifts: Shift[];
  shifts: Shift[];
  // Actions
  clockIn: (userId: string) => void;
  clockOut: (userId: string) => void;
  setActiveShifts: (activeShifts: Shift[]) => void;
  setShifts: (shifts: Shift[]) => void;
  tick: () => void;
  clearHistory: () => void;
}

export const useShiftsStore = create<ShiftsState>()(
  persist(
    (set) => ({
      activeShifts: [],
      shifts: INITIAL_MOCK_SHIFTS,

      setActiveShifts: (activeShifts) => set({ activeShifts }),
      setShifts: (shifts) => set({ shifts }),

      clockIn: (userId) => {
        const newShift: Shift = {
          id: `shift_${Date.now()}`,
          userId,
          startTime: new Date().toISOString(),
          durationSeconds: 0,
          isCompleted: false,
        };

        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              // Doc ID matches userId to prevent double clock-in
              await setDoc(doc(db, "activeShifts", userId), newShift);
            } catch (e) {
              console.error("Firestore clockIn error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => {
          if (state.activeShifts.some((s) => s.userId === userId)) return {};
          return {
            activeShifts: [...state.activeShifts, newShift],
          };
        });
      },

      clockOut: (userId) => {
        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const active = useShiftsStore.getState().activeShifts.find((s) => s.userId === userId);
              if (!active) return;

              const completedShift: Shift = {
                ...active,
                endTime: new Date().toISOString(),
                isCompleted: true,
              };

              // Write completed shift log to shifts history
              await setDoc(doc(collection(db, "shifts")), completedShift);
              // Delete active shift record
              await deleteDoc(doc(db, "activeShifts", userId));
            } catch (e) {
              console.error("Firestore clockOut error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => {
          const active = state.activeShifts.find((s) => s.userId === userId);
          if (!active) return {};

          const completedShift: Shift = {
            ...active,
            endTime: new Date().toISOString(),
            isCompleted: true,
          };

          return {
            activeShifts: state.activeShifts.filter((s) => s.userId !== userId),
            shifts: [completedShift, ...state.shifts],
          };
        });
      },

      tick: () => {
        set((state) => ({
          activeShifts: state.activeShifts.map((s) => {
            // Re-calculate elapsed seconds using startTime for exact accuracy
            const elapsed = Math.floor(
              (Date.now() - new Date(s.startTime).getTime()) / 1000
            );
            return {
              ...s,
              durationSeconds: elapsed >= 0 ? elapsed : s.durationSeconds + 1,
            };
          }),
        }));
      },

      clearHistory: () => {
        set({ shifts: [] });
      },
    }),
    {
      name: "startupos-shifts-store",
    }
  )
);
