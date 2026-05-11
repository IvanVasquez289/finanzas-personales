# Finanzas PWA

Sistema personal de control financiero basado en el contrato de `proyect.md`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui compatible (`components.json`, `components/ui/*`)
- Prisma ORM
- PostgreSQL
- PWA instalable
- React Hook Form, Zod y Recharts listos como dependencias para formularios, validación y reportes

## Desarrollo

```bash
npm install
npm run dev
```

La app corre en:

```text
http://localhost:3000
```

## Base de datos

Copia `.env.example` a `.env.local` y reemplaza `[YOUR-PASSWORD]` con la contraseña real de Supabase.

El proyecto usa dos URLs:

- `DATABASE_URL`: runtime con Supabase transaction pooler, puerto `6543`.
- `DIRECT_URL`: migraciones con Supabase session pooler, puerto `5432`.

Prisma 7 lee estas variables desde `prisma.config.ts`.

```bash
npx prisma validate
npm run prisma:generate
npm run prisma:migrate
```

El schema vive en `prisma/schema.prisma` y está modelado con `userId` desde el inicio para mantener UX single-user con estructura preparada para multiusuario.

El Prisma Client de runtime se inicializa en `lib/db.ts` con `@prisma/adapter-pg`, requerido por Prisma 7.

## Seguridad Supabase

Las tablas de dominio tienen RLS activado y no exponen permisos a roles de Data API (`anon` / `authenticated`). La app accede a datos desde el servidor con Prisma.

Migración aplicada:

```text
prisma/migrations/20260511011000_enable_rls_and_revoke_data_api/migration.sql
prisma/migrations/20260511012500_harden_prisma_migrations_table/migration.sql
```

## Diseño migrado

Los archivos originales exportados desde Claude Design se conservan en `project/` como referencia. La implementación productiva está en:

- `app/page.tsx`
- `components/finance-app.tsx`
- `lib/finance-data.ts`

Pantallas migradas:

- Dashboard
- Tarjeta BBVA / ciclo actual
- Sobres y cuentas
- Distribución de quincena
- Registro de gasto

## Verificación

```bash
npm run build
npx prisma validate
```
