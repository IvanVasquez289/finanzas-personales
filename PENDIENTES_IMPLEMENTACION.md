# Pendientes de implementación

Documento ordenado por importancia para convertir la maqueta en una app financiera usable día a día.

## Prioridad 1 - Core diario

Estas tareas afectan directamente si la app sirve para registrar el día y entender cuánto dinero queda.

1. [ ] Registro de pagos de tarjeta y cierre de ciclo.
   - [x] Primera versión de registro de pago implementada.
   - [ ] Cierre formal de ciclo.
   - [ ] Histórico de ciclos.
   - [ ] Pagos parciales editables.
2. [ ] Registro de gasto completo.
   - [x] Pantalla maquetada.
   - [x] Primera server action implementada.
   - [ ] Fecha/hora editable.
   - [ ] React Hook Form.
   - [ ] MSI como `InstallmentPlan`.
   - [ ] Mejor confirmación visual.
   - [ ] Duplicados tolerantes por fecha/monto/comercio.
3. [ ] Distribución de quincena completa.
   - [x] Pantalla maquetada.
   - [x] Primera server action implementada.
   - [ ] Capturar nuevo ingreso desde la pantalla.
   - [ ] Fecha de recepción.
   - [ ] Plantillas editables.
   - [ ] React Hook Form.
4. [ ] Saldos confiables de sobres/cuentas.
   - [x] Pantalla maquetada.
   - [ ] Derivar saldos completamente desde allocations.
   - [ ] Derivar saldos completamente desde gastos y pagos.
   - [ ] Ajustes auditables de saldo.
5. [ ] Dashboard con cálculos de dominio.
   - [x] Pantalla maquetada.
   - [x] Alimentación desde Prisma.
   - [ ] Dinero libre calculado con servicios puros.
   - [ ] Dinero comprometido calculado con servicios puros.
   - [ ] Próximos pagos calculados con reglas completas.
   - [ ] Alertas reales.
   - [ ] Filtros por periodo real.

## Prioridad 2 - Configuración del MVP

Estas tareas permiten dejar de depender del seed y adaptar la app a cambios reales.

1. [ ] CRUD de cuentas/sobres.
2. [ ] CRUD de tarjetas.
3. [ ] Configuración de corte y fecha límite de pago.
4. [ ] Edición de presupuesto personal de tarjeta.
5. [ ] CRUD de categorías.
6. [ ] CRUD de metas de ahorro.
7. [ ] Alta/edición de presupuestos por categoría o cuenta.

## Prioridad 3 - Navegación y detalle

Estas tareas hacen que la información deje de estar resumida solamente en cards.

1. [ ] Detalle completo de movimientos.
2. [ ] Detalle de movimientos por tarjeta/ciclo.
3. [ ] Calendario de pagos.
4. [ ] Reportes básicos mensuales.
5. [ ] Reportes por ciclo de tarjeta.
6. [ ] Acciones reales para links tipo “Ver todas”, “Calendario” y “Reordenar”.

## Prioridad 4 - Seguridad y operación

Estas tareas son importantes antes de usar la app como sistema estable.

1. [ ] Autenticación simple.
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

- [ ] Extraer cálculos a servicios de dominio testeables.
- [ ] Calcular dinero libre desde transacciones, allocations y compromisos reales.
- [ ] Calcular dinero comprometido con reglas completas.
- [ ] Agregar alertas reales por presupuesto y exceso de gasto.
- [ ] Conectar acciones de “Ver todas”, calendario y detalle de movimientos.
- [ ] Agregar filtros por periodo real.

### Tarjetas

- [ ] Registrar pagos parciales editables.
- [ ] Cerrar ciclos y conservar histórico.
- [ ] Mostrar detalle completo de movimientos por tarjeta.
- [x] Filtrar gasto por categoría por tarjeta/ciclo seleccionado.
- [ ] Filtrar MSI por tarjeta seleccionada.
- [x] Calcular timeline de ciclo con fechas reales.
- [ ] Editar presupuesto personal de tarjeta.

### Sobres y cuentas

- [ ] Crear, editar y desactivar sobres/cuentas.
- [ ] Reordenar sobres.
- [ ] Ajustes manuales de saldo con auditoría.
- [ ] Derivar saldos completamente desde movimientos y allocations.
- [ ] Separar cuentas bancarias reales de sobres contables cuando sea necesario.

### Distribución de quincena

- [ ] Convertir UI a React Hook Form.
- [ ] Crear plantillas de distribución editables.
- [ ] Permitir capturar un nuevo monto de ingreso desde la pantalla.
- [ ] Permitir elegir fecha de recepción.
- [ ] Evitar distribuir contra un ingreso viejo cuando no exista ingreso del periodo actual.

### Registro de gasto

- [ ] Convertir UI a React Hook Form.
- [ ] Permitir elegir fecha y hora del gasto.
- [ ] Permitir editar método de pago y comercio con mejor UX.
- [ ] Manejar MSI como `InstallmentPlan`.
- [ ] Crear reglas de comercio a categoría.
- [ ] Mejorar detección de duplicados con tolerancias por fecha/monto/comercio.
- [ ] Mostrar confirmación visual persistente después de guardar.

### PWA

- [ ] Revisar instalación en iOS y Android.
- [ ] Agregar pantalla offline mínima.
- [ ] Versionar service worker en cada cambio relevante.
- [ ] Revisar estrategia de cache para assets estáticos y datos dinámicos.

## Pantallas no maquetadas todavía

- [ ] Autenticación simple.
- [ ] Configuración inicial/onboarding.
- [ ] Alta/edición de cuentas.
- [ ] Alta/edición de tarjetas.
- [ ] Configuración de corte y fecha límite de pago.
- [ ] Alta/edición de categorías.
- [ ] Alta/edición de presupuestos.
- [ ] Detalle completo de movimientos.
- [ ] Reportes mensuales.
- [ ] Reportes por ciclo.
- [ ] Calendario de pagos.
- [ ] Pantalla de importación por captura.
- [ ] Pantalla de revisión de OCR.
- [ ] Pantalla de importación por PDF.
- [ ] Pantalla de análisis mensual por PDF.
- [ ] Configuración de reglas de categorización.
- [ ] Configuración de normalización de comercios.
