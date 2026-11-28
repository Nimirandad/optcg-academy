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
- [x] T0.8 Revisión visual de las 28 páginas contra el inventario, incluidas marcas en rojo. Dep.: T0.2. Hoja: `docs/coverage/revision-reglamento-T0.8.xlsx`. Verif.: `extraction.humanReview` actualizado por una persona. Cerrada el 2026-11-27 por declaración del propietario, sin completar la hoja (ADR-014).
- [x] T0.9 Reconfirmar avisos de restricciones, erratas, "VIEW MORE" de Q&A y listados de booster y starter. Verif.: informe §4–7. La categoría "others" de productos pasa a T5.4.
- [x] T0.10 Decidir ADR-002 a ADR-009. Verif.: aprobadas por el propietario el 2026-11-26.
- [x] T0.11 🔒 Aprobar fuente vigente y matriz de reglas (criterio de salida de la fase). Dep.: T0.7, T0.10. Aprobada por el propietario el 2026-11-27 con T0.8 pendiente (ADR-012).

## Fase 1 — Base (Dep.: T0.10)

Aprobada por el propietario el 2026-11-27.

- [x] T1.0 🔒 Instalar y autenticar `gh`; crear el repositorio con el nombre y la visibilidad confirmados (ADR-011). Verif.: `gh repo view` muestra el repositorio.
- [x] T1.1 🔒 `git init`, `.gitignore`, versión de Node fijada, scaffold Astro estático + Svelte + TS estricto, lockfile. Verif.: `npm ci && npm run build` en limpio.
- [x] T1.2 Scripts `dev`, `check`, `test`, `build`, `preview`; Vitest y Playwright con una prueba cada uno. Dep.: T1.1. Verif.: todos terminan con código 0.
- [x] T1.3 Tokens de diseño, modo claro/oscuro, layout, menú móvil, 404, aviso no oficial. Dep.: T1.1. Verif.: E2E a 320 px y teclado; contraste AA calculado.
- [x] T1.4 Rutas de `plan.md` §3 con estado "en construcción". Dep.: T1.3. Verif.: E2E recorre todas.
- [x] T1.5 `site`/`base` configurables, helper de enlaces con `BASE_URL`, sitemap, metadatos. Dep.: T1.0, T1.4. Verif.: E2E bajo subruta sin enlaces rotos.
- [x] T1.6 Pagefind tras el build; prueba de búsqueda `1-3-5-1`, "Blocker" y "Bloqueador". Dep.: T1.5.
- [x] T1.7 Esquemas Zod y colecciones de contenido iniciales, con fixtures ficticios. Dep.: T1.2. Verif.: datos inválidos hacen fallar `check`.
- [x] T1.8 `ci.yml` con permisos mínimos y acciones fijadas. Dep.: T1.2, T1.7. Verif.: mismos comandos en local; ejecución remota solo con repositorio. Ejecución remota correcta sobre `d6916a8` (2026-11-27): https://github.com/Nimirandad/optcg-academy/actions/runs/45939818536
- [x] T1.9 `deploy.yml` y README. Dep.: T1.5, T1.8. 🔒 despliegue de prueba. Desplegado el 2026-11-27 desde `d6916a8` en https://nimirandad.github.io/optcg-academy/; 70 de 72 pruebas contra el sitio publicado. Las 2 fallidas (canonical de la página 404) se corrigieron en `f7b085e`: 72 de 72 contra el sitio publicado.

## Fase 2 — Reglamento (Dep.: Fase 1; T0.8; T0.11)

- [x] T2.1 Validador de cobertura (faltantes, duplicados, referencias rotas) en CI. Verif.: fixtures que fallan por cada causa. Ejecutado en local el 2026-11-27; añadido a `ci.yml`, sin ejecución remota.
- [x] T2.2 Plantillas de capítulo, anclas por subregla y guía editorial. Dep.: T2.1. Guía: `docs/editorial.md`.
- [x] T2.3 Redactar caps. 1–3. Verif.: cobertura 100 % de esos IDs, estado `pending` hasta revisión. Hecho el 2026-11-27.
- [x] T2.4 Redactar caps. 4–7. Dep.: T2.2. Hecho el 2026-11-27; 5-1-2-4 en `conflict`.
- [x] T2.5 Redactar caps. 8–11. Dep.: T2.2. Hecho el 2026-11-27; 8-1-3-4-2 en `conflict`.
- [x] T2.6 Glosario bilingüe con keywords 10-1 y 10-2. Dep.: T2.5. 24 keywords, definiciones en `pending`.
- [x] T2.7 Metadatos de los 49 documentos Q&A (hash, fecha, set, estado) y extracción por posición de las tablas, con carga manual de respaldo. Base: `docs/sources/descargas-2026-11-26.json`. Dep.: T1.7. 49 documentos y 1.502 preguntas indexadas el 2026-11-27 desde los PDF del 2026-11-26 (hashes verificados). 14 filas por comprobar y 1 fila vacía en el original (EB04-038).
- [x] T2.8 Revisar aclaraciones: generales primero, luego sets legales, luego históricos. Dep.: T2.7. Verif.: porcentaje y pendientes publicados. Borrador completo el 2026-11-27: 1.502 de 1.502 explicadas (100 %), 12 en `conflict`, 0 revisadas por una persona (T2.10). Orden seguido: generales y luego por fecha de documento; la legalidad por set no está determinada.
- [x] T2.9 Páginas Q&A, erratas y conflictos visibles. Dep.: T2.7. Índice, 49 páginas por documento, erratas y conflictos; probado en local.
- [x] T2.10 🔒 Revisión humana de contenido. Dep.: T2.3–T2.9. Hoja preparada: `docs/coverage/revision-contenido-T2.10.csv`. Solo una persona puede completarla. Revisión asistida previa del 2026-11-27: `docs/coverage/revision-asistida-2026-11-27.md`. Cerrada el 2026-11-27 por declaración del propietario, sin completar la hoja ni cambiar estados (ADR-018).

## Fase 3 — Academia (Dep.: T2.3–T2.5)

- [x] T3.1 Progreso en `localStorage` versionado con migración, borrado y errores. Verif.: unitarias. `src/lib/progress.ts`; unitarias el 2026-11-27.
- [x] T3.2 Componente de cuestionario con retroalimentación por opción. Verif.: unitarias y E2E. Unitarias y E2E el 2026-11-27.
- [x] T3.3 Lecciones niveles 1–2. Dep.: T3.1, T3.2. 9 lecciones y 27 preguntas, aprobadas por el propietario (ADR-043).
- [x] T3.4 Lecciones niveles 3–5. Dep.: T3.3. 15 lecciones más (24 en total), aprobadas por el propietario (ADR-043).
- [x] T3.5 Casos y desafíos. Dep.: T3.2, T2.8. 12 casos y 5 desafíos, aprobados por el propietario (ADR-043).
- [x] T3.6 🔒 Aprobación editorial y recorrido completo E2E. Recorrido E2E previo ejecutado el 2026-11-27 (112 de 112). El propietario confirmó la aprobación en ADR-043.

## Fase 4 — Simuladores (Dep.: Fase 1; reglas de caps. 3, 6–8, 10 revisadas)

- [x] T4.1 Estado inmutable y acciones tipadas en `domain/game` sin dependencias de framework. Verif.: unitarias y comprobación de imports. `tests/unit/game.test.ts`, 2026-11-27.
- [x] T4.2 Combate. Dep.: T4.1. Verif.: empate, ataque fallido, daño con 0 vidas, Blocker, Counter, Double Attack, Banish, Trigger. Unitarias y E2E el 2026-11-27.
- [x] T4.3 Turnos. Dep.: T4.1. Verif.: primer turno, DON!! deck con 1 y 0, acciones ilegales. Unitarias y E2E el 2026-11-27.
- [x] T4.4 Playmat con controles táctiles y de teclado. Dep.: T4.1. Verif.: límites 5 personajes/1 Stage; reemplazo no es K.O. Unitarias y E2E el 2026-11-27.
- [x] T4.5 Efectos guiados. Dep.: T4.1, T2.8. Verif.: orden de resolución, reemplazo, Once Per Turn. Unitarias y E2E el 2026-11-27; sin la prioridad ambigua de 8-1-3-4-2 (ADR-022).
- [x] T4.6 Límites de alcance visibles y accesibilidad. E2E con axe, teclado y 320 px el 2026-11-27. Lector de pantalla sin probar (T7.1).
- [x] T4.7 🔒 Aprobar los casos límite y el alcance (criterio de salida de la fase, `plan.md` §12). Aprobados por el propietario el 2026-11-27 (ADR-023).

## Fase 5 — Datos y mazos (Dep.: Fase 1; ADR-006; puede ir en paralelo con Fase 2)

Iniciada el 2026-11-27 (ADR-024).

- [x] T5.1 Esquemas `Card`, `Printing`, `Product`, `Source`, `FormatSnapshot`, `Deck`, `Validation` (ADR-007). `src/lib/deck-schemas.ts`; unitarias el 2026-11-27.
- [x] T5.2 Validador de legalidad. Dep.: T5.1. Verif.: fixtures de colores, cantidades, parejas, excepciones, bloque X, fechas límite 2026-11-27, 2027-04-01 y 2029-03-31. `src/domain/legality/`; `tests/unit/legality.test.ts` y `format.test.ts`, 2026-11-27. La fecha 2029-03-31 se prueba con un formato ficticio.
- [x] T5.3 Snapshots de formato vigente y futuro con fuentes. Dep.: T5.1, T0.9. 🔒 aprobación. `src/data/rotation/`; aprobados por el propietario el 2026-11-27 (ADR-028).
- [x] T5.4 Datos mínimos de cartas y productos para los mazos candidatos, bloque verificado por carta; revisar la categoría "others" de productos. Dep.: T5.1. ST-31 a ST-36: 90 cartas con 202 impresiones y bloque por impresión (ADR-028); "others" (13 páginas) revisada sin mazos preconstruidos. Unitarias el 2026-11-27; datos en `pending`.
- [x] T5.5 Rúbrica y puntuación con renormalización. Dep.: T5.1. `docs/rubrica.md` (propuesta, ADR-026); unitarias el 2026-11-27.
- [x] T5.6 Test de preferencias, colores y filtros. Dep.: T5.5. En `/mazos/`: siete Starter Decks y dos referencias construidas, filtros combinables en la URL y seis accesos directos por color (ADR-045). Presupuesto, dificultad, estilo y temática se habilitan al contar con datos. E2E de Mazos: 8 de 8 en Chromium de escritorio y 320 px el 2026-11-27, con axe para los filtros.
- [x] T5.7 🔒 Listas de mazos revisadas por una persona. Dep.: T5.2–T5.5. No elegir líderes antes. Falta la cantidad de cada carta: no aparece en las páginas oficiales consultadas. ST-31 a ST-35 cargadas en `pending` desde fuentes de terceros (ADR-029; `docs/coverage/listas-starter-T5.7.md`); ST-31 a ST-35 aprobadas por el propietario el 2026-11-27 sin cotejo físico (ADR-030). ST-36 pendiente, sin cantidades.
- [x] T5.8 Fichas, exportación en texto y avisos de caducidad (48 h / 7 días). Dep.: T5.7. Nueve fichas en `/mazos/[slug]/`. Cinco listas revisadas pasan por el validador con suspensiones. Las cuatro listas del ADR-047 se identifican como referencias. Fuentes y simulación de caducidad verificadas en escritorio y a 320 px. Los datos estratégicos, precios y la revisión de ST-36 siguen pendientes.

## Fase 6 — Automatización (Dep.: T2.1, T5.2; ADR-006)

Iniciada el 2026-11-27 (ADR-031).

- [x] T6.1 Adaptadores con timeout, reintentos, caché y hash, probados con fixtures. `scripts/sync/lib/` (ADR-032); `tests/integration/sync-adapters.test.ts` con datos ficticios y transporte simulado, 2026-11-27. Sin transporte real ni extractores de fuentes oficiales (T6.2).
- [x] T6.2 `sync-cards`, `sync-qa`, `sync-rules`, `sync-format`. Dep.: T6.1. 🔒 acceso real a fuentes. `npm run sync` (ADR-035), ejecutado el 2026-11-27 contra el sitio sin PDF: 76 de 76 fuentes, 0 diferencias (ADR-037). Workflows solo manuales (ADR-038), simulados en local sin red; **no ejecutados en GitHub**. Sin programación diaria ni PR. Cada nueva consulta requiere autorización.
- [x] T6.3 `validate-decks` y snapshot de seguridad. Dep.: T5.2. `npm run validate:decks`, `src/data/safety/` y `validate-decks.yml` (ADR-036); `tests/unit/safety.test.ts` y ejecución local, 2026-11-27. El workflow no se ha ejecutado en GitHub.
- [x] T6.4 Simulaciones de rotación, prohibición y fallo de fuente. Dep.: T6.2, T6.3. `tests/integration/simulations.test.ts` con datos ficticios y sitio simulado, en local el 2026-11-27 (ADR-039).
- [ ] T6.5 🔒 Verificar la incidencia y el permiso `issues: write` en GitHub (ADR-040). Simulación local aprobada con `gh` ficticio. El [workflow de formato en `main`](https://github.com/Nimirandad/optcg-academy/actions/runs/46084302100) se ejecutó con autorización el 2026-11-27. La comparación pasó sin diferencias ni fallos y GitHub omitió `avisar`. Falta verificar el camino de escritura de la incidencia.
- [x] T6.6 Rediseño visual e interactivo (ADR-033), incorporado a esta fase por el propietario el 2026-11-27. Portada, `/jugar/`, retos en cuatro lecciones, nueve temas de reglas y estilo común; diseño aprobado. `tests/unit/{combat,topics}.test.ts` y `tests/e2e/experience.spec.ts`. Temas aprobados en ADR-043; sin prueba con lector de pantalla.

## Fase 7 — Lanzamiento (Dep.: Fases 2–6)

Inicio de QA autorizado el 2026-11-27 (ADR-049). T6.5 sigue abierta.

- [ ] T7.1 Accesibilidad automatizada y manual. Axe y teclado comprobados en los recorridos principales. Pendiente confirmar la salida de VoiceOver.
- [x] T7.2 Lighthouse en laboratorio e imágenes. Cuatro rutas medidas después de optimizar el mapa y la portada. Ver informe de QA.
- [x] T7.3 Guías editorial, de mantenimiento y de rollback. `docs/editorial.md`, `docs/mantenimiento.md` y README actualizados.
- [x] T7.4 Revisión de permisos, créditos y datos personales en el artefacto local. Avisos y atribuciones comprobados. Ver informe de QA.
- [x] T7.5 Checklist de `plan.md` §13 revisado. Evidencia y pendientes en [el informe de QA](docs/coverage/qa-lanzamiento-2026-11-27.md).
- [ ] T7.6 🔒 Publicación.

## Fuera de alcance

PWA/offline, inglés, importación avanzada, contribuciones, dominio propio e integración con Oplay u OPTCGSim (incluido su spike).
