import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureInitialFinanceData } from "@/lib/initial-finance-data";

export async function getCurrentFinanceUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) return null;

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      authUserId: session.user.id,
      name: session.user.name || session.user.email.split("@")[0] || "Usuario",
    },
    create: {
      authUserId: session.user.id,
      email: session.user.email,
      name: session.user.name || session.user.email.split("@")[0] || "Usuario",
    },
  });

  await ensureInitialFinanceData(user.id);

  return user;
}

export async function requireCurrentFinanceUser() {
  const user = await getCurrentFinanceUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}
