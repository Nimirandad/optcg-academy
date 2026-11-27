# Tareas

`plan.md` manda. Marca `[x]` solo cuando la verificación se haya ejecutado. "Dep." = dependencias. 🔒 = requiere decisión o autorización del propietario.

## Fase 0 — Descubrimiento

- [x] T0.1 Analizar `plan.md` y `references/`. Verif.: informe §10–11.
- [x] T0.2 Extraer inventario de IDs del PDF local. Verif.: 11 + 481, sin duplicados ni padres ausentes.
- [x] T0.3 Verificar reglamento publicado, rotación, restricciones y lanzamientos. Verif.: informe §2–5 con nivel de verificación.
- [x] T0.4 Inventariar documentos de Q&A y erratas (solo listados). Verif.: 49 enlaces PDF únicos.
- [x] T0.5 Revisar avisos de permisos y acceso. Verif.: informe §8.
- [x] T0.6 Crear `TASKS.md`, `PROGRESS.md`, `DECISIONS.md`, `AGENTS.md`.
- [x] T0.7 Descargar el PDF oficial y comparar versión y SHA-256. Verif.: idénticos (2026-11-26), informe §1.
- [ ] T0.8 Revisión visual de las 28 páginas contra el inventario, incluidas marcas en rojo. Dep.: T0.2. Hoja: `docs/coverage/revision-reglamento-T0.8.xlsx`. Verif.: `extraction.humanReview` actualizado por una persona.
- [x] T0.9 Reconfirmar avisos de restricciones, erratas, "VIEW MORE" de Q&A y listados de booster y starter. Verif.: informe §4–7. La categoría "others" de productos pasa a T5.4.
- [x] T0.10 Decidir ADR-002 a ADR-009. Verif.: aprobadas por el propietario el 2026-11-26.
- [x] T0.11 🔒 Aprobar fuente vigente y matriz de reglas (criterio de salida de la fase). Dep.: T0.7, T0.10. Aprobada por el propietario el 2026-11-27 con T0.8 pendiente (ADR-012).

## Fase 1 — Base (Dep.: T0.10)

- [x] T1.0 🔒 Instalar y autenticar `gh`; crear el repositorio con el nombre y la visibilidad confirmados (ADR-011). Verif.: `gh repo view` muestra el repositorio.
- [x] T1.1 🔒 `git init`, `.gitignore`, versión de Node fijada, scaffold Astro estático + Svelte + TS estricto, lockfile. Verif.: `npm ci && npm run build` en limpio.
- [x] T1.2 Scripts `dev`, `check`, `test`, `build`, `preview`; Vitest y Playwright con una prueba cada uno. Dep.: T1.1. Verif.: todos terminan con código 0.
- [x] T1.3 Tokens de diseño, modo claro/oscuro, layout, menú móvil, 404, aviso no oficial. Dep.: T1.1. Verif.: E2E a 320 px y teclado; contraste AA calculado.
- [x] T1.4 Rutas de `plan.md` §3 con estado "en construcción". Dep.: T1.3. Verif.: E2E recorre todas.
- [x] T1.5 `site`/`base` configurables, helper de enlaces con `BASE_URL`, sitemap, metadatos. Dep.: T1.0, T1.4. Verif.: E2E bajo subruta sin enlaces rotos.
- [x] T1.6 Pagefind tras el build; prueba de búsqueda `1-3-5-1`, "Blocker" y "Bloqueador". Dep.: T1.5.
- [x] T1.7 Esquemas Zod y colecciones de contenido iniciales, con fixtures ficticios. Dep.: T1.2. Verif.: datos inválidos hacen fallar `check`.
- [ ] T1.8 `ci.yml` con permisos mínimos y acciones fijadas. Dep.: T1.2, T1.7. Verif.: mismos comandos en local; ejecución remota solo con repositorio. Workflow escrito y comandos verificados en local (2026-11-27); falta la ejecución remota, que requiere push.
- [ ] T1.9 `deploy.yml` y README. Dep.: T1.5, T1.8. 🔒 despliegue de prueba. Archivos escritos (2026-11-27); sin ejecutar.

## Fase 2 — Reglamento (Dep.: Fase 1; T0.8; T0.11)

- [ ] T2.1 Validador de cobertura (faltantes, duplicados, referencias rotas) en CI. Verif.: fixtures que fallan por cada causa.
- [ ] T2.2 Plantillas de capítulo, anclas por subregla y guía editorial. Dep.: T2.1.
- [ ] T2.3 Redactar caps. 1–3. Verif.: cobertura 100 % de esos IDs, estado `pending` hasta revisión.
- [ ] T2.4 Redactar caps. 4–7. Dep.: T2.2.
- [ ] T2.5 Redactar caps. 8–11. Dep.: T2.2.
- [ ] T2.6 Glosario bilingüe con keywords 10-1 y 10-2. Dep.: T2.5.
- [ ] T2.7 Metadatos de los 49 documentos Q&A (hash, fecha, set, estado) y extracción por posición de las tablas, con carga manual de respaldo. Base: `docs/sources/descargas-2026-11-26.json`. Dep.: T1.7.
- [ ] T2.8 Revisar aclaraciones: generales primero, luego sets legales, luego históricos. Dep.: T2.7. Verif.: porcentaje y pendientes publicados.
- [ ] T2.9 Páginas Q&A, erratas y conflictos visibles. Dep.: T2.7.
- [ ] T2.10 🔒 Revisión humana de contenido. Dep.: T2.3–T2.9.

## Fase 3 — Academia (Dep.: T2.3–T2.5)

- [ ] T3.1 Progreso en `localStorage` versionado con migración, borrado y errores. Verif.: unitarias.
- [ ] T3.2 Componente de cuestionario con retroalimentación por opción. Verif.: unitarias y E2E.
- [ ] T3.3 Lecciones niveles 1–2. Dep.: T3.1, T3.2.
- [ ] T3.4 Lecciones niveles 3–5. Dep.: T3.3.
- [ ] T3.5 Casos y desafíos. Dep.: T3.2, T2.8.
- [ ] T3.6 🔒 Revisión humana y recorrido completo E2E.

## Fase 4 — Simuladores (Dep.: Fase 1; reglas de caps. 3, 6–8, 10 revisadas)

- [ ] T4.1 Estado inmutable y acciones tipadas en `domain/game` sin dependencias de framework. Verif.: unitarias y comprobación de imports.
- [ ] T4.2 Combate. Dep.: T4.1. Verif.: empate, ataque fallido, daño con 0 vidas, Blocker, Counter, Double Attack, Banish, Trigger.
- [ ] T4.3 Turnos. Dep.: T4.1. Verif.: primer turno, DON!! deck con 1 y 0, acciones ilegales.
- [ ] T4.4 Playmat con controles táctiles y de teclado. Dep.: T4.1. Verif.: límites 5 personajes/1 Stage; reemplazo no es K.O.
- [ ] T4.5 Efectos guiados. Dep.: T4.1, T2.8. Verif.: orden de resolución, reemplazo, Once Per Turn.
- [ ] T4.6 Límites de alcance visibles y accesibilidad.

## Fase 5 — Datos y mazos (Dep.: Fase 1; ADR-006; puede ir en paralelo con Fase 2)

- [ ] T5.1 Esquemas `Card`, `Printing`, `Product`, `Source`, `FormatSnapshot`, `Deck`, `Validation` (ADR-007).
- [ ] T5.2 Validador de legalidad. Dep.: T5.1. Verif.: fixtures de colores, cantidades, parejas, excepciones, bloque X, fechas límite 2026-11-27, 2027-04-01 y 2029-03-31.
- [ ] T5.3 Snapshots de formato vigente y futuro con fuentes. Dep.: T5.1, T0.9. 🔒 aprobación.
- [ ] T5.4 Datos mínimos de cartas y productos para los mazos candidatos, bloque verificado por carta; revisar la categoría "others" de productos. Dep.: T5.1.
- [ ] T5.5 Rúbrica y puntuación con renormalización. Dep.: T5.1.
- [ ] T5.6 Test de preferencias, colores y filtros. Dep.: T5.5.
- [ ] T5.7 🔒 Listas de mazos revisadas por una persona. Dep.: T5.2–T5.5. No elegir líderes antes.
- [ ] T5.8 Fichas, exportación en texto y avisos de caducidad (48 h / 7 días). Dep.: T5.7.

## Fase 6 — Automatización (Dep.: T2.1, T5.2; ADR-006)

- [ ] T6.1 Adaptadores con timeout, reintentos, caché y hash, probados con fixtures.
- [ ] T6.2 `sync-cards`, `sync-qa`, `sync-rules`, `sync-format`. Dep.: T6.1. 🔒 acceso real a fuentes.
- [ ] T6.3 `validate-decks` y snapshot de seguridad. Dep.: T5.2.
- [ ] T6.4 Simulaciones de rotación, prohibición y fallo de fuente. Dep.: T6.2, T6.3.
- [ ] T6.5 🔒 Permisos de GitHub para crear PR.

## Fase 7 — Lanzamiento (Dep.: Fases 2–6)

- [ ] T7.1 Accesibilidad automatizada y manual (teclado y lector).
- [ ] T7.2 Lighthouse en laboratorio e imágenes.
- [ ] T7.3 Guías editorial, de mantenimiento y de rollback.
- [ ] T7.4 Revisión de permisos, créditos y ausencia de datos personales.
- [ ] T7.5 Checklist de `plan.md` §13.
- [ ] T7.6 🔒 Publicación.

## Fuera de alcance

PWA/offline, inglés, importación avanzada, contribuciones, dominio propio e integración con Oplay u OPTCGSim (incluido su spike).
