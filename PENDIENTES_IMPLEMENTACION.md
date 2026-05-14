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

Estas tareas permiten dejar de depender del seed y adaptar la app a cambios reales.

1. [x] CRUD de cuentas/sobres.
2. [x] CRUD de tarjetas.
3. [x] Configuración de corte y fecha límite de pago.
4. [x] Edición de presupuesto personal de tarjeta.
5. [x] CRUD de categorías.
6. [x] CRUD de metas de ahorro.
7. [x] Alta/edición de presupuestos por categoría o cuenta.

## Prioridad 3 - Navegación y detalle

Estas tareas hacen que la información deje de estar resumida solamente en cards.

1. [x] Detalle completo de movimientos.
2. [x] Detalle de movimientos por tarjeta/ciclo.
3. [ ] Calendario de pagos.
4. [ ] Reportes básicos mensuales.
5. [ ] Reportes por ciclo de tarjeta.
6. [ ] Acciones reales para links tipo “Ver todas”, “Calendario” y “Reordenar”.
   - [x] “Ver todos” de movimientos.
   - [x] “Ver todas” de tarjetas.
   - [ ] “Calendario”.
   - [ ] “Reordenar”.

## Prioridad 4 - Seguridad y operación

Estas tareas son importantes antes de usar la app como sistema estable.

1. [x] Autenticación simple.
   - [x] Integración con Better Auth en código.
   - [x] Migración de Auth aplicada en Supabase.
2. [ ] Configuración inicial/onboarding.
3. [ ] Usuario dedicado para Prisma en Supabase en vez de `postgres`.
4. [x] Revisar permisos de Data API con RLS y revokes.
5. [ ] Revisar permisos de runtime con usuario dedicado.
6. [ ] Revisar permisos de migraciones con usuario dedicado.
7. [ ] Pruebas unitarias para servicios de dominio.
8. [ ] Pruebas de integración para server actions críticas.

## Prioridad 5 - Importaciones

Estas tareas reducen captura manual, pero dependen de tener el core sólido.

1. [ ] Importación por captura.
2. [ ] OCR.
3. [ ] Pantalla de revisión de OCR.
4. [ ] Reglas de categorización por comercio.
5. [ ] Normalización de comercios.
6. [ ] Importación por PDF.
7. [ ] Análisis mensual por PDF.

## Pantallas maquetadas con lógica incompleta

### Dashboard

- [x] Extraer cálculos a servicios de dominio testeables.
- [x] Calcular dinero libre desde transacciones, allocations y compromisos reales.
- [x] Calcular dinero comprometido con reglas completas.
- [x] Agregar alertas reales por presupuesto y exceso de gasto.
- [ ] Conectar acciones de “Ver todas”, calendario y detalle de movimientos.
  - [x] Movimientos.
  - [x] Tarjetas.
  - [ ] Calendario.
- [x] Agregar filtros por periodo real.

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
- [ ] Reordenar sobres.
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
- [ ] Permitir editar método de pago y comercio con mejor UX.
- [x] Manejar MSI como `InstallmentPlan`.
- [ ] Crear reglas de comercio a categoría.
- [x] Mejorar detección de duplicados con tolerancias por fecha/monto/comercio.
- [x] Mostrar confirmación visual persistente después de guardar.

### PWA

- [ ] Revisar instalación en iOS y Android.
- [x] Agregar pantalla offline mínima.
- [x] Versionar service worker en cada cambio relevante.
- [ ] Revisar estrategia de cache para assets estáticos y datos dinámicos.

## Pantallas no maquetadas todavía

- [x] Autenticación simple.
- [ ] Configuración inicial/onboarding.
- [ ] Alta/edición de cuentas.
- [ ] Alta/edición de tarjetas.
- [x] Configuración de corte y fecha límite de pago.
- [ ] Alta/edición de categorías.
- [ ] Alta/edición de presupuestos.
- [x] Detalle completo de movimientos.
- [ ] Reportes mensuales.
- [ ] Reportes por ciclo.
- [ ] Calendario de pagos.
- [ ] Pantalla de importación por captura.
- [ ] Pantalla de revisión de OCR.
- [ ] Pantalla de importación por PDF.
- [ ] Pantalla de análisis mensual por PDF.
- [ ] Configuración de reglas de categorización.
- [ ] Configuración de normalización de comercios.
