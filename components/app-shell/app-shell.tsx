import type { AppScreen } from "@/features/navigation/types";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";

export function AppShell({
  active,
  onNavigate,
  hideNavigation = false,
  children,
}: {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  hideNavigation?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="app-viewport bg-[#04060a] text-[#eef2f8]">
      <div className="app-viewport relative mx-auto flex w-full max-w-[430px] flex-col bg-[#06080c] shadow-2xl md:my-8 md:min-h-[844px] md:overflow-hidden md:rounded-[42px] md:border md:border-white/10">
        <div className="app-screen relative flex flex-1 flex-col overflow-hidden md:min-h-[844px]">{children}</div>
        {hideNavigation ? null : <BottomTabBar active={active} onNavigate={onNavigate} />}
      </div>
    </main>
  );
}
