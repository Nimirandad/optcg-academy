# Fase 0 — Informe de descubrimiento

**Fecha de consulta:** 2026-11-26 · **Región objetivo:** edición inglesa, NA/EU/OC/LATAM/ME · **Estado:** aprobado el 2026-11-27 (revisión humana T0.8 pendiente)

Niveles de verificación usados:

- **D** (directo): HTML oficial leído con `curl` y contrastado.
- **R** (resumido): página oficial leída solo mediante un lector que resume; reconfirmar antes de publicar.
- **I** (inferido): deducción propia, no declarada por Bandai.
- **—**: no verificado.

## 1. Fuente local del reglamento

| Dato | Valor |
|---|---|
| Archivo | `references/rule_comprehensive.pdf` (único documento en `references/`) |
| Versión | 1.2.1, actualizado 2026-08-28, 28 páginas |
| SHA-256 | `4709b6327b396ffa3cff9f773adfa560d4be66a3162aa4176b4523a552161bd0` |
| Vigencia | La página oficial de reglas muestra Comprehensive Rules con fecha 2026-08-28 (`rule_comprehensive.pdf?20260828`) (D). |
| Comparación (T0.7) | El PDF oficial descargado el 2026-11-26 es **idéntico byte a byte** a la copia local (mismo SHA-256). Vigencia confirmada a esa fecha (D). |

### Inventario

11 capítulos y 481 identificadores subordinados (492 en total), en [rules-inventory.json](../coverage/rules-inventory.json). La secuencia jerárquica no presenta saltos ni duplicados.

| Cap. | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Subreglas | 33 | 88 | 56 | 50 | 23 | 40 | 29 | 81 | 7 | 62 | 12 |

La extracción es automática. El 2026-11-27 el asistente cotejó visualmente las 28 páginas renderizadas: no halló IDs faltantes, sobrantes ni en otra página. Falta la revisión humana (tarea T0.8), con la hoja [revision-reglamento-T0.8.xlsx](../coverage/revision-reglamento-T0.8.xlsx). El inventario contiene IDs y páginas, no texto del PDF.

### Anomalías del PDF

| Elemento | Observación | Tratamiento propuesto |
|---|---|---|
| `8.4.`, `8.6.3.` | Puntos en lugar de guiones | ID canónico `8-4`, `8-6-3`; alias con la forma impresa |
| `2-10-4`, `2-13`, `3-1-2-1` | Falta el punto final | El extractor debe tolerarlo |
| `2-7-3`, `2-10-3`, `2-10-4`, `3-1-2-1`, `4-10-2`, `8-3-1-4`, `8-6-1` | Texto en rojo, total o parcial; en la portada también la versión y la fecha. Que marque cambios es una inferencia (I) | Confirmar en T0.8; revisar primero en la Fase 2 |
| `6-5-5-1` | Redacción dudosa sobre el cost area al dar DON!! | Consulta a revisor/juez |
| `7-1-2-3` | Posible errata: falta "to" | Anotar |
| `8-1-3-3-4` | Repite el contenido de `8-1-3-3` | Conservar ambos IDs |
| `8-1-3-3-5` | Lista I, II, III cuyo orden se altera al extraer texto | Transcribir según la imagen de la página 19 |
| `1-2-1-1-*`, `1-2-2-*`, `9-2-1-*` | Condiciones de derrota repetidas | Referencias cruzadas |
| `10-2-10-1` frente a `8-3-1-6` | DON!! −X se llama "condition" en una y costo de activación en otra | Consulta a revisor/juez; no armonizar por cuenta propia |
| `8-4-4` | Usa "skill" por "effect" | Anotar |
| Encabezados | Muchas subreglas no tienen título | `title` opcional en el modelo `Rule` |
| Símbolos | `(Symbol) Counter`, `①`, `「When Attacked」` | Revisión visual |

Los casos obligatorios de `plan.md` §4 y las listas de keywords 10-1 (7) y 10-2 (17) coinciden con la estructura del PDF. La coincidencia de contenido regla por regla se revisará en la Fase 2.

## 2. Documentos oficiales

Base: `https://en.onepiece-cardgame.com`

| Documento | Fecha mostrada | Ruta | Nivel |
|---|---|---|---|
| Comprehensive Rules | 2026-08-28 | `/pdf/rule_comprehensive.pdf?20260828` | D |
| Tournament Rules Manual | 2026-01-16 | `/pdf/tournament_rules_manual.pdf?20260116` | D |
| Rule Manual | 2023-06-23 | `/pdf/rule_manual.pdf?20230623` | D |
| Playsheet | 2025-09-29 | `/pdf/playsheet.pdf?20250929` | D |
| Resumen de reglas en español | 2024-03-11 | `/pdf/rule_overview_sheet_es.pdf?20240311` | D |
| Idiomas permitidos (LATAM: inglés) | 2025-11-07 | `/rules/announcements/lang_card_rule.php` | R |

De estos PDF solo se leyó el de Comprehensive Rules. El resumen en español es anterior a las reglas vigentes y no debe usarse como autoridad.

## 3. Formato Standard y rotación

Fuentes: `/topics/013.php` (2025-07-23) y `/news/blockicon-card.html` (2026-11-20). Nivel D.

| Periodo | Standard | Extra |
|---|---|---|
| 2026-04-01 a 2027-03-31 | Bloques 2–5 | Bloques 1–5 |
| 2027-04-01 a 2028-03-31 | Bloques 3–6 (salen 1 y 2) | Bloques 1–6 |

- Bandai redacta estos periodos como ejemplos ("for example, in tournaments from…").
- El número de bloque está impreso en la esquina inferior derecha. Booster 1–4 = bloque 1, 5–8 = bloque 2, "and so on".
- **I:** OP-17 a OP-20 serían bloque 5. No hay tabla oficial leída para EB, ST, PRB ni PEB. La legalidad debe resolverse **por carta**, no por set.
- Las Super Parallel y las cartas con su mismo número siguen siendo legales en Standard; las nuevas desde abril de 2026 llevan bloque "X". Lista oficial actualizada al 2026-11-20.
- 15 números se tratan como bloque 4, legales del 2026-04-01 al 2029-03-31: OP01-039, OP01-055, OP02-005, OP02-068, OP03-008, OP03-044, OP03-048, OP03-072, OP03-097, OP04-016, OP04-077, OP04-096, ST01-011, ST02-007, ST06-008.
- Cartas con bloque actualizado y reimpresas (al 2026-08-21): OP01-016, OP04-016, EB04-061. La página no indica el bloque resultante.
- OP04-016 figura en dos secciones; las secciones tienen fechas de actualización distintas.
- `/rules/blockicon/` responde 404 (R).
- No se encontró ninguna regla de bloques específica para Latinoamérica.

**La rotación del 2027-04-01 está a unos cuatro meses.** Toda recomendación debe mostrar su estado posterior.

## 4. Prohibidas y restringidas

Fuente: `/news/restriction.html` (D). Aplica a torneos oficiales y sancionados.

| Prohibida | Vigente desde |
|---|---|
| OP06-116 Reject | 2024-06-21 |
| ST10-001 Trafalgar Law | 2024-09-06 |
| OP06-086 Gecko Moria | 2025-04-01 |
| OP03-040 Nami | 2025-08-30 |
| OP06-047 Charlotte Pudding | 2026-04-01 |
| OP14-020 Dracule Mihawk | 2026-10-12 |

**Restringidas:** ninguna.

**Parejas prohibidas** (no pueden estar en el mismo mazo):

| Carta A | Carta B | Vigente desde |
|---|---|---|
| OP11-040 | OP11-067 | 2025-08-30 |
| OP11-040 | OP08-069 | 2025-08-30 |
| OP07-115 | EB04-058 | 2026-04-10 (NA/EU/LATAM/OC) |
| EB05-001 | OP13-001 | **2026-11-27** |
| EB05-001 | OP01-002 | **2026-11-27** |

- Fechas contrastadas (D) con `/news/restriction-archive.html`, `/topics/019.php` y los avisos individuales.
- El aviso del 2026-11-17 entra en vigor el día siguiente a esta consulta; no indica zona horaria. Su texto dice "adding and removing", pero no enumera retiradas (R).
- Retiradas anteriores que un historial debe respetar: OP05-041 y OP02-052 (aviso de `/topics/019.php`); seis cartas el 2026-04-01 (OP07-045, EB01-059, ST06-015, OP02-024, OP03-098, OP02-117) (R). Existe además un aviso de retiradas de diciembre de 2023 (`/topics/006.php`) no analizado en detalle.

## 5. Lanzamientos

Fuente: `/products/` (D para booster y starter: se leyeron las 3 y 4 páginas de esos listados; SD-01 figura en el de starters). El sitio no distingue fechas ni precios para Latinoamérica (R). La categoría "others" no se revisó, así que productos como LD-01 siguen en nivel R.

| Producto | Fecha |
|---|---|
| OP-16, ST-30 | 2026-06-12 |
| ST-31 a ST-36 | 2026-07-31 |
| OP-17 | 2026-08-28 |
| SD-01 | 2026-09-18 |
| EB-05 | 2026-10-30 |
| **OP-18** (último booster publicado) | 2026-11-20 |
| ST-37, ST-38 | 2026-12-18 (futuro) |
| EB-06 | 2027-01-29 (futuro) |
| OP-19 | 2027-03-05 (futuro) |
| PEB-01 | 2027-04-23 (futuro) |

## 6. Q&A oficiales

Fuente: `/rules/faq/` (D para enlaces; R para fechas y nombres). **49 PDF únicos**: 1 de reglas generales (2025-02-28), 1 de promocionales y 47 de productos.

- Actualizados el 2026-11-20: OP-18, OP-17, ST-30, EB-03, PRB-01, OP-09, OP-05 y ST-01–04. Antes: EB-05 (11-06), OP-16 (10-30).
- Cubren OP-01–OP-18, EB-01–EB-05, PRB-01/02 y ST-01–ST-36. EB-04 se cubre en los documentos combinados con OP-14/OP-15; hay documentos que agrupan rangos de ST.
- Sin Q&A: ST-37 y ST-38 (aún no publicados).
- El nombre de archivo no es uniforme (`faq_op15-eb04.pdf`).
- "VIEW MORE" no oculta entradas adicionales: los 49 enlaces están en el HTML (D).

### Descarga y análisis (2026-11-26)

Los 49 PDF se descargaron fuera del repositorio. Metadatos y hashes: [descargas-2026-11-26.json](descargas-2026-11-26.json).

- Todos tienen texto extraíble; no requieren OCR.
- Orden de magnitud: unas 1.500 preguntas (líneas terminadas en "?") y 1.028 números de carta distintos citados. No son cifras revisadas.
- Formato de tabla: `Card No. | Card Name | Question | Answer` (reglas generales: categoría, pregunta, respuesta). El texto plano sale **por columnas**, por lo que emparejar pregunta y respuesta exige extracción por posición y revisión; no sirve una lectura lineal.
- Algunos documentos contienen `<br>` literal.
- Un mismo número de carta puede ocupar varias filas.
- Solo se inspeccionaron muestras. **Cobertura de aclaraciones revisadas: 0 %.**

## 7. Erratas

| Aviso (listado en `/rules/`) | Fecha | Carta citada |
|---|---|---|
| `/topics/notice_op13.php` | 2025-10-24 | OP13-077 |
| `/topics/notice_op13-119.php` | 2025-10-30 | OP13-119 |
| `/topics/notice-op14-009.php` | 2025-12-19 | OP14-009 |
| `/topics/notice_op15-023.php` | 2026-03-13 | OP15-023 |
| `/news/notice-op16.html` | 2026-05-29 | OP16-081 |
| `/news/notice_eb05.html` | 2026-10-23 | EB05-033 |

- Se leyó completa `/rules/errata_card/` (D): 105 números de carta, entrada más reciente del 2025-05-16, ninguna de OP13 a OP16 ni EB05.
- Confirmado: la sincronización de erratas debe combinar la página de erratas y los avisos.

## 8. Permisos y acceso automatizado

| Punto | Hallazgo |
|---|---|
| Aviso del sitio | "All images, text and data on this website may not be reproduced without permission." (R) |
| Términos de uso | No se halló enlace en el pie de página (R) |
| `robots.txt` | 404 (D). No equivale a autorización |
| API o exportación | No se menciona ninguna (R) |
| Aviso de propiedad intelectual (2026-07-10) | Trata venta y distribución de productos no autorizados; no regula sitios de fans (R) |

**Implicación:** sin permiso escrito, no almacenar texto de efectos, preguntas y respuestas literales ni imágenes. La sincronización automática del HTML oficial no está autorizada ni prohibida expresamente según lo revisado; requiere decisión del propietario (ADR-006).

## 9. Entorno y versiones

| Herramienta | Detectado / última estable |
|---|---|
| Node local | 22.23.5 (npm 10.9.9) |
| Node LTS activo | 24.22.3 (Krypton); también 26.13.1 "Lithium" figura como LTS en el índice |
| astro | 7.4.13 (Node ≥22.23.4, Vite ^8) |
| @astrojs/svelte / svelte | 9.1.6 / 5.59.2 |
| @astrojs/mdx / @astrojs/sitemap / @astrojs/check | 8.1.6 / 3.7.6 / 0.9.12 |
| typescript | 7.0.2 es la última, **incompatible** con los pares de `@astrojs/svelte` y `@astrojs/check`; usar 6.0.3 |
| zod / pagefind | 4.6.7 / 1.6.0 |
| vitest / @playwright/test / nanostores | 5.1.2 / 1.65.1 / 1.5.5 |

Antes de fijar Node (T1.1), confirmar el calendario oficial de LTS: el índice marca dos líneas con nombre LTS.

El directorio no es un repositorio Git y no tiene remoto.

## 10. Inconsistencias y vacíos de `plan.md`

| # | Punto | Propuesta |
|---|---|---|
| 1 | §8 `Card` omite nombre, atributo, rareza y Trigger, que §4 exige | Ampliar el esquema (ADR-007) |
| 2 | §8 `Card.effect` frente a permisos §4/§15 | Opcional y vacío sin permiso (ADR-006) |
| 3 | §8 `FormatSnapshot` no modela parejas prohibidas ni excepciones de bloque por número | Campos explícitos |
| 4 | §10 `content/qa` y `data/qa` | `data/qa` = metadatos; `content/qa` = explicaciones |
| 5 | §9 sincronización diaria frente a "no asumir permisos de scraping" | Fase 6 con fixtures hasta decidir |
| 6 | §12 Fase 1 pide despliegue; §14 prohíbe publicar sin autorización | Validar subruta en local; desplegar solo con permiso |
| 7 | §11 exige lint, accesibilidad y Lighthouse sin nombrar herramientas | Autorizar dependencias (ADR-005) |
| 8 | §11 metas INP de campo sin rastreo | Declararlas no medibles; usar laboratorio |
| 9 | §9 caducidad en sitio estático | Evaluar fechas en cliente y en build; sin JS, mostrar fecha y no afirmar vigencia |
| 10 | §14 "crear issues" sin repositorio | `TASKS.md` hasta tener remoto |
| 11 | §12 revisión humana/juez sin responsable | Resuelto: propietario y grupo de juego (ADR-010) |
| 12 | §7 presupuesto CLP sin fuente | Mostrar "desconocido" |
| 13 | §11 Pagefind y búsqueda por ID | Probar tokenización de `1-3-5-1` en Fase 1 |

## 11. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Permisos de contenido y datos | Limita catálogo, Q&A y sincronización | Mínimo de datos, enlaces, consulta a Bandai |
| Cambio de restricciones el 2026-11-27 y rotación el 2027-04-01 | Recomendaciones obsoletas | Snapshots con fecha efectiva |
| Volumen: 492 reglas y cerca de 1.500 Q&A en tablas | Fases 2 largas | Entregas por capítulo y por set |
| Revisión sin juez confirmado (ADR-010) | Ambigüedades sin resolver | Marcarlas y buscar respaldo oficial |
| Mapeo carta→bloque incompleto | Legalidad `unknown` | Registrar bloque por carta con fuente |
| Ambigüedades del reglamento | Explicaciones erróneas | Marcar `conflict`/`pending` |
