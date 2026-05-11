La arquitectura quedaría así: **un solo proyecto Next.js fullstack**, desplegado en Vercel, conectado a Supabase como base de datos PostgreSQL. No usaremos NestJS al inicio.

```txt
Usuario / iPhone / Navegador
        ↓
Next.js PWA en Vercel
        ↓
Backend interno de Next.js
(Server Actions + Route Handlers)
        ↓
Prisma ORM
        ↓
Supabase PostgreSQL
```

## 1. Vista general

```txt
finanzas-personales/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── actions/
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── accounts/
│   ├── cards/
│   ├── transactions/
│   ├── budgets/
│   └── imports/
│
├── features/
│   ├── accounts/
│   ├── credit-cards/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   ├── income/
│   ├── installments/
│   └── imports/
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── dates.ts
│   ├── money.ts
│   └── validators.ts
│
├── services/
│   ├── cycle.service.ts
│   ├── transaction.service.ts
│   ├── budget.service.ts
│   ├── import.service.ts
│   ├── duplicate.service.ts
│   └── merchant-normalizer.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── manifest.json
│   └── icons/
│
└── .env
```

---

# 2. Capas del sistema

## Frontend

Aquí vive la interfaz:

```txt
Dashboard
Cuentas / sobres
Tarjetas
Movimientos
Presupuestos
Metas
Importaciones
Reportes
```

Tecnologías:

```txt
Next.js App Router
React
TypeScript
Tailwind
shadcn/ui
Recharts
PWA
```

La app se podrá abrir desde navegador y también instalar en iPhone como PWA.

---

## Backend interno de Next.js

No será un backend separado. Vivirá dentro del mismo proyecto Next.js.

Usaremos dos mecanismos:

### Server Actions

Para acciones internas del panel:

```txt
crear gasto
registrar ingreso
distribuir quincena
crear cuenta
actualizar presupuesto
confirmar movimientos importados
```

### Route Handlers

Para endpoints que necesiten HTTP formal, sobre todo:

```txt
subir captura
subir PDF
procesar importación
consultar reportes
```

Ejemplo:

```txt
app/api/imports/screenshot/route.ts
app/api/imports/pdf/route.ts
app/api/reports/monthly/route.ts
```

---

## Prisma

Prisma será la capa que conecta el backend de Next.js con Supabase.

```txt
Next.js → Prisma → Supabase PostgreSQL
```

Prisma nos dará:

```txt
modelado de tablas
migraciones
queries tipadas
relaciones
seguridad en TypeScript
```

---

## Supabase

Supabase será principalmente:

```txt
PostgreSQL administrado
```

Más adelante también podríamos usar:

```txt
Supabase Storage para capturas/PDFs
Supabase Auth si quieres login formal
```

Pero al inicio lo principal será la base de datos.

---

# 3. Módulos principales

## Accounts / Cuentas

Maneja:

```txt
Ahorro
Pago tarjetas
Fijos
Libre
BBVA Azul
Liverpool
Nu Débito
```

Todas son `Account`, pero con tipos diferentes:

```txt
debit
savings
credit_card
store_card
envelope
cash
```

---

## Credit Cards / Tarjetas

Maneja tarjetas como:

```txt
BBVA Azul
Liverpool
```

Cada tarjeta tendrá:

```txt
fecha de corte
fecha límite de pago
límite bancario
presupuesto personal
ciclo actual
pagos próximos
```

---

## Cycles / Ciclos

Importantísimo.

La app NO trabajará solo por mes calendario.

Tendrá ciclos de tarjeta:

```txt
BBVA corte día 5:
06 mayo → 05 junio
se paga 25 junio
```

Esto evita mezclar gastos de diferentes cortes.

---

## Transactions / Movimientos

Maneja gastos, ingresos, transferencias y pagos.

Ejemplos:

```txt
Uber $69.60
Pago TDC $7,460
Ingreso quincenal $9,250
Transferencia a ahorro $2,500
Compra en Liverpool
MSI silla $550
```

---

## Budgets / Presupuestos

Maneja límites como:

```txt
BBVA: $5,000 por ciclo
Transporte: $1,200
Comida/salidas: $1,000
Tools/subs: $950
Libre: monto disponible por quincena
```

---

## Goals / Metas

Maneja metas como:

```txt
Ahorro objetivo: $48,000
Ahorro mensual ideal: $5,000–$6,000
```

---

## Installments / MSI

Maneja compras a meses:

```txt
Silla: $550 mensual
Bocina: $334 mensual
Liverpool: parcialidades futuras
```

El sistema debe distinguir:

```txt
monto original
parcialidad mensual
número de pago actual
número total de pagos
tarjeta asociada
```

---

## Imports / Importaciones

Versión 2 y 3.

Maneja:

```txt
capturas de BBVA
PDFs de estado de cuenta
OCR
parsing
duplicados
revisión manual
confirmación
```

---

# 4. Flujo principal del usuario

## Cuando te pagan

```txt
Registras ingreso quincenal: $9,250
        ↓
La app sugiere distribución:
- Pago tarjetas: $2,500
- Ahorro: $2,500–$3,000
- Fijos: $1,000
- Libre: resto
        ↓
Confirmas
        ↓
Se actualizan tus sobres
```

---

## Cuando registras un gasto

Ejemplo: Uber con BBVA.

```txt
Registrar gasto
        ↓
Cuenta: BBVA Azul
Categoría: Transporte
Monto: $69.60
        ↓
La app detecta ciclo:
06 mayo → 05 junio
        ↓
Suma al presupuesto BBVA
        ↓
Actualiza dashboard
```

---

## Cuando pagas la tarjeta

```txt
Pago BBVA $7,460
        ↓
Sale de cuenta Pago tarjetas
        ↓
Se registra como transferencia/pago
        ↓
Ciclo anterior queda pagado
```

---

## Cuando subes captura

```txt
Subes imagen
        ↓
OCR extrae texto
        ↓
Parser detecta movimientos
        ↓
Normaliza comercios
        ↓
Detecta duplicados
        ↓
Pantalla de revisión
        ↓
Confirmas movimientos
        ↓
Se guardan como transacciones
```

---

# 5. Arquitectura técnica por versiones

## Versión 1 — Core financiero

```txt
Next.js
Prisma
Supabase Postgres
Dashboard
Cuentas
Tarjetas
Movimientos manuales
Presupuestos
Metas
Quincenas
Ciclos
MSI
```

Sin OCR todavía.

---

## Versión 2 — Capturas

Agregamos:

```txt
upload de imagen
OCR
parser de texto
normalización de comercios
detección de duplicados
pantalla de revisión
```

---

## Versión 3 — PDFs

Agregamos:

```txt
upload PDF
extracción de texto
parser de estado de cuenta
análisis mensual
comparación contra ciclos anteriores
reportes
```

---

## Futuro — IA

No se implementa al inicio, pero dejamos una interfaz preparada:

```ts
interface TransactionClassifier {
  classify(input: RawTransaction): Promise<ClassifiedTransaction>
}
```

Primera implementación:

```txt
RuleBasedClassifier
```

Futuro:

```txt
AIClassifier
```

Así no rehacemos la arquitectura cuando agreguemos IA.

---

# 6. Cómo se verá el flujo de datos

```txt
Pantalla React
   ↓
Server Action / Route Handler
   ↓
Service de dominio
   ↓
Prisma
   ↓
Supabase PostgreSQL
```

Ejemplo real:

```txt
CreateTransactionForm
   ↓
createTransactionAction()
   ↓
transactionService.create()
   ↓
cycleService.assignToCreditCardCycle()
   ↓
prisma.transaction.create()
   ↓
Supabase
```

---

# 7. Estructura recomendada de carpetas

```txt
app/
├── page.tsx
├── layout.tsx
├── (dashboard)/
│   ├── dashboard/
│   ├── accounts/
│   ├── cards/
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   └── imports/
│
├── api/
│   ├── imports/
│   │   ├── screenshot/
│   │   │   └── route.ts
│   │   └── pdf/
│   │       └── route.ts
│   └── reports/
│       └── monthly/
│           └── route.ts
│
└── actions/
    ├── accounts.actions.ts
    ├── transactions.actions.ts
    ├── income.actions.ts
    ├── budgets.actions.ts
    └── cards.actions.ts
```

```txt
features/
├── accounts/
├── credit-cards/
├── transactions/
├── income/
├── budgets/
├── goals/
├── installments/
└── imports/
```

```txt
services/
├── cycle.service.ts
├── transaction.service.ts
├── allocation.service.ts
├── budget.service.ts
├── installment.service.ts
├── import.service.ts
├── duplicate.service.ts
└── merchant-normalizer.service.ts
```

---

# 8. Decisión final de arquitectura

Para iniciar:

```txt
Next.js Fullstack + Prisma + Supabase PostgreSQL + PWA
```

No usaremos:

```txt
NestJS al inicio
LocalStorage como base principal
IA en MVP
Backend separado
```

Sí usaremos:

```txt
Server Actions
Route Handlers
Prisma
Supabase Postgres
PWA
OCR futuro
PDF parser futuro
```

---

# 9. Resumen simple

Tu app quedará así:

```txt
Next.js = app + backend
Prisma = puente con la base de datos
Supabase = PostgreSQL en la nube
Vercel = hosting del proyecto
PWA = instalación en iPhone
```

Esa arquitectura es suficiente para tu MVP, barata, escalable y fácil de mantener.
