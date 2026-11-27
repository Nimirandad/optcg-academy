# Decisiones (ADR)

Estados: **Aceptada** (viene de `plan.md` o la autorizó el propietario), **Propuesta** (no aplicar sin aprobación), **Reemplazada**.

## ADR-001 — Stack del plan · Aceptada

Astro estático sin Starlight, islas Svelte, TypeScript estricto, CSS nativo, Content Collections, JSON + Zod, Pagefind, localStorage versionado, Vitest, Playwright, GitHub Actions y Pages, npm. Sin React, Tailwind, SPA, servidor, cuentas ni base de datos. Fuente: `plan.md` §2.

## ADR-002 — Registro de decisiones y tareas · Aceptada (2026-11-26)

Este archivo es el registro de ADR; `docs/adr/` se usará solo si una decisión necesita anexo. `TASKS.md` sustituye a los issues mientras no exista repositorio remoto. **Desviación** de §10 y §14.

## ADR-003 — Node · Aceptada (2026-11-26)

Fijar Node 24 LTS (`.nvmrc`, `engines`, CI). Aplicado el 2026-11-27 con 24.22.3: según el calendario oficial, 24 está en mantenimiento (fin 2028-04-30) y 26 es LTS desde 2026-10-28; se mantiene la 24 aprobada. El equipo local tiene 22.23.5, que cumple el mínimo de Astro 7 (≥22.23.4) pero exigiría instalar 24 o fijar 22. Confirmar el calendario oficial de LTS antes de aplicar.

## ADR-004 — TypeScript 6.0.x · Aceptada (2026-11-26)

TypeScript 7.0.2 queda fuera de los rangos de `@astrojs/svelte` (^5.3.3 || ^6.0.0) y `@astrojs/check` (^5 || ^6). Usar 6.0.3 y revisar cuando se amplíen.

## ADR-005 — Dependencias adicionales · Aceptada (2026-11-26)

| Paquete (dev) | Motivo en el plan | Recomendación |
|---|---|---|
| `@astrojs/check` | typecheck (§9, §11) | Incluir |
| `@astrojs/sitemap` | sitemap (§11) | Incluir |
| `@astrojs/mdx` | MDX (§2) | Incluir cuando haya contenido que lo requiera |
| ESLint y plugins de Astro/Svelte/TS | "lint" en CI (§9) | Incluir, configuración mínima |
| `@axe-core/playwright` | accesibilidad automatizada (§11) | Incluir en Fase 1 |
| Prettier, Lighthouse CI | no exigidos como paquete | No incluir por ahora |
| `nanostores` | solo con estado compartido real (§2) | No incluir aún |
| Parser de PDF/HTML para sync | §9 | Decidir en Fase 6 |

## ADR-006 — Contenido de Bandai y acceso automatizado · Aceptada (2026-11-26)

El sitio oficial indica que sus textos, imágenes y datos no se reproducen sin permiso.

- Guardar solo identificadores y datos factuales necesarios (número, nombre, categoría, color, coste, bloque), con fuente.
- `effect` y `trigger` opcionales y vacíos sin permiso; explicaciones propias y enlaces.
- No versionar PDF ni imágenes oficiales en un repositorio público; incluye `references/rule_comprehensive.pdf`, que debe quedar en `.gitignore`.
- Q&A: metadatos, enlace y explicación propia.
- Sincronización: desarrollar con fixtures; activar consultas reales solo tras decidir, idealmente con consulta a Bandai.

Esto no es asesoría legal; tampoco garantiza que los datos factuales estén libres de restricciones.

## ADR-007 — Ajustes de modelos de datos · Aceptada (2026-11-26)

Amplía §8 ("campos orientativos"): `Card` con `name`, `attributes`, `rarity`, `trigger`; `Rule.title` opcional y `sourceLabel` para IDs atípicos; `FormatSnapshot` con `bannedPairs`, `blockWindow` y `blockExceptions` con vigencia. `data/qa` contiene metadatos y `content/qa` explicaciones.

## ADR-008 — Legalidad conservadora · Aceptada (2026-11-26)

La legalidad se evalúa por carta (bloque, excepciones, restricciones) y fecha efectiva, nunca solo por set. Si falta el dato: `unknown`. El mapeo OP-17–20 = bloque 5 es una inferencia y no basta para validar. Si Bandai no indica zona horaria, aplicar la restricción desde el inicio de la fecha en la zona más temprana. En el cliente se reevalúa la fecha; sin JavaScript solo se muestra la fecha de validación, sin afirmar vigencia.

## ADR-009 — Despliegue de la Fase 1 · Aceptada (2026-11-26)

La subruta se prueba en local con `astro preview` y Playwright. El despliegue en Pages que exige §12 se hace solo con autorización expresa; hasta entonces el criterio de salida queda abierto.

## ADR-010 — Revisión humana · Aceptada

El propietario, junto con las personas con las que juega, revisa el contenido (2026-11-26). No se asume que sea revisión de un juez: las ambigüedades del reglamento quedan en `pending` o `conflict` hasta tener respaldo oficial.

## ADR-011 — Creación del repositorio · Aceptada

El repositorio no existe y se creará con GitHub CLI (2026-11-26). `gh` instalado y con sesión iniciada. Creado el 2026-11-27: `Nimirandad/optcg-academy`, público; primer push autorizado el 2026-11-27.

## ADR-012 — Aprobación de la Fase 0 con revisión pendiente · Aceptada (2026-11-27)

El propietario aprobó la Fase 0 para avanzar antes de completar la revisión humana del inventario (T0.8). T0.8 sigue abierta, `extraction.humanReview` y las reglas siguen en `pending`, y T0.8 pasa a ser requisito de la Fase 2. Se aparta de la dependencia original de T0.11.

## ADR-013 — Implementación de la base · Aceptada para la Fase 1, a revisar por el propietario

- Se añade la ruta `/buscar/`, no listada en `plan.md` §3, para el buscador global.
- Paquetes de apoyo al lint y a los tipos, además de ADR-005: `@eslint/js`, `typescript-eslint`, `astro-eslint-parser`, `svelte-eslint-parser`, `globals` y `@types/node`.
- `npm run check` no revisa tipos dentro de `.svelte`; haría falta `svelte-check`, que no está aprobado.
- Playwright usa el Chromium completo (`channel: 'chromium'`). Solo se prueba Chromium.
- `astro preview` se ejecuta con `--ignore-lock` en las pruebas para que no pase a segundo plano.
- `deploy.yml` es solo manual (ADR-009), aunque `plan.md` §9 admite desplegar desde `main`.
- El repositorio es `Nimirandad/optcg-academy`, público; los commits usan el correo personal, configurado solo en este repositorio (2026-11-27).

El despliegue de prueba y la activación de Pages se autorizaron y ejecutaron el 2026-11-27 (ADR-009).

## Aclaraciones de la Fase 0

- Se añadieron `docs/sources/` y `docs/coverage/` (previstos en §10) para el informe y el inventario.
- El inventario guarda IDs y páginas, sin texto del reglamento.
