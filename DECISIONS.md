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

## ADR-014 — Cierre de T0.8 e inicio de la Fase 2 · Aceptada (2026-11-27)

El propietario declaró en la conversación: «No se marcó el excel pero está todo ok, sigue con la fase 2». T0.8 se cierra con esa declaración; la hoja queda sin completar y no hay registro fila por fila. Cubre solo el inventario (IDs, jerarquía y páginas): el estado `reviewStatus` de cada regla y de las explicaciones sigue en `pending` hasta la revisión de contenido (T2.10).

## ADR-015 — Formato del contenido de reglas · Propuesta (aplicada, a revisar)

- Un JSON por capítulo en `src/content/rules/`; ID de padre y página salen del inventario y no se duplican. No se añade MDX.
- Campos: `id`, `title` opcional, `explanation`, `example` y `tip` opcionales, `relatedIds`, `reviewStatus`; `reviewedBy` es obligatorio si el estado es `reviewed`.
- El validador es TypeScript ejecutado directamente por Node 24, sin dependencias nuevas.

## ADR-016 — Inventario y explicaciones de Q&A · Propuesta (aplicada, a revisar)

- El repositorio guarda solo metadatos y huellas por pregunta; PDF y texto extraído quedan en `references/qa/` (ignorada por Git).
- Las huellas SHA-256 truncadas permiten detectar cambios sin guardar texto.
- La extracción usa Swift y PDFKit (sin dependencias nuevas), solo en macOS; hay carga manual por página.
- Los datos están en `src/data/qa/` y las explicaciones en `src/content/qa/` (ADR-007). Las cartas y keywords de cada pregunta se detectan automáticamente.
- No se clasifica por líder, timing ni nivel: faltan datos de cartas.

## ADR-017 — Aviso de cartas prohibidas · Aceptada (2026-11-27)

El propietario pidió señalar las cartas prohibidas. Registro en `src/data/restrictions/standard.json` con fuente, fecha de consulta, fecha efectiva y estado `pending`. El aviso aparece en cada pregunta de Q&A que cite una carta prohibida o de una pareja, y la lista completa en `/qa/`. Indica «desde» la fecha efectiva y no afirma vigencia (ADR-008). No es el `FormatSnapshot` ni el validador de legalidad de la Fase 5, que no se ha iniciado.

## ADR-018 — Cierre de la Fase 2 e inicio de la Fase 3 · Aceptada (2026-11-27)

Tras la revisión asistida, el propietario declaró: «Ya revisé puedes seguir, está ok». Se cierra T2.10 con esa declaración y se inicia la Fase 3. Como en ADR-014, no hay registro fila por fila: ningún `reviewStatus` pasa a `reviewed`, el sitio sigue mostrando «pendiente de revisión» y las 14 entradas en `conflict` siguen señaladas. Para marcar entradas como revisadas hace falta que el propietario indique cuáles y a nombre de quién. No se hizo commit.

## ADR-019 — Academia: progreso y cuestionarios · Propuesta (aplicada, a revisar)

- Lecciones en Markdown (`src/content/lessons/`); preguntas en `src/data/questions/<lección>.json`.
- Una lección queda «completada» al responder todas sus preguntas, sea cual sea el resultado; se guarda el mejor puntaje. Repetir no penaliza.
- Progreso en `localStorage` (`optcg:progress`), versión 1. No hubo versiones publicadas antes; la migración desde la versión 0 existe para fijar el mecanismo y se prueba con datos ficticios.
- Datos ilegibles se respaldan antes de sobrescribirse; datos de una versión posterior no se tocan.

## ADR-020 — Contenido de la Fase 2 como revisado · Aceptada (2026-11-27)

El propietario indicó: «técnicamente están como reviewed»; se debe seguir la documentación oficial tal como está y, si resulta errónea, la corrección se buscará después. En consecuencia:

- Las 492 reglas, 24 keywords y 1.502 explicaciones de Q&A pasan a `reviewed`, con `reviewedBy` «Propietario del proyecto» (sin nombre propio, por ser un repositorio público) y fecha 2026-11-27. El asistente aplicó el cambio por esa instrucción.
- Las antiguas entradas en `conflict` conservan su observación visible en el sitio y en `/qa/#conflictos`; ya no bloquean. Se aparta de ADR-010 y de `plan.md` §4.1 en lo referido al estado, no en la señalización.
- No es revisión de un juez. La instrucción no cubre lecciones, casos ni desafíos, creados después.
- Si cambia una fuente, la entrada afectada vuelve a `pending`.

## ADR-021 — Inicio de la Fase 4 · Aceptada (2026-11-27)

El propietario pidió continuar «con la siguiente fase pendiente del desarrollo». Se interpretó como la Fase 4, la siguiente en orden y con dependencias cumplidas (reglas de los caps. 3, 6–8 y 10 revisadas, ADR-020). T3.6 sigue abierta porque exige revisión humana. La Fase 5 no se inició.

## ADR-022 — Motor educativo y simuladores · Propuesta (aplicada, a revisar)

- Los cuatro simuladores viven en `/simuladores/`, sin rutas nuevas.
- Motor en `src/domain/game/`; las acciones devuelven un estado nuevo o el motivo y las reglas del rechazo.
- Escenarios en TypeScript dentro de `src/features/`, comprobados con pruebas; no se envía Zod al navegador. Se aparta del «JSON validado con Zod» de ADR-001 para estos datos.
- Solo cartas ficticias. [Trigger] modelado únicamente como robo; efectos activados con costes ①, DON!! −X y descarte; Events solo [Counter].
- No hay barajado, preparación ni rival automático. No hay arrastrar y soltar (opcional en `plan.md` §6).
- Orden de resolución por tandas (8-6-1, 8-6-1-1). En reemplazos se ordena primero la persona del turno y, aplicado uno, no se ofrecen los demás para ese proceso (lectura editorial de 8-1-3-4-4, por revisar). No se modela la prioridad de «la carta que generó el reemplazo» (8-1-3-4-2, observación abierta).
- [Double Attack] contra 1 de Life no gana la partida (aclaración `rules-p6-1`).
- Si ambas personas cumplieran una derrota a la vez, se informan ambas sin declarar un resultado.

## ADR-023 — Cierre de la Fase 4 · Aceptada (2026-11-27)

El propietario respondió «Aprobar Fase 4» a la pregunta sobre los casos límite y el alcance de los simuladores. Se cierra T4.7. La aprobación no marca los textos como revisados, no cambia el estado de ADR-022 y no autoriza la Fase 5, commit, push ni despliegue. T3.6 sigue abierta.

## ADR-024 — Inicio de la Fase 5 · Aceptada (2026-11-27)

El propietario pidió continuar «con la siguiente fase pendiente del desarrollo» cuando `PROGRESS.md` señalaba la Fase 5 como siguiente. Se interpretó como su inicio. No aprueba snapshots (T5.3), no elige mazos ni líderes y no autoriza commit, push ni despliegue. T3.6 sigue abierta.

## ADR-025 — Datos y legalidad · Propuesta (aplicada, a revisar)

- Modelos en `src/lib/deck-schemas.ts`; el dominio declara sus propios tipos en `src/domain/`, sin importar fuera.
- El bloque se guarda por impresión; `Card` no repite `blockSymbol` (se aparta de `plan.md` §8). `printingsComplete` distingue «fuera de bloque» (`invalid`) de «sin verificar» (`unknown`).
- Una impresión disponible con bloque permitido legaliza el número. Las excepciones del snapshot (bloque X y bloque 4 hasta el 2029-03-31) se aplican por número.
- Efectos de construcción como datos estructurados (`deckRules`), sin texto de carta; `null` es «sin comprobar» y los no evaluables dan `unknown`.
- Colores de cartas no Leader: resuelto en ADR-027.
- Prioridad del resultado: `invalid`, `unknown`, `pending-review`, `valid`. Fuera de la vigencia del snapshot no se afirma nada del formato.
- Región única `na-eu-oc-latam-me`. Fechas ISO sin hora; la zona horaria de ADR-008 la aplicará quien obtenga «hoy» (T5.8).
- Los snapshots duplican las prohibiciones de `src/data/restrictions/standard.json`; una prueba exige que coincidan.
- No se modela ninguna fecha posterior al 2028-03-31: no se ha verificado esa rotación.

## ADR-026 — Rúbrica, test y colores · Propuesta (aplicada, a revisar)

- Anclajes de la rúbrica en `docs/rubrica.md`.
- Test de cinco preguntas; cada respuesta suma un punto a los colores cuya tendencia general (`plan.md` §7) coincide. Los empates se muestran; no se sugiere combinación si habría que elegir al azar.
- Fortalezas, desafíos y reglas por color son textos editoriales sin revisión, visibles en `/mazos/` con ese aviso.
- Los filtros del catálogo quedan como lógica probada; su interfaz se añadirá cuando haya mazos que filtrar.

## ADR-027 — Colores · Aceptada (2026-11-27)

El propietario indicó: «solo los líderes pueden poseer doble color y en los decks se pueden combinar los colores que posee el líder en cuestión». Comprobado el 2026-11-27 en la lista oficial (62 series, 2.969 números): 170 impresiones de Leader con dos colores y ninguna carta Character, Event o Stage con más de uno. El esquema rechaza una carta no Leader multicolor y el validador exige que el color de cada carta esté en el Leader. La regla 2-3-4 no impone esa limitación: si Bandai publica una carta así, la carga fallará y habrá que revisar esta decisión.

## ADR-028 — Snapshots aprobados y candidatos · Aceptada (2026-11-27)

- El propietario aprobó T5.3 («sobre lo que respecta al 5.3 está bien»): los dos snapshots y sus fuentes pasan a `reviewed`, a nombre de «Propietario del proyecto». Una fuente que cambie vuelve a `pending`.
- Pidió como candidatos Starter Decks recientes ligados a la identidad. Interpretación: ST-31 a ST-36 (2026-07-31), la serie reciente de un mazo por Leader, que cubre los seis colores (negro solo en ST-35, rojo/negro). Quedan fuera ST-30 (Leaders de dos personajes, junio), SD-01 (set de mazos) y ST-37/ST-38 (aún no publicados).
- Se cargan solo los datos de ADR-006; poder, vida, Counter, tipos y atributos quedan vacíos. Las cartas siguen en `pending`.
- La importación lee páginas guardadas en `references/cards/` (ignorada por Git); no usa la red ni es la sincronización de la Fase 6.
- `deckRules: []` se asigna por búsqueda automática de frases de construcción en el texto de las impresiones; revisarlo en T5.7.
- Las páginas de producto dicen que las cartas valen en torneo 7 días después del lanzamiento y también desde el pre-lanzamiento en tienda. El validador no modela ese plazo; para ST-31 a ST-36 ya venció, pero habrá que resolverlo antes de ST-37.

## ADR-029 — Cantidades de fuentes de terceros · Aceptada (2026-11-27)

Tras informar que no se hallaron cantidades oficiales, el propietario indicó «Sí, cárgalas» para ST-31 a ST-35 (fuentes en `docs/coverage/listas-starter-T5.7.md`).

- Se cargan en `src/data/decks/` como `pending`; la autorización no es revisión de las listas, así que no son `valid` ni se recomiendan.
- Se aparta de la prioridad de fuentes oficiales (`plan.md` §8) solo para las cantidades.
- `Deck` gana `listSources`; `strategy` puede ser `null` (ver ADR-030).
- ST-36 no se carga: no hay cantidades.
- El sitio todavía no muestra las listas (fichas en T5.8).

## ADR-030 — Aprobación de las listas y cierre de T5.7 · Aceptada (2026-11-27)

El propietario declaró: «Aprobé las listas, así que avanza con 5.7». Antes había indicado que no tiene los mazos físicos.

- ST-31 a ST-35 pasan a `reviewed`, a nombre de «Propietario del proyecto», con fecha 2026-11-27. No hay registro fila por fila ni cotejo con los productos; las cantidades siguen viniendo de terceros (ADR-029).
- T5.7 se cierra para esas cinco listas. ST-36 queda fuera por no tener cantidades.
- La aprobación no cubre los datos de cartas (T5.4), que siguen en `pending`: el validador responde `pending-review` y no se recomienda ningún mazo.
- Se retira la exigencia de `strategy` en un mazo revisado (introducida en ADR-029): la estrategia pertenece a las fichas (T5.8).

## ADR-031 — Inicio de la Fase 6 · Aceptada (2026-11-27)

El propietario indicó: «Autorizo iniciar la Fase 6, empezando por T6.1 con fixtures. No hagas commit ni consultas automáticas a fuentes sin preguntarme». No autoriza T6.2 contra fuentes reales, dependencias nuevas, permisos de GitHub, commit, push ni despliegue. La Fase 5 y T3.6 siguen abiertas.

## ADR-032 — Adaptadores de fuentes · Propuesta (aplicada, a revisar)

- Código en `scripts/sync/lib/`, fuera del navegador y sin dependencias nuevas.
- El transporte se inyecta y no hay implementación real: nada puede consultar una fuente hasta T6.2.
- Valores iniciales: 15 s por intento, 2 reintentos (espera de 1 s y 2 s), 10 MiB por respuesta. Se reintenta ante fallo de red, timeout, 408, 429 y 5xx. Si `Retry-After` supera 60 s, no se reintenta.
- Solo HTTPS, sin puerto ni credenciales, y solo hosts declarados. Las redirecciones no se siguen: fallan para revisar la URL.
- Cada adaptador declara tipos de contenido, versión del extractor y esquema Zod. La caché solo se actualiza si la extracción y la validación terminan bien; ante un fallo se informa la última comprobación válida.
- Se comparan la huella del cuerpo y la de los datos extraídos (`new`, `data`, `content`, `none`). `retrievedAt` es la primera descarga de ese contenido; `checkedAt`, la última comprobación con éxito. Todo resultado queda en `pending`.
- La caché en disco irá en `references/cache/`, ignorada por Git. `change` compara con la caché, no con el repositorio: T6.2 debe decidir sus PR comparando con los datos versionados.

## ADR-033 — Experiencia visual e interactiva · Aceptada (2026-11-27)

El propietario señaló que la intención era una página visualmente interactiva y dinámica, que no abrume a quien empieza, con las reglas en una sección aparte y de lectura amena, sin recursos de Bandai. La web actual se ve como una consulta de texto: portada de enlaces, lecciones con texto y tablas, y reglas numeradas una por una.

Propuesta, antes de la Fase 7 (que debe probar el diseño final):

1. Dirección visual y prototipo de la portada y de una lección (combate). **Se aprueba antes de extenderlo.**
2. Portada con un recorrido «Empieza aquí»; las secciones de consulta quedan en segundo plano.
3. Lecciones interactivas: tablero animado paso a paso y retos cortos, reutilizando `src/domain/game/`.
4. Reglas: entrada por temas, en lenguaje llano y con apoyo visual; la vista numerada completa se conserva como referencia (`plan.md` §4: cobertura e identificadores).
5. Simuladores con la misma identidad visual.

**Estado:** el propietario autorizó el paso 1 («Sí, haz el prototipo») y después pidió continuar («Mientras aun se trabaja en la fase 6 sigue con el rebranding»), lo que se toma como aprobación de los pasos 2 a 5. Aplicados en local, sin commit ni publicación. Revisado el resultado, el propietario respondió «Me gusta así» (2026-11-27): aprueba el diseño, no el contenido de los temas, que sigue en `pending`. (Registrada primero como ADR-031; renumerada porque ese número lo usa el inicio de la Fase 6.)

- El prototipo pasó a ser el sitio: portada, `/jugar/` con los cinco retos y se retiraron las rutas `/prototipo/`.
- Retos jugables dentro de cuatro lecciones (ataques, DON!! en combate, Blocker y Counter); las lecciones que tienen un tema muestran su recorrido paso a paso; el resto solo cambia de aspecto.
- Reglas: nueve temas en `src/data/topics/` con página `reglas/tema/<tema>/`, redactados a partir de las explicaciones numeradas y en `pending`. Las direcciones numeradas no cambian.

Límites: arte propio (CSS y SVG), sin imágenes de Bandai (ADR-006), sin dependencias nuevas, reducción de movimiento, teclado, 320 px y WCAG 2.2 AA (ADR-001). Amplía `plan.md` §3 y la dirección «minimalista» del diseño visual.

## ADR-034 — Consulta única de 8 páginas oficiales · Aceptada (2026-11-27)

El propietario respondió «Autorizar 8 páginas» a la propuesta de descargar una vez, a `references/cache/` y sin versionarlas: `/rules/`, `/rules/faq/`, `/rules/errata_card/`, `/news/restriction.html`, `/news/restriction-archive.html`, `/topics/013.php`, `/news/blockicon-card.html` y `/products/`. Ejecutada el 2026-11-27: una petición por página, sin reintentos ni seguir enlaces; metadatos en `docs/sources/consulta-2026-11-27.json`. La autorización está consumida: no cubre repetirla, otras páginas ni PDF, consultas automáticas ni el desarrollo contra la red. Las pruebas versionadas usarán solo fixtures ficticios.

## ADR-035 — Sincronización de fuentes · Propuesta (aplicada, a revisar)

El propietario pidió desarrollar T6.2 sin red («Sí, desarrolla»).

- `npm run sync` solo informa: no escribe datos, no cambia estados de revisión ni crea PR. Aplicar una diferencia es manual.
- Por defecto lee las copias locales de `references/`. `--red` consulta el sitio oficial, con 3 s entre peticiones; cada ejecución requiere autorización (primera: ADR-037).
- Extractores sin dependencias nuevas, ligados a la estructura actual: ante algo inesperado fallan y la fuente no genera diferencias. Una restricción de copias o una pareja con otra forma obligan a revisar a mano.
- `docs/sources/linea-base-sync.json` guarda la última extracción de lo que no está en otros datos (avisos, erratas, productos, series y huella del historial): identificadores, fechas, enlaces, títulos de producto y huellas. Queda en `pending`.
- Prohibidas y bloques se comparan por número; los cambios de fecha dentro de una lista solo se detectan por la huella de la página.
- No se separan preguntas de Q&A (requiere macOS), no se recorre la paginación de productos y, sin `--pdf`, un PDF reemplazado en la misma URL no se detecta.
- La lectura de la lista de cartas se comparte con `import-cards.ts`.

## ADR-036 — Validación de mazos y suspensiones de seguridad · Propuesta (aplicada, a revisar)

El propietario pidió continuar con T6.3.

- `src/data/safety/standard.json` registra suspensiones por carta, pareja o formato completo, con motivo, fuente y vigencia. Hoy está vacío.
- Una suspensión no declara ilegal un mazo: lo deja en `pending-review` (si no es ya `invalid` o `unknown`) y lo identifica en `suspendedBy`, así que no se recomienda.
- Se aplica aunque esté en `pending`, porque solo restringe. Se aparta de «snapshot de seguridad **revisado**» (`plan.md` §9); la revisión queda en el commit que lo publica.
- Las suspensiones son un dato obligatorio del validador.
- `npm run validate:decks` informa el estado de hoy (zona UTC+14, ADR-008), el de cada fecha con cambios conocidos y los bloqueos por falta de snapshot aprobado. Sale con 2 si hoy no hay formato o algún mazo es `invalid`; `pending-review`, `unknown`, las suspensiones y los bloqueos futuros no hacen fallar.
- `validate-decks.yml` corre al cambiar datos o el validador y a mano, con permiso de lectura y sin programación diaria.
- La regla de importaciones del dominio admite la extensión `.ts` dentro de la misma carpeta, necesaria para ejecutarlo con Node.
- Los umbrales de 48 h y 7 días no se implementaron aquí (regla añadida en ADR-039; avisos en T5.8).

## ADR-037 — Primera sincronización contra el sitio · Aceptada (2026-11-27)

El propietario respondió «Sí, sin PDF» a la pregunta de ejecutar una vez `--red` (al menos 76 peticiones separadas 3 s, más reintentos, respuestas sin versionar y riesgo de ADR-006). Ejecutada el 2026-11-27 de 17:11 a 17:14 UTC, usando el almacén de certificados del sistema (`NODE_USE_SYSTEM_CA=1`) con la verificación TLS activa. Informe en `docs/sources/informe-sync-2026-11-27.json`. La autorización está consumida: no cubre repetirla, los PDF ni consultas programadas.

## ADR-038 — Workflows de sincronización solo manuales · Aceptada (2026-11-27)

El propietario respondió «Sí, solo manuales» a la pregunta de crear los workflows `sync-*` sin programación diaria.

- `sync-cards.yml`, `sync-qa.yml`, `sync-rules.yml` y `sync-format.yml`, solo con `workflow_dispatch`, permiso de lectura y un grupo de concurrencia común. Una prueba exige esas tres condiciones.
- Cada ejecución consulta el sitio oficial; lanzarla es la autorización de esa consulta. Los PDF (Q&A y reglas) son opcionales y vienen desactivados.
- El informe queda en el resumen del trabajo. Con diferencias o fallos el trabajo termina en error. No modifican datos ni crean PR (T6.5).
- Sin caché entre ejecuciones: cada una descarga todo.
- Se aparta de `plan.md` §9 (diario y manual, con PR). La programación diaria queda sin decidir.
- No autoriza commit, push ni ejecutarlos.

## ADR-039 — Caducidad y simulaciones · Propuesta (aplicada, a revisar)

El propietario pidió continuar con T6.4.

- `src/domain/legality/freshness.ts`: advertencia pasadas 48 h y caducidad pasados 7 días (`plan.md` §9), contados desde la fuente comprobada hace más tiempo. Sin dato, o con fecha ilegible o futura, se considera caducado. Solo `valid` y no caducado se recomienda.
- La fecha efectiva sin snapshot aprobado la cubre el validador (`sin formato` o `pending-review`).
- La regla aún no la usa el sitio ni `validate:decks`. T5.8 debe aplicarla y decidir **dónde persiste la última comprobación**: hoy solo está en la caché local, y los workflows de GitHub empiezan sin ella.
- Detectar una prohibición no suspende nada: publicar la suspensión es un paso manual (ADR-036).

## ADR-040 — Cómo avisar de diferencias (T6.5) · Aceptada: opción A (2026-11-27)

El propietario respondió «A: incidencias» a la pregunta sobre qué opción aplicar en local. Sustituye los PR de `plan.md` §9 y T6.5. No autoriza commit, push, ejecutar workflows ni cambiar la configuración remota.

Aplicado en los cuatro `sync-*.yml`: trabajo `avisar` solo si `comparar` falla, con `issues: write`, sin acciones, repositorio ni dependencias; informe por variable de entorno, recortado a 50.000 bytes y sangrado. Actualiza la incidencia abierta por Actions con el mismo título o crea una; editarla no genera un comentario nuevo y no se cierra sola. Modifica ADR-038: ahora hay un permiso de escritura.

### Análisis previo

Estado leído con `gh` el 2026-11-27: repositorio público; permiso por defecto de `GITHUB_TOKEN` de lectura; «Allow GitHub Actions to create and approve pull requests» desactivado; `main` sin protección ni rulesets; auto-merge desactivado; incidencias activadas.

`npm run sync` solo informa, así que hoy un PR no tendría cambios de datos que proponer.

| Opción | Resultado | Permisos de escritura | Configuración remota |
|---|---|---|---|
| A (recomendada) | Una incidencia por área, creada o actualizada solo si hay diferencias o fallos | `issues: write` | Ninguna |
| B | PR con el informe como archivo | `contents: write`, `pull-requests: write` | Activar el ajuste de PR y proteger `main` |
| C | PR con cambios de datos en `pending` | Los de B | Los de B, más escribir el código que genera los datos |

Para A: el trabajo que consulta e instala dependencias sigue en lectura; otro trabajo, sin `npm ci` ni código del repositorio, recibe el informe y es el único con `issues: write`. El informe contiene identificadores, enlaces, títulos de producto y mensajes de error, y sería público.

Para B y C: `contents: write` sobre un `main` sin protección permitiría escribir en él; los workflows de un PR creado con `GITHUB_TOKEN` esperan aprobación manual según la documentación de GitHub.

A se aparta de `plan.md` §9, que pide PR.

## ADR-041 — El rediseño forma parte de la Fase 6 · Aceptada (2026-11-27)

El propietario indicó: «integralo a la fase 6 y haz commit». El rediseño (ADR-033) se registra como T6.6. Autoriza el commit local de todo el trabajo pendiente (Fases 2 a 6), hecho en una rama nueva y sin `.claude/`. No autoriza push, PR, fusión, despliegue ni ejecutar workflows.

## ADR-042 — Publicación automática al fusionar · Aceptada (2026-11-27)

El propietario indicó: «La idea seria automatizarlo para que funcione en el mismo pipeline una vez mergeado».

- `ci.yml` publica en Pages tras verificar, en cada push a `main` o ejecución manual sobre `main`. Los PR no publican. `deploy.yml` se elimina.
- Sustituye la autorización por despliegue de ADR-009 y ADR-013: fusionar en `main` equivale a publicar. Las comprobaciones previas a publicar (reglamento, rotación, restricciones, erratas, Q&A) pasan a hacerse antes de fusionar; nada lo exige automáticamente.
- `main` no tiene protección de rama: un push directo también publica si las verificaciones pasan.
- Los agentes siguen necesitando autorización para commit, push y fusión.

## Aclaraciones de la Fase 0

- Se añadieron `docs/sources/` y `docs/coverage/` (previstos en §10) para el informe y el inventario.
- El inventario guarda IDs y páginas, sin texto del reglamento.
