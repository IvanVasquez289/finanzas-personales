"use client";

import type React from "react";
import { useState } from "react";
import { ArrowLeft, FileText, ImageUp, ListChecks, ScanText, Wand2 } from "lucide-react";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";

type ImportTab = "capture" | "review" | "pdf" | "analysis" | "rules";

const tabs: { id: ImportTab; label: string }[] = [
  { id: "capture", label: "Captura" },
  { id: "review", label: "OCR" },
  { id: "pdf", label: "PDF" },
  { id: "analysis", label: "Análisis" },
  { id: "rules", label: "Reglas" },
];

export function ImportWorkbenchScreen({ data, onBack }: { data: FinanceSnapshot; onBack: () => void }) {
  const [tab, setTab] = useState<ImportTab>("capture");

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

      {tab === "capture" ? (
        <ImportPanel
          icon={<ImageUp size={18} />}
          title="Importación por captura"
          body="Sube capturas bancarias para preparar movimientos. El guardado automático queda bloqueado hasta revisión humana."
          fields={["Banco o app", "Cuenta destino", "Archivo de imagen"]}
        />
      ) : null}

      {tab === "review" ? (
        <ReviewPanel data={data} />
      ) : null}

      {tab === "pdf" ? (
        <ImportPanel
          icon={<FileText size={18} />}
          title="Importación por PDF"
          body="Carga estados de cuenta para extraer movimientos y compararlos contra lo ya registrado."
          fields={["Tarjeta o cuenta", "Periodo del estado", "Archivo PDF"]}
        />
      ) : null}

      {tab === "analysis" ? (
        <Card className="p-4">
          <SectionHeader title="Análisis mensual por PDF" />
          <div className="grid gap-2">
            {["Variación contra mes anterior", "Categorías que subieron", "Pagos duplicados o faltantes", "Impacto en ahorro"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3 text-[13px] text-[#a4adbe]">
                {item}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "rules" ? (
        <Card className="p-4">
          <SectionHeader title="Reglas de comercio" />
          <div className="grid gap-2">
            {merchantRules(data).map((rule) => (
              <div key={rule.match} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3.5 py-3">
                <div>
                  <div className="text-[13px] font-semibold">{rule.match}</div>
                  <div className="mt-0.5 text-[11px] text-[#6a7384]">Normalizar como {rule.normalized}</div>
                </div>
                <div className="text-[12px] text-[#2A5BFF]">{rule.category}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function ImportPanel({
  icon,
  title,
  body,
  fields,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  fields: string[];
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-2xl bg-[#2A5BFF1f] text-[#2A5BFF]">{icon}</div>
        <div>
          <div className="text-[15px] font-semibold">{title}</div>
          <p className="mt-1 text-[12px] leading-[1.45] text-[#a4adbe]">{body}</p>
        </div>
      </div>
      <div className="grid gap-2">
        {fields.map((field) => (
          <div key={field} className="h-11 rounded-2xl border border-white/[0.08] bg-[#10141d] px-3 py-3 text-[13px] text-[#6a7384]">
            {field}
          </div>
        ))}
      </div>
      <Button className="mt-3 w-full" type="button">Preparar revisión</Button>
    </Card>
  );
}

function ReviewPanel({ data }: { data: FinanceSnapshot }) {
  const sampleCategory = data.expenseForm.categories[0]?.label ?? "Sin categoría";

  return (
    <Card className="p-4">
      <SectionHeader title="Revisión de OCR" />
      <div className="grid gap-2">
        {["Uber Trip", "Amazon Mx", "Oxxo"].map((merchant, index) => (
          <div key={merchant} className="rounded-2xl border border-white/[0.08] bg-[#10141d] p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold">{merchant}</div>
              <div className="font-mono text-[13px]">${[128.4, 499, 82][index].toFixed(2)}</div>
            </div>
            <div className="mt-2 flex gap-1.5">
              <Chip icon={<ListChecks size={12} />} label={sampleCategory} />
              <Chip icon={<Wand2 size={12} />} label="duplicado no detectado" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-[#a4adbe]">
      {icon}
      {label}
    </span>
  );
}

function merchantRules(data: FinanceSnapshot) {
  const categories = data.expenseForm.categories;
  const find = (name: string) => categories.find((category) => category.label.toLowerCase().includes(name))?.label ?? categories[0]?.label ?? "Sin categoría";

  return [
    { match: "UBER, DIDI", normalized: "Movilidad", category: find("transporte") },
    { match: "AMAZON, MERCADO", normalized: "Compras online", category: find("libre") },
    { match: "OXXO, BAMA", normalized: "Conveniencia", category: find("comida") },
    { match: "NETFLIX, OPENAI", normalized: "Suscripciones", category: find("tools") },
  ];
}
