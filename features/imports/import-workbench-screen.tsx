"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ArrowLeft, Camera, Check, FileText, ImageUp, ListChecks, Loader2, ScanText, X } from "lucide-react";
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

type ImportTab = "capture" | "review" | "pdf" | "rules";

const tabs: { id: ImportTab; label: string }[] = [
  { id: "capture", label: "Captura" },
  { id: "review", label: "Revisar" },
  { id: "pdf", label: "PDF" },
  { id: "rules", label: "Reglas" },
];

const INITIAL_STATE: ImportActionState = { ok: false, message: "" };

export function ImportWorkbenchScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [tab, setTab] = useState<ImportTab>("capture");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeBatchAccountId, setActiveBatchAccountId] = useState<string | null>(null);

  function handleBatchCreated(id: string, accountId: string) {
    setActiveBatchId(id);
    setActiveBatchAccountId(accountId);
    setTab("review");
  }

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

      <div className="grid grid-cols-4 gap-1.5">
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
        <CapturePanel data={data} source="screenshot" onBatchCreated={handleBatchCreated} />
      )}

      {tab === "review" && (
        <ReviewPanel data={data} batchId={activeBatchId} accountId={activeBatchAccountId} />
      )}

      {tab === "pdf" && (
        <CapturePanel data={data} source="pdf" onBatchCreated={handleBatchCreated} />
      )}

      {tab === "rules" && <RulesPanel data={data} />}
    </div>
  );
}

// ─── CapturePanel ─────────────────────────────────────────────────────────────

type OcrStatus = "idle" | "loading" | "done" | "error";

function CapturePanel({
  data,
  source,
  onBatchCreated,
}: {
  data: FinanceSnapshot;
  source: "screenshot" | "pdf";
  onBatchCreated: (batchId: string, accountId: string) => void;
}) {
  const allAccounts = data.expenseForm.accounts.map((a) => ({ id: a.id, name: a.label }));
  const [selectedAccountId, setSelectedAccountId] = useState(allAccounts[0]?.id ?? "");

  const [state, action, pending] = useActionState(
    async (prev: ImportActionState, formData: FormData) => {
      const result = await createImportBatchAction(prev, formData);
      if (result.ok && result.batchId) onBatchCreated(result.batchId, selectedAccountId);
      return result;
    },
    INITIAL_STATE,
  );

  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrText, setOcrText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isScreenshot = source === "screenshot";
  const title = isScreenshot ? "Importar por captura" : "Importar por PDF";
  const body = isScreenshot
    ? "Sube una captura de tu app bancaria o pega el texto directamente. Se detectarán fechas, comercios y montos."
    : "Pega el texto extraído de tu estado de cuenta PDF para detectar y comparar movimientos.";

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrStatus("loading");
    setOcrText("");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["spa", "eng"]);
      const result = await worker.recognize(file);
      await worker.terminate();

      const extracted = result.data.text.trim();
      setOcrText(extracted);
      setOcrStatus("done");

      if (textareaRef.current) {
        textareaRef.current.value = extracted;
        textareaRef.current.focus();
      }
    } catch {
      setOcrStatus("error");
    }
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#2A5BFF1f] text-[#2A5BFF]">
          {isScreenshot ? <ImageUp size={18} /> : <FileText size={18} />}
        </div>
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">{body}</p>
        </div>
      </div>

      {/* Image OCR section (screenshot only) */}
      {isScreenshot && (
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />

          {previewUrl ? (
            <div className="relative mb-3 overflow-hidden rounded-2xl border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Captura seleccionada" className="max-h-48 w-full object-contain" />
              <button
                type="button"
                onClick={() => { setPreviewUrl(null); setOcrStatus("idle"); setOcrText(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-black/50 text-white"
              >
                <X size={12} />
              </button>
              {ocrStatus === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                  <Loader2 size={24} className="animate-spin text-white" />
                  <span className="text-[12px] text-white">Extrayendo texto…</span>
                </div>
              )}
              {ocrStatus === "done" && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-[#3DD68C]/90 px-2 py-1 text-[11px] font-medium text-black">
                  <Check size={11} />
                  Texto extraído
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-[13px] text-[#6a7384] transition-colors hover:border-[#2A5BFF]/40 hover:text-[#a4adbe]"
            >
              <Camera size={17} />
              Subir captura o foto
            </button>
          )}

          {ocrStatus === "error" && (
            <p className="mb-2 text-[12px] text-red-400">No se pudo leer la imagen. Pega el texto manualmente.</p>
          )}
        </div>
      )}

      <form action={action} className="grid gap-3">
        <input type="hidden" name="source" value={source} />

        <select
          name="accountId"
          required
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 text-[13px] text-white"
        >
          <option value="">Cuenta o tarjeta destino…</option>
          {allAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <div className="relative">
          <textarea
            ref={textareaRef}
            name="rawText"
            required
            rows={6}
            defaultValue={ocrText}
            key={ocrText}
            placeholder={"Texto de los movimientos:\n05/05/2026  OXXO CONVENIENCE  $89.50\n06/05/2026  UBER TRIP  $128.40"}
            className="w-full resize-none rounded-2xl border border-white/[0.08] bg-[#10141d] p-3 text-[13px] text-white placeholder:text-[#6a7384]"
          />
          {ocrStatus === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#10141d]/80">
              <Loader2 size={20} className="animate-spin text-[#a4adbe]" />
            </div>
          )}
        </div>

        {state.message && (
          <p className={`text-[12px] ${state.ok ? "text-green-400" : "text-red-400"}`}>
            {state.message}
          </p>
        )}

        <Button type="submit" disabled={pending || ocrStatus === "loading"} className="w-full">
          {pending ? "Procesando…" : "Preparar revisión"}
        </Button>
      </form>
    </Card>
  );
}

// ─── ReviewPanel ──────────────────────────────────────────────────────────────

function ReviewPanel({ data, batchId, accountId }: { data: FinanceSnapshot; batchId: string | null; accountId: string | null }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(
    confirmImportBatchAction,
    INITIAL_STATE,
  );

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
        <SectionHeader title="Revisión" />
        <p className="text-[13px] text-[#6a7384]">
          Importa una captura o PDF para revisar los movimientos detectados aquí.
        </p>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Card className="flex items-center justify-center gap-2 p-6">
        <Loader2 size={16} className="animate-spin text-[#a4adbe]" />
        <p className="text-[13px] text-[#a4adbe]">Cargando movimientos…</p>
      </Card>
    );
  }

  const visibleItems = items.filter((i) => i.status !== "ignored");
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-[#a4adbe]">
          {visibleItems.length} movimiento{visibleItems.length !== 1 ? "s" : ""} detectado{visibleItems.length !== 1 ? "s" : ""}
        </div>
        {confirmedCount > 0 && (
          <div className="text-[12px] font-semibold text-[#3DD68C]">{confirmedCount} seleccionado{confirmedCount !== 1 ? "s" : ""}</div>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-[13px] text-[#6a7384]">No se detectaron movimientos en este lote.</p>
        </Card>
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
        <form action={confirmAction} className="grid gap-2">
          <input type="hidden" name="batchId" value={batchId} />
          <input type="hidden" name="accountId" value={accountId ?? data.expenseForm.accounts[0]?.id ?? ""} />
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
    </div>
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
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{item.merchant || "Sin comercio"}</div>
          <div className="mt-0.5 text-[11px] text-[#6a7384]">{item.date || "Sin fecha"}</div>
        </div>
        <div className="shrink-0 font-mono text-[13px]">
          {item.amountCents > 0 ? money(item.amountCents / 100) : "—"}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
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

// ─── RulesPanel ───────────────────────────────────────────────────────────────

function RulesPanel({ data }: { data: FinanceSnapshot }) {
  const categories = data.expenseForm.categories;
  const find = (name: string) =>
    categories.find((c) => c.label.toLowerCase().includes(name))?.label ?? categories[0]?.label ?? "Sin categoría";

  const rules = [
    { match: "UBER, DLO*UBER, UBER RIDE", normalized: "Movilidad", category: find("transporte") },
    { match: "DIDI, DLO DIDI RIDES", normalized: "Movilidad", category: find("transporte") },
    { match: "RAPPI, UBER EATS, DIDI FOOD", normalized: "Comida delivery", category: find("comida") },
    { match: "CLAUDE.AI, OPENAI, CODEX", normalized: "Herramientas IA", category: find("tools") },
    { match: "SPOTIFY, ICLOUD, APPLE", normalized: "Suscripciones", category: find("tools") },
    { match: "BAMA, OXXO", normalized: "Conveniencia", category: find("libre") },
    { match: "AMAZON, MERCADO PAGO", normalized: "Compras online", category: find("libre") },
  ];

  return (
    <Card className="p-4">
      <SectionHeader title="Reglas de categorización" />
      <p className="mb-3 text-[12px] text-[#6a7384]">
        Se aplican automáticamente al detectar movimientos en una importación.
      </p>
      <div className="grid gap-2">
        {rules.map((rule) => (
          <div
            key={rule.match}
            className="rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-[#a4adbe]">{rule.match}</div>
                <div className="mt-0.5 text-[11px] text-[#6a7384]">→ {rule.normalized}</div>
              </div>
              <div className="shrink-0 text-[11px] font-medium text-[#2A5BFF]">{rule.category}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
