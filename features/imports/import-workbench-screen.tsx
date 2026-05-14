"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowLeft, Check, FileText, ImageUp, ListChecks, ScanText, X } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import {
  createImportBatchAction,
  confirmImportBatchAction,
  updateImportItemAction,
  getImportBatchesAction,
  type ImportActionState,
} from "./actions";

type ImportTab = "capture" | "review" | "pdf" | "analysis" | "rules";

const tabs: { id: ImportTab; label: string }[] = [
  { id: "capture", label: "Captura" },
  { id: "review", label: "OCR" },
  { id: "pdf", label: "PDF" },
  { id: "analysis", label: "Análisis" },
  { id: "rules", label: "Reglas" },
];

const INITIAL_STATE: ImportActionState = { ok: false, message: "" };

export function ImportWorkbenchScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [tab, setTab] = useState<ImportTab>("capture");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-[18px] overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Importar</div>
        <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#161b25] text-[#a4adbe]">
          <ScanText size={17} />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="h-9 rounded-xl border text-[11px] font-medium"
            style={{
              background: tab === item.id ? FT.accentSoft : "rgba(255,255,255,0.04)",
              borderColor: tab === item.id ? "rgba(42,91,255,0.45)" : "rgba(255,255,255,0.08)",
              color: tab === item.id ? FT.accent : FT.textDim,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "capture" && (
        <CapturePanel
          data={data}
          source="screenshot"
          onBatchCreated={(id) => { setActiveBatchId(id); setTab("review"); }}
        />
      )}

      {tab === "review" && (
        <ReviewPanel data={data} batchId={activeBatchId} />
      )}

      {tab === "pdf" && (
        <CapturePanel
          data={data}
          source="pdf"
          onBatchCreated={(id) => { setActiveBatchId(id); setTab("review"); }}
        />
      )}

      {tab === "analysis" && <AnalysisPanel />}

      {tab === "rules" && <RulesPanel data={data} />}
    </div>
  );
}

// ─── CapturePanel ─────────────────────────────────────────────────────────────

function CapturePanel({
  data,
  source,
  onBatchCreated,
}: {
  data: FinanceSnapshot;
  source: "screenshot" | "pdf";
  onBatchCreated: (batchId: string) => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: ImportActionState, formData: FormData) => {
      const result = await createImportBatchAction(prev, formData);
      if (result.ok && result.batchId) onBatchCreated(result.batchId);
      return result;
    },
    INITIAL_STATE,
  );

  const allAccounts = data.expenseForm.accounts.map((a) => ({ id: a.id, name: a.label }));

  const icon = source === "screenshot" ? <ImageUp size={18} /> : <FileText size={18} />;
  const title = source === "screenshot" ? "Importación por captura" : "Importación por PDF";
  const body =
    source === "screenshot"
      ? "Pega el texto copiado de tu app bancaria. Se detectarán fechas, comercios y montos automáticamente."
      : "Pega el texto extraído de tu estado de cuenta PDF para comparar movimientos contra los ya registrados.";

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-2xl bg-[#2A5BFF1f] text-[#2A5BFF]">{icon}</div>
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">{body}</p>
        </div>
      </div>

      <form action={action} className="grid gap-3">
        <input type="hidden" name="source" value={source} />

        <select
          name="accountId"
          required
          className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 text-[13px] text-white"
        >
          <option value="">Cuenta o tarjeta destino…</option>
          {allAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <textarea
          name="rawText"
          required
          rows={6}
          placeholder={"Pega aquí el texto del movimiento:\n05/05/2026  OXXO CONVENIENCE  $89.50\n06/05/2026  UBER TRIP  $128.40"}
          className="w-full resize-none rounded-2xl border border-white/[0.08] bg-[#10141d] p-3 text-[13px] text-white placeholder:text-[#6a7384]"
        />

        {state.message && (
          <p className={`text-[12px] ${state.ok ? "text-green-400" : "text-red-400"}`}>
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Procesando…" : "Preparar revisión"}
        </Button>
      </form>
    </Card>
  );
}

// ─── ReviewPanel ──────────────────────────────────────────────────────────────

function ReviewPanel({ data, batchId }: { data: FinanceSnapshot; batchId: string | null }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmImportBatchAction,
    INITIAL_STATE,
  );

  // Load items when batchId arrives
  if (batchId && !loaded && !isPending) {
    startTransition(async () => {
      const batches = await getImportBatchesAction();
      const batch = batches.find((b) => b.id === batchId);
      if (batch) {
        setItems(
          batch.items.map((item) => ({
            id: item.id,
            merchant: item.detectedMerchant ?? "",
            amountCents: item.detectedAmountCents ?? 0,
            date: item.detectedDate?.toISOString().slice(0, 10) ?? "",
            categoryId: item.suggestedCategoryId ?? "",
            status: item.status,
          })),
        );
      }
      setLoaded(true);
    });
  }

  async function toggleItem(itemId: string, current: ReviewItem["status"]) {
    const next = current === "confirmed" ? "pending" : "confirmed";
    await updateImportItemAction(itemId, { status: next });
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: next } : i)));
  }

  async function ignoreItem(itemId: string) {
    await updateImportItemAction(itemId, { status: "ignored" });
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "ignored" } : i)));
  }

  const categories = data.expenseForm.categories;

  if (!batchId) {
    return (
      <Card className="p-4">
        <SectionHeader title="Revisión de OCR" />
        <p className="text-[13px] text-[#6a7384]">
          Crea un lote desde la pestaña Captura o PDF para revisar los movimientos detectados.
        </p>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Card className="p-4">
        <p className="text-[13px] text-[#a4adbe]">Cargando movimientos…</p>
      </Card>
    );
  }

  const visibleItems = items.filter((i) => i.status !== "ignored");
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;

  return (
    <Card className="p-4">
      <SectionHeader title="Revisión de OCR" />

      {visibleItems.length === 0 ? (
        <p className="text-[13px] text-[#6a7384]">No se detectaron movimientos en este lote.</p>
      ) : (
        <div className="grid gap-2">
          {visibleItems.map((item) => (
            <ReviewItemRow
              key={item.id}
              item={item}
              categories={categories}
              onToggle={() => toggleItem(item.id, item.status)}
              onIgnore={() => ignoreItem(item.id)}
              onCategoryChange={(catId) => {
                updateImportItemAction(item.id, { suggestedCategoryId: catId });
                setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, categoryId: catId } : i)));
              }}
            />
          ))}
        </div>
      )}

      {confirmedCount > 0 && (
        <form action={confirmAction} className="mt-3 grid gap-2">
          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="accountId" value={data.expenseForm.accounts[0]?.id ?? ""} />
          {confirmState.message && (
            <p className={`text-[12px] ${confirmState.ok ? "text-green-400" : "text-red-400"}`}>
              {confirmState.message}
            </p>
          )}
          <Button type="submit" disabled={confirming} className="w-full">
            {confirming ? "Importando…" : `Importar ${confirmedCount} movimiento${confirmedCount !== 1 ? "s" : ""}`}
          </Button>
        </form>
      )}
    </Card>
  );
}

// ─── ReviewItemRow ────────────────────────────────────────────────────────────

type ReviewItem = {
  id: string;
  merchant: string;
  amountCents: number;
  date: string;
  categoryId: string;
  status: "pending" | "confirmed" | "ignored" | "duplicate";
};

function ReviewItemRow({
  item,
  categories,
  onToggle,
  onIgnore,
  onCategoryChange,
}: {
  item: ReviewItem;
  categories: { id: string; label: string }[];
  onToggle: () => void;
  onIgnore: () => void;
  onCategoryChange: (catId: string) => void;
}) {
  const isConfirmed = item.status === "confirmed";

  return (
    <div
      className="rounded-2xl border p-3.5"
      style={{
        borderColor: isConfirmed ? "rgba(42,91,255,0.4)" : "rgba(255,255,255,0.08)",
        background: isConfirmed ? "rgba(42,91,255,0.06)" : "#10141d",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate">{item.merchant || "Sin comercio"}</div>
          <div className="mt-0.5 text-[11px] text-[#6a7384]">{item.date || "Sin fecha"}</div>
        </div>
        <div className="font-mono text-[13px] shrink-0">
          {item.amountCents > 0 ? money(item.amountCents / 100) : "—"}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="grid size-7 place-items-center rounded-full border text-[11px]"
            style={{
              background: isConfirmed ? FT.accent : "transparent",
              borderColor: isConfirmed ? FT.accent : "rgba(255,255,255,0.15)",
              color: isConfirmed ? "#fff" : FT.textMute,
            }}
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={onIgnore}
            className="grid size-7 place-items-center rounded-full border border-white/10 text-[#6a7384]"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <select
          value={item.categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#161b25] px-2.5 py-1.5 text-[12px] text-white"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      )}

      {item.status === "duplicate" && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-yellow-400">
          <ListChecks size={11} />
          Posible duplicado detectado
        </div>
      )}
    </div>
  );
}

// ─── AnalysisPanel ────────────────────────────────────────────────────────────

function AnalysisPanel() {
  return (
    <Card className="p-4">
      <SectionHeader title="Análisis mensual" />
      <div className="grid gap-2">
        {[
          "Variación contra mes anterior",
          "Categorías que subieron",
          "Pagos duplicados o faltantes",
          "Impacto en ahorro",
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3 text-[13px] text-[#a4adbe]"
          >
            {item}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[#6a7384]">
        Importa un estado de cuenta PDF para generar el análisis automáticamente.
      </p>
    </Card>
  );
}

// ─── RulesPanel ───────────────────────────────────────────────────────────────

function RulesPanel({ data }: { data: FinanceSnapshot }) {
  const categories = data.expenseForm.categories;
  const find = (name: string) =>
    categories.find((c) => c.label.toLowerCase().includes(name))?.label ?? categories[0]?.label ?? "Sin categoría";

  const rules = [
    { match: "UBER, DIDI", normalized: "Movilidad", category: find("transporte") },
    { match: "AMAZON, MERCADO", normalized: "Compras online", category: find("libre") },
    { match: "OXXO, BAMA", normalized: "Conveniencia", category: find("comida") },
    { match: "NETFLIX, OPENAI", normalized: "Suscripciones", category: find("tools") },
  ];

  return (
    <Card className="p-4">
      <SectionHeader title="Reglas de comercio" />
      <div className="grid gap-2">
        {rules.map((rule) => (
          <div
            key={rule.match}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3"
          >
            <div>
              <div className="text-[13px] font-semibold">{rule.match}</div>
              <div className="mt-0.5 text-[11px] text-[#6a7384]">Normalizar como {rule.normalized}</div>
            </div>
            <div className="text-[12px] text-[#2A5BFF]">{rule.category}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-[#6a7384]">
        Las reglas se aplican automáticamente al importar movimientos nuevos.
      </p>
    </Card>
  );
}
