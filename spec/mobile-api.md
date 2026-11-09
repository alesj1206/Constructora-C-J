# API Móvil — Movimientos de material (MVP)
## Constructora C&J S.A.S.

<!--
API backend ligera para la app móvil que usan los obreros en campo.
Reutiliza los casos de uso e integridad del inventario ya existentes; es solo
una capa HTTP delgada. No duplica lógica ni cambia el esquema de BD.
-->

**Versión:** 1.0.0
**Fecha:** 2026-11-01
**Estado:** Implementada y validada
**Relacionado con:** `spec/constitution.md`, `spec/tech-stack.md`, `spec/code-standards.md`

---

## 1. Alcance (MVP)

Permite a los obreros registrar **salidas rápidas** de material desde el celular
con lo mínimo: **material + cantidad**. Decisiones de diseño del MVP:

- **Operario = usuario autenticado** (el obrero logueado). No se escribe aparte.
- **Frente de obra opcional** (se puede mandar o dejar vacío).
- **Sin firma** en móvil; la identidad queda por el token y `created_by`.
- La integridad del Kardex se mantiene: cada salida es un movimiento `out` en la
  misma ruta transaccional con bloqueo (`FOR UPDATE`) que impide stock negativo.

## 2. Autenticación

Todas las rutas requieren un **Bearer token** (el mismo JWT firmado del login):

```
Authorization: Bearer <jwt>
```

Sin token o inválido → `401`.

## 3. Endpoints

### GET `/api/mobile/materials`
Lista de materiales con saldo, para el selector del formulario móvil.

**Respuesta 200:**
```json
{
  "ok": true,
  "materials": [
    { "id": "…301", "code": "MAT-001", "description": "Cemento Gris 50kg (Argos)",
      "unit": "bultos", "balance": 25, "status": "critical" }
  ]
}
```

### POST `/api/mobile/movements`
Registra una salida de material.

**Request:**
```json
{
  "materialId": "33333333-3333-3333-3333-333333333301",
  "quantity": 10,
  "workFrontId": "2222…-201",   // opcional
  "note": "Vaciado piso 5"       // opcional
}
```

**Respuesta 201:**
```json
{
  "ok": true,
  "message": "Salida registrada. Stock actualizado: 15 bultos.",
  "movement": {
    "materialCode": "MAT-001", "materialDescription": "Cemento Gris 50kg (Argos)",
    "type": "out", "quantity": 10, "newBalance": 15, "unit": "bultos"
  }
}
```

## 4. Validaciones y errores (mensajes en español para el obrero)

| Situación | HTTP | Mensaje |
|-----------|------|---------|
| Sin token / inválido | 401 | Sesión expirada. Inicia sesión de nuevo. |
| Falta material | 400 | Selecciona un material. |
| Cantidad no numérica o ≤ 0 | 400 | La cantidad debe ser un número mayor a cero. |
| Material inexistente | 404 | El material seleccionado no existe. |
| Stock insuficiente | 409 | Stock insuficiente para el despacho. |
| Error interno | 500 | No se pudo registrar. Intenta de nuevo. |

> Los logs técnicos quedan en inglés (vía el tipo `Result`); los mensajes al
> usuario, en español.

## 5. Estructura (Clean Architecture)

```
src/
  app/api/mobile/
    materials/route.ts     # GET: lista con saldo (auth Bearer)
    movements/route.ts     # POST: valida payload -> caso de uso -> HTTP
  lib/
    api-auth.ts            # verifica el Bearer token (jose)
  features/inventory/
    domain/usecases/
      quick-movement-usecases.ts   # RegisterQuickIssue (material+cantidad)
    domain/repositories/           # + createQuickIssue, QuickIssueInput
    data/                          # reusa insertIssue (misma transacción)
```

- Los route handlers son delgados: parsean, validan tipos, llaman al caso de uso
  y traducen el `Result` a HTTP + mensaje ES. Nada de SQL en la capa HTTP.
- `RegisterQuickIssue` reutiliza el repositorio y su transacción → no se duplica
  la lógica del inventario (la comparte con la web admin).
- **Sin cambios de esquema de BD.** `work_front_id` y `signature_data` ya eran
  nulos; el datasource ahora guarda NULL cuando vienen vacíos.

## 6. Validación en runtime (01-11-2026)

| Caso | Resultado |
|------|-----------|
| GET materiales con token | ✅ 200, 4 materiales con saldo y semáforo |
| GET sin token | ✅ 401 |
| POST salida válida (3 un) | ✅ 201, saldo 25 → 22 |
| POST stock insuficiente (99999) | ✅ 409, rechazado por el guard transaccional |
| POST material inexistente | ✅ 404 |
| POST cantidad negativa / cero | ✅ 400 |

## 7. Sobre la "automatización posterior" (Power Automate / Excel)

Recomendación: la automatización **consume** esta API o la exportación a Excel
existente (`/api/reports/export`); no se inserta en el flujo de escritura diario,
para no romper la integridad transaccional del Kardex.
