# Backlog — Segunda Entrega (Sprint 2)
## Constructora C&J S.A.S.

<!--
Historias de usuario documentadas para la SEGUNDA entrega. No forman parte del
MVP de la primera entrega, pero su código y esquema de base de datos YA EXISTEN
en el proyecto (ocultos de la navegación). Este documento describe qué entra en
la próxima entrega y por qué se pospuso.
-->

**Versión:** 1.0.0
**Fecha:** 2026-11-01
**Estado:** Planeado (no expuesto en el MVP)
**Relacionado con:** `spec/constitution.md`, `spec/tech-stack.md`, `spec/code-standards.md`

---

## 1. Contexto

La primera entrega (MVP) cubre el **flujo operativo diario** del almacén con dos
pantallas:

- **Pantalla A — Inventario (hub):** Kardex en tiempo real con semáforo PP/SS
  (HU-03) y acciones de entrada (HU-01) y salida con firma (HU-02) como modales.
- **Pantalla B — Catálogo:** alta y listado de materiales (HU-00).

La segunda entrega añade la **capa de control y reportería**: conciliación,
desviación de consumo, informe de costos y exportación a Excel. Estas historias
dependen de datos que solo maduran tras varias quincenas de uso real, por lo que
se posponen de forma deliberada.

> Nota técnica: las cuatro historias de esta entrega **ya están implementadas y
> validadas** (rutas `/reconciliation`, `/reports` y `/api/reports/export`), pero
> están **ocultas de la navegación** del MVP. La segunda entrega consiste en
> exponerlas (p. ej. en una Pantalla "Gestión" con pestañas) y refinarlas con el
> uso real.

---

## 2. Historias de usuario de la segunda entrega

### HU-04 — Conteo físico y conciliación
- **Como** almacenista, **quiero** registrar el conteo físico y ver la diferencia
  contra el saldo del sistema, **para** conciliar cada 15 días.
- **Criterio de aceptación:** dado que el almacenista ingresa la cantidad contada
  de un material, cuando guarda el conteo, entonces el sistema calcula
  automáticamente la diferencia entre el conteo físico y el saldo del sistema.
- **Por qué se pospone:** es control de cierre (quincenal), no operación diaria.
  Sostiene la meta estratégica de reducir pérdidas en 20% para 2028, así que es
  la primera candidata a exponerse en la segunda entrega.

### HU-05 — Desviación de consumo real vs. planificado
- **Como** ingeniero residente, **quiero** comparar el consumo real con el
  planificado por actividad, **para** detectar desviaciones a tiempo.
- **Criterio de aceptación:** dado que existe un consumo planificado para una
  actividad y se han registrado vales de salida asociados, cuando el residente
  consulta la actividad, entonces el sistema muestra la desviación en porcentaje
  entre el consumo real y el planificado.
- **Por qué se pospone:** depende de cargar el **consumo planificado** por
  actividad, un dato que la empresa aún no maneja estructurado (viene del
  cronograma del residente). Es la historia más dependiente de datos externos.

### HU-06 — Informe quincenal de costos por obra
- **Como** gerente, **quiero** un informe quincenal de costos reales y
  desviaciones por obra, **para** decidir con información oportuna.
- **Criterio de aceptación:** dado que termina la quincena, cuando el gerente
  solicita el informe, entonces el sistema lo genera sin digitación manual.
- **Por qué se pospone:** cobra valor tras acumular varias quincenas de
  movimientos reales; en el MVP no habría datos suficientes.

### HU-07 — Exportar consumos a Excel para SIIGO
- **Como** contador, **quiero** exportar los consumos por obra a Excel, **para**
  consultarlos al hacer la contabilidad en SIIGO.
- **Criterio de aceptación:** dado que el contador selecciona una obra y un
  periodo, cuando pulsa exportar, entonces el sistema genera en un solo clic un
  archivo de Excel.
- **Por qué se pospone:** es una integración "nice-to-have"; el contador puede
  esperar a que la operación diaria esté consolidada.

---

## 3. Propuesta de UI para la segunda entrega

Exponer estas historias en una **Pantalla "Gestión"** accesible desde el hub,
organizada con **pestañas** (no rutas fragmentadas):

- Conciliación (HU-04)
- Desviación de consumo (HU-05)
- Reportes y Excel (HU-06, HU-07)

Esto mantiene el principio del MVP: el día a día vive en Inventario; lo
administrativo/quincenal se agrupa en un solo lugar de uso ocasional.

---

## 4. Estado técnico actual (ya construido)

| HU | Ruta existente | Estado |
|----|----------------|--------|
| HU-04 | `/reconciliation` | Implementada, oculta de navegación |
| HU-05 | `/reconciliation` (sección desviación) | Implementada, oculta |
| HU-06 | `/reports` | Implementada, oculta |
| HU-07 | `/api/reports/export` | Implementada, oculta |

La base de datos (`db/0002_inventory.sql`) ya incluye las tablas necesarias
(`planned_consumption`, `stock_movements` con tipo `adjust`, etc.). La segunda
entrega no requiere cambios de esquema, solo exponer y refinar la UI.
