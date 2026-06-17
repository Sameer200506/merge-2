"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Shift } from "@/types";

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
];

interface ShiftsState {
  activeShifts: Shift[];
  shifts: Shift[];
  // Actions
  clockIn: (userId: string) => void;
  clockOut: (userId: string) => void;
  tick: () => void;
  clearHistory: () => void;
}

export const useShiftsStore = create<ShiftsState>()(
  persist(
    (set) => ({
      activeShifts: [],
      shifts: INITIAL_MOCK_SHIFTS,

      clockIn: (userId: string) => {
        set((state) => {
          // Prevent double clock-in
          if (state.activeShifts.some((s) => s.userId === userId)) return {};
          
          const newShift: Shift = {
            id: `shift_${Date.now()}`,
            userId,
            startTime: new Date().toISOString(),
            durationSeconds: 0,
            isCompleted: false,
          };
          return {
            activeShifts: [...state.activeShifts, newShift],
          };
        });
      },

      clockOut: (userId: string) => {
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
          activeShifts: state.activeShifts.map((s) => ({
            ...s,
            durationSeconds: s.durationSeconds + 1,
          })),
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
