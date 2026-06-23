"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "@/types";
import { mockNotifications } from "@/lib/mock-data";

interface NotificationsState {
  notifications: Notification[];
  markAllRead: () => void;
  clearAll: () => void;
  clearNotif: (id: string) => void;
  addNotification: (notif: Omit<Notification, "id" | "createdAt" | "updatedAt">) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: mockNotifications,
      
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
      })),
      
      clearAll: () => set({ notifications: [] }),
      
      clearNotif: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),
      
      addNotification: (notif) => set((state) => ({
        notifications: [
          {
            ...notif,
            id: `notif_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Notification,
          ...state.notifications
        ]
      }))
    }),
    {
      name: "startupos-notifications-store",
    }
  )
);
