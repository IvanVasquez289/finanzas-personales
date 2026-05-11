import type { AppScreen } from "@/features/navigation/types";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";

export function AppShell({
  active,
  onNavigate,
  children,
}: {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-[#04060a] text-[#eef2f8]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#06080c] shadow-2xl md:my-8 md:min-h-[844px] md:overflow-hidden md:rounded-[42px] md:border md:border-white/10">
        <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden md:min-h-[844px]">{children}</div>
        <BottomTabBar active={active} onNavigate={onNavigate} />
      </div>
    </main>
  );
}
