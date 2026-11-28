# Estado del desarrollo

**Última actualización:** 2026-11-27 · **Fase actual:** 7 (QA de lanzamiento), autorizada en ADR-049. T7.2–T7.5 hechas. Quedan pendientes la comprobación con lector de pantalla (T7.1), la verificación de incidencias en GitHub (T6.5) y la publicación (T7.6).

## Corrección de cabecera para CI (2026-11-27)

- En GitHub Actions, la fuente de respaldo hizo que el último enlace de la cabecera se solapara con Buscar. En anchos intermedios, el logo ocupa menos espacio y las etiquetas pueden repartirse en dos líneas.
- Se verificaron cuatro E2E de cabecera en Chromium de escritorio y de 320 px, incluido el caso con fuentes anchas entre 897 y 1089 px.

## QA de lanzamiento (2026-11-27)

- Se corrigió el nombre accesible de las cartas del combate guiado y se comprobó el flujo de foco con teclado. El árbol de accesibilidad expone acción, nombre, poder y estado. VoiceOver se activó y se restauró su ajuste inicial. Falta confirmar sus anuncios.
- Lighthouse 13.6.0 en móvil dio 98 de rendimiento en portada y 100 en Aprende, Mazos y Combate. Las cuatro rutas obtuvieron 100 en accesibilidad y CLS 0. La portada pasó de 450 a 250 KiB transferidos tras incorporar variantes para el mapa y recomprimir la ilustración móvil.
- Guía editorial, guía de mantenimiento y rollback, avisos y créditos actualizados. Build local sin copias oficiales de cartas, PDF ni hojas de cálculo. El [informe de QA](docs/coverage/qa-lanzamiento-2026-11-27.md) registra la evidencia y los criterios pendientes.
- `npm run check`, `npm run lint`, `npm run validate`, `npm run validate:decks`, `npm test` (310 pruebas) y `npm run build` correctos. E2E de escritorio y 320 px: 194 de 194 antes de los ajustes y 12 de 12 dirigidas después. La repetición completa posterior se interrumpió por tiempos de espera.

## Modal de mazos por color (2026-11-27)

- Las cartas de color abren el mazo en un diálogo nativo con desplazamiento interno, cierre visible y devolución del foco. El diálogo y su fondo se animan al abrir y cerrar, respetando la preferencia de movimiento reducido. También se cierra al pulsar fuera. Se conservan los destinos por ancla para los filtros y la navegación sin JavaScript.
- Verificación con check, lint, build, 310 pruebas unitarias y 10 E2E de Mazos en escritorio y móvil de 320 px, con axe y cierre por teclado.

## Fichas de mazos y vigencia de Standard (2026-11-27)

- Nueve fichas estáticas bajo `/mazos/[slug]/` con cantidades, exportación y fuentes. Cinco listas revisadas se evalúan con los snapshots y las suspensiones. ST-27, ST-36 y las dos listas de torneo se muestran como referencias pendientes de revisión. Los precios, la dificultad y la estrategia quedan pendientes de datos editoriales.
- El sitio y `validate:decks` usan el informe versionado de la comparación completa autorizada (ADR-037). Manda la comprobación más antigua de las fuentes. El sitio advierte después de 48 h y deja sin confirmar la vigencia después de 7 días o si la fecha efectiva carece de snapshot aprobado. Confirmar una nueva comparación y versionar su informe son pasos manuales.
- Verificado con `npm run check`, `npm run lint`, `npm run validate`, 310 pruebas de `npm test`, `npm run validate:decks` con y sin fecha, y `E2E_PORT=4331 npm run test:e2e -- tests/e2e/decks.spec.ts --workers=2`. Build y 10 E2E correctas en Chromium de escritorio y 320 px, con axe y reloj simulado para vigencia, aviso y caducidad. El informe de legalidad detectó ausencia de snapshot aprobado desde el 2028-04-01.
- T6.5: la [ejecución autorizada del workflow de formato en `main`](https://github.com/Nimirandad/optcg-academy/actions/runs/46084302100) completó la comparación sin diferencias ni fallos. GitHub omitió `avisar`. Permanece pendiente verificar el permiso de escritura. La comparación de una sola área no actualiza la evidencia de la comparación completa.

## Cabecera en una fila (2026-11-27)

- Desde más de 56 rem, el logo, la navegación y los controles comparten una fila. La cabecera usa Avenir Next cuando está disponible, con respaldo del sistema, subrayado animado y apertura escalonada del menú compacto. El teclado y la preferencia de movimiento reducido se respetan.
- Verificación con check, lint, build, 310 pruebas unitarias y 10 pruebas E2E de cabecera, navegación, modo oscuro y funcionamiento sin JavaScript. Se comprobó la distribución a 908 y 320 px.

## Identidad gráfica de OPTCG Academy (2026-11-27)

- La cabecera usa una marca compuesta con dos cartas, una rosa de los vientos y «OPTCG Academy» en Avenir Next. El favicon usa el mismo símbolo. Los PNG finales se dibujaron y compusieron con tipografía para obtener contornos limpios.
- Prompt del boceto exploratorio con ImageGen integrado: Design a polished, original horizontal brand lockup for OPTCG Academy, an independent Spanish-language trading-card learning platform. Transparent background. One compact icon at left, one aligned two-line wordmark at right. Create a single upright playing card using a distinctive squared-off top-right clipped corner; the card is solid muted champagne gold (#DBBE80), holding one large deep evergreen (#10292B) four-point compass cutout with an elongated northern point. Make the outer card silhouette bold and extremely clean at favicon sizes, no circular enclosure, no secondary cards. The wordmark reads exactly “OPTCG” on the first line and “Academy” on the second line. “OPTCG” in warm ivory (#F4EFE6), strong humanist uppercase sans with controlled letter spacing. “Academy” in muted champagne gold (#DBBE80), same sans family, bold title case with excellent visibility at small sizes, slightly smaller than the first line. Keep both baselines and left edges carefully aligned. Generous clean separation between card and words, vertically centered optically. Overall aspect ratio around 3:1 and tight transparent bounds. Use only solid flat fills, no outlines around letters, no black drop shadow, no gradients, no shading, no textures, no extraneous highlights, no mockup, no badges, no external franchise branding, no extra text. Finished brand identity artwork, calibrated for a dark evergreen header viewed at 128px width.
- Verificación: check, lint, build, 310 pruebas unitarias y 2 E2E para la cabecera en escritorio y móvil de 320 px.

## Logo con el nombre de la academia (2026-11-27)

- La cabecera usa `public/arte/logo-optcg-academy.png`, una versión horizontal generada con ImageGen integrado. El favicon usa el emblema circular.
- Prompt de generación: Extend the reference logo into a compact horizontal header lockup on transparent background. Keep the existing circular gold/navy card-and-teal-compass emblem intact on the left. To its right put exactly "OPTCG Academy", ideally stacked as "OPTCG" in heavy warm ivory capitals and "Academy" in bold warm gold title case, with no other text. Keep the wordmark as tall as the emblem, bold and highly legible when the whole lockup is displayed at 52px tall. Tight bounding box around the full design, simple clean typography, no shadows, extra ornament, border, texture, or watermark.
- Verificación: check, lint, build, 310 pruebas unitarias y 2 E2E con el logo y los controles en la misma fila en escritorio y móvil de 320 px.

## Emblema y navegación de Simuladores (2026-11-27)

- El emblema generado con ImageGen integrado se usa en la cabecera y como favicon. El enlace de inicio conserva su nombre accesible. Archivo: `public/arte/logo-academy.png`.
- Prompt de generación: Logo-brand for OPTCG Academy, a community trading card game academy with a modern nautical theme. Single original wordless emblem for a web header and favicon. A bold warm ivory playing card with one centered teal four-point compass needle, framed in a circular deep navy badge with a thick antique-gold rim. An offset second card edge suggests a deck. Centered, nearly fill square with 6% clear margin, isolated on genuinely transparent background. Flat graphic, strong silhouette, clean edges, simple enough to read at 44 pixels. No typography, numerals, skulls, external logos, characters, textures, or watermark.
- El último robo, Bloqueo y Counter y Duelo en negativo aparecen en la misma navegación que los cuatro modos originales, con iconos de cartas, escudo y trofeo.
- Verificación: `npm run check`, `npm run lint`, 310 pruebas unitarias, build y 4 pruebas E2E de navegación, carga del logo y simulación en escritorio y móvil de 320 px.

## Ejercicios en Simuladores (2026-11-27)

- El último robo se abre desde Turnos. Bloqueo y Counter y Duelo en negativo se abren desde Combate. Los tres tienen una ruta propia y también aparecen en el índice de Simuladores. Casos y desafíos conserva su cuestionario por nivel.
- Verificación con `npm run check`, `npm run lint`, `npm test` (310 pruebas), compilación de producción y 6 pruebas E2E de navegación y resolución en escritorio y 320 px.

## Carta oficial en el simulador guiado de Efectos (2026-11-27)

- El ejercicio usa a Monkey.D.Luffy (ST21-001) y Jinbe (ST31-002), con el efecto de asignar DON!! Rested cotejado en [la lista oficial ST-31](https://en.onepiece-cardgame.com/cardlist/?series=569031) el 2026-11-27.
- El motor conserva el DON!! que cumple la condición del Leader y transfiere los DON!! Rested elegidos al Character. Verificación en Chromium desktop y 320 px, compilación de producción y respuesta PNG local para ambas cartas.

## Distribución de la mesa y barra de acciones (2026-11-27)

- El campo rival se refleja: sus recursos quedan encima del líder y sus cartas jugadas miran al centro de la mesa. Los recursos propios quedan debajo del líder. Ambos tienen una pila de vida lateral con contador. Los controles quedan dentro de la mesa compartida, anclados al borde inferior visible mientras se recorre.
- Verificación: `check`, `lint`, build, 310 pruebas unitarias y 4 pruebas E2E de los cuatro simuladores guiados y los cinco retos, en escritorio y móvil de 320 px.

## Zonas y fases visibles en la mesa (2026-11-27)

- La mesa compartida de retos y simuladores muestra los mazos, la zona de coste, los DON!! Active/Rested y la mano propia. Del rival se muestra el tamaño de la mano.
- Turnos parte del End Phase rival. Al entrar en Refresh, Jinbe se endereza y devuelve el DON!! asignado a coste. Draw añade a Nico Robin a la mano y DON!! Phase añade dos recursos. En Main se puede asignar DON!!, jugar desde la mano o combinar ambas acciones antes de pasar a End.
- Verificación: lint, check, build, 310 pruebas unitarias y 6 pruebas E2E dirigidas en escritorio y móvil de 320 px.

## Mesa compartida y desbloqueo (2026-11-27)

- Combate, Turnos, Playmat y Efectos comparten la mesa, los controles por carta y la retroalimentación de los retos con ejercicios propios. Los simuladores originales se conservan como práctica libre.
- El mapa, las páginas de cada isla y el enlace a la siguiente isla respetan el progreso registrado en este navegador. Las reglas y las referencias directas siguen disponibles. Ver ADR-048.
- Verificación: `check`, `lint`, `validate`, build, 310 pruebas unitarias y 10 E2E dirigidas. Chromium de escritorio y 320 px recorrió las 24 lecciones, verificó el bloqueo por enlace directo y completó los ejercicios de los cuatro simuladores.

## Islas, simuladores y listas de referencia (2026-11-27)

- Mapa en zigzag con conectores curvos continuos, cinco islas ilustradas y ruta propia de lecciones para cada una. Casos por nivel. Accesos con iconos al índice, capítulo anterior y siguiente.
- Combate independiente de los retos. Las cartas admiten acciones directas de combate, turno, mesa y activación de efectos, con enlaces a las reglas correspondientes.
- Cuatro listas con cantidades y exportación: ST-27 y ST-36 de caja según fuentes de terceros, y una lista de torneo para OP09-081 y OP10-099. Se comprobó que cada lista suma 50 cartas principales y la correspondencia de las listas de caja con el catálogo de Bandai. Ver ADR-047.

## Ajustes de navegación y presentación (2026-11-27)

- Simuladores separados por ruta; Combate comparte los retos del sitio. Turnos y Playmat usan cartas oficiales en sus mesas nuevas; Efectos conserva cartas didácticas para aislar los casos.
- Ruta del curso con conectores continuos. Casos y desafíos comparte una sola sección con los 12 casos prácticos, sin repetir los cuestionarios de Aprende.
- Referencia numerada agrupada por punto, 9 ilustraciones de temas, controles con iconos y animaciones compatibles con reducción de movimiento.
- Selector de mazos de 3 × 2, amarillo brillante y ST-27 Negro con 15 imágenes para uso local; cantidades sin confirmar. ADR-046 registra fuentes y alcance.
- Node 24: `check` sin errores, `lint`, `validate`, `build`, 310 pruebas unitarias y 20 E2E dirigidas correctas. Comprobación local a 1280 y 320 px: dos filas de tres cartas, 15 imágenes para ST-27, arte real en Combate, Turnos y Playmat, cero incidencias de axe en Mazos. Se verificaron las 492 anclas únicas y que el build excluye el arte oficial.

## Interactividad para principiantes (2026-11-27)

- Reglas numeradas agrupadas y plegadas con enlaces que abren la regla exacta. «La mesa» y la lección de zonas incluyen una práctica de colocación basada en el manual oficial simplificado.
- Simuladores con accesos directos, cartas ilustradas y selección visual de atacante y objetivo en combate libre. Los cinco retos de combate emplean cartas oficiales.
- Mazos por color con acceso directo al producto y sus cartas, referencias y exportación. El arte oficial se sirve desde copias de Bandai guardadas fuera de Git para el uso local autorizado. ST-36 conserva las cantidades como desconocidas.
- Glosario y Q&A con filtros locales. Casos y desafíos tienen accesos por nivel. Arte náutico original renovado con estética manga.
- Verificación: `npm run check`, `npm run lint`, `npm run validate`, 310 pruebas unitarias y build de producción con 18 E2E dirigidas en Chromium (escritorio y 320 px). Se comprobaron las 492 anclas únicas y las 90 respuestas PNG en desarrollo. Se inspeccionó la carga del arte en Mazos y Jugar; el build queda sin copias de arte oficial. La primera prueba contra el servidor de desarrollo incluyó fallos por el reinicio, cambios de escenario durante la ejecución y el selector de la barra de Astro; la pasada estática posterior verifica los recorridos principales sobre el estado final.

## Identidad y catálogo (2026-11-27)

- Portada, cabecera, mapa, temas, cartas de práctica y favicon con ilustraciones originales generadas. Recursos locales en `public/arte/`; portada con una variante para pantallas pequeñas. La portada pública de OPlayTCG sirvió como referencia de navegación por set.
- `/mazos/` muestra 90 cartas de las listas oficiales ST-31 a ST-36. ST-31 a ST-35 incluyen cantidades por carta, fuentes y listas copiables; ST-36 sigue sin cantidades confirmadas.
- Aprobación del propietario registrada en ADR-043. Se aplicó a fichas de carta, lecciones, cuestionarios, casos y temas. Se retiraron los avisos de revisión de las páginas educativas y se mantuvieron enlaces, versiones e identificadores de las fuentes.
- `npm run validate:decks -- --fecha 2026-11-27` devuelve cinco listas `valid` para esa fecha con las fuentes locales. Falta snapshot aprobado desde el 2028-04-01. Las fichas no muestran un distintivo de vigencia automática.
- ADR-044 propone usar cartas oficiales en un reto piloto. El piloto de retos guiados se autorizó después en ADR-045.
- Verificación con Node 24: `npm run check` (0 errores), `npm run lint`, `npm run validate`, `npm test` (310/310) y `npm run build` (paso previo de Playwright). E2E dirigido: 20/20, incluye escritorio y 320 px, catálogo, portada, combate y recorrido de 24 lecciones. La primera pasada completa se interrumpió tras tiempos de espera y dos selectores desactualizados que pasaron en el segundo intento. Se inspeccionó la portada en claro y oscuro.

## Relevo para la próxima sesión

- **Rediseño (ADR-033, 2026-11-27):** aplicado en local a todo el sitio y diseño aprobado por el propietario. Nueve temas de reglas aprobados en ADR-043 (`src/data/topics/`).
- **Encargo:** Fase 6 iniciada el 2026-11-27 con T6.1 (ADR-031). Sin consultas automáticas a fuentes ni commit sin preguntar.
- **Publicado (2026-11-27):** el PR 1 (Fases 2 a 6 y rediseño) se fusionó y `f190866` se desplegó en Pages. Desde ADR-042, fusionar en `main` publica (rama `publicar-al-fusionar`).
- **Entorno:** usar Node 24 (`PATH="$HOME/.nvm/versions/node/v24.22.3/bin:$PATH"`). Si `npm run dev` ocupa el puerto: `E2E_PORT=4322 npm run test:e2e`; con el equipo cargado, añadir `-- --workers=2`.
- **Local, sin versionar:** `references/` (PDF oficiales, texto extraído de Q&A y `references/cards/`). Para regenerar cartas y productos: `node scripts/sync/import-cards.ts 2026-11-27`, con la fecha de descarga. No usa la red; regenerar deja las cartas en `pending`.
- **Fase 6, siguiente:** verificar T6.5 y los workflows en GitHub. Commit, push, cada ejecución que consulte el sitio, programar los `sync-*` o una dependencia nueva (ADR-005) requieren autorización. Las fichas ya integran suspensiones y caducidad con el informe versionado del ADR-037.
- **Copias para T6.2:** las 8 páginas de `references/cache/consulta-2026-11-27/` (ADR-034). Consultar de nuevo requiere autorización.
- **Datos para la Fase 6:** snapshots aprobados en `src/data/rotation/`, listas en `src/data/decks/`, cartas en `src/data/cards/`. Una prueba exige que las prohibiciones de los snapshots coincidan con `src/data/restrictions/standard.json`.
- **Pendiente del propietario:** revisar las cantidades de referencia de ST-36 (ADR-047). ADR-022, 025, 026, 032, 035, 036 y 039 siguen en «Propuesta».

## Hecho

- Lectura completa de `plan.md` y del reglamento local v1.2.1.
- Inventario de 492 identificadores en `docs/coverage/rules-inventory.json`.
- Verificación inicial de fuentes oficiales: `docs/sources/descubrimiento.md`.
- Archivos de seguimiento.
- PDF oficial de reglas idéntico a la copia local.
- 49 PDF de Q&A descargados fuera del repositorio y registrados en `docs/sources/descargas-2026-11-26.json`; contenido sin revisar.

### Fase 1 (2026-11-27)

- Repositorio público `Nimirandad/optcg-academy` creado; primer commit en `main` autorizado el 2026-11-27.
- Astro, Svelte y TypeScript estricto; tema claro y oscuro; menú móvil; 404; rutas de `plan.md` §3 y `/buscar/`.
- Búsqueda con Pagefind y por número de regla; esquemas Zod; `ci.yml`, `deploy.yml` y README.
- Sin contenido: reglas con ID y página solamente; glosario con una entrada (Blocker) sin definición. Lecciones, mazos y sets de Q&A no generan páginas.

### Fase 2 (2026-11-27)

- T0.8 cerrada por declaración del propietario (ADR-014).
- Validador de cobertura, matriz `docs/coverage/rules-matrix.csv`, plantilla de capítulo y `docs/editorial.md`.
- Explicaciones propias para los 492 IDs (redactadas por el asistente a partir del PDF local): `reviewed` por instrucción del propietario (ADR-020).
- Glosario con las 24 keywords de 10-1 y 10-2.
- Q&A: PDF copiados a `references/qa/` (ignorada por Git) con los 50 hashes del registro verificados antes de copiar; no se descargó nada nuevo.
- Índice de 49 documentos y 1.502 preguntas; extractor por posición, carga manual por página y generador en `scripts/sync/`.
- Explicaciones propias de las 1.502 preguntas de los 49 documentos: `reviewed` por la misma instrucción. La fila vacía de EB04-038 no cuenta como pregunta.
- Las páginas de reglas enlazan las aclaraciones relacionadas en listas plegadas (hasta 94 por regla; el capítulo 8 pesa unos 196 KB) y se excluyen del índice de búsqueda.
- Errata: los 6 avisos se leyeron el 2026-11-27 y se resumen en `/qa/`.
- Cartas prohibidas (6) y parejas (5) señaladas en Q&A (ADR-017); el registro sigue en `pending`.
- Revisión asistida previa en `docs/coverage/revision-asistida-2026-11-27.md` (anterior al cambio de estados).
- Las de documentos por set se redactaron sin el texto de las cartas: solo reflejan lo que dice cada aclaración y las reglas enlazadas son una asociación editorial por comprobar.
- Páginas `/qa/` y `/qa/<documento>/`, 6 avisos de errata resumidos y enlaces desde las reglas.
- Hoja `docs/coverage/revision-contenido-T2.10.csv`: copia generada de los textos; no se usó para registrar la revisión.

### Fase 3 (2026-11-27)

- Progreso local versionado con migración, respaldo, borrado y manejo de errores.
- Cuestionario con explicación por opción, repetición y teclado.
- Niveles 1 a 5: 24 lecciones y 72 preguntas; 12 casos con resolución paso a paso; un desafío por nivel. Todo `pending`; situaciones inventadas.
- Recorrido E2E desde cero: las 24 lecciones respondidas correctamente, con retroalimentación y progreso. No se probó con lector de pantalla.

### Fase 4 (2026-11-27)

- Motor puro en `src/domain/game/`: estado inmutable, turnos, combate, efectos activados, orden de resolución y reemplazo (ADR-022).
- `/simuladores/`: combate (13 escenarios, poder base y DON!! editables), turnos, playmat (dos mesas) y efectos (7 escenarios guiados). Cartas ficticias; alcance incluido y excluido visible en la página.
- Textos de los simuladores sin revisión humana.
- Sin probar: lector de pantalla, Firefox y Safari. `npm run check` no revisa tipos dentro de `.svelte`.

#### Fase 5 (2026-11-27, parcial)

- Snapshots aprobados por el propietario (ADR-028) y colores resueltos (ADR-027).
- Candidatos ST-31 a ST-36: 6 productos y 90 cartas (15 por mazo, con su Leader), en `pending`. Disponibles y dentro de bloque en ambos snapshots.
- Ninguna impresión de las 90 cartas contiene frases de construcción de mazo (búsqueda automática).

- Esquemas de cartas, impresiones, productos, fuentes, formatos, mazos y validaciones (`src/lib/deck-schemas.ts`).
- Validador de legalidad puro en `src/domain/legality/`; un dato ausente nunca produce `valid`.
- Dos snapshots Standard en `src/data/rotation/` (2026-04-01 y 2027-04-01), con 8 fuentes oficiales y sus huellas. El sitio no los muestra.
- Puntuación, ranking, filtros y test de preferencias en `src/domain/recommendation/`; rúbrica en `docs/rubrica.md`.
- `/mazos/`: colores, reglas relacionadas y test. El sitio no muestra cartas ni mazos; sin interfaz de filtros ni fichas.
- Textos de colores y relación respuesta-color sin revisión humana.

### Formato Standard, consulta del 2026-11-27

- HTML oficial leído de bloques (`/topics/013.php`, `/news/blockicon-card.html`), prohibidas, su historial y los avisos del 2026-04-01, 04-10, 10-12 y 11-27.
- Sin cambios respecto del registro de prohibidas del sitio. El aviso del 2026-11-27 anuncia «adding and removing», pero no enumera retiradas.
- La lista de números legales sin importar reimpresión (Super Parallel y bloque X) tiene 40 entradas; la de bloque 4, 15.
- Bandai redacta los periodos de rotación como ejemplos.
- Categoría "others" de productos (13 páginas): sin mazos preconstruidos.
- Los precios publicados son MSRP en USD; no hay fuente en CLP, así que el precio sigue desconocido.

### Cantidades de los mazos (2026-11-27)

- No halladas en las páginas oficiales consultadas.
- Cantidades de terceros para ST-31 a ST-35 (solo ST-31 con dos fuentes); ST-36 sin dato. Suman 50 y pasan el validador sin infracciones. Detalle en `docs/coverage/listas-starter-T5.7.md`. El propietario autorizó cargarlas (ADR-029) y aprobarlas (ADR-030): `src/data/decks/starter-decks.json`; el sitio no las muestra.

### Fase 6 (2026-11-27, parcial)

- T6.1: petición con timeout, reintentos limitados y tamaño máximo; caché en memoria y en disco; huellas del cuerpo y de los datos; adaptadores validados con Zod (`scripts/sync/lib/`, ADR-032).
- Pruebas con fixtures ficticios (`tests/fixtures/sources/`) y transporte simulado. No se consultó ninguna fuente.
- No hay transporte real, extractores de fuentes oficiales ni workflows. La caché no se ha usado con contenido real.

### Rediseño (2026-11-27, ADR-033; T6.6 por ADR-041)

- Identidad visual común (cabecera, títulos, tarjetas, cuestionarios y simuladores) con CSS y SVG propios; sin dependencias nuevas.
- Portada con mapa de cinco niveles y progreso local; `Aprende` muestra el mismo mapa.
- Retos de combate (`src/features/combat/`) en `/jugar/` y en cuatro lecciones; recorrido por pasos en las lecciones con tema.
- Reglas por temas (9) además de la referencia numerada. Los resúmenes están en `pending`: los redactó un agente y **requieren revisión humana**.
- Sin hacer: contenido interactivo propio para las lecciones sin reto ni tema; prueba con lector de pantalla y en otros navegadores.
- Verificado: `check` (0 errores), `lint`, `validate`, `npm test` 308 de 308 y E2E en Chromium. La pasada completa dio 155 de 168 (13 agotaron el tiempo, con el equipo muy cargado); las 13 repetidas de una en una pasaron (se amplió el límite de la auditoría de accesibilidad). Entre ambas pasadas cambiaron dos estilos (olas del título y cuestionarios).
- Antes del commit: `lint`, `check`, `validate`, `validate:decks` y `npm test` 308 de 308; E2E 160 de 160 sobre el estado final. Las 8 restantes (auditoría de accesibilidad, enlaces y recorrido completo) pasaron en la repetición anterior, ya con los dos estilos cambiados.

### Consulta única de fuentes (2026-11-27, ADR-034)

- 8 páginas HTML, todas con HTTP 200; copias en `references/cache/consulta-2026-11-27/` (ignorada por Git) y metadatos en `docs/sources/consulta-2026-11-27.json`.
- Coinciden con los dos snapshots: 40 números de bloque X, 15 de bloque 4, 6 prohibidas y 5 parejas (comparación automática de números; las fechas no se compararon automáticamente).
- Las huellas de bloques (2 páginas), prohibidas e historial son idénticas a las registradas en los snapshots.
- La página de Q&A enlaza las mismas 49 URL; la de reglas, `rule_comprehensive.pdf?20260828`. No se descargó ningún PDF.
- Erratas: 105 números y los mismos 6 avisos enlazados.
- `/products/` está paginada (19 páginas) y solo se vio la primera; su contenido no se comparó automáticamente.
- No se observaron cabeceras `ETag` ni `Last-Modified`: detectar cambios exigirá descargar y comparar huellas.

### T6.2, código sin red (2026-11-27)

- `npm run sync [format|qa|rules|cards] [-- --pdf]`: extractores y comparaciones en `scripts/sync/sources/`; línea base en `docs/sources/linea-base-sync.json` (`node scripts/sync/baseline.ts <fecha>`).
- Sobre las copias locales (con `--pdf`): 126 de 126 fuentes leídas, 0 diferencias. Las copias son de las mismas fuentes que originaron los datos, así que no demuestra vigencia ni que se detecten cambios reales.
- La detección y los fallos se prueban con páginas ficticias (`tests/integration/sync-sources.test.ts`).
- `import-cards.ts`, tras compartir el extractor, generó en una copia aparte archivos de cartas y productos idénticos.
- Sin hacer: paginación de productos.

### T6.3 (2026-11-27)

- Suspensiones de seguridad en `src/data/safety/standard.json` (sin entradas) integradas en el validador.
- Informe (`npm run validate:decks`), fecha 2026-11-28 en UTC+14: ST-31 a ST-35 en `pending-review` (15 cartas sin revisar cada uno), también tras el 2027-04-01. Ninguno es `valid`.
- Bloqueo informado: no hay snapshot desde el 2028-04-01 (ADR-025).
- `validate-decks.yml` creado; no se ha ejecutado en GitHub. El sitio no muestra mazos, así que una suspensión aún no cambia nada visible.

### Primera sincronización con red (2026-11-27, ADR-037)

- `--red` sin PDF, 17:11–17:14 UTC: 76 de 76 fuentes comprobadas, 0 diferencias.
- 75 respuestas idénticas byte a byte a las copias locales; `/products/` solo difería en el parámetro de versión de las imágenes.
- Sin `ETag` ni `Last-Modified`; unos 23,6 MB por ejecución. Caché en `references/cache/sync/` (ignorada por Git).
- No comprueba el contenido de los PDF (reglamento y Q&A), las páginas de producto posteriores a la primera ni los avisos individuales.

### Workflows de sincronización (2026-11-27, ADR-038)

- Cuatro `sync-*.yml` solo manuales. Su paso final se simuló en local contra las copias, sin `--red`: salidas y resúmenes correctos, y los códigos 1 y 2 se conservan.
- No se han ejecutado en GitHub ni hay programación diaria.

### T6.4 (2026-11-27)

- Prohibición: detección (salida 2), suspensión manual, snapshot aprobado y aplicación desde la fecha efectiva.
- Rotación: aviso sin snapshot siguiente, sin recomendación con uno pendiente y cambio anticipado con uno aprobado, sin invalidar antes.
- Fallo de fuente (HTTP 503, cambio de estructura, redirección): se conserva la última respuesta válida, se informa su antigüedad, caduca pasados 7 días y se recupera.
- Son simulaciones locales con datos ficticios, no una prueba en GitHub ni sobre el sitio publicado. La caducidad aún no se muestra ni se aplica fuera de las pruebas.

### T6.5, incidencias (2026-11-27, ADR-040)

- Con diferencias o fallos, cada `sync-*` abrirá o actualizará una incidencia pública.
- Simulado en local sin `--red` y con un `gh` ficticio: creación, actualización, códigos 1 y 2, ausencia de informe y texto hostil (queda sangrado y no se ejecuta). La consulta de incidencias se probó con `gh` real, solo lectura.
- Sin verificar en GitHub: el permiso, el paso del informe entre trabajos y la incidencia.

## Límites de los Q&A

- 14 filas marcadas «extracción por comprobar»: en la mayoría, el nombre largo de la carta se mezcla con la pregunta.
- El documento OP-14/EB-04 tiene una fila sin pregunta ni respuesta (EB04-038, p. 10) en el original.
- El resto del emparejamiento pregunta-respuesta no se ha cotejado fila por fila.
- Datos de los PDF del 2026-11-26; el 2026-11-27 las 49 URL no mostraban versiones nuevas.
- La página de erratas lista 105 números de carta que no están inventariados en el sitio.

### Observaciones sobre las fuentes oficiales

El contenido sigue la documentación tal como está (ADR-020). Quedan anotadas por si se aclaran más adelante.

| Regla | Duda | Estado |
|---|---|---|
| 5-1-2-4 | Remite a 8-1-3-4-3 (reemplazos) al hablar de efectos permanentes; parece una referencia cruzada errónea | Visible en el sitio |
| 8-1-3-4-2 | No queda claro qué carta «generó» el reemplazo prioritario | Visible en el sitio |
| 6-5-5-1 | Dice colocar el DON!! bajo la carta «en la zona de coste»; se explicó como bajo el Leader o Character | Anotada aquí |
| 8-1-3-3-4 | Repite el texto de 8-1-3-3 | Anotada aquí |
| 10-2-9-1 | Redacción distinta de 8-3-2-3 para la misma condición | Anotada aquí |
| Q&A rules-p3-4 | Incluye la zona de Stage en DON!! −X; 8-3-1-6 y 10-2-10-1 no la nombran | Visible en el sitio |
| Q&A op15-eb04-p6-3 | Menciona solo DON!! Rested, pero la aclaración p6-2 de la misma carta admite Active o Rested | Visible en el sitio |
| Q&A op15-eb04-p7-4 | La respuesta publicada incluye una nota que parece interna sobre revisar su redacción | Visible en el sitio |
| Q&A op03-p3-4, p3-5, p4-3, p4-5 y p4-6 | Ponen un efecto de daño antes del [Trigger]; la regla 8-6-2 y la aclaración op13-p1-2 (otro efecto) apuntan a otro orden | Visible en el sitio |
| Q&A op06-p1-3, p1-4 y p1-5 | Remiten al texto actualizado de OP06-009, no verificado y ausente de la lista de erratas | Visible en el sitio |
| Q&A op13-p4-6 | Resuelve primero quien va primero; 5-2-1-5-1 prioriza a quien escogió el orden | Visible en el sitio |

El 2026-11-27 la página oficial seguía enlazando la versión 1.2.1 (por fecha de URL). Confirmarlo de nuevo antes de publicar.

## Verificaciones ejecutadas

| Comprobación | Resultado |
|---|---|
| Secuencia de IDs del PDF | Sin saltos; 4 líneas rechazadas son referencias cruzadas |
| Inventario JSON | IDs únicos, todos los padres existen |
| Revisión visual del asistente (2026-11-27) | 28 páginas; IDs coinciden con el inventario; 7 reglas con texto en rojo. No es revisión humana |
| Hoja de revisión T0.8 | 492 filas y 28 páginas; XML válido y abre en Quick Look; no probada en Excel ni Google Sheets |
| Restricciones, bloques y enlaces PDF | Contrastados sobre el HTML oficial |
| Reglamento oficial frente a local | Mismo SHA-256 |
| Descarga de PDF | 50 de 50 válidos |
| Fechas de restricciones, erratas, listados de booster y starter | Contrastados sobre el HTML oficial |
| Permisos, idiomas, categoría "others" | Solo lectura resumida o sin revisar |
| Instalación de `gh` (2026-11-26) | 2.106.0; `gh auth status` con sesión activa |
| Fase 1: `npm ci`, `check`, `lint` | Código 0 en instalación limpia |
| Fase 1: `npm test` | 40 de 40 |
| Fase 1: `npm run test:e2e` (build y subruta) | 72 de 72, Chromium escritorio y 320 px, con axe |
| Dato inválido en una colección | `npm run check` termina con código 1 |
| CI en GitHub, `d6916a8` (2026-11-27) | [Correcta](https://github.com/Nimirandad/optcg-academy/actions/runs/45939818536) |
| Despliegue de prueba, `d6916a8` (2026-11-27) | [Correcto](https://github.com/Nimirandad/optcg-academy/actions/runs/45940208194) |
| Pruebas contra el sitio publicado | 70 de 72; fallo: la 404 declaraba canonical a `/404/`, que responde 404 |
| Corrección del 404 en local | `lint`, `check`, 40 unitarias y 72 de navegador correctas |
| Nuevo despliegue, `f7b085e` (2026-11-27) | [Correcto](https://github.com/Nimirandad/optcg-academy/actions/runs/45940811557); CI correcta |
| Pruebas contra el sitio publicado, `f7b085e` | 72 de 72 |
| Estado local sobre `f7b085e` (2026-11-27, Node 24.22.3) | `check` sin errores, `lint` correcto, 40 de 40 unitarias, 72 de 72 de navegador (incluye build) |
| Hoja T0.8, relectura (2026-11-27) | Columnas de resultado y revisor por página sin completar |
| Fase 2: SHA-256 del PDF local | Coincide con el inventario |
| Fase 2: `lint`, `check`, `validate` | Correctos; cobertura 492/492, 0 revisadas |
| Fase 2: `npm test` | 52 de 52, con un fixture que falla por cada causa del validador |
| Fase 2: `npm run test:e2e` | 74 de 74, Chromium escritorio y 320 px, con axe y las 492 anclas |
| Q&A: extracción y generación del índice | 49 documentos, 1.502 preguntas; regenerar produce el mismo archivo |
| Estado final: `lint`, `check`, `validate` | Correctos; reglas 492/492, Q&A 63/1.502 |
| Estado final: `npm test` | 64 de 64 |
| Estado final: `npm run test:e2e` | 84 de 84; axe sobre `/qa/` y tres documentos, no sobre los 49 |
| Con OP-17 y OP-18: `lint`, `check`, `validate`, `npm test` | Correctos; 64 de 64 unitarias, Q&A 170/1.502 |
| Con OP-17 y OP-18: `npm run test:e2e` | Primera pasada 84 de 86: la búsqueda «Blocker» ya no mostraba el glosario. Tras dar peso a sus términos, 86 de 86 |
| Con ST-30, EB-03, PRB-01 y OP-09: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 270/1.502 |
| Con OP-05, ST-01–04, EB-05 y OP-16: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 470/1.502 |
| Con ST-31–36, OP-14, OP-15, promocionales y OP-13: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 732/1.502 |
| Con OP-12, ST-29, PRB-02, ST-22–28, OP-11, EB-02, ST-21, OP-10 y OP-07: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 994/1.502 |
| Con ST-15–20, OP-08, ST-14, EB-01, OP-06, ST-13, ST-10 y OP-04: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 1.224/1.502 |
| Bloque final (OP-01–03, ST-05–09, ST-11, ST-12): `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 64 de 64 unitarias, 86 de 86 de navegador, Q&A 1.502/1.502 |
| Revisión asistida y cartas prohibidas: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 66 de 66 unitarias, 90 de 90 de navegador |
| Fase 3, T3.1–T3.3: `lint`, `check`, `validate`, `npm test`, `test:e2e` | Correctos; 85 de 85 unitarias, 104 de 104 de navegador |
| Fase 3 completa: `lint`, `check`, `validate`, `npm test`, `E2E_PORT=4322 npm run test:e2e` | Correctos; 86 de 86 unitarias, 112 de 112 de navegador; reglas y Q&A revisadas 492 y 1.502 |
| Última pasada de navegador (2026-11-27) | Con los procesos por defecto, 107 de 112: 5 tiempos agotados con el equipo muy cargado. Con `--workers=2`, 112 de 112 |
| Fase 4: `lint`, `check`, `validate`, `npm test`, `E2E_PORT=4322 npm run test:e2e -- --workers=2` | Correctos; 131 de 131 unitarias, 128 de 128 de navegador (incluye build) |
| Fase 5 parcial: `lint`, `check`, `validate`, `npm test`, `E2E_PORT=4322 npm run test:e2e -- --workers=2` | Correctos; 170 de 170 unitarias, 132 de 132 de navegador (incluye build) |
| Carga de listas: `lint`, `check`, `validate`, `npm test`, `build` | Correctos; 178 de 178 unitarias. Sin repetir navegador |
| Cierre de T5.7: `lint`, `check`, `validate`, `npm test`, `build` | Correctos; 179 de 179 unitarias. Navegador: última pasada 132 de 132, antes de cargar datos; ninguna página cambió después |
| T5.3 y T5.4: `lint`, `check`, `validate`, `npm test` | Correctos; 175 de 175 unitarias. Sin repetir navegador ni build: no cambió ninguna página |
| T6.1: `check`, `lint`, `validate`, `npm test`, `build` (Node 24.22.3) | Correctos; 216 de 216 pruebas. Sin repetir navegador: no cambió ninguna página |
| T6.2: `check`, `lint`, `validate`, `npm test`, `build`, `sync -- --pdf` | Correctos; 249 de 249 pruebas (incluyen las del prototipo). Sin navegador |
| T6.3: `check`, `lint`, `validate`, `npm test`, `build`, `validate:decks` | Correctos; 264 de 264 pruebas. Sin navegador |
| Sincronización con red sin PDF (2026-11-27) | 76 de 76 fuentes, 0 diferencias, salida 0 |
| Workflows `sync-*`: YAML, simulación local, `check`, `lint`, `npm test` | Correctos; 280 de 280 pruebas. Una pasada falló 3 (nombres no capturados, carga media 31); las 9 siguientes pasaron. Sin build ni navegador: no cambió ninguna página |
| T6.4: `check`, `lint`, `validate`, `validate:decks`, `build`, `sync -- --pdf` (copias), `npm test` | Correctos; 293 de 293 pruebas en 5 pasadas. Sin navegador |
| T6.5 local: simulación de workflows, `check`, `lint`, `validate`, `npm test` | Correctos; 297 de 297 pruebas. Sin build ni navegador: no cambió ninguna página |

En este equipo se necesitó configuración local de certificados para instalar herramientas; la verificación TLS no se desactivó.

Sin verificar: Firefox, Safari, lector de pantalla y Lighthouse.

Los scripts de extracción de la Fase 0 fueron temporales; el validador permanente es `scripts/coverage/validate.ts`.

## Alertas con fecha

- **2026-11-27:** nuevas parejas prohibidas (EB05-001 con OP13-001 y con OP01-002).
- **2026-12-18:** ST-37 y ST-38. Reglas, Q&A y restricciones deben revisarse de nuevo antes de publicar.
- **2027-04-01:** bloques 1 y 2 salen de Standard, salvo excepciones.

## Pendientes de datos y alcance

- Revisión de las cantidades de referencia de ST-36 (ADR-047).
- Confirmar condiciones antes de usar imágenes oficiales en un despliegue público.

## Definido por el propietario

- El repositorio de GitHub no existe y se creará con GitHub CLI.
- La revisión humana de reglas la hará el propietario junto con su grupo de juego.
- ADR-002 a ADR-009 aprobadas, incluidas las dependencias de ADR-005 y la política de contenido de ADR-006.
- Descarga de los PDF oficiales de reglas y Q&A autorizada y realizada.
- 2026-11-27: Fase 1 aprobada, con CI y sitio de prueba publicados.
- 2026-11-27: inventario de reglas aceptado (ADR-014) e inicio de la Fase 2.
- 2026-11-27: casos límite y alcance de la Fase 4 aprobados (ADR-023).
- 2026-11-27: revisión de la Fase 2 aceptada e inicio de la Fase 3 (ADR-018).
- 2026-11-27: contenido de la Fase 2 como revisado, siguiendo la documentación oficial (ADR-020).
- 2026-11-27: inicio de la Fase 5 (ADR-024).
- 2026-11-27: listas de ST-31 a ST-35 aprobadas (ADR-030); la Fase 6 se abordará en una sesión nueva.
- 2026-11-27: carga de cantidades de terceros para ST-31 a ST-35 (ADR-029).
- 2026-11-27: snapshots de formato aprobados, candidatos pedidos y regla de colores (ADR-027, ADR-028).
- 2026-11-27: workflows de sincronización solo manuales (ADR-038).
- 2026-11-27: una sincronización contra el sitio, sin PDF (ADR-037).
- 2026-11-27: consulta única de 8 páginas oficiales (ADR-034).
- 2026-11-27: inicio de la Fase 6 con T6.1 y fixtures (ADR-031).
- 2026-11-27: Fase 0 aprobada con T0.8 pendiente (ADR-012); repositorio público; instalación de Node 24 y dependencias autorizada; commits con correo personal.

## Próximos pasos

1. Fase 6: verificar el trabajo de aviso y su permiso `issues: write` ante una diferencia o fallo autorizado. La comparación de formato ya pasó en GitHub.
2. Completar la prueba de lector de pantalla (T7.1) y revisar las cantidades de referencia de ST-36.
3. Commit, push y fusión solo con autorización. Desde ADR-042, cada fusión en `main` publica el sitio.
4. El día de publicar: repetir la comprobación de reglamento, Q&A, erratas, bloques y restricciones.
