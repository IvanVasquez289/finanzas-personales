import { CreditCard, Home, Plus, Target, WalletCards } from "lucide-react";
import type { AppScreen } from "@/features/navigation/types";
import { FT } from "@/lib/finance-tokens";

export function BottomTabBar({
  active,
  onNavigate,
}: {
  active: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}) {
  const items = [
    { id: "home" as const, label: "Inicio", icon: Home },
    { id: "cards" as const, label: "Tarjetas", icon: CreditCard },
    { id: "add" as const, label: "", icon: Plus, isAdd: true },
    { id: "env" as const, label: "Sobres", icon: WalletCards },
    { id: "goal" as const, label: "Meta", icon: Target },
  ];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] px-3 pb-[max(8px,env(safe-area-inset-bottom))] md:px-4">
      <div className="pointer-events-auto flex min-h-[62px] items-center justify-around rounded-[26px] border border-white/[0.10] bg-[#080b12]/92 px-2.5 py-2 shadow-[0_-10px_34px_rgba(0,0,0,0.42)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#080b12]/80">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAdd) {
            return (
              <button
                key={item.id}
                type="button"
                aria-label="Nuevo gasto"
                className="-mt-5 flex size-[54px] items-center justify-center rounded-full bg-[#2A5BFF] text-white shadow-[0_8px_24px_rgba(42,91,255,0.45)]"
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={22} />
              </button>
            );
          }

          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="flex min-w-[54px] flex-col items-center gap-1 py-1 text-[10px] transition-colors"
              style={{ color: isActive ? FT.text : FT.textFade }}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={21} strokeWidth={isActive ? 2 : 1.6} />
              <span className={isActive ? "font-medium" : ""}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
