# Avance del proyecto Finanzas PWA

Documento de seguimiento basado en `proyect.md` y en el estado actual del código.

## 1. Estado general

El proyecto ya fue migrado desde el bundle de diseño en `project/` hacia una aplicación Next.js real.

Stack actualmente configurado:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Componentes base compatibles con shadcn/ui.
- Prisma ORM.
- PostgreSQL como base objetivo.
- PWA básica con manifest, icono y service worker.
- Dependencias listas para React Hook Form, Zod y Recharts.

Estado importante:

- La interfaz está maquetada y alimentada por datos reales desde Supabase.
- La base de datos está modelada en Prisma.
- Ya existe conexión Supabase configurada vía `.env.local`.
- Ya se aplicó la migración inicial en Supabase.
- Ya se aplicó una migración de seguridad para activar RLS y revocar acceso por Data API.
- Prisma Client ya puede consultar la base con `@prisma/adapter-pg`.
- La pantalla principal ya lee datos reales desde Supabase vía Prisma.
- Ya existe seed idempotente para datos iniciales reales.
- Ya existe una primera server action conectada a Prisma para crear gastos manuales.
- Todavía no hay autenticación.

## 2. Supabase: siguientes pasos

Supabase se usará inicialmente como PostgreSQL administrado. Para este proyecto, Prisma será el acceso principal a datos desde Next.js.

Referencias oficiales:

- Supabase + Prisma: https://supabase.com/docs/guides/database/prisma
- Connection strings de Supabase: https://supabase.com/docs/reference/postgres/connection-strings

### 2.1 Crear proyecto en Supabase

En Supabase:

1. Crear un nuevo project.
2. Elegir región cercana.
3. Guardar la contraseña de la base de datos.
4. Entrar al dashboard del proyecto.
5. Ir a `Connect` para obtener connection strings.

### 2.2 RLS y Data API

Estado: completado para las tablas de dominio.

Supabase mostraba `UNRESTRICTED` porque las tablas estaban en `public`, con RLS apagado y accesibles por la Data API. Como esta app usará Prisma desde el servidor y no Supabase JS desde el navegador, la decisión correcta por ahora es:

- Activar RLS en todas las tablas de dominio.
- No crear policies públicas.
- Revocar permisos de `anon`, `authenticated` y `service_role` sobre las tablas de dominio.
- Mantener acceso a datos solamente desde Next.js server-side vía Prisma.

Migración aplicada:

```text
prisma/migrations/20260511011000_enable_rls_and_revoke_data_api/migration.sql
prisma/migrations/20260511012500_harden_prisma_migrations_table/migration.sql
```

Auditoría ejecutada:

```text
unrestricted_count = 0
```

Eso significa que las tablas de dominio ya no quedan abiertas para roles de Data API.

### 2.3 Sobre el usuario de conexión

Supabase te dio strings con el usuario `postgres.fowfffmflgjwyitmvjbw`. Eso funciona y ya está validado.

Qué significa:

- `postgres` es el usuario dueño/admin de la base.
- Prisma puede migrar y consultar sin trabas.
- Es cómodo para arrancar, pero tiene demasiados permisos para runtime a largo plazo.

Para hacer las cosas bien desde ahora, hay dos niveles:

1. Seguridad de Data API: ya resuelta con RLS + revoke.
2. Seguridad de conexión Postgres: pendiente crear usuario dedicado para Prisma.

Más adelante, recomendado por Supabase: crear un usuario separado para Prisma en vez de usar directamente `postgres`.

Cuando quieras endurecer permisos de conexión, en Supabase SQL Editor se puede ejecutar una variante de:

```sql
create user "prisma" with password 'CAMBIA_ESTA_PASSWORD' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Usar una contraseña fuerte y guardarla en un password manager.

Después habría que cambiar `.env.local`:

```env
DATABASE_URL="postgresql://prisma.fowfffmflgjwyitmvjbw:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://prisma.fowfffmflgjwyitmvjbw:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

Este cambio es recomendado antes de producción. Para el MVP local, el riesgo principal de Data API ya quedó cerrado.

### 2.4 Configurar `.env.local`

Crear un archivo `.env.local` local basado en `.env.example`.

Usaremos dos URLs:

- `DATABASE_URL`: runtime de Next.js usando Supabase transaction pooler en puerto `6543`.
- `DIRECT_URL`: Prisma CLI/migraciones usando Supabase session pooler en puerto `5432`.

```env
DATABASE_URL="postgresql://postgres.fowfffmflgjwyitmvjbw:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.fowfffmflgjwyitmvjbw:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
```

Notas:

- Reemplazar `[YOUR-PASSWORD]` por la contraseña real de la base.
- No commitear `.env.local`.
- `.gitignore` ya ignora `.env` y `.env.local`.
- El proyecto usa Prisma 7, por eso las URLs se leen desde `prisma.config.ts`, no desde `schema.prisma`.
- `prisma.config.ts` prioriza `DIRECT_URL` para comandos CLI, y usa `DATABASE_URL` como fallback.

### 2.5 Migración inicial

Estado: completado.

Comandos ejecutados:

```bash
npx prisma validate
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Resultado:

- Se creó y aplicó `prisma/migrations/20260511004642_init/migration.sql`.
- Supabase quedó sincronizado con `prisma/schema.prisma`.
- `npx prisma migrate status` reporta que la base está actualizada.

### 2.6 Verificar en Supabase

Después de migrar:

1. Abrir Supabase Table Editor.
2. Confirmar tablas: `User`, `Account`, `CreditAccount`, `CreditCardCycle`, `IncomeEvent`, `Allocation`, `Transaction`, `Category`, `Budget`, `Goal`, `InstallmentPlan`, `ImportBatch`, `ImportItem`.
3. Confirmar enums creados.
4. Confirmar que no hay datos sensibles cargados todavía.

## 3. Qué ya está maquetado

La maqueta productiva vive en `components/finance-app.tsx`.

### Dashboard

Estado: maquetado.

Incluye:

- Resumen de quincena.
- Dinero libre restante.
- Composición de quincena.
- Avance de meta de ahorro.
- Tarjetas del ciclo actual.
- Próximos pagos.
- Dinero comprometido.
- Movimientos recientes.

Pendiente:

- Reemplazar cálculos temporales por servicios de dominio completos.
- Alertas reales por presupuesto.
- Navegación hacia vistas detalle reales.

### Tarjeta / ciclo actual

Estado: maquetado con cálculo inicial de ciclo.

Incluye:

- Tarjeta BBVA visual.
- Presupuesto personal usado.
- Fecha de corte y fecha de pago.
- Timeline de ciclo.
- Gasto por categoría.
- MSI activos.

Pendiente:

- Cierre formal de ciclo e histórico.

Implementado:

- Selector local para mostrar varias tarjetas dinámicamente.
- Gasto por categoría calculado por tarjeta/ciclo seleccionado.
- Primera acción para registrar pago de tarjeta contra el ciclo.
- Descuento del pago desde el sobre `Pago tarjetas`.
- Cálculo de ciclo real por `cutoffDay` y `paymentDueDay`.
- Creación idempotente del ciclo actual al guardar un gasto de tarjeta.
- Asociación automática de nuevas transacciones al ciclo calculado.
- Selección del ciclo actual calculado para el resumen del dashboard.

### Sobres / cuentas

Estado: maquetado.

Incluye:

- Ahorro.
- Pago tarjetas.
- Fijos.
- Libre.
- Cuentas bancarias.
- Distribución visual tipo dona.
- Recordatorio de regla: Libre no se repone con tarjeta.

Pendiente:

- CRUD de cuentas/sobres.
- Saldos derivados de transacciones y allocations.
- Reordenar sobres.
- Ajustes manuales de saldo.

### Distribución de quincena

Estado: primera versión conectada a Prisma.

Incluye:

- Monto de ingreso.
- Sliders por sobre.
- Validación visual de total asignado.
- Botón de confirmación.

Pendiente:

- Formulario real con React Hook Form y Zod.
- Plantillas de distribución editables.

Implementado:

- Validación básica con Zod.
- Confirmación de distribución vía server action.
- Upsert idempotente de `IncomeEvent` por día.
- Upsert de `Allocation` por sobre.
- Actualización de saldos por diferencia para evitar duplicados.
- Actualización de avance de meta cuando cambia Ahorro.
- Registro de transacción de ingreso quincenal.
- Revalidación del dashboard después de confirmar.

### Registro de gasto

Estado: primera versión conectada a Prisma.

Incluye:

- Captura de monto.
- Categorías.
- Método de pago.
- Opción visual de MSI.
- Nota.
- Teclado numérico custom.

Pendiente:

- Completar UX de fecha/hora editable.
- Actualizar presupuestos y dashboard.
- Manejar MSI como `InstallmentPlan`.

Implementado:

- Validación básica con Zod.
- Guardado de `Transaction` manual vía server action.
- Asignación automática al ciclo abierto de tarjeta.
- Fingerprint único para detectar duplicados exactos.
- Descuento de saldo para cuentas no crediticias.
- Revalidación del dashboard después de guardar.

## 4. Qué no está maquetado todavía

Pantallas definidas en `proyect.md` pero no implementadas visualmente:

- Autenticación simple.
- Configuración inicial/onboarding.
- Alta/edición de cuentas.
- Alta/edición de tarjetas.
- Configuración de corte y fecha límite de pago.
- Alta/edición de categorías.
- Alta/edición de presupuestos.
- Detalle completo de movimientos.
- Reportes mensuales.
- Reportes por ciclo.
- Calendario de pagos.
- Pantalla de importación por captura.
- Pantalla de revisión de OCR.
- Pantalla de importación por PDF.
- Pantalla de análisis mensual por PDF.
- Configuración de reglas de categorización.
- Configuración de normalización de comercios.

## 5. Qué ya está implementado técnicamente

### Frontend base

- `app/layout.tsx`: metadata, viewport, PWA config e inyección de service worker.
- `app/page.tsx`: entrada principal de la aplicación.
- `app/globals.css`: estilos globales, Tailwind y dark mode base.
- `components/ui/button.tsx`: botón compatible con patrón shadcn/ui.
- `components/ui/card.tsx`: superficie base para cards.
- `components/finance-app.tsx`: orquestador de navegación local.
- `components/app-shell/*`: shell móvil, header y tab bar.
- `components/finance/*`: primitives financieras reutilizables.
- `components/accounts/*`: componentes visuales de sobres/cuentas.
- `components/cards/*`: componentes visuales de tarjetas.
- `components/dashboard/*`: componentes visuales del dashboard.
- `components/income/*`: componentes visuales de distribución.
- `components/transactions/*`: componentes visuales de movimientos.
- `features/dashboard/dashboard-screen.tsx`: pantalla Dashboard.
- `features/credit-cards/card-detail-screen.tsx`: pantalla de tarjeta.
- `features/accounts/envelopes-screen.tsx`: pantalla de sobres.
- `features/income/distribution-screen.tsx`: pantalla de distribución.
- `features/transactions/expense-form-screen.tsx`: pantalla de registro de gasto.
- `lib/finance-snapshot.ts`: consulta server-side que arma el estado de UI desde Prisma.
- `lib/db.ts`: Prisma Client con `@prisma/adapter-pg`.
- `prisma/seed.cjs`: seed idempotente de datos iniciales reales.

### PWA

- `app/manifest.ts`.
- `public/icon.svg`.
- `public/sw.js`.
- Registro de service worker en `components/service-worker-registration.tsx`.
- Ajustes de viewport/safe area para iPhone en shell y navegación.

### Prisma

Schema definido para:

- `User`.
- `Account`.
- `CreditAccount`.
- `CreditCardCycle`.
- `IncomeEvent`.
- `Allocation`.
- `Transaction`.
- `Category`.
- `Budget`.
- `Goal`.
- `InstallmentPlan`.
- `ImportBatch`.
- `ImportItem`.

Decisiones ya aplicadas:

- Montos en centavos con `Int`.
- `userId` desde el inicio.
- Enums para estados y tipos principales.
- Fingerprint único por usuario para duplicados.
- Importaciones preparadas para captura y PDF.

## 6. Implementaciones backend pendientes

### 6.1 Conexión Prisma

Crear:

- `lib/db.ts` con Prisma Client singleton.
- Configuración compatible con Next.js y Prisma 7.
- Prueba mínima de conexión.

### 6.2 Seed inicial

Crear seed para:

- Usuario personal inicial.
- Categorías iniciales: Transporte, Comida/salidas, Tools/subs, MSI, Libre, Fijos, Ahorro, Otros.
- Sobres: Ahorro, Pago tarjetas, Fijos, Libre.
- Cuentas: BBVA Débito, Nu Débito.
- Tarjetas: BBVA Azul, Liverpool.
- Meta de ahorro inicial.

### 6.3 Servicios de dominio

Crear servicios puros para reglas financieras:

- Calcular ciclo de tarjeta por fecha de corte. Estado: primera versión implementada.
- Obtener ciclo actual por tarjeta. Estado: primera versión implementada.
- Asignar transacción a ciclo. Estado: primera versión implementada para gasto manual.
- Calcular gasto por ciclo.
- Calcular gasto por categoría.
- Calcular dinero comprometido.
- Calcular dinero libre.
- Calcular avance de metas.
- Generar próximos pagos.
- Detectar exceso de presupuesto.

### 6.4 Server actions / API routes V1

Implementar acciones para:

- Crear ingreso quincenal.
- Confirmar distribución de ingreso. Estado: primera versión implementada.
- Crear gasto manual. Estado: primera versión implementada.
- Crear cuenta/sobre.
- Crear tarjeta.
- Actualizar presupuesto personal de tarjeta.
- Crear meta de ahorro.
- Crear plan MSI.
- Marcar pago de tarjeta o pago fijo. Estado: primera versión implementada para tarjeta.

### 6.5 Validaciones

Crear schemas Zod para:

- `IncomeEvent`.
- `Allocation`.
- `Transaction`.
- `Account`.
- `CreditAccount`.
- `Goal`.
- `InstallmentPlan`.

Reglas críticas:

- Montos positivos en formularios.
- `cutoffDay` entre 1 y 31.
- `paymentDueDay` entre 1 y 31.
- El total distribuido no debe exceder el ingreso.
- Un gasto de tarjeta debe tener ciclo asignado.

### 6.6 Normalización y duplicados

Implementar:

- `normalizeMerchant(raw: string)`.
- Reglas iniciales de comercio a categoría.
- `createTransactionFingerprint`.
- Búsqueda de duplicados exactos.
- Marcado de posibles duplicados para importaciones.

### 6.7 Dashboard desde base de datos

Estado: primera versión implementada.

Ya se reemplazó `financeSnapshot` por `getFinanceSnapshot()`:

- Query de resumen de quincena.
- Query de sobres y saldos.
- Query de tarjetas y ciclos abiertos.
- Query de próximos pagos derivados de MSI y ciclos.
- Query de movimientos recientes.
- Query de meta de ahorro.

Pendiente:

- Extraer cálculos a servicios de dominio testeables.
- Agregar modelos para pagos recurrentes no MSI.
- Agregar filtros por periodo real.

### 6.8 Autenticación

Opciones:

- Supabase Auth.
- Auth.js.
- Autenticación simple propia para MVP local.

Recomendación actual:

- Si ya se usará Supabase, conviene evaluar Supabase Auth para login.
- Aun usando Supabase Auth, mantener Prisma como acceso principal a datos de dominio.
- Mapear el usuario autenticado con `User.id` interno o guardar `supabaseAuthId`.

El schema actual no tiene `supabaseAuthId`; habría que agregarlo si se decide usar Supabase Auth.

### 6.9 Importación por captura, versión 2

Backend pendiente:

- Upload temporal de imagen.
- OCR con Tesseract.js o servicio externo.
- Parser de movimientos.
- Crear `ImportBatch`.
- Crear `ImportItem`.
- Pantalla de revisión.
- Confirmar items como `Transaction`.
- Ignorar o marcar duplicados.

### 6.10 Importación PDF, versión 3

Backend pendiente:

- Upload temporal de PDF.
- Extracción con `pdf-parse` o `pdfjs-dist`.
- Parser por patrón de estado de cuenta.
- Comparación contra presupuestos.
- Resumen mensual/ciclo.
- Alertas de aumentos por categoría.

## 7. Orden recomendado desde aquí

1. Implementar creación de gasto manual.
2. Implementar ingreso + distribución.
3. Implementar cálculo de ciclos de tarjeta.
4. Implementar tarjetas reales y presupuestos.
5. Implementar autenticación.
6. Implementar reportes básicos.
7. Después iniciar OCR/importaciones.

## 8. Comandos de verificación actuales

Estos comandos ya pasan en el estado actual:

```bash
npm run build
npx prisma validate
npm run prisma:generate
npm run prisma:seed
```

Migración inicial ya ejecutada:

```bash
npm run prisma:migrate -- --name init
```
