"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Plus, SlidersHorizontal, Tags, Target, Trash2, WalletCards, X } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { ProgressBar } from "@/components/finance/progress-bar";
import { SectionHeader } from "@/components/finance/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { FinanceSnapshot } from "@/lib/finance-snapshot";
import { FT } from "@/lib/finance-tokens";
import { money } from "@/lib/money";
import {
  adjustAccountBalanceAction,
  advanceInstallmentAction,
  cancelInstallmentAction,
  createAccountAction,
  createBudgetAction,
  createCategoryAction,
  createCreditCardAction,
  createGoalAction,
  deactivateAccountAction,
  deleteAccountAction,
  deleteBudgetAction,
  deleteCategoryAction,
  deleteCreditCardAction,
  updateAccountAction,
  updateCategoryAction,
  updateCreditCardAction,
  updateGoalAction,
} from "./actions";
import { initialSettingsState } from "./types";
import { signOut } from "@/lib/auth-client";

const cardColorPresets = ["#2A5BFF", "#3DD68C", "#F5B544", "#8B6CF0", "#3DD6C9", "#E94B6A"];

export function SettingsScreen({
  data,
  section,
  onBack,
}: {
  data: FinanceSnapshot;
  section: "accounts" | "cards" | "plan";
  onBack: () => void;
}) {
  const [accountState, createAccount, accountPending] = useActionState(createAccountAction, initialSettingsState);
  const [updateAccountState, updateAccount, updateAccountPending] = useActionState(updateAccountAction, initialSettingsState);
  const [deactivateState, deactivateAccount, deactivatePending] = useActionState(deactivateAccountAction, initialSettingsState);
  const [deleteAccountState, deleteAccount, deleteAccountPending] = useActionState(deleteAccountAction, initialSettingsState);
  const [adjustState, adjustAccount, adjustPending] = useActionState(adjustAccountBalanceAction, initialSettingsState);
  const [cardState, createCard, cardPending] = useActionState(createCreditCardAction, initialSettingsState);
  const [updateCardState, updateCard, updateCardPending] = useActionState(updateCreditCardAction, initialSettingsState);
  const [deleteCardState, deleteCard, deleteCardPending] = useActionState(deleteCreditCardAction, initialSettingsState);
  const [categoryState, createCategory, categoryPending] = useActionState(createCategoryAction, initialSettingsState);
  const [updateCategoryState, updateCategory, updateCategoryPending] = useActionState(updateCategoryAction, initialSettingsState);
  const [deleteCategoryState, deleteCategory, deleteCategoryPending] = useActionState(deleteCategoryAction, initialSettingsState);
  const [goalState, createGoal, goalPending] = useActionState(createGoalAction, initialSettingsState);
  const [updateGoalState, updateGoal, updateGoalPending] = useActionState(updateGoalAction, initialSettingsState);
  const [budgetState, createBudget, budgetPending] = useActionState(createBudgetAction, initialSettingsState);
  const [deleteBudgetState, deleteBudget, deleteBudgetPending] = useActionState(deleteBudgetAction, initialSettingsState);

  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createBudgetOpen, setCreateBudgetOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  useEffect(() => { if (accountState.ok) { setCreateAccountOpen(false); setEditingAccountId(null); } }, [accountState]);
  useEffect(() => { if (updateAccountState.ok) setEditingAccountId(null); }, [updateAccountState]);
  useEffect(() => { if (cardState.ok) setCreateCardOpen(false); }, [cardState]);
  useEffect(() => { if (updateCardState.ok) setEditingCardId(null); }, [updateCardState]);
  useEffect(() => { if (categoryState.ok) setCreateCategoryOpen(false); }, [categoryState]);
  useEffect(() => { if (updateCategoryState.ok) setEditingCategoryId(null); }, [updateCategoryState]);
  useEffect(() => { if (goalState.ok) setCreateGoalOpen(false); }, [goalState]);
  useEffect(() => { if (updateGoalState.ok) setEditingGoalId(null); }, [updateGoalState]);
  useEffect(() => { if (budgetState.ok) setCreateBudgetOpen(false); }, [budgetState]);

  const accounts = data.settings.accounts.filter((a) => a.type !== "credit_card" && a.type !== "store_card");
  const cards = data.settings.accounts.filter((a) => a.credit);
  const activeCategories = data.settings.categories;
  const activeAccounts = data.settings.accounts.filter((a) => a.isActive);
  const title = { accounts: "Cuentas", cards: "Tarjetas", plan: "Meta" }[section];

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title={title}
        right={
          <Button type="button" variant="secondary" size="icon" aria-label="Regresar" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
        }
      />
      <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto px-4 app-bottom-scroll">

        {/* ── CUENTAS Y SOBRES ── */}
        {section === "accounts" ? (
          <section>
            <SectionHeader
              title="Cuentas y sobres"
              action={createAccountOpen ? undefined : "+ Nueva"}
              onAction={() => setCreateAccountOpen(true)}
            />

            {createAccountOpen && (
              <Card className="mb-4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Nueva cuenta</span>
                  <button type="button" onClick={() => setCreateAccountOpen(false)} className="text-[#6a7384]"><X size={15} /></button>
                </div>
                <form action={createAccount} className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[1fr_128px]">
                    <Input name="name" placeholder="Nombre" autoFocus />
                    <select name="type" className={fieldClass}>
                      <option value="envelope">Sobre</option>
                      <option value="savings">Ahorro</option>
                      <option value="debit">Débito</option>
                      <option value="cash">Efectivo</option>
                    </select>
                  </div>
                  <Input name="openingBalance" type="number" step="0.01" placeholder="Saldo inicial (opcional)" />
                  <Button disabled={accountPending}>Crear</Button>
                  <StateMessage state={accountState} />
                </form>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {accounts.map((account) => (
                <Card key={account.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-3"
                    onClick={() => setEditingAccountId(editingAccountId === account.id ? null : account.id)}
                  >
                    <WalletCards size={16} className="shrink-0 text-[#6a7384]" />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[14px] font-semibold">{account.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#6a7384]">
                        {account.type} · {money(account.balance)} · {account.isActive ? "activa" : "inactiva"}
                      </div>
                    </div>
                    {editingAccountId === account.id ? <ChevronUp size={15} className="text-[#6a7384]" /> : <Pencil size={14} className="text-[#6a7384]" />}
                  </button>

                  {editingAccountId === account.id && (
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3.5">
                      <form action={updateAccount} className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[1fr_124px]">
                        <input type="hidden" name="id" value={account.id} />
                        <Input name="name" defaultValue={account.name} />
                        <select name="type" defaultValue={account.type} className={fieldClass}>
                          <option value="envelope">Sobre</option>
                          <option value="savings">Ahorro</option>
                          <option value="debit">Débito</option>
                          <option value="cash">Efectivo</option>
                        </select>
                        <Button variant="secondary" disabled={updateAccountPending} className="min-[390px]:col-span-2">Guardar</Button>
                      </form>
                      <form action={adjustAccount} className="mt-3 grid grid-cols-1 gap-3 min-[390px]:grid-cols-[112px_1fr]">
                        <input type="hidden" name="id" value={account.id} />
                        <Input name="amount" type="number" step="0.01" placeholder="+/- monto" />
                        <Input name="note" placeholder="Motivo del ajuste" />
                        <Button variant="secondary" disabled={adjustPending} className="min-[390px]:col-span-2">Ajustar</Button>
                      </form>
                      <div className="mt-3 flex items-center gap-4">
                        {account.isActive ? (
                          <form action={deactivateAccount}>
                            <input type="hidden" name="id" value={account.id} />
                            <button className="text-[12px] text-[#F46A6A]" disabled={deactivatePending}>Desactivar</button>
                          </form>
                        ) : null}
                        <form action={deleteAccount} onSubmit={(e) => { if (!confirm("¿Eliminar esta cuenta permanentemente?")) e.preventDefault(); }}>
                          <input type="hidden" name="id" value={account.id} />
                          <button className="flex items-center gap-1 text-[12px] text-[#F46A6A]/60" disabled={deleteAccountPending}>
                            <Trash2 size={11} />Eliminar
                          </button>
                        </form>
                        <button type="button" onClick={() => setEditingAccountId(null)} className="ml-auto text-[12px] text-[#6a7384]">Cancelar</button>
                      </div>
                      <StateMessage state={updateAccountState} />
                      <StateMessage state={adjustState} />
                      <StateMessage state={deactivateState} />
                      <StateMessage state={deleteAccountState} />
                    </div>
                  )}
                </Card>
              ))}
              {accounts.length === 0 && !createAccountOpen && (
                <div className="py-6 text-center text-[13px] text-[#6a7384]">
                  Sin cuentas.{" "}
                  <button type="button" className="text-[#2A5BFF]" onClick={() => setCreateAccountOpen(true)}>Crear una →</button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── CATEGORÍAS ── */}
        {section === "accounts" ? (
          <section>
            <SectionHeader
              title="Categorías"
              action={createCategoryOpen ? undefined : "+ Nueva"}
              onAction={() => setCreateCategoryOpen(true)}
            />

            {createCategoryOpen && (
              <Card className="mb-4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Nueva categoría</span>
                  <button type="button" onClick={() => setCreateCategoryOpen(false)} className="text-[#6a7384]"><X size={15} /></button>
                </div>
                <form action={createCategory} className="grid grid-cols-[1fr_64px] gap-3 min-[390px]:grid-cols-[1fr_76px]">
                  <Input name="name" placeholder="Nombre" autoFocus />
                  <Input name="color" type="color" defaultValue="#a4adbe" />
                  <Button disabled={categoryPending} className="col-span-2">Crear</Button>
                </form>
                <StateMessage state={categoryState} />
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {activeCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-3"
                    onClick={() => setEditingCategoryId(editingCategoryId === category.id ? null : category.id)}
                  >
                    <span className="size-3 shrink-0 rounded-full" style={{ background: category.color }} />
                    <span className="flex-1 text-left text-[14px] font-semibold">{category.name}</span>
                    {editingCategoryId === category.id ? <ChevronUp size={15} className="text-[#6a7384]" /> : <Pencil size={14} className="text-[#6a7384]" />}
                  </button>

                  {editingCategoryId === category.id && (
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3.5">
                      <form action={updateCategory} className="grid grid-cols-[1fr_64px] gap-3 min-[390px]:grid-cols-[1fr_76px]">
                        <input type="hidden" name="id" value={category.id} />
                        <Input name="name" defaultValue={category.name} />
                        <Input name="color" type="color" defaultValue={category.color} />
                        <Button variant="secondary" disabled={updateCategoryPending} className="col-span-2">Guardar</Button>
                      </form>
                      <div className="mt-3 flex items-center gap-4">
                        {!category.isSystem ? (
                          <form action={deleteCategory}>
                            <input type="hidden" name="id" value={category.id} />
                            <button className="flex items-center gap-1 text-[12px] text-[#F46A6A]" disabled={deleteCategoryPending}>
                              <Trash2 size={11} />Eliminar
                            </button>
                          </form>
                        ) : (
                          <span className="text-[11px] text-[#6a7384]">Categoría del sistema</span>
                        )}
                        <button type="button" onClick={() => setEditingCategoryId(null)} className="ml-auto text-[12px] text-[#6a7384]">Cancelar</button>
                      </div>
                      <StateMessage state={updateCategoryState} />
                      <StateMessage state={deleteCategoryState} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── PRESUPUESTOS ── */}
        {section === "accounts" ? (
          <section>
            <SectionHeader
              title="Presupuestos"
              action={createBudgetOpen ? undefined : "+ Nuevo"}
              onAction={() => setCreateBudgetOpen(true)}
            />

            {createBudgetOpen && (
              <Card className="mb-4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Nuevo presupuesto</span>
                  <button type="button" onClick={() => setCreateBudgetOpen(false)} className="text-[#6a7384]"><X size={15} /></button>
                </div>
                <form action={createBudget} className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[128px_1fr]">
                    <select name="scope" className={fieldClass}>
                      <option value="category">Categoría</option>
                      <option value="account">Cuenta</option>
                    </select>
                    <select name="targetId" className={fieldClass}>
                      {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
                    <Input name="amount" type="number" step="0.01" placeholder="Monto" />
                    <Input name="periodStart" type="date" />
                    <Input name="periodEnd" type="date" />
                  </div>
                  <Button disabled={budgetPending}>Crear presupuesto</Button>
                  <StateMessage state={budgetState} />
                </form>
              </Card>
            )}

            <Card className="overflow-hidden">
              {data.settings.budgets.length === 0 ? (
                <div className="px-4 py-5 text-center text-[13px] text-[#6a7384]">
                  Sin presupuestos.{" "}
                  <button type="button" className="text-[#2A5BFF]" onClick={() => setCreateBudgetOpen(true)}>Crear uno →</button>
                </div>
              ) : (
                data.settings.budgets.map((budget, index) => (
                  <div key={budget.id} className={`flex items-center gap-3 px-4 py-3 ${index === data.settings.budgets.length - 1 ? "" : "border-b border-white/[0.06]"}`}>
                    <SlidersHorizontal size={16} className="shrink-0 text-[#6a7384]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{budget.label}</div>
                      <div className="mt-0.5 text-[11px] text-[#6a7384]">{budget.periodStart} · {budget.periodEnd}</div>
                    </div>
                    <div className="font-mono text-[13px]">{money(budget.amount)}</div>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={budget.id} />
                      <button aria-label="Eliminar presupuesto" disabled={deleteBudgetPending} className="text-[#F46A6A]/60">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </Card>
            <StateMessage state={deleteBudgetState} />
          </section>
        ) : null}

        {/* ── TARJETAS ── */}
        {section === "cards" ? (
          <section>
            <SectionHeader
              title="Tarjetas de crédito"
              action={createCardOpen ? undefined : "+ Nueva"}
              onAction={() => setCreateCardOpen(true)}
            />

            {createCardOpen && (
              <Card className="mb-4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Nueva tarjeta</span>
                  <button type="button" onClick={() => setCreateCardOpen(false)} className="text-[#6a7384]"><X size={15} /></button>
                </div>
                <form action={createCard} className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                    <Input name="name" placeholder="Nombre (ej. BBVA Azul)" autoFocus />
                    <Input name="issuer" placeholder="Emisor (ej. BBVA)" />
                  </div>
                  <CardColorPicker name="color" defaultValue="#2A5BFF" />
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                    <select name="type" className={fieldClass}>
                      <option value="credit_card">Crédito</option>
                      <option value="store_card">Departamental</option>
                    </select>
                    <Input name="creditLimit" type="number" step="0.01" placeholder="Límite bancario" />
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
                    <Input name="cutoffDay" type="number" min={1} max={31} placeholder="Día corte" />
                    <Input name="paymentDueDay" type="number" min={1} max={31} placeholder="Día pago" />
                    <Input name="personalBudget" type="number" step="0.01" placeholder="Mi presupuesto" />
                  </div>
                  <Button disabled={cardPending}>Crear tarjeta</Button>
                  <StateMessage state={cardState} />
                </form>
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {cards.map((card) => (
                <Card key={card.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-3"
                    onClick={() => setEditingCardId(editingCardId === card.id ? null : card.id)}
                  >
                    <Tags size={16} className="shrink-0 text-[#6a7384]" />
                    <span className="size-3 rounded-full" style={{ background: card.credit?.color ?? "#2A5BFF" }} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[14px] font-semibold">{card.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#6a7384]">
                        {card.credit?.issuer} · corte día {card.credit?.cutoffDay} · presupuesto {money(card.credit?.personalBudget ?? 0)}
                      </div>
                    </div>
                    {editingCardId === card.id ? <ChevronUp size={15} className="text-[#6a7384]" /> : <Pencil size={14} className="text-[#6a7384]" />}
                  </button>

                  {editingCardId === card.id && (
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3.5">
                      <form action={updateCard} className="grid gap-3">
                        <input type="hidden" name="accountId" value={card.id} />
                        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                          <Input name="name" defaultValue={card.name} placeholder="Nombre" />
                          <Input name="issuer" defaultValue={card.credit?.issuer} placeholder="Emisor" />
                        </div>
                        <CardColorPicker name="color" defaultValue={card.credit?.color ?? "#2A5BFF"} />
                        <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                          <Input name="creditLimit" type="number" step="0.01" defaultValue={card.credit?.limit} placeholder="Límite" />
                          <Input name="cutoffDay" type="number" min={1} max={31} defaultValue={card.credit?.cutoffDay} placeholder="Corte" />
                          <Input name="paymentDueDay" type="number" min={1} max={31} defaultValue={card.credit?.paymentDueDay} placeholder="Pago" />
                          <Input name="personalBudget" type="number" step="0.01" defaultValue={card.credit?.personalBudget} placeholder="Presuesto" />
                        </div>
                        <Button variant="secondary" disabled={updateCardPending}>Guardar cambios</Button>
                      </form>
                      <div className="mt-3 flex items-center gap-4">
                        <form action={deleteCard} onSubmit={(e) => { if (!confirm("¿Eliminar esta tarjeta permanentemente?")) e.preventDefault(); }}>
                          <input type="hidden" name="id" value={card.id} />
                          <button className="flex items-center gap-1 text-[12px] text-[#F46A6A]/60" disabled={deleteCardPending}>
                            <Trash2 size={11} />Eliminar
                          </button>
                        </form>
                        <button type="button" onClick={() => setEditingCardId(null)} className="ml-auto text-[12px] text-[#6a7384]">Cancelar</button>
                      </div>
                      <StateMessage state={updateCardState} />
                      <StateMessage state={deleteCardState} />
                    </div>
                  )}
                </Card>
              ))}
              {cards.length === 0 && !createCardOpen && (
                <div className="py-6 text-center text-[13px] text-[#6a7384]">
                  Sin tarjetas.{" "}
                  <button type="button" className="text-[#2A5BFF]" onClick={() => setCreateCardOpen(true)}>Agregar una →</button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── PLANES MSI ── */}
        {section === "cards" ? (
          <section>
            <SectionHeader title="Planes MSI activos" />
            <Card className="overflow-hidden">
              {data.settings.installmentPlans.length === 0 ? (
                <div className="px-4 py-5 text-center text-[13px] text-[#6a7384]">
                  Sin planes MSI activos.
                </div>
              ) : (
                data.settings.installmentPlans.map((plan, index) => (
                  <InstallmentPlanRow
                    key={plan.id}
                    plan={plan}
                    last={index === data.settings.installmentPlans.length - 1}
                  />
                ))
              )}
            </Card>
          </section>
        ) : null}

        {/* ── METAS ── */}
        {section === "plan" ? (
          <section>
            <SectionHeader
              title="Metas de ahorro"
              action={createGoalOpen ? undefined : "+ Nueva"}
              onAction={() => setCreateGoalOpen(true)}
            />

            {createGoalOpen && (
              <Card className="mb-4 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">Nueva meta</span>
                  <button type="button" onClick={() => setCreateGoalOpen(false)} className="text-[#6a7384]"><X size={15} /></button>
                </div>
                <form action={createGoal} className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-[1fr_132px]">
                  <Input name="name" placeholder="Nombre de la meta" autoFocus />
                  <Input name="targetAmount" type="number" step="0.01" placeholder="Objetivo $" />
                  <Button disabled={goalPending} className="min-[390px]:col-span-2">Crear</Button>
                </form>
                <StateMessage state={goalState} />
              </Card>
            )}

            <div className="flex flex-col gap-3">
              {data.settings.goals.map((goal) => (
                <Card key={goal.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3.5 py-3"
                    onClick={() => setEditingGoalId(editingGoalId === goal.id ? null : goal.id)}
                  >
                    <Target size={16} className="shrink-0 text-[#6a7384]" />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[14px] font-semibold">{goal.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#6a7384]">
                        {money(goal.currentAmount)} de {money(goal.targetAmount)} · {goal.status}
                      </div>
                    </div>
                    {editingGoalId === goal.id ? <ChevronUp size={15} className="text-[#6a7384]" /> : <Pencil size={14} className="text-[#6a7384]" />}
                  </button>

                  {editingGoalId === goal.id && (
                    <div className="border-t border-white/[0.06] px-4 pb-4 pt-3.5">
                      <form action={updateGoal} className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2">
                        <input type="hidden" name="id" value={goal.id} />
                        <Input name="name" defaultValue={goal.name} />
                        <Input name="targetAmount" type="number" step="0.01" defaultValue={goal.targetAmount} />
                        <select name="status" defaultValue={goal.status} className={fieldClass}>
                          <option value="active">Activa</option>
                          <option value="paused">Pausada</option>
                          <option value="completed">Completa</option>
                        </select>
                        <Button variant="secondary" disabled={updateGoalPending} className="min-[390px]:col-span-2">Guardar</Button>
                      </form>
                      <div className="mt-3 flex justify-end">
                        <button type="button" onClick={() => setEditingGoalId(null)} className="text-[12px] text-[#6a7384]">Cancelar</button>
                      </div>
                      <StateMessage state={updateGoalState} />
                    </div>
                  )}
                </Card>
              ))}
              {data.settings.goals.length === 0 && !createGoalOpen && (
                <div className="py-6 text-center text-[13px] text-[#6a7384]">
                  Sin metas.{" "}
                  <button type="button" className="text-[#2A5BFF]" onClick={() => setCreateGoalOpen(true)}>Crear una →</button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── SESIÓN ── */}
        <section className="pb-2">
          <SectionHeader title="Sesión" />
          <Card className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-semibold">{data.user.name}</div>
                <div className="mt-0.5 text-[11px] text-[#6a7384]">Cuenta activa</div>
              </div>
              <button
                type="button"
                className="rounded-xl border border-[#F46A6A]/30 bg-[#F46A6A]/10 px-3.5 py-2 text-[13px] font-medium text-[#F46A6A]"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/sign-in";
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function InstallmentPlanRow({
  plan,
  last,
}: {
  plan: FinanceSnapshot["settings"]["installmentPlans"][number];
  last: boolean;
}) {
  const [advanceState, advanceAction, advancing] = useActionState(advanceInstallmentAction, { ok: false, message: "" });
  const [cancelState, cancelAction, cancelling] = useActionState(cancelInstallmentAction, { ok: false, message: "" });
  const pct = plan.total > 0 ? Math.round((plan.current / plan.total) * 100) : 0;

  return (
    <div className={`px-4 py-3.5 ${last ? "" : "border-b border-white/[0.06]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{plan.merchant}</div>
          <div className="mt-0.5 text-[11px] text-[#6a7384]">
            {plan.accountName} · {money(plan.monthly)}/mes · mensualidad {plan.current} de {plan.total}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[12px] text-[#a4adbe]">{money(plan.original)}</div>
          <div className="text-[10px] text-[#6a7384]">original</div>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar pct={pct} color={FT.warn} height={4} />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <form action={advanceAction}>
          <input type="hidden" name="planId" value={plan.id} />
          <button
            type="submit"
            disabled={advancing}
            className="rounded-xl border border-[#2A5BFF]/30 bg-[#2A5BFF]/10 px-3 py-1.5 text-[12px] font-medium text-[#2A5BFF]"
          >
            {advancing ? "…" : plan.current >= plan.total ? "Marcar completado" : "Avanzar mensualidad"}
          </button>
        </form>
        <form action={cancelAction}>
          <input type="hidden" name="planId" value={plan.id} />
          <button
            type="submit"
            disabled={cancelling}
            className="rounded-xl border border-white/[0.08] px-3 py-1.5 text-[12px] text-[#F46A6A]/70"
          >
            {cancelling ? "…" : "Cancelar plan"}
          </button>
        </form>
      </div>
      {(advanceState.message || cancelState.message) ? (
        <div className="mt-1.5 text-[11px]" style={{ color: (advanceState.ok || cancelState.ok) ? FT.pos : FT.danger }}>
          {advanceState.message || cancelState.message}
        </div>
      ) : null}
    </div>
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

function CardColorPicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#10141d] p-2.5">
      <input type="hidden" name={name} value={value} />
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.06em] text-[#6a7384]">Color de tarjeta</span>
        <span
          className="h-5 w-12 rounded-full"
          style={{ background: `linear-gradient(135deg, ${shade(value, -34)} 0%, ${value} 56%, ${shade(value, 28)} 100%)` }}
        />
      </div>
      <div className="grid grid-cols-6 gap-2">
        {cardColorPresets.map((color) => (
          <button
            type="button"
            key={color}
            aria-label={`Color ${color}`}
            onClick={() => setValue(color)}
            className="h-8 rounded-xl border"
            style={{
              background: `linear-gradient(135deg, ${shade(color, -34)} 0%, ${color} 56%, ${shade(color, 28)} 100%)`,
              borderColor: value === color ? "rgba(238,242,248,0.9)" : "rgba(255,255,255,0.10)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function shade(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const num = Number.parseInt(normalized, 16);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 255) + amount);
  const b = clamp((num & 255) + amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

const fieldClass = "h-11 min-w-0 rounded-[14px] border border-white/[0.08] bg-[#10141d] px-3.5 text-[14px] text-[#eef2f8] outline-none placeholder:text-[#6a7384] focus:border-[#2A5BFF]/60";
