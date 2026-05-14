# Pendientes de implementación

Documento ordenado por importancia para convertir la maqueta en una app financiera usable día a día.

## Prioridad 1 - Core diario

Estas tareas afectan directamente si la app sirve para registrar el día y entender cuánto dinero queda.

1. [x] Registro de pagos de tarjeta y cierre de ciclo.
   - [x] Primera versión de registro de pago implementada.
   - [x] Cierre formal de ciclo.
   - [x] Histórico de ciclos.
   - [x] Pagos parciales editables.
2. [x] Registro de gasto completo.
   - [x] Pantalla maquetada.
   - [x] Primera server action implementada.
   - [x] Fecha/hora editable.
   - [x] React Hook Form.
   - [x] MSI como `InstallmentPlan`.
   - [x] Mejor confirmación visual.
   - [x] Duplicados tolerantes por fecha/monto/comercio.
   - [x] Defaults limpios (sin datos demo hardcodeados).
   - [x] Hidden inputs con `value` explícito para garantizar FormData correcto.
   - [x] Empty state con guía accionable cuando no hay categorías o cuentas.
3. [x] Distribución de quincena completa.
   - [x] Pantalla maquetada.
   - [x] Primera server action implementada.
   - [x] Capturar nuevo ingreso desde la pantalla.
   - [x] Fecha de recepción.
   - [x] Sugerencia de distribución y ajuste manual.
   - [x] React Hook Form.
4. [x] Saldos confiables de sobres/cuentas.
   - [x] Pantalla maquetada.
   - [x] Derivar saldos completamente desde allocations.
   - [x] Derivar saldos completamente desde gastos y pagos.
   - [x] Ajustes auditables de saldo.
5. [x] Dashboard con cálculos de dominio.
   - [x] Pantalla maquetada.
   - [x] Alimentación desde Prisma.
   - [x] Dinero libre calculado con servicios puros.
   - [x] Dinero comprometido calculado con servicios puros.
   - [x] Próximos pagos calculados con reglas completas.
   - [x] Alertas reales.
   - [x] Filtros por periodo real.

## Prioridad 2 - Configuración del MVP

Estas tareas permiten configurar la app desde cero y adaptarla a cambios reales.

1. [x] CRUD de cuentas/sobres.
   - [x] Eliminación en cascada (incluye movimientos asociados).
2. [x] CRUD de tarjetas.
   - [x] Eliminación en cascada (ciclos, transacciones, planes MSI).
3. [x] Configuración de corte y fecha límite de pago.
4. [x] Edición de presupuesto personal de tarjeta.
5. [x] CRUD de categorías.
6. [x] CRUD de metas de ahorro.
7. [x] Alta/edición de presupuestos por categoría o cuenta.

## Prioridad 3 - Navegación y detalle

Estas tareas hacen que la información deje de estar resumida solamente en cards.

1. [x] Detalle completo de movimientos.
2. [x] Detalle de movimientos por tarjeta/ciclo.
3. [x] Calendario de pagos.
4. [x] Reportes básicos mensuales.
5. [x] Reportes por ciclo de tarjeta.
6. [x] Acciones reales para links tipo "Ver todas", "Calendario" y "Reordenar".
   - [x] "Ver todos" de movimientos.
   - [x] "Ver todas" de tarjetas.
   - [x] "Calendario".
   - [x] "Reordenar".

## Prioridad 4 - Seguridad y operación

Estas tareas son importantes antes de usar la app como sistema estable.

1. [x] Autenticación simple.
   - [x] Integración con Better Auth en código.
   - [x] Migración de Auth aplicada en Supabase.
2. [x] Configuración inicial/onboarding.
3. [ ] Usuario dedicado para Prisma en Supabase en vez de `postgres`.
4. [x] Revisar permisos de Data API con RLS y revokes.
5. [ ] Revisar permisos de runtime con usuario dedicado.
6. [ ] Revisar permisos de migraciones con usuario dedicado.
7. [x] Pruebas unitarias para servicios de dominio (`vitest`, 37 tests).
8. [ ] Pruebas de integración para server actions críticas.

## Prioridad 5 - Importaciones

Estas tareas reducen captura manual, pero dependen de tener el core sólido.

1. [x] Importación por captura (server action + parsing de texto pegado).
2. [x] OCR básico (parsing de texto libre con detección de fecha/comercio/monto).
3. [x] Pantalla de revisión de OCR (ReviewPanel con confirmar/ignorar por item).
4. [x] Reglas de categorización por comercio (RulesPanel conectado a categorías reales).
5. [x] Normalización de comercios (normalizeMerchant en actions y transactions).
6. [x] Importación por PDF (mismo flujo que captura, fuente `pdf`).
7. [ ] Análisis mensual por PDF (requiere parsear PDF binario; pendiente integrar pdfjs-dist).

## Pantallas maquetadas con lógica incompleta

### Dashboard

- [x] Extraer cálculos a servicios de dominio testeables.
- [x] Calcular dinero libre desde transacciones, allocations y compromisos reales.
- [x] Calcular dinero comprometido con reglas completas.
- [x] Agregar alertas reales por presupuesto y exceso de gasto.
- [x] Conectar acciones de "Ver todas", calendario y detalle de movimientos.
- [x] Agregar filtros por periodo real.
- [x] Botón de logout visible (iniciales + ícono LogOut).

### Tarjetas

- [x] Registrar pagos parciales editables.
- [x] Cerrar ciclos y conservar histórico.
- [x] Mostrar detalle completo de movimientos por tarjeta.
- [x] Filtrar gasto por categoría por tarjeta/ciclo seleccionado.
- [x] Filtrar MSI por tarjeta seleccionada.
- [x] Calcular timeline de ciclo con fechas reales.
- [x] Editar presupuesto personal de tarjeta.

### Sobres y cuentas

- [x] Crear, editar y desactivar sobres/cuentas.
- [x] Eliminar en cascada (incluyendo todos los movimientos asociados).
- [x] Reordenar sobres.
- [x] Ajustes manuales de saldo con auditoría.
- [x] Derivar saldos completamente desde movimientos y allocations.
- [ ] Separar cuentas bancarias reales de sobres contables cuando sea necesario.

### Distribución de quincena

- [x] Convertir UI a React Hook Form.
- [x] Agregar sugerencia de distribución clara.
- [x] Permitir capturar un nuevo monto de ingreso desde la pantalla.
- [x] Permitir elegir fecha de recepción.
- [x] Evitar distribuir contra un ingreso viejo cuando no exista ingreso del periodo actual.

### Registro de gasto

- [x] Convertir UI a React Hook Form.
- [x] Permitir elegir fecha y hora del gasto.
- [x] Permitir editar método de pago y comercio con mejor UX.
- [x] Manejar MSI como `InstallmentPlan`.
- [x] Crear reglas de comercio a categoría.
- [x] Mejorar detección de duplicados con tolerancias por fecha/monto/comercio.
- [x] Mostrar confirmación visual persistente después de guardar.
- [x] Eliminar valores demo hardcodeados del formulario.
- [x] Mostrar guía accionable cuando faltan categorías o cuentas.

### PWA

- [ ] Revisar instalación en iOS y Android.
- [x] Agregar pantalla offline mínima.
- [x] Versionar service worker en cada cambio relevante (v4).
- [x] Estrategia de cache para assets estáticos (cache-first) y datos dinámicos (network-first).

## Pantallas no maquetadas todavía

- [x] Autenticación simple.
- [x] Configuración inicial/onboarding.
- [x] Alta/edición de cuentas.
- [x] Alta/edición de tarjetas.
- [x] Configuración de corte y fecha límite de pago.
- [x] Alta/edición de categorías.
- [x] Alta/edición de presupuestos.
- [x] Detalle completo de movimientos.
- [x] Reportes mensuales.
- [x] Reportes por ciclo.
- [x] Calendario de pagos.
- [x] Pantalla de importación por captura.
- [x] Pantalla de revisión de OCR.
- [x] Pantalla de importación por PDF.
- [x] Pantalla de análisis mensual por PDF.
- [x] Configuración de reglas de categorización.
- [x] Configuración de normalización de comercios.
