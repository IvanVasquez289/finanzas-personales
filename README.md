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

## Probar en iPhone como PWA

### Opción rápida en red local

1. Ejecuta:

```bash
npm run dev -- --hostname 0.0.0.0
```

2. Busca tu IP local:

```bash
ipconfig getifaddr en0
```

3. En el iPhone, conectado a la misma Wi-Fi, abre:

```text
http://TU_IP_LOCAL:3000
```

4. En Safari: compartir → `Agregar a pantalla de inicio`.

Limitación: en local será HTTP. Sirve para revisar diseño y navegación, pero para una PWA más fiel conviene HTTPS.

### Opción recomendada

Desplegar en Vercel. Vercel da HTTPS, dominio temporal y una experiencia más cercana a la PWA final en iPhone.

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
- `lib/finance-snapshot.ts`
- `lib/db.ts`

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
npm run prisma:seed
```
