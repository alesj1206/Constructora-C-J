# Stack Tecnológico — Sistema de Control de Inventario de Obra
## Constructora C&J S.A.S.

<!--
Define la pila tecnológica del proyecto y justifica cada decisión contra la
Constitución (ver spec/constitution.md). Toda tecnología listada aquí debe poder
defenderse frente a los Artículos I–VII. Si una decisión futura contradice este
documento, primero se enmienda este documento (o la constitución).
-->

**Versión:** 1.1.0
**Fecha:** 2026-11-01
**Estado:** Vigente
**Relacionado con:** `spec/constitution.md`

---

## 0. Enmienda 1.1.0 — Backend: MySQL local en vez de Supabase

> Por decisión del equipo, el backend **no usa Supabase**. Se usa una base de
> datos **MySQL local** administrada por el propio equipo.
>
> **Implicaciones para la web admin (ya implementadas):**
> - **Base de datos:** MySQL 8.0 (`constructora_cj`), driver `mysql2`. La app se
>   conecta con un usuario no-root (`cj_app`).
> - **Autenticación propia:** credenciales en la tabla `users`, contraseñas con
>   hash **bcrypt** (`bcryptjs`), verificadas en el servidor.
> - **Sesión:** cookie **JWT** firmada, HTTP-only (`jose`), sin tabla de sesiones.
> - **Clean Architecture intacta:** el cambio solo afectó la capa `data/` + `lib/`
>   y añadió server actions; el `domain/` y la UI no cambiaron.
> - Variables de entorno: `MYSQL_*` y `AUTH_JWT_SECRET` en `.env.local`.
> - La migración vive en `web-admin/db/0001_init.sql`.
>
> Las secciones 3 (Supabase) y partes de la 4/5 que mencionan Supabase quedan
> como **contexto histórico** del análisis; prevalece esta enmienda.

---

## 1. Resumen ejecutivo

El sistema se compone de tres piezas que comparten **una sola fuente de verdad**:

| Pieza | Para quién | Tecnología recomendada |
|-------|-----------|------------------------|
| **App móvil de obra** | Almacenista, operarios en sitio | **Flutter** (Android/iOS) con sincronización *offline-first* |
| **Web de administración** | Gerencia, ingeniero residente, contador | **Next.js + React + TypeScript** |
| **Backend / base de datos** | Fuente única de verdad y sincronización | **Supabase** (PostgreSQL + Auth + Storage + API + Realtime) |

Idea central: la app de obra y la web admin **no se hablan directamente entre
sí**. Ambas leen y escriben contra Supabase. La app funciona sin conexión y
sincroniza cuando vuelve la red; la web admin consulta en tiempo real el mismo
inventario. Esto resuelve el requisito de "enviar datos desde el móvil y
sincronizar con la web admin" de forma simple y confiable.

```
┌───────────────────────┐          ┌───────────────────────┐
│   App móvil de obra    │          │   Web de administración │
│       (Flutter)        │          │   (Next.js + React)     │
│  - Entradas            │          │  - Dashboard / Kardex   │
│  - Vales de salida     │          │  - Semáforo PP/SS       │
│  - Firma + foto        │          │  - Reportes y costos    │
│  - Caché local (SQLite)│          │  - Exportar a Excel     │
└───────────┬───────────┘          └───────────┬───────────┘
            │  sync al reconectar               │  tiempo real
            └───────────────┬───────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │      SUPABASE       │
                 │  PostgreSQL (verdad)│
                 │  Auth · Storage     │
                 │  API REST/Realtime  │
                 │  Backups en la nube │
                 └─────────────────────┘
                            │  exportación manual (Excel)
                            ▼
                   SIIGO (contabilidad, sin cambios)
```

---

## 2. Principios que guían la elección (anclados a la Constitución)

- **Bajo costo y construible en semanas** (Art. II): todas las piezas tienen
  nivel gratuito o muy económico para una microempresa y tienen ecosistema
  maduro con documentación abundante.
- **Una sola fuente de verdad + respaldo en nube** (Art. III y V): una base de
  datos relacional central (PostgreSQL) con backups automáticos.
- **Funciona en obra con conectividad intermitente** (Art. IV): la app móvil es
  *offline-first*; no se pierde un registro ya capturado si se cae la red.
- **Integridad del Kardex** (Art. III): PostgreSQL ofrece transacciones ACID y
  restricciones que protegen `Saldo = Inicial + Entradas − Salidas`.
- **Sin sobreingeniería** (Art. II): nada de IA, ESB, microservicios ni colas.
  Un backend gestionado (BaaS) evita montar y mantener servidores.
- **Español y usabilidad de campo** (Art. IV): Flutter permite firma en
  pantalla, cámara para remisión y formularios simples en un solo código.

---

## 3. Backend y base de datos — **Supabase**

**Qué es:** plataforma *Backend-as-a-Service* de código abierto construida sobre
**PostgreSQL**. Entrega base de datos, autenticación, almacenamiento de archivos,
API automática (REST y en tiempo real) y backups, sin administrar servidores.

**Por qué para C&J:**

- **PostgreSQL = modelo relacional** ideal para inventario: catálogo de
  materiales, órdenes de compra, entradas, salidas (vales) y el Kardex calculado
  encajan en tablas con relaciones y restricciones.
- **Integridad garantizada:** transacciones ACID, llaves foráneas, `CHECK`
  (ej. cantidades ≥ 0) y vistas para el saldo. Esto hace cumplir el Artículo III
  a nivel de datos, no solo de interfaz.
- **Row Level Security (RLS):** permisos por rol (almacenista, residente,
  gerente, contador) directamente en la base de datos.
- **Backups en la nube automáticos:** satisface la "estrategia de respaldo
  híbrida" del Artículo V y supera la dependencia de respaldos físicos locales.
- **API y Realtime automáticos:** la web admin ve cambios de stock al instante
  sin construir una capa de API propia.
- **Storage:** para las fotos de remisión y los comprobantes de firma.
- **Costo:** plan gratuito suficiente para arrancar; escalado económico.

**Alternativa considerada:** **Firebase/Firestore**. Muy bueno en sincronización
offline, pero su modelo NoSQL complica los cálculos relacionales del Kardex y los
reportes por obra/periodo. Para inventario con reglas de saldo, PostgreSQL es más
natural. Se documenta como descartada por este motivo.

---

## 4. App móvil de obra — **Flutter**

**Qué es:** framework de Google para crear apps nativas de Android e iOS desde un
**único código** en el lenguaje Dart.

**Por qué para C&J:**

- **Un solo código, dos plataformas:** menos trabajo para un equipo pequeño
  (Art. II). Corre en los teléfonos del personal de obra sin reescrituras.
- **Offline-first real:** caché local en el dispositivo (SQLite) para registrar
  entradas y vales **sin conexión**; la sincronización ocurre al reconectar.
  Cumple el Artículo IV (conectividad intermitente, sin pérdida de registros).
- **Capacidades de campo nativas:** captura de **firma en pantalla** del operario
  y **cámara** para adjuntar la foto de la remisión, tal como piden las historias
  HU-01 y HU-02.
- **UI simple y rápida:** formularios con listas desplegables y pocos campos,
  pensados para personal no técnico y uso a una mano.
- **Integración directa con Supabase:** paquete oficial `supabase_flutter`.

**Estrategia de sincronización (offline-first):**

- **Opción base (recomendada para empezar):** `supabase_flutter` + caché local
  en SQLite (p. ej. `drift`), con una cola de operaciones pendientes y resolución
  de conflictos por *última escritura gana* (timestamp). Suficiente para el
  volumen de una microempresa.
- **Opción de evolución (si el offline se vuelve crítico):** **PowerSync**, que
  sincroniza automáticamente PostgreSQL de Supabase con un SQLite local en cada
  dispositivo. Se adopta solo si la opción base se queda corta (Art. II: la
  complejidad se gana cuando hay un problema real).

**Alternativa considerada:** una **PWA / web móvil** (mismo Next.js
responsive). Es más barata de mantener (una sola base web), pero el soporte
offline y el acceso a cámara/firma es más frágil en obra. Flutter se recomienda
por la experiencia de campo; si el presupuesto/tiempo aprieta, una PWA es el
"plan B" aceptable para HU-02/HU-01.

---

## 5. Web de administración — **Next.js + React + TypeScript**

**Qué es:** **React** es la librería de interfaz; **Next.js** es el framework que
la organiza en una aplicación web completa; **TypeScript** añade tipado estático
para menos errores.

**Por qué para C&J:**

- **Dashboard y Kardex en tiempo real:** tablas interactivas con el listado de
  insumos y el **semáforo** verde/amarillo/rojo según PP y SS (HU-03).
- **Reportes para gerencia:** informe quincenal de costos reales y desviaciones
  por obra (HU-06) sin digitación manual.
- **Exportación a Excel** en un clic para que el contador consulte en SIIGO
  (HU-07). Se implementa con una librería de hojas de cálculo (p. ej.
  `exceljs` / `SheetJS`).
- **Tipado (TypeScript):** reduce errores en cálculos de saldos y costos, acorde
  con la exigencia de integridad del Artículo III.
- **Despliegue sencillo y gratuito** en Vercel (fabricante de Next.js) o en
  cualquier hosting de Node.
- **Mismo backend:** usa `@supabase/supabase-js`; comparte datos y permisos (RLS)
  con la app móvil.

**Alternativa considerada:** **Vite + React** (sin Next.js). Más ligero, pero
Next.js aporta rutas, renderizado y despliegue listos. Para un panel admin con
reportes, Next.js ahorra tiempo. Aceptable usar Vite si el equipo prefiere algo
más minimalista.

---

## 6. Integración con SIIGO

- SIIGO **permanece sin cambios** como sistema de contabilidad y facturación
  (Art. I y V).
- La única interacción es **exportar consumos por obra y periodo a Excel** desde
  la web admin (HU-07). **No** se construye una integración automática por API en
  esta fase: sería sobreingeniería para el alcance y la madurez actuales (Art. II).

---

## 7. Herramientas de desarrollo y operación

| Área | Herramienta recomendada | Nota |
|------|-------------------------|------|
| Control de versiones | **Git + GitHub** | Ya se usa; backlog en GitHub Projects (Art. VII) |
| Gestión de backlog | **GitHub Projects** | Fuente única de trabajo pendiente |
| Lenguajes | **Dart** (móvil), **TypeScript** (web/admin), **SQL** (datos) | — |
| Estado (Flutter) | `provider` o `riverpod` | Empezar simple; Riverpod si crece |
| Estado/datos (web) | TanStack Query + cliente Supabase | Cacheo y refresco de datos |
| Estilos web | **Tailwind CSS** | Rápido y consistente |
| Base local móvil | **SQLite** (vía `drift`) | Caché offline |
| Excel | `exceljs` / `SheetJS` (web) | Exportación HU-07 |
| Pruebas | `flutter_test`, `vitest`/`jest` | Según el Artículo VI (criterios verificables) |
| Despliegue web | **Vercel** o hosting Node | Gratuito para empezar |
| Distribución móvil | APK directa / Google Play interno | Equipos de obra Android |

---

## 8. Versiones de referencia (al 2026-11-01)

> Fijar versiones exactas al iniciar cada módulo y mantenerlas pineadas.

- **Flutter:** última versión estable del canal `stable`.
- **Dart:** la incluida con el Flutter elegido.
- **`supabase_flutter`:** v2.x.
- **Next.js:** 16.x (estable actual).
- **React:** 19.x (la que traiga Next.js 16).
- **Node.js:** versión LTS activa.
- **PostgreSQL:** la gestionada por Supabase (15+).

---

## 9. Mapa historia de usuario → tecnología

| Historia | Dónde vive | Piezas tecnológicas |
|----------|-----------|---------------------|
| HU-00 Catálogo + ABC | Admin web (configuración) | Next.js + Supabase |
| HU-01 Entradas vs. orden de compra | App móvil | Flutter + cámara + Storage + Supabase |
| HU-02 Vale digital de salida | App móvil | Flutter + firma en pantalla + Supabase |
| HU-03 Stock en tiempo real + semáforo | Admin web (y consulta móvil) | Next.js + Supabase Realtime |
| HU-04 Conteo físico / conciliación | App móvil + admin | Flutter + Supabase |
| HU-05 Desviación de consumo | Admin web | Next.js + SQL (vistas) |
| HU-06 Informe quincenal | Admin web | Next.js + SQL |
| HU-07 Exportar a Excel | Admin web | Next.js + exceljs/SheetJS |

---

## 10. Resumen de la recomendación

- **Backend:** Supabase (PostgreSQL gestionado) — una fuente de verdad, backups
  en nube, integridad transaccional, API y tiempo real automáticos.
- **Móvil de obra:** Flutter, offline-first, con firma y cámara.
- **Web admin:** Next.js + React + TypeScript, con dashboard, semáforo, reportes
  y exportación a Excel.
- **Sincronización:** ambos clientes contra Supabase; la app móvil cachea local y
  sincroniza al reconectar.

Esta pila es de bajo costo, construible por un equipo pequeño en semanas,
mantenible, y respeta cada artículo de la constitución. Las opciones de bajo
código (AppSheet / Power Apps) que se usaron para **prototipar** siguen siendo
válidas como herramienta de validación temprana (Art. IV), pero para el producto
final se recomienda el desarrollo propio por control, costo de licencias a largo
plazo y ajuste exacto al proceso (Art. I y II).
