import { Card } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#06080c] px-4 text-[#eef2f8]">
      <Card className="w-full max-w-sm p-5 text-center">
        <h1 className="text-[22px] font-semibold">Sin conexión</h1>
        <p className="mt-2 text-[14px] leading-6 text-[#a4adbe]">
          Puedes volver a intentar cuando tengas internet.
        </p>
      </Card>
    </main>
  );
}
