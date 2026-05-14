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
    <nav className="app-bottom-nav pointer-events-none fixed z-30 mx-auto max-w-[398px] md:absolute md:left-4 md:right-4">
      <div className="pointer-events-auto flex min-h-[66px] items-center justify-around rounded-[28px] border border-white/[0.10] bg-[#080b12]/90 px-2.5 py-2 shadow-[0_-10px_34px_rgba(0,0,0,0.42)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#080b12]/78">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAdd) {
            return (
              <button
                key={item.id}
                aria-label="Nuevo gasto"
                className="-mt-4 flex size-[56px] items-center justify-center rounded-full bg-[#2A5BFF] text-white shadow-[0_8px_24px_rgba(42,91,255,0.45)]"
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={22} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              className="flex min-w-[58px] flex-col items-center gap-1.5 py-1 text-[10px]"
              style={{ color: active === item.id ? FT.text : FT.textFade }}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={22} strokeWidth={1.7} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
