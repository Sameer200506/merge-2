"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewMode, ThemeMode } from "@/types";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  // Command palette
  commandOpen: boolean;
  // Theme
  theme: ThemeMode;
  // Notifications panel
  notificationsPanelOpen: boolean;
  // Active view modes per module
  workflowView: ViewMode;
  tasksView: ViewMode;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setWorkflowView: (view: ViewMode) => void;
  setTasksView: (view: ViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      sidebarCollapsed: true,
      commandOpen: false,
      theme: "dark",
      notificationsPanelOpen: false,
      workflowView: "kanban",
      tasksView: "list",

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCommandOpen: (open) => set({ commandOpen: open }),

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
      },
      setTheme: (theme) => set({ theme }),

      setNotificationsPanelOpen: (open) => set({ notificationsPanelOpen: open }),
      setWorkflowView: (view) => set({ workflowView: view }),
      setTasksView: (view) => set({ tasksView: view }),
    }),
    {
      name: "startupos-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        workflowView: state.workflowView,
        tasksView: state.tasksView,
      }),
    }
  )
);
