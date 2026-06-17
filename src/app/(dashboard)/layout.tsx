import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { ChatDrawer } from "@/components/shared/chat-drawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
      <ChatDrawer />
    </div>
  );
}
