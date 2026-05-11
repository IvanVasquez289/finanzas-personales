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

Copia `.env.example` a `.env` y configura `DATABASE_URL` con PostgreSQL.

```bash
npx prisma validate
npm run prisma:generate
npm run prisma:migrate
```

El schema vive en `prisma/schema.prisma` y está modelado con `userId` desde el inicio para mantener UX single-user con estructura preparada para multiusuario.

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
