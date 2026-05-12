"use client";

import { useActionState } from "react";
import { Settings, SlidersHorizontal, Tags, Target, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { money } from "@/lib/money";
import {
  adjustAccountBalanceAction,
  createAccountAction,
  createBudgetAction,
  createCategoryAction,
  createCreditCardAction,
  createGoalAction,
  createTemplateAction,
  deactivateAccountAction,
  deleteBudgetAction,
  deleteCategoryAction,
  deleteTemplateAction,
  initialSettingsState,
  updateAccountAction,
  updateCategoryAction,
  updateCreditCardAction,
  updateGoalAction,
} from "./actions";

export function SettingsScreen({ data }: { data: FinanceSnapshot }) {
  const [accountState, createAccount, accountPending] = useActionState(createAccountAction, initialSettingsState);
  const [updateAccountState, updateAccount, updateAccountPending] = useActionState(updateAccountAction, initialSettingsState);
  const [deactivateState, deactivateAccount, deactivatePending] = useActionState(deactivateAccountAction, initialSettingsState);
  const [adjustState, adjustAccount, adjustPending] = useActionState(adjustAccountBalanceAction, initialSettingsState);
  const [cardState, createCard, cardPending] = useActionState(createCreditCardAction, initialSettingsState);
  const [updateCardState, updateCard, updateCardPending] = useActionState(updateCreditCardAction, initialSettingsState);
  const [categoryState, createCategory, categoryPending] = useActionState(createCategoryAction, initialSettingsState);
  const [updateCategoryState, updateCategory, updateCategoryPending] = useActionState(updateCategoryAction, initialSettingsState);
  const [deleteCategoryState, deleteCategory, deleteCategoryPending] = useActionState(deleteCategoryAction, initialSettingsState);
  const [goalState, createGoal, goalPending] = useActionState(createGoalAction, initialSettingsState);
  const [updateGoalState, updateGoal, updateGoalPending] = useActionState(updateGoalAction, initialSettingsState);
  const [budgetState, createBudget, budgetPending] = useActionState(createBudgetAction, initialSettingsState);
  const [deleteBudgetState, deleteBudget, deleteBudgetPending] = useActionState(deleteBudgetAction, initialSettingsState);
  const [templateState, createTemplate, templatePending] = useActionState(createTemplateAction, initialSettingsState);
  const [deleteTemplateState, deleteTemplate, deleteTemplatePending] = useActionState(deleteTemplateAction, initialSettingsState);
  const accounts = data.settings.accounts.filter((account) => account.type !== "credit_card" && account.type !== "store_card");
  const cards = data.settings.accounts.filter((account) => account.credit);
  const activeCategories = data.settings.categories;
  const activeAccounts = data.settings.accounts.filter((account) => account.isActive);

  return (
    <>
      <PageHeader
        eyebrow="MVP"
        title="Configuración"
        right={
          <div className="grid size-9 place-items-center rounded-full border border-white/[0.06] bg-[#161b25] text-[#a4adbe]">
            <Settings size={17} />
          </div>
        }
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 app-bottom-scroll">
        <section>
          <SectionHeader title="Plantillas de quincena" />
          <Card className="p-3.5">
            <form action={createTemplate} className="grid gap-2">
              <Input name="name" placeholder="Nombre de plantilla" />
              <div className="grid grid-cols-4 gap-2">
                <Input name="pago" type="number" step="0.01" placeholder="Tarjetas" />
                <Input name="ahorro" type="number" step="0.01" placeholder="Ahorro" />
                <Input name="fijos" type="number" step="0.01" placeholder="Fijos" />
                <Input name="libre" type="number" step="0.01" placeholder="Libre" />
              </div>
              <Button disabled={templatePending}>Guardar plantilla</Button>
              <StateMessage state={templateState} />
            </form>
          </Card>
          <Card className="mt-2 overflow-hidden">
            {data.settings.templates.map((template, index) => (
              <div key={template.id} className={`flex items-center gap-3 px-4 py-3 ${index === data.settings.templates.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{template.name}</div>
                  <div className="mt-0.5 text-[11px] text-[#6a7384]">
                    {money(template.pago)} · {money(template.ahorro)} · {money(template.fijos)} · {money(template.libre)}
                  </div>
                </div>
                <form action={deleteTemplate}>
                  <input type="hidden" name="id" value={template.id} />
                  <button className="text-[12px] text-[#F46A6A]" disabled={deleteTemplatePending}>Eliminar</button>
                </form>
              </div>
            ))}
          </Card>
          <StateMessage state={deleteTemplateState} />
        </section>

        <section>
          <SectionHeader title="Cuentas y sobres" />
          <Card className="p-3.5">
            <form action={createAccount} className="grid gap-2">
              <div className="grid grid-cols-[1fr_112px] gap-2">
                <Input name="name" placeholder="Nombre" />
                <select name="type" className={fieldClass}>
                  <option value="envelope">Sobre</option>
                  <option value="savings">Ahorro</option>
                  <option value="debit">Débito</option>
                  <option value="cash">Efectivo</option>
                </select>
              </div>
              <Input name="openingBalance" type="number" step="0.01" placeholder="Saldo inicial" />
              <Button disabled={accountPending}>Crear cuenta/sobre</Button>
              <StateMessage state={accountState} />
            </form>
          </Card>
          <div className="mt-2 flex flex-col gap-2">
            {accounts.map((account) => (
              <Card key={account.id} className="p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-semibold">{account.name}</div>
                    <div className="mt-0.5 text-[11px] text-[#6a7384]">{account.type} · {money(account.balance)} · {account.isActive ? "activa" : "inactiva"}</div>
                  </div>
                  <WalletCards size={17} className="text-[#6a7384]" />
                </div>
                <form action={updateAccount} className="grid grid-cols-[1fr_104px_80px] gap-2">
                  <input type="hidden" name="id" value={account.id} />
                  <Input name="name" defaultValue={account.name} />
                  <select name="type" defaultValue={account.type} className={fieldClass}>
                    <option value="envelope">Sobre</option>
                    <option value="savings">Ahorro</option>
                    <option value="debit">Débito</option>
                    <option value="cash">Efectivo</option>
                  </select>
                  <Button variant="secondary" disabled={updateAccountPending}>Guardar</Button>
                </form>
                <form action={adjustAccount} className="mt-2 grid grid-cols-[96px_1fr_80px] gap-2">
                  <input type="hidden" name="id" value={account.id} />
                  <Input name="amount" type="number" step="0.01" placeholder="+/-" />
                  <Input name="note" placeholder="Motivo del ajuste" />
                  <Button variant="secondary" disabled={adjustPending}>Ajustar</Button>
                </form>
                {account.isActive ? (
                  <form action={deactivateAccount} className="mt-2">
                    <input type="hidden" name="id" value={account.id} />
                    <button className="text-[12px] text-[#F46A6A]" disabled={deactivatePending}>Desactivar</button>
                  </form>
                ) : null}
              </Card>
            ))}
            <StateMessage state={updateAccountState} />
            <StateMessage state={adjustState} />
            <StateMessage state={deactivateState} />
          </div>
        </section>

        <section>
          <SectionHeader title="Tarjetas" />
          <Card className="p-3.5">
            <form action={createCard} className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Input name="name" placeholder="Nombre" />
                <Input name="issuer" placeholder="Emisor" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select name="type" className={fieldClass}>
                  <option value="credit_card">Crédito</option>
                  <option value="store_card">Departamental</option>
                </select>
                <Input name="creditLimit" type="number" step="0.01" placeholder="Límite" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input name="cutoffDay" type="number" min={1} max={31} placeholder="Corte" />
                <Input name="paymentDueDay" type="number" min={1} max={31} placeholder="Pago" />
                <Input name="personalBudget" type="number" step="0.01" placeholder="Presupuesto" />
              </div>
              <Button disabled={cardPending}>Crear tarjeta</Button>
              <StateMessage state={cardState} />
            </form>
          </Card>
          <div className="mt-2 flex flex-col gap-2">
            {cards.map((card) => (
              <Card key={card.id} className="p-3.5">
                <form action={updateCard} className="grid gap-2">
                  <input type="hidden" name="accountId" value={card.id} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input name="name" defaultValue={card.name} />
                    <Input name="issuer" defaultValue={card.credit?.issuer} />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input name="creditLimit" type="number" step="0.01" defaultValue={card.credit?.limit} />
                    <Input name="cutoffDay" type="number" min={1} max={31} defaultValue={card.credit?.cutoffDay} />
                    <Input name="paymentDueDay" type="number" min={1} max={31} defaultValue={card.credit?.paymentDueDay} />
                    <Input name="personalBudget" type="number" step="0.01" defaultValue={card.credit?.personalBudget} />
                  </div>
                  <Button variant="secondary" disabled={updateCardPending}>Actualizar tarjeta</Button>
                </form>
              </Card>
            ))}
            <StateMessage state={updateCardState} />
          </div>
        </section>

        <section>
          <SectionHeader title="Categorías" />
          <Card className="p-3.5">
            <form action={createCategory} className="grid grid-cols-[1fr_76px_90px] gap-2">
              <Input name="name" placeholder="Categoría" />
              <Input name="color" type="color" defaultValue="#a4adbe" />
              <Button disabled={categoryPending}>Crear</Button>
            </form>
            <StateMessage state={categoryState} />
          </Card>
          <div className="mt-2 flex flex-col gap-2">
            {activeCategories.map((category) => (
              <Card key={category.id} className="p-3.5">
                <form action={updateCategory} className="grid grid-cols-[1fr_76px_90px] gap-2">
                  <input type="hidden" name="id" value={category.id} />
                  <Input name="name" defaultValue={category.name} />
                  <Input name="color" type="color" defaultValue={category.color} />
                  <Button variant="secondary" disabled={updateCategoryPending}>Guardar</Button>
                </form>
                {!category.isSystem ? (
                  <form action={deleteCategory} className="mt-2">
                    <input type="hidden" name="id" value={category.id} />
                    <button className="text-[12px] text-[#F46A6A]" disabled={deleteCategoryPending}>Eliminar</button>
                  </form>
                ) : null}
              </Card>
            ))}
            <StateMessage state={updateCategoryState} />
            <StateMessage state={deleteCategoryState} />
          </div>
        </section>

        <section>
          <SectionHeader title="Metas" />
          <Card className="p-3.5">
            <form action={createGoal} className="grid grid-cols-[1fr_112px_90px] gap-2">
              <Input name="name" placeholder="Meta" />
              <Input name="targetAmount" type="number" step="0.01" placeholder="Objetivo" />
              <Button disabled={goalPending}>Crear</Button>
            </form>
            <StateMessage state={goalState} />
          </Card>
          <div className="mt-2 flex flex-col gap-2">
            {data.settings.goals.map((goal) => (
              <Card key={goal.id} className="p-3.5">
                <div className="mb-2 flex items-center justify-between text-[12px] text-[#6a7384]">
                  <span>{money(goal.currentAmount)} / {money(goal.targetAmount)}</span>
                  <Target size={15} />
                </div>
                <form action={updateGoal} className="grid grid-cols-[1fr_104px_104px_82px] gap-2">
                  <input type="hidden" name="id" value={goal.id} />
                  <Input name="name" defaultValue={goal.name} />
                  <Input name="targetAmount" type="number" step="0.01" defaultValue={goal.targetAmount} />
                  <select name="status" defaultValue={goal.status} className={fieldClass}>
                    <option value="active">Activa</option>
                    <option value="paused">Pausada</option>
                    <option value="completed">Completa</option>
                  </select>
                  <Button variant="secondary" disabled={updateGoalPending}>Guardar</Button>
                </form>
              </Card>
            ))}
            <StateMessage state={updateGoalState} />
          </div>
        </section>

        <section>
          <SectionHeader title="Presupuestos" />
          <Card className="p-3.5">
            <form action={createBudget} className="grid gap-2">
              <div className="grid grid-cols-[112px_1fr] gap-2">
                <select name="scope" className={fieldClass}>
                  <option value="category">Categoría</option>
                  <option value="account">Cuenta</option>
                </select>
                <select name="targetId" className={fieldClass}>
                  {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  {activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input name="amount" type="number" step="0.01" placeholder="Monto" />
                <Input name="periodStart" type="date" />
                <Input name="periodEnd" type="date" />
              </div>
              <Button disabled={budgetPending}>Crear presupuesto</Button>
              <StateMessage state={budgetState} />
            </form>
          </Card>
          <Card className="mt-2 overflow-hidden">
            {data.settings.budgets.map((budget, index) => (
              <div key={budget.id} className={`flex items-center gap-3 px-4 py-3 ${index === data.settings.budgets.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                <SlidersHorizontal size={16} className="text-[#6a7384]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">{budget.label}</div>
                  <div className="mt-0.5 text-[11px] text-[#6a7384]">{budget.periodStart} · {budget.periodEnd}</div>
                </div>
                <div className="font-mono text-[13px]">{money(budget.amount)}</div>
                <form action={deleteBudget}>
                  <input type="hidden" name="id" value={budget.id} />
                  <button aria-label="Eliminar presupuesto" disabled={deleteBudgetPending} className="text-[#F46A6A]">
                    <Tags size={15} />
                  </button>
                </form>
              </div>
            ))}
          </Card>
          <StateMessage state={deleteBudgetState} />
        </section>
      </div>
    </>
  );
}

function StateMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;

  return (
    <div className="mt-2 text-[12px]" style={{ color: state.ok ? "#3DD68C" : "#F46A6A" }}>
      {state.message}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

const fieldClass = "h-10 min-w-0 rounded-xl border border-white/[0.08] bg-[#10141d] px-3 text-[13px] text-[#eef2f8] outline-none placeholder:text-[#6a7384] focus:border-[#2A5BFF]/60";
