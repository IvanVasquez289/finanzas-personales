# Contrato técnico del sistema

# Sistema Personal de Finanzas — PWA

## 1. Propósito del documento

Este documento define el contrato técnico y funcional del sistema personal de finanzas. Su objetivo es dejar claras las reglas de negocio, alcance, arquitectura, tecnologías, entidades principales, flujos y criterios de aceptación antes de iniciar el desarrollo.

El proyecto se trabajará bajo un enfoque de **spec-driven development**, por lo que este documento servirá como fuente de verdad para guiar la implementación con ayuda de IA, evitando improvisar arquitectura o construir funcionalidades sin una definición clara.

---

## 2. Contexto del proyecto

El sistema nace de una necesidad personal: tener control real sobre ingresos, gastos, tarjetas, pagos, ahorros y metas financieras.

Actualmente el usuario recibe ingresos de forma quincenal, utiliza principalmente tarjeta de crédito para gastos recurrentes y digitales, tiene pagos fijos externos como una MacBook, maneja dinero libre para gastos variables y busca ahorrar entre $5,000 y $6,000 mensuales para alcanzar una meta inicial de aproximadamente $48,000.

El problema principal no es únicamente gastar, sino no tener visibilidad en tiempo real de cuánto se ha gastado, cuánto queda disponible y cuánto dinero ya está comprometido para pagos futuros. Las aplicaciones bancarias tradicionales muestran saldos, movimientos y límites de crédito, pero no muestran el avance personalizado contra presupuestos, ciclos reales de corte, metas de ahorro o dinero comprometido.

Por eso el sistema será una herramienta de control financiero personal, no solamente un tracker de gastos.

---

## 3. Objetivo general

Crear una aplicación web instalable como **Progressive Web Application** que permita administrar finanzas personales de forma simple, visual y estructurada.

La aplicación debe permitir responder preguntas como:

* ¿Cuánto dinero recibí este mes o esta quincena?
* ¿Cuánto tengo comprometido en pagos?
* ¿Cuánto llevo gastado en mis tarjetas?
* ¿Cuánto me queda de presupuesto?
* ¿Cuánto estoy ahorrando?
* ¿Voy bien para llegar a mi meta de ahorro?
* ¿Qué gastos ya fueron registrados?
* ¿Qué movimientos vienen de capturas o estados de cuenta?
* ¿Qué pagos debo hacer y cuándo?

El sistema debe ayudar a tomar decisiones antes de que termine el ciclo, no solo analizar el problema después del corte.

---

## 4. Principios financieros del sistema

### 4.1 La tarjeta de crédito no es dinero disponible

El límite bancario de una tarjeta no representa dinero real disponible. El sistema debe distinguir entre:

* **Límite de crédito bancario:** monto máximo que el banco permite utilizar.
* **Presupuesto personal de tarjeta:** monto máximo que el usuario decide gastar en un ciclo.

El sistema debe dar prioridad visual al presupuesto personal, no al límite bancario.

### 4.2 El ahorro no se toca para gastos comunes

El ahorro es una cuenta o sobre destinado a crecer capital. No debe usarse para:

* regalos;
* gastos libres;
* compras ocasionales;
* pagos de tarjeta normales;
* salidas;
* antojos;
* compras impulsivas.

### 4.3 El dinero libre es para gastos variables

El dinero libre sirve para gastos no recurrentes o no esenciales. No requiere seguimiento granular obligatorio si el usuario decide usarlo como bolsa de gasto libre.

Ejemplos:

* regalos;
* compras ocasionales;
* ropa;
* Amazon;
* Bama/Oxxo;
* cigarros/cerveza;
* antojos;
* cine;
* gastos especiales.

Regla principal:

> Si el dinero libre se acaba, no se repone usando tarjeta de crédito.

### 4.4 Los pagos fijos deben estar separados

Pagos como MacBook, internet u obligaciones recurrentes externas deben tener una cuenta o sobre separado para evitar mezclarlos con el dinero libre.

### 4.5 El sistema debe minimizar carga mental

El objetivo no es que el usuario recuerde mentalmente cada gasto. El sistema debe mostrar:

* gasto actual;
* presupuesto restante;
* pagos próximos;
* dinero comprometido;
* dinero libre disponible;
* ahorro acumulado;
* alertas cuando un presupuesto esté cerca de agotarse.

---

## 5. Alcance funcional general

El sistema deberá soportar:

* múltiples cuentas financieras;
* múltiples tarjetas de crédito o departamentales;
* presupuestos por tarjeta y categoría;
* ciclos de tarjeta por fecha de corte;
* ingresos quincenales;
* distribución de ingresos en sobres/cuentas;
* gastos manuales;
* gastos importados desde capturas;
* gastos importados desde PDFs;
* detección de duplicados;
* compras a meses sin intereses;
* metas de ahorro;
* dashboard financiero;
* reportes mensuales y por ciclo;
* arquitectura preparada para IA futura, aunque no se implementará IA en las primeras versiones.

---

## 6. Alcance por versiones

## Versión 1 — Core financiero

La versión 1 debe resolver la administración financiera básica.

### Incluye

* Autenticación simple.
* Dashboard principal.
* Registro de ingresos.
* Registro manual de gastos.
* Cuentas/sobres.
* Tarjetas bancarias y departamentales.
* Configuración de corte y fecha límite de pago.
* Presupuesto personal por tarjeta.
* Categorías de gastos.
* Metas de ahorro.
* Distribución de quincena.
* Ciclo actual de tarjeta.
* Próximos pagos.
* Dinero comprometido.
* Dinero libre.

### No incluye

* OCR.
* Importación de capturas.
* Importación de PDFs.
* IA generativa.

### Objetivo

Que el sistema ya funcione diariamente para saber cuánto se ha gastado, cuánto queda disponible, cuánto se debe pagar y cuánto se está ahorrando.

---

## Versión 2 — Importación por capturas

La versión 2 debe reducir la captura manual de movimientos.

### Incluye

* Subir capturas de pantalla de movimientos bancarios.
* OCR para extraer texto.
* Parser para identificar movimientos.
* Sugerencia de categoría mediante reglas.
* Normalización de comercios.
* Detección de duplicados.
* Pantalla de revisión antes de guardar.
* Confirmar, editar, ignorar o marcar movimientos.

### Flujo esperado

```text
Subir captura
→ OCR extrae texto
→ Parser detecta movimientos
→ Sistema sugiere categoría
→ Sistema detecta duplicados
→ Usuario revisa
→ Usuario confirma
→ Movimientos se guardan
→ Dashboard se actualiza
```

### Consideración importante

El OCR nunca debe guardar movimientos automáticamente. Siempre debe haber revisión humana porque las capturas bancarias pueden tener errores de lectura, nombres truncados, fuentes pequeñas o montos mal interpretados.

---

## Versión 3 — Importación de PDF y análisis mensual

La versión 3 debe permitir subir estados de cuenta y generar análisis históricos.

### Incluye

* Subir PDF de estado de cuenta.
* Extraer texto del PDF.
* Detectar movimientos.
* Clasificar movimientos por reglas.
* Detectar duplicados.
* Comparar contra presupuestos.
* Comparar contra meses/ciclos anteriores.
* Generar resumen del ciclo.
* Mostrar qué categorías causaron aumentos.
* Mostrar alertas de exceso de gasto.

### Objetivo

Permitir análisis mensual o por ciclo de tarjeta para entender por qué subió o bajó el gasto y cómo afecta la meta de ahorro.

---

## Versión futura — IA opcional

La IA no será parte del MVP inicial. La arquitectura deberá quedar preparada para agregarla después.

### Posibles usos futuros

* Clasificación inteligente de comercios ambiguos.
* Resúmenes financieros automáticos.
* Recomendaciones personalizadas.
* Detección de anomalías.
* Explicación conversacional de gastos.
* Preguntas tipo: “¿por qué gasté más este mes?”
* Proyecciones para alcanzar metas.

---

## 7. Stack tecnológico

## 7.1 Arquitectura inicial

La arquitectura inicial recomendada será:

```text
Next.js fullstack + PostgreSQL + Prisma + PWA
```

No se usará NestJS al inicio para evitar sobrearquitectura. Next.js será suficiente para frontend, backend ligero, API routes, server actions, dashboard y PWA.

---

## 7.2 Frontend

Tecnologías:

* Next.js App Router.
* TypeScript.
* Tailwind CSS.
* shadcn/ui.
* React Hook Form.
* Zod.
* Recharts para gráficas.
* PWA instalable en iPhone.

El frontend deberá ser responsive y funcionar correctamente como panel web y como aplicación instalada en móvil.

---

## 7.3 Backend

Inicialmente estará dentro del mismo proyecto Next.js usando:

* Server Actions.
* API Routes.
* Servicios internos.
* Validaciones con Zod.
* Prisma para acceso a datos.
* Procesamiento de archivos.
* Parser de capturas y PDFs.

---

## 7.4 Base de datos

Se usará:

* PostgreSQL.
* Prisma ORM.

No se usará solo LocalStorage porque el sistema requiere:

* persistencia confiable;
* historial;
* múltiples dispositivos;
* ciclos;
* metas;
* importaciones;
* duplicados;
* reportes;
* posible evolución futura.

---

## 7.5 Storage de archivos

Para capturas y PDFs se podrá usar:

* Supabase Storage;
* Vercel Blob;
* o almacenamiento temporal durante el procesamiento.

Regla inicial:

> No guardar archivos sensibles permanentemente si no es necesario.

El sistema debe procesar el archivo, extraer movimientos y guardar solo datos estructurados.

---

## 7.6 OCR

Para la versión 2 se considerará:

* Tesseract.js como primera opción simple;
* posible microservicio OCR en Python en el futuro;
* posible servicio externo si se requiere mayor precisión.

---

## 7.7 PDF parsing

Para versión 3 se podrá usar:

* pdf-parse;
* pdfjs-dist;
* parser propio basado en patrones de estados de cuenta.

---

## 7.8 Despliegue

Para MVP personal:

* Vercel Hobby para Next.js.
* Supabase Free o Neon Free para PostgreSQL.
* Dominio opcional.

La app podrá funcionar inicialmente sin dominio propio usando el subdominio gratuito del proveedor.

---

## 8. Decisión sobre NestJS

NestJS no se usará en la primera etapa.

Se considerará migrar o extraer backend a NestJS si en el futuro:

* el sistema se convierte en SaaS;
* hay múltiples usuarios reales;
* se requiere API pública;
* se integran bancos/Open Finance;
* se agregan workers OCR/IA;
* se requiere arquitectura modular más robusta;
* existe una app móvil nativa consumiendo API.

Arquitectura futura posible:

```text
Next.js PWA
    ↓
NestJS API
    ↓
PostgreSQL
    ↓
Workers OCR/IA
```

---

## 9. Modelo de dominio

## 9.1 User

Aunque el MVP será para uso personal, el schema debe incluir `userId` desde el inicio para quedar preparado para múltiples usuarios.

Decisión:

> UX single-user, schema multi-user-ready.

---

## 9.2 Account

Representa cualquier cuenta, tarjeta, sobre o cajita.

Ejemplos:

* BBVA Azul.
* Liverpool.
* Nu Débito.
* Ahorro.
* Pago tarjetas.
* Fijos.
* Libre.

Campos sugeridos:

```ts
type Account = {
  id: string;
  userId: string;
  name: string;
  type: "debit" | "savings" | "credit_card" | "store_card" | "cash" | "envelope";
  currentBalance?: number;
  isActive: boolean;
};
```

---

## 9.3 CreditAccount

Configuración especial para tarjetas de crédito o departamentales.

Ejemplos:

* BBVA Azul.
* Liverpool.

Campos sugeridos:

```ts
type CreditAccount = {
  id: string;
  accountId: string;
  issuer: string;
  creditLimit?: number;
  cutoffDay: number;
  paymentDueDay: number;
  personalBudget: number;
};
```

---

## 9.4 CreditCardCycle

Representa un ciclo real de tarjeta, no un mes calendario.

Ejemplo para corte día 5:

```text
06-may-2026 → 05-jun-2026
Pago límite: 25-jun-2026
```

Campos sugeridos:

```ts
type CreditCardCycle = {
  id: string;
  creditAccountId: string;
  startDate: Date;
  endDate: Date;
  paymentDueDate: Date;
  budgetAmount: number;
  statementAmount?: number;
  paidAmount?: number;
  status: "open" | "closed" | "paid";
};
```

Regla:

> Los gastos de tarjeta deben asignarse al ciclo correspondiente según la fecha de operación/cargo y la fecha de corte.

---

## 9.5 IncomeEvent

Representa un ingreso recibido, normalmente quincenal.

Campos sugeridos:

```ts
type IncomeEvent = {
  id: string;
  userId: string;
  amount: number;
  receivedAt: Date;
  source: string;
};
```

---

## 9.6 Allocation

Representa cómo se reparte un ingreso entre cuentas o sobres.

Ejemplo:

```text
Ingreso: $9,250
- Pago tarjetas: $2,500
- Ahorro: $2,500
- Fijos: $1,000
- Libre: $3,250
```

Campos sugeridos:

```ts
type Allocation = {
  id: string;
  incomeEventId: string;
  accountId: string;
  amount: number;
};
```

---

## 9.7 Transaction

Representa cualquier movimiento financiero.

Campos sugeridos:

```ts
type Transaction = {
  id: string;
  userId: string;
  accountId: string;
  creditCardCycleId?: string;
  date: Date;
  postedDate?: Date;
  merchantRaw?: string;
  merchantNormalized?: string;
  description?: string;
  amount: number;
  direction: "income" | "expense" | "transfer";
  categoryId?: string;
  paymentMethod: "credit_card" | "debit" | "cash" | "transfer";
  source: "manual" | "screenshot" | "pdf" | "system";
  status: "pending_review" | "confirmed" | "duplicate" | "ignored";
  fingerprint?: string;
};
```

---

## 9.8 Category

Clasifica gastos.

Categorías iniciales:

* Transporte.
* Comida/salidas.
* Tools/subs.
* MSI.
* Libre.
* Fijos.
* Ahorro.
* Otros.

La categoría “Libre” representa gastos ocasionales o variables no presupuestados como parte de la tarjeta base.

---

## 9.9 Budget

Representa un límite de gasto para una categoría, cuenta o tarjeta.

Campos sugeridos:

```ts
type Budget = {
  id: string;
  userId: string;
  scope: "category" | "account" | "credit_cycle";
  categoryId?: string;
  accountId?: string;
  creditCardCycleId?: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
};
```

---

## 9.10 Goal

Representa una meta financiera.

Ejemplo:

```text
Meta: Ahorro
Objetivo: $48,000
Actual: $11,000
Ahorro mensual esperado: $5,000–$6,000
```

Campos sugeridos:

```ts
type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  status: "active" | "completed" | "paused";
};
```

---

## 9.11 InstallmentPlan

Representa una compra a meses sin intereses o parcialidades.

Campos sugeridos:

```ts
type InstallmentPlan = {
  id: string;
  userId: string;
  accountId: string;
  merchant: string;
  originalAmount: number;
  monthlyAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "cancelled";
};
```

Regla:

> Para presupuestos mensuales, lo que afecta el flujo es la parcialidad mensual, no el monto original completo.

---

## 9.12 ImportBatch

Representa una importación desde captura o PDF.

Campos sugeridos:

```ts
type ImportBatch = {
  id: string;
  userId: string;
  source: "screenshot" | "pdf";
  status: "processing" | "review" | "completed" | "failed";
  uploadedAt: Date;
  rawText?: string;
};
```

---

## 9.13 ImportItem

Representa un movimiento detectado antes de confirmarse.

Campos sugeridos:

```ts
type ImportItem = {
  id: string;
  importBatchId: string;
  detectedDate?: Date;
  detectedMerchant?: string;
  detectedAmount?: number;
  suggestedCategoryId?: string;
  duplicateTransactionId?: string;
  status: "pending" | "confirmed" | "ignored" | "duplicate";
};
```

---

## 10. Reglas de negocio

## 10.1 Reparto de quincena

El sistema debe permitir registrar ingresos quincenales y sugerir una distribución.

Distribución base esperada:

```text
Ingreso aproximado: $9,250
- Pago tarjetas: $2,500
- Ahorro: $2,500–$3,000
- Fijos: $1,000
- Libre: resto
```

La distribución puede variar si existe un pago fuerte próximo o si una tarjeta tiene un saldo mayor.

---

## 10.2 Pago de tarjetas

La cuenta “Pago tarjetas” representa dinero reservado para liquidar tarjetas.

Debe cubrir:

* BBVA;
* Liverpool;
* cualquier otra tarjeta futura;
* parcialidades de MSI;
* pagos exigibles del ciclo.

---

## 10.3 Uso de BBVA

La tarjeta BBVA se usará principalmente para gastos normales y relativamente controlables:

* Uber/Didi;
* comida/salidas normales;
* Claude;
* Codex;
* Spotify/iCloud;
* MSI existentes.

Presupuesto personal estimado:

```text
$4,500–$5,500 por ciclo
```

---

## 10.4 Uso de débito/libre

El dinero libre se usará para gastos variables y ocasionales:

* regalos;
* compras random;
* Bama/Oxxo;
* cerveza/cigarros;
* Amazon ocasional;
* ropa;
* cine;
* perfume;
* otros gustos.

Regla:

> Si Libre llega a cero, el sistema debe alertar. No se debe recomendar usar tarjeta para compensarlo.

---

## 10.5 Ahorro

El ahorro es una cuenta/sobre destinada a acumular capital.

Meta inicial:

```text
$48,000
```

Ahorro mensual deseado:

```text
$5,000–$6,000
```

---

## 10.6 Fijos

La cuenta “Fijos” debe cubrir pagos obligatorios como:

* MacBook: $1,400, pago día 21.
* Internet: $500.
* Otros pagos fijos fuera de tarjeta.

Monto mensual estimado:

```text
$1,900
```

---

## 10.7 Liverpool y tarjetas departamentales

El sistema debe soportar tarjetas departamentales como Liverpool.

Cada tarjeta debe tener:

* nombre;
* tipo;
* corte;
* fecha límite de pago;
* presupuesto personal;
* pagos próximos;
* MSI asociados;
* ciclos propios.

---

## 10.8 MSI

Los MSI deben manejarse como compromisos mensuales temporales.

El sistema debe distinguir entre:

* monto original de compra;
* parcialidad mensual;
* tarjeta asociada;
* número de parcialidad actual;
* número total de parcialidades;
* saldo pendiente.

---

## 10.9 Exceso de presupuesto

Si una categoría, cuenta o tarjeta excede su presupuesto, el sistema debe:

* mostrar alerta visual;
* indicar cuánto se excedió;
* proyectar impacto en ahorro;
* no bloquear el registro del gasto;
* marcar el gasto como fuera de presupuesto.

---

## 10.10 Ciclos de tarjeta

Los ciclos de tarjeta deben calcularse por fecha de corte, no por mes calendario.

Ejemplo:

```text
Corte día 5
Ciclo: día 6 al día 5 del siguiente mes
Pago: día 25 del siguiente mes
```

Un gasto del 30 de abril y uno del 3 de mayo pueden pertenecer al mismo ciclo si caen antes del corte.

---

## 10.11 Duplicados

Para detectar duplicados se debe generar una huella:

```text
fecha + comercio_normalizado + monto + cuenta
```

Ejemplo:

```text
2026-05-09|DIDI|69.60|BBVA
```

Si un movimiento importado coincide con una huella existente, debe marcarse como duplicado o posible duplicado.

---

## 10.12 Normalización de comercios

El sistema debe normalizar nombres similares.

Ejemplos:

```text
DLO*UBER RIDE → UBER
UBER RIDE → UBER
DLO*TDA UBER RIDES → UBER
DIDI RIDES → DIDI
DLO DIDI RIDES MX → DIDI
```

---

## 11. Reglas iniciales de categorización

```text
UBER / DLO*UBER / UBER RIDE → Transporte
DIDI / DLO DIDI RIDES / DIDI PAYIN → Transporte
RAPPI / UBER EATS / DIDI FOOD → Comida/salidas
CLAUDE.AI → Tools/subs
CODEX / OPENAI → Tools/subs
SPOTIFY → Tools/subs
ICLOUD / APPLE → Tools/subs
BAMA / OXXO → Libre
AMAZON → Libre
MERCADO PAGO → Revisar
LIVERPOOL → Revisar / Liverpool
```

Las reglas deben poder editarse en el futuro.

---

## 12. Pantallas principales

## 12.1 Dashboard

Debe mostrar:

* ingreso registrado del periodo;
* ahorro actual;
* avance hacia meta;
* pagos próximos;
* gasto de tarjetas;
* presupuesto usado;
* dinero libre;
* alertas.

---

## 12.2 Cuentas/sobres

Debe mostrar cuentas como:

* Ahorro.
* Pago tarjetas.
* Fijos.
* Libre.
* BBVA.
* Liverpool.

---

## 12.3 Tarjetas

Debe mostrar por tarjeta:

* ciclo actual;
* fecha de corte;
* fecha límite de pago;
* presupuesto personal;
* gasto actual;
* saldo/pago estimado;
* MSI;
* movimientos.

---

## 12.4 Distribución de ingreso

Debe permitir registrar una quincena y distribuirla entre sobres.

---

## 12.5 Registro de gasto

Debe permitir capturar:

* monto;
* fecha;
* cuenta;
* tarjeta;
* categoría;
* descripción;
* método de pago.

---

## 12.6 Importación por captura

Debe permitir:

* subir imagen;
* ver movimientos detectados;
* editar campos;
* confirmar;
* ignorar;
* marcar duplicados.

---

## 12.7 Importación por PDF

Debe permitir:

* subir estado de cuenta;
* detectar movimientos;
* revisar;
* confirmar;
* generar análisis.

---

## 13. Criterios de aceptación globales

El sistema será aceptable si permite:

* registrar ingresos quincenales;
* repartir ingresos en sobres;
* visualizar dinero comprometido;
* manejar varias tarjetas;
* asignar gastos a ciclos reales;
* registrar MSI;
* saber cuánto se debe pagar por tarjeta;
* controlar presupuesto personal de tarjeta;
* controlar dinero libre;
* visualizar avance de ahorro;
* importar capturas con revisión;
* importar PDFs con análisis;
* detectar duplicados;
* evitar depender de cálculos mentales.

---

## 14. Criterios de éxito personal

El proyecto será exitoso si ayuda a:

* mantener la tarjeta BBVA alrededor de $4,500–$5,500 por ciclo;
* ahorrar $5,000–$6,000 mensuales;
* llegar a $48,000 de ahorro;
* separar gastos libres de gastos de tarjeta;
* no usar tarjeta para compensar dinero libre agotado;
* pagar tarjetas completas y a tiempo;
* visualizar pagos próximos;
* entender por qué un ciclo se disparó;
* tomar decisiones antes del corte.

---

## 15. Enfoque de desarrollo

El desarrollo seguirá spec-driven development.

Orden de trabajo:

1. Validar este contrato técnico.
2. Crear ERD.
3. Crear Prisma schema.
4. Definir estructura de carpetas.
5. Definir pantallas y flujos.
6. Implementar versión 1.
7. Implementar versión 2.
8. Implementar versión 3.
9. Preparar interfaz futura para IA.

---

## 16. Decisiones finales actuales

* La app será una PWA con Next.js.
* No se usará NestJS al inicio.
* Se usará PostgreSQL y Prisma.
* No se usará LocalStorage como persistencia principal.
* La app soportará varias tarjetas desde el inicio.
* La app soportará tarjetas departamentales como Liverpool.
* Los ciclos de tarjeta se calcularán por fecha de corte.
* El ahorro será una cuenta separada, no fondo de emergencia.
* Los gastos libres se pagarán preferentemente con débito/libre.
* La tarjeta se usará para gastos recurrentes/controlados.
* La IA queda para futuro.
* OCR y reglas se implementarán antes que IA.
* Toda importación requerirá revisión manual antes de guardar.

---

## 17. Resumen ejecutivo

Este sistema será una aplicación personal de finanzas construida como PWA con Next.js, PostgreSQL y Prisma. Permitirá controlar ingresos, gastos, tarjetas, sobres, metas y pagos próximos.

El sistema no busca solamente registrar gastos, sino dar visibilidad financiera en tiempo real: cuánto se ha gastado, cuánto queda, cuánto está comprometido y si el usuario va en camino a sus metas de ahorro.

El MVP se construirá sin IA, usando reglas, OCR, parsing y revisión manual. La arquitectura quedará preparada para integrar IA en el futuro sin rehacer el sistema.

El objetivo final es construir una herramienta que ayude al usuario a tomar mejores decisiones financieras antes de que termine el ciclo, evitando depender de cálculos mentales o de la limitada visualización de las aplicaciones bancarias.
