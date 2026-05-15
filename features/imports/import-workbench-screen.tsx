"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ArrowLeft, Camera, Check, Loader2, ScanText, X } from "lucide-react";
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

const INITIAL_STATE: ImportActionState = { ok: false, message: "" };

export function ImportWorkbenchScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const allAccounts = data.expenseForm.accounts.map((a) => ({ id: a.id, name: a.label }));
  const [selectedAccountId, setSelectedAccountId] = useState(allAccounts[0]?.id ?? "");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, action, pending] = useActionState(
    async (prev: ImportActionState, formData: FormData) => {
      const result = await createImportBatchAction(prev, formData);
      if (result.ok && result.batchId) setActiveBatchId(result.batchId);
      return result;
    },
    INITIAL_STATE,
  );

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
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
      }
    } catch {
      setOcrStatus("error");
    }
  }

  function clearImage() {
    setPreviewUrl(null);
    setOcrStatus("idle");
    setOcrText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 app-bottom-scroll app-top">
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="text-[14px] text-[#a4adbe]">Importar</div>
        <div className="grid size-10 place-items-center rounded-full border border-white/10 bg-[#161b25] text-[#a4adbe]">
          <ScanText size={17} />
        </div>
      </div>

      {/* ── Step 1: Capture ── */}
      <Card className="p-4">
        <p className="mb-3 text-[12px] leading-[1.5] text-[#6a7384]">
          Sube una captura de tu app bancaria o pega el texto directamente. Se detectan fechas, comercios y montos automáticamente.
        </p>

        <div className="mb-3">
          <label className="mb-1 block text-[11px] text-[#6a7384]">Cuenta o tarjeta destino</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 text-[13px] text-white"
          >
            <option value="">Selecciona cuenta…</option>
            {allAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

        {previewUrl ? (
          <div className="relative mb-3 overflow-hidden rounded-2xl border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Captura" className="max-h-44 w-full object-contain" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-black/50 text-white"
            >
              <X size={12} />
            </button>
            {ocrStatus === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                <Loader2 size={22} className="animate-spin text-white" />
                <span className="text-[12px] text-white">Extrayendo texto…</span>
              </div>
            )}
            {ocrStatus === "done" && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-[#3DD68C]/90 px-2 py-1 text-[11px] font-medium text-black">
                <Check size={11} /> Texto extraído
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3.5 text-[13px] text-[#6a7384] hover:border-[#2A5BFF]/40 hover:text-[#a4adbe]"
          >
            <Camera size={16} />
            Subir captura o foto del estado de cuenta
          </button>
        )}

        {ocrStatus === "error" && (
          <p className="mb-2 text-[12px] text-red-400">No se pudo leer la imagen. Pega el texto manualmente abajo.</p>
        )}

        <form action={action} className="grid gap-3">
          <input type="hidden" name="source" value="screenshot" />
          <input type="hidden" name="accountId" value={selectedAccountId} />

          <label className="text-[11px] text-[#6a7384]">
            Texto de los movimientos
            <textarea
              ref={textareaRef}
              name="rawText"
              required
              rows={5}
              defaultValue={ocrText}
              key={ocrText}
              placeholder={"05/05/2026  OXXO CONVENIENCE  $89.50\n06/05/2026  UBER TRIP  $128.40\n…"}
              className="mt-1.5 w-full resize-none rounded-2xl border border-white/[0.08] bg-[#10141d] p-3 text-[13px] text-white placeholder:text-[#6a7384]"
            />
          </label>

          {state.message && (
            <p className={`text-[12px] ${state.ok ? "text-green-400" : "text-red-400"}`}>{state.message}</p>
          )}

          <Button type="submit" disabled={pending || ocrStatus === "loading" || !selectedAccountId} className="w-full">
            {pending ? "Procesando…" : "Detectar movimientos →"}
          </Button>
        </form>
      </Card>

      {/* ── Step 2: Review (shown after processing) ── */}
      {activeBatchId && (
        <ReviewPanel
          data={data}
          batchId={activeBatchId}
          accountId={selectedAccountId}
        />
      )}
    </div>
  );
}

// ─── ReviewPanel ──────────────────────────────────────────────────────────────

type ReviewItem = {
  id: string;
  merchant: string;
  amountCents: number;
  date: string;
  categoryId: string;
  status: "pending" | "confirmed" | "ignored" | "duplicate";
};

function ReviewPanel({ data, batchId, accountId }: { data: FinanceSnapshot; batchId: string; accountId: string }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmState, confirmAction, confirming] = useActionState(confirmImportBatchAction, INITIAL_STATE);

  if (!loaded && !isPending) {
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

  if (!loaded) {
    return (
      <Card className="flex items-center justify-center gap-2 p-6">
        <Loader2 size={16} className="animate-spin text-[#a4adbe]" />
        <p className="text-[13px] text-[#a4adbe]">Cargando movimientos detectados…</p>
      </Card>
    );
  }

  const visibleItems = items.filter((i) => i.status !== "ignored");
  const confirmedCount = items.filter((i) => i.status === "confirmed").length;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between px-1">
        <SectionHeader title={`${visibleItems.length} movimiento${visibleItems.length !== 1 ? "s" : ""} detectado${visibleItems.length !== 1 ? "s" : ""}`} />
        {confirmedCount > 0 && (
          <span className="text-[12px] font-semibold" style={{ color: FT.pos }}>
            {confirmedCount} seleccionado{confirmedCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-[13px] text-[#6a7384]">No se detectaron movimientos. Revisa el texto e intenta de nuevo.</p>
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
          <input type="hidden" name="accountId" value={accountId || (data.expenseForm.accounts[0]?.id ?? "")} />
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
        <div className="mt-1.5 text-[11px] text-yellow-400">⚠ Posible duplicado</div>
      )}
    </div>
  );
}
