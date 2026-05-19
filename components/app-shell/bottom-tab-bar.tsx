import { CreditCard, Home, PiggyBank, Plus, WalletCards } from "lucide-react";
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
    { id: "goal" as const, label: "Meta", icon: PiggyBank },
  ];

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] bg-gradient-to-t from-[#06080c] via-[#06080c]/92 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-7 md:absolute md:px-5">
      <div className="pointer-events-auto grid min-h-[76px] grid-cols-5 items-center rounded-[30px] border border-white/[0.10] bg-[#080b12]/94 px-2 py-2 shadow-[0_-12px_38px_rgba(0,0,0,0.48)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#080b12]/82">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAdd) {
            return (
              <button
                key={item.id}
                type="button"
                aria-label="Nuevo gasto"
                className="mx-auto -mt-9 flex size-[58px] items-center justify-center rounded-full bg-[#2A5BFF] text-white shadow-[0_10px_28px_rgba(42,91,255,0.50),inset_0_1px_0_rgba(255,255,255,0.24)]"
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={24} />
              </button>
            );
          }

          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="mx-auto flex h-[58px] w-[58px] flex-col items-center justify-center gap-1 rounded-[16px] text-[10px] transition-colors"
              style={{
                color: isActive ? FT.text : FT.textFade,
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.13)" : "none",
              }}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={21} strokeWidth={isActive ? 2 : 1.6} />
              <span className={`leading-none ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
