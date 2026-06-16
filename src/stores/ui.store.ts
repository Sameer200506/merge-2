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
  pipelineView: ViewMode;
  tasksView: ViewMode;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  setPipelineView: (view: ViewMode) => void;
  setTasksView: (view: ViewMode) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: true,
      commandOpen: false,
      theme: "dark",
      notificationsPanelOpen: false,
      pipelineView: "kanban",
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
      setPipelineView: (view) => set({ pipelineView: view }),
      setTasksView: (view) => set({ tasksView: view }),
    }),
    {
      name: "startupos-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        pipelineView: state.pipelineView,
        tasksView: state.tasksView,
      }),
    }
  )
);
