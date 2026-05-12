"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "No se pudo iniciar sesión.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#06080c] px-4 text-[#eef2f8]">
      <Card className="w-full max-w-sm p-5">
        <h1 className="text-[22px] font-semibold">Entrar a Finanzas</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="correo"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#10141d] px-4 text-[15px] outline-none focus:border-[#2A5BFF]/60"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="contraseña"
            className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#10141d] px-4 text-[15px] outline-none focus:border-[#2A5BFF]/60"
          />
          {error ? <div className="text-[13px] text-[#ff5c7a]">{error}</div> : null}
          <Button className="w-full" disabled={pending}>
            {pending ? "Entrando" : "Entrar"}
          </Button>
        </form>
        <div className="mt-4 text-center text-[13px] text-[#a4adbe]">
          ¿Primera vez?{" "}
          <Link className="font-semibold text-[#2A5BFF]" href="/sign-up">
            Crear cuenta
          </Link>
        </div>
      </Card>
    </main>
  );
}
