# Plan maestro de desarrollo — OPTCG Academy

**Estado:** propuesta lista para implementación · **Idioma:** español (Latinoamérica) · **Hosting:** GitHub Pages

## 1. Visión y objetivos

Construir una plataforma educativa no oficial de ONE PIECE CARD GAME que acompañe a una persona desde su primera partida hasta la consulta de reglas avanzadas y la elección de un mazo legal, accesible y acorde con su estilo. No será un ranking del meta ni una mera traducción del PDF.

Objetivos: aprendizaje progresivo, cobertura íntegra y trazable del reglamento, práctica interactiva, recomendaciones vigentes, acceso móvil mediante URL o QR, mantenimiento reproducible y alojamiento estático gratuito dentro de los límites de GitHub.

Públicos: principiante sin conocimientos, jugador casual, jugador que comienza a competir y jugador experimentado que consulta una interacción. No sustituye el criterio de un juez ni las políticas oficiales de torneo.

## 2. Decisiones técnicas

| Capa | Elección |
|---|---|
| Sitio y rutas | Astro, salida estática, sin Starlight |
| Islas interactivas | Svelte, integración oficial de Astro |
| Lenguaje | TypeScript estricto |
| Diseño | CSS nativo, variables, estilos encapsulados |
| Contenido | Markdown/MDX y Astro Content Collections |
| Datos estructurados | JSON validado con Zod |
| Búsqueda | Pagefind, índice generado después del build |
| Estado | Svelte local; Nanostores solo si hay estado compartido real |
| Persistencia | localStorage versionado |
| Pruebas | Vitest y Playwright |
| Automatización | GitHub Actions |
| Hosting | GitHub Pages |

No React, Tailwind, SPA global, servidor, cuentas, base de datos ni claves privadas en el cliente. Astro utiliza Vite internamente; no se busca eliminarlo. Usar versiones estables compatibles al iniciar, fijar Node LTS y lockfile, documentar decisiones en ADR. npm como gestor inicial, sustituible si se justifica.

## 3. Experiencia y navegación

| Ruta relativa | Función |
|---|---|
| `/` | Inicio, accesos rápidos, estado de actualización |
| `/aprende/` | Academia y progreso |
| `/aprende/[leccion]/` | Lección, ejemplos, práctica y referencias |
| `/reglas/` | Índice completo |
| `/reglas/[capitulo]/` | Reglas numeradas y enlaces por subregla |
| `/mazos/` | Colores, filtros, test y catálogo |
| `/mazos/[slug]/` | Ficha de mazo y alternativas |
| `/simuladores/` | Combate, turnos, playmat y efectos |
| `/glosario/` | Keywords y conceptos bilingües |
| `/qa/` | Q&A oficiales por set, carta y mecánica |
| `/qa/[set]/` | Aclaraciones del set y referencias oficiales |
| `/casos/` | Situaciones prácticas con resolución |
| `/desafios/` | Cuestionarios por nivel |
| `/actualizaciones/` | Versiones, cambios y estado de fuentes |
| `/acerca/` | Fuentes, metodología, créditos y aviso no oficial |

Dos modos: aprendizaje guiado y consulta directa. Navegación cruzada entre conceptos, reglas, simuladores y mazos. Buscador global por número de regla, término español/inglés, keyword y título. Búsqueda de cartas y filtros de mazos mediante índice estructurado independiente. URL compartible para cada regla y mazo; filtros mediante parámetros cuando sea útil.

### Diseño visual

Identidad pirata moderna y minimalista, no imitación de la web oficial. Paleta inicial: azul marino #0B1D38, dorado #D8BC80, pergamino #F4EFE6, azul océano #426B8A y rojo #A44949. Son tokens iniciales, ajustar contraste según WCAG 2.2 AA. Tipografía legible, iconografía consistente, sin depender del color para comunicar estado. Modo claro/oscuro, teclado, foco visible, reducción de movimiento, áreas táctiles de al menos 44 px como objetivo, diseño desde 320 px. En móvil, menú compacto y navegación de capítulos desplegable. Branding comunitario opcional, no asumido.

## 4. Reglamento: fuente y cobertura

Fuente inicial entregada: `rule_comprehensive.pdf`, ONE PIECE CARD GAME Comprehensive Rules v1.2.1, actualización 28/08/2026, 28 páginas. Es una línea base, no una afirmación de que sea la última versión. Verificar vigencia antes de publicar.

Mantener identificadores originales (p. ej. 1-3-5-1), jerarquía, versión, página y referencias cruzadas. Redactar explicaciones propias en español sin alterar el significado. Distinguir claramente regla, explicación, ejemplo y consejo estratégico. No publicar traducción literal integral ni imágenes protegidas sin verificar permisos; enlazar al original oficial. La cobertura completa significa representar todas las reglas y subreglas, no copiar literalmente el PDF.

| Capítulo original | Cobertura educativa requerida |
|---|---|
| 1. Game Overview | Dos jugadores, derrota, concesión, precedencias, acciones imposibles, elecciones y cálculos |
| 2. Card Information | Todos los campos de carta, categorías, colores, tipos, atributos, poder, coste, texto, vida, Counter, Trigger, número, bloque y demás metadatos |
| 3. Game Areas | Todas las zonas, visibilidad, propiedad, estados, movimientos y límites de campo |
| 4. Basic Game Terminology | Efectos, jugadores, estados, robo, daño, jugar, up to, base, if/then, remove y poder a cero |
| 5. Game Setup | Construcción, preparación, orden inicial, mulligan y vidas |
| 6. Game Progression | Refresh, Draw, DON!!, Main y End, excepciones del primer turno |
| 7. Card Attacks and Battles | Declaración, Attack, Block, Counter, Damage y End of Battle |
| 8. Activating and Resolving Effects | Tipos de efectos, validez, costes, condiciones, activación, resolución y orden |
| 9. Rule Processing | Procesamiento fundamental y comprobación de derrota |
| 10. Keyword Effects and Keywords | Todos los efectos de palabra clave y palabras clave, con excepciones |
| 11. Other | Bucles infinitos, revelación y consulta de zonas secretas |

### Requisitos de exactitud y casos obligatorios

- Perder por daño al líder con cero vidas o por mazo vacío; no confundir cero vidas por sí solo con derrota.
- Texto de carta prevalece sobre reglas; prohibición prevalece sobre obligación; acciones imposibles y selección de hasta cero; poder negativo no implica K.O.; coste negativo durante cálculos según regla.
- Construcción base: líder, 50 cartas, 10 DON!!, colores del líder, máximo cuatro por número salvo excepciones aplicables. Diferenciar construcción y legalidad de formato.
- Zonas públicas/secretas; cinco personajes y un Stage; reemplazar por límite no equivale a K.O.; DON!! asignado no está Active ni Rested.
- Mulligan completo una vez, orden de preparación y efectos iniciales conforme al capítulo 5.
- Primer jugador sin robo y con un DON!! en su primer turno; ambos sin atacar en su primer turno; DON!! asignado da +1000 durante turno propio.
- Ataques a líder o personaje Rested salvo excepciones; empate de poder favorece atacante; atacante no sufre K.O. por perder combate; Trigger opcional y tratamiento especial de daño.
- Diferenciar coste de jugar y coste de activación; condiciones, efectos automáticos, activos, permanentes y de reemplazo conforme al capítulo 8; no inventar un sistema de pila.
- Efectos de palabra clave 10-1: Rush, Double Attack, Banish, Blocker, Trigger, Rush: Character, Unblockable.
- Palabras clave 10-2: K.O., Activate: Main, Main, Counter, When Attacking, On Play, End of Your Turn, End of Your Opponent’s Turn, DON!! xX, DON!! −X, Your Turn, Opponent’s Turn, Once Per Turn, Trash, On Block, On Your Opponent’s Attack, On K.O.
- Bucles: empate si nadie puede detenerlo; procedimientos distintos si uno o ambos pueden detenerlo; revelar cartas al mover entre zonas secretas cuando corresponde.

Esta lista es un conjunto de pruebas mínimas, no reemplaza el inventario exhaustivo. Antes de redactar, extraer todas las subreglas del PDF y revisar visualmente errores de extracción, incluidos identificadores atípicos como 8.4. Generar matriz de cobertura `ruleId -> explicación -> fuente -> revisión -> pruebas/casos cuando aplique`. Fallar CI ante reglas faltantes, duplicadas o referencias rotas. Toda excepción debe aparecer junto a la regla pertinente. Revisión humana de contenido antes de publicación.

### 4.1. Q&A oficiales por set

Incorporar al alcance inicial las aclaraciones oficiales de Bandai de cada expansión, Starter Deck y otros productos que dispongan de Q&A. Inventariar también sets históricos cuando sus aclaraciones sigan siendo útiles; distinguir relevancia mecánica de legalidad competitiva. No asumir que una carta rotada invalida una aclaración general.

- Crear un catálogo navegable por set, código de carta, líder, keyword, mecánica, timing y nivel. Indexar con Pagefind y enlazar desde reglas, glosario, lecciones, fichas y casos prácticos.
- Registrar `id`, `setCode`, `cardIds`, `mechanics`, `ruleIds`, `sourceUrl`, `sourceQuestionId` (si existe), página, idioma, versión/hash, fecha de publicación y revisión, estado (`pending`, `reviewed`, `superseded`, `conflict`) y explicación propia en español. Mantener términos oficiales en inglés como alias de búsqueda.
- Diferenciar pregunta oficial, explicación editorial y ejemplo educativo. Enlazar al documento original; no redistribuir íntegramente preguntas, respuestas o imágenes sin permisos. No extrapolar una resolución específica a otras cartas sin sustento.
- Clasificar por costes, condiciones, timings, efectos simultáneos, reemplazos, DON!!, Trigger, Blocker, Once Per Turn, zonas y demás mecánicas según inventario real. Convertir aclaraciones relevantes en casos guiados y fixtures de pruebas del motor educativo.
- Verificar cambios, erratas y Q&A sustituidos. Si existe conflicto con una regla o aclaración posterior, marcar pendiente de revisión y no presentar una resolución como definitiva hasta confirmar la fuente oficial aplicable. Conservar historial y referencias.
- Fase 0: inventariar fuentes oficiales y formatos (PDF/HTML), permisos, disponibilidad regional y cobertura por producto. No se han inspeccionado todavía todos los Q&A ni confirmado sus rutas individuales. Si una fuente falta, registrar el vacío explícitamente.
- Automatizar detección de nuevos documentos y modificaciones mediante `sync-qa.yml`, con hash, snapshots, extracción validada, informe y PR editorial. No publicar interpretaciones automáticamente. Permitir carga manual cuando la extracción no sea fiable.
- Criterio de salida: inventario de Q&A disponibles revisado, cobertura trazable de aclaraciones relevantes, enlaces funcionales, búsqueda por carta/mecánica/set, casos críticos probados y ausencia de conflictos sin señalizar. Publicar porcentaje de cobertura y pendientes.

## 5. Academia interactiva

| Nivel | Lecciones |
|---|---|
| 1. Fundamentos | Objetivo, anatomía de cartas, colores, zonas y recursos |
| 2. Primera partida | Construcción, preparación, mulligan y fases |
| 3. Combate | Ataques, DON!!, Blocker, Counter, daño, Trigger |
| 4. Efectos | Costes, condiciones, timings, keywords y orden |
| 5. Avanzado | Excepciones, procesamiento, información oculta, bucles y casos complejos |

Cada lección: objetivo, prerrequisitos, explicación breve, ejemplo visual accesible, interacción, preguntas con retroalimentación, referencia exacta a reglas y siguiente paso. Guardar progreso, permitir reiniciar y repetir sin penalización. No bloquear la consulta avanzada. Preguntas con distractores plausibles y explicación de por qué cada opción es correcta o incorrecta; evitar ambigüedades y marcar supuestos.

## 6. Simuladores y casos

- **Combate:** elegir atacante/objetivo, poder base, DON!!, Blocker elegible, Counter y efectos de escenario; mostrar pasos, resultado, diferencia de poder y reglas aplicables. Incluir empate, ataque fallido, daño al líder, K.O. y excepciones en escenarios separados.
- **Turnos:** máquina de estados de fases, primer/segundo jugador, refresh, robo, DON!!, acciones Main y End. Explicar acciones ilegales y permitir reinicio.
- **Playmat:** dos campos, zonas, cartas genéricas, Active/Rested, asignación de DON!!, límites, visibilidad y movimientos. Arrastrar opcional; controles equivalentes por toque y teclado.
- **Efectos:** escenarios guiados de costes, condiciones, orden de resolución, efectos simultáneos, reemplazo y Once Per Turn. Registrar pasos y referencias.
- **Casos prácticos:** pregunta situacional, elección, resolución paso a paso y enlaces a reglas. Clasificar por nivel y mecánica.

Separar motor puro TypeScript de Svelte. Estado inmutable, acciones tipadas, validadores y resultados deterministas; no usar lógica visual como autoridad. Modelar solo las interacciones soportadas y declararlas; no prometer un motor universal de todas las cartas. Si una interacción no está implementada, indicarlo explícitamente. Usar cartas ficticias o recursos autorizados y no confundir simulación educativa con juego competitivo completo.

## 7. Encuentra tu mazo ideal

Objetivo: recomendar mazos de entrada legales en el formato Standard vigente aplicable a Latinoamérica, no necesariamente meta. Considerar lanzamientos recientes sin favorecer automáticamente lo nuevo. La legalidad es un filtro obligatorio para las recomendaciones Standard; los mazos históricos/casuales, si se conservan, estarán separados y claramente marcados.

| Color | Tendencia general, no regla absoluta |
|---|---|
| Rojo | Presión, ataques y modificación de poder |
| Verde | Control de campo, Rested y reactivación |
| Azul | Gestión de mano/mazo y devolución de cartas |
| Morado | Aceleración y administración de DON!! |
| Negro | Reducción de costes y eliminación |
| Amarillo | Vidas y Trigger |

### Funciones

- Explorador de colores con fortalezas, desafíos, mecánicas y ejemplos de líderes vigentes; permitir multicolor.
- Test de preferencias: ritmo, interacción, recursos, tolerancia a complejidad, estilo de victoria; resultados explicables, empates y combinación de colores. No presentarlo como diagnóstico.
- Filtros por color, presupuesto, dificultad, estilo, monocolor/multicolor, Starter Deck o construido, temática y lanzamientos recientes.
- Catálogo Starter, Budget, Beginner, Casual, Temático y Evolutivo. Etiquetas combinables; no crear listas solo para llenar categorías.
- Ficha: líder y código, 50 cartas con cantidades, versión y fecha de validación, dificultad, estilo, presupuesto CLP cuando haya fuente fiable, mecánicas, plan de primeros turnos, mulligan, combos, errores frecuentes, mejoras y sustituciones legales. Exportación de decklist en texto copiable; imágenes solo si autorizadas.
- Rotación futura: mostrar fecha oficial, cartas afectadas, sustituciones revisadas y coste de adaptación cuando verificable. No especular fechas ni garantizar precios.

### Algoritmo de recomendación

Primero filtrar por legalidad, región, fecha efectiva, preferencias obligatorias y disponibilidad verificable cuando se solicita. Después ordenar por puntuación editorial normalizada 0–100: facilidad 30%, identidad del color 25%, accesibilidad económica 20%, consistencia 15%, mejoras futuras 10%. Documentar rúbrica y evidencia de cada puntuación. Los datos desconocidos no se presentan como certezas; si falta precio, mostrar desconocido y renormalizar pesos disponibles indicando cobertura. Afinidad del test sirve para filtrar o desempatar; recencia es filtro/preferencia, no sustituto de calidad. No usar win rate o tier competitivo como requisito. Revisar manualmente cada lista y procurar al menos una opción por color cuando exista una opción adecuada y verificable.

## 8. Datos y legalidad

Modelos Zod (campos orientativos, ampliar según fuente):

| Entidad | Campos esenciales |
|---|---|
| Rule | id, parentId, chapter, title, explanation, sourceVersion, sourcePage, relatedIds, reviewStatus |
| Lesson | id, level, prerequisites, ruleIds, exerciseIds |
| Card | canonicalId, number, category, colors, types, power, cost, life, counter, effect, blockSymbol, printings, sourceRef |
| Printing | id, cardId, productId, blockSymbol, region, releaseDate, sourceRef |
| Product | id, kind, name, region, releaseDate, sourceRef |
| FormatSnapshot | id, region, format, effectiveFrom, rotationPolicy, bans, restrictions, exceptions, verifiedAt, sources |
| Deck | id, leaderId, entries[{cardId, quantity}], tags, difficulty, scoreBreakdown, strategy, alternatives, reviewedAt |
| Validation | deckId, snapshotId, status, violations, checkedAt, nextKnownChange |
| Source | url, retrievedAt, effectiveDate, hash, parserVersion, reviewStatus |
| Question/Scenario | id, level, prompt, options/state, answer, rationale, ruleIds, version |

No confundir número de carta, impresión alternativa, reimpresión y símbolo de bloque. Aplicar política oficial de reimpresiones, excepciones y restricciones por combinación o líder cuando existan. El validador comprueba líder, 50 cartas, cantidades, colores, disponibilidad temporal, restricciones y excepciones; DON!! se valida por separado. Resultado `valid`, `invalid`, `unknown` o `pending-review`; solo `valid` con datos vigentes se recomienda como Standard. Usar fechas efectivas, no fecha de anuncio. Evaluar también snapshot futuro sin invalidar anticipadamente. No codificar una rotación fija sin verificarla.

Fuentes prioritarias (confirmar rutas y permisos al implementar):
- https://en.onepiece-cardgame.com/cardlist/
- https://en.onepiece-cardgame.com/products/
- https://en.onepiece-cardgame.com/rules/
- https://en.onepiece-cardgame.com/ — noticias y anuncios.

Usar edición inglesa y calendario aplicable a Latinoamérica, comprobar particularidades regionales. No se han verificado en este plan los lanzamientos ni la rotación efectiva de noviembre de 2026; son tareas bloqueantes de publicación. No asumir API oficial estable ni permisos de scraping; respetar términos, límites y robots, usar fuentes autorizadas o carga manual si es necesario. Precios locales opcionales, nunca inventados.

## 9. Automatización y actualización

GitHub Actions ejecuta procesos diarios (cron UTC y disparo manual): obtener fuentes permitidas con timeout, reintentos limitados y caché; conservar metadatos/hash; detectar cambios semánticos; validar esquema, fechas y cobertura; comparar snapshot anterior; ejecutar validación de mazos; generar informe y PR de datos para revisión. No fusionar automáticamente cambios estratégicos ni traducciones. Si no cambia nada, no generar PR. Si falla una fuente, conservar último snapshot fiable, mostrar antigüedad y marcar legalidad no confirmada al superar umbral.

Propuesta inicial: advertencia de datos desactualizados tras 48 h sin comprobación exitosa; ocultar recomendaciones Standard no verificables tras 7 días o al alcanzar una fecha efectiva conocida sin snapshot aprobado, lo que ocurra primero. Ajustar umbrales según operación. Para una prohibición detectada pendiente de revisión, suspender recomendación afectada mediante un snapshot de seguridad revisado y publicado con prioridad. GitHub Pages no actualiza el contenido hasta un nuevo despliegue; no prometer actualización en tiempo real.

| Workflow | Disparador | Resultado |
|---|---|---|
| ci.yml | PR/push | lint, typecheck, esquemas, cobertura, tests, build |
| sync-cards.yml | Diario/manual | cambios de cartas/productos, PR |
| sync-qa.yml | Diario/manual | nuevos Q&A, cambios y PR editorial |
| sync-rules.yml | Diario/manual | cambios de reglamento/erratas, informe y PR |
| sync-format.yml | Diario/manual | rotación, restricciones y fechas efectivas |
| validate-decks.yml | Cambios de datos/manual | informe de legalidad y bloqueos |
| deploy.yml | main validada/manual | build, Pagefind, artifact y publicación |

Evitar ejecuciones concurrentes conflictivas; permisos mínimos, acciones fijadas, secretos solo en CI, PR con revisión. Confirmar configuración de permisos para creación de PR y ejecución de checks; usar credencial de alcance mínimo si GITHUB_TOKEN no dispara workflows necesarios. No ejecutar contenido remoto como código. GitHub puede retrasar cron o deshabilitarlo por inactividad; mostrar fecha de última comprobación, documentar ejecución manual y recuperación. Las fechas futuras conocidas requieren un despliegue programado o evaluación cliente conservadora. Revisar mazos tras cada expansión; precios semanalmente solo si fuente fiable.

## 10. Arquitectura del repositorio

```text
optcg-academy/
├── .github/workflows/
├── public/assets/
├── src/
│   ├── components/{ui,interactive}/
│   ├── content/{rules,lessons,keywords,guides,cases,qa}/
│   ├── content.config.ts
│   ├── data/{cards,products,decks,rotation,restrictions,questions,qa}/
│   ├── features/{battle,turns,playmat,effects,recommender,quizzes}/
│   ├── domain/{game,legality,recommendation}/
│   ├── layouts/
│   ├── pages/
│   ├── styles/
│   ├── stores/
│   └── lib/
├── scripts/{sync,validate,coverage}/
├── tests/{unit,integration,e2e,fixtures}/
├── docs/{adr,sources,coverage}/
├── astro.config.mjs
├── package.json
├── package-lock.json
├── README.md
└── plan.md
```

Dependencias de dominio hacia ningún framework; UI consume dominio y datos validados. Scripts de ingesta separados del navegador. Usar islas `client:visible` para interacciones bajo el pliegue y `client:load` cuando sean necesarias inmediatamente. HTML estático para reglas, fichas y lecciones. Evitar hidratar todo el sitio. localStorage con migraciones, manejo de errores, exportación/importación opcional y borrado del progreso; sin sincronización entre dispositivos ni datos personales obligatorios.

## 11. Despliegue y calidad

Configurar `site` y `base` según URL real de repositorio; rutas y recursos respetan `BASE_URL`. Generar rutas estáticas con `getStaticPaths`; página 404, enlaces directos, sitemap y metadatos. Pagefind indexa `dist` tras build; probar bajo subruta real. GitHub Pages configurado con fuente GitHub Actions, artifact de `dist`, permisos `pages: write` e `id-token: write` solo en deploy. Dominio propio opcional. README con instalación, `npm ci`, `npm run dev`, `npm run check`, `npm test`, `npm run build`, `npm run preview`, publicación y actualización manual. Definir estos scripts efectivamente en package.json.

Pruebas unitarias: reglas del motor, casos límite, validación de cantidades/colores, reimpresiones, fechas y restricciones, puntuaciones y empates. Integración: fixtures de fuentes, cambio de esquema, fallos de red, snapshot anterior/futuro, matriz de cobertura. E2E: navegación móvil/escritorio, búsqueda bilingüe y por ID, quiz, combate, turnos, playmat, filtros, persistencia, enlaces directos, subruta Pages y estados de datos vencidos. Accesibilidad automatizada y manual con teclado/lector. Objetivos iniciales: LCP <=2.5 s, CLS <=0.1, INP <=200 ms como metas de campo cuando existan métricas; pruebas Lighthouse como aproximación, no garantía. Imágenes optimizadas y carga diferida. Sin rastreo por defecto.

## 12. Roadmap y entregables

| Fase | Trabajo | Criterio de salida |
|---|---|---|
| 0. Descubrimiento | Verificar fuentes, permisos, formato regional, inventario PDF, ADR | Fuente vigente y matriz de reglas aprobadas; riesgos documentados |
| 1. Base | Astro/Svelte, tokens, rutas, CI, Pages, layout y búsqueda | Build y despliegue de prueba bajo subruta; navegación accesible |
| 2. Reglamento | 11 capítulos, todas las subreglas, glosario, Q&A y referencias | Cobertura 100% del snapshot de reglas aprobado; inventario y cobertura Q&A documentados; revisión humana |
| 3. Academia | Cinco niveles, progreso, cuestionarios y casos | Recorrido completo desde cero y retroalimentación verificada |
| 4. Simuladores | Motor puro, combate, turnos, playmat, efectos | Casos límite aprobados y alcance visible |
| 5. Datos y mazos | Catálogo vigente, legalidad, test, filtros y fichas | Todas las recomendaciones verificadas y revisadas |
| 6. Automatización | Sync, snapshots, PR, alertas, caducidad | Simulación de rotación, prohibición y fallo de fuente exitosa |
| 7. Lanzamiento | QA, revisión editorial, accesibilidad, documentación | Cumplimiento de definición de terminado y publicación |

Las fases 2 y 5 pueden avanzar en paralelo tras la base; la automatización puede iniciarse antes con fixtures. Publicar preview/MVP solo con alcance visible, sin afirmar cobertura completa o vigencia no comprobada. No fijar plazos sin conocer capacidad del equipo. Backlog posterior: modo offline/PWA, inglés, importación avanzada de listas, contribuciones comunitarias moderadas y dominio propio; no necesarios para primera versión.

## 13. Definición de terminado

- [ ] 11 capítulos y todas las subreglas de la versión vigente aprobada, trazables y revisadas.
- [ ] Q&A oficiales inventariados, aclaraciones relevantes revisadas, buscables y trazables; conflictos y faltantes visibles.
- [ ] Academia completa, glosario, casos y cuestionarios con explicaciones correctas.
- [ ] Simuladores funcionales con límites explícitos y pruebas de casos críticos.
- [ ] Recomendador con colores, test, filtros, fichas y listas verificadas; ninguna recomendación Standard inválida o desconocida.
- [ ] Fuentes, región, formato, fechas efectivas, última revisión y estado de sincronización visibles.
- [ ] CI verde, pruebas de actualización y fallos, build reproducible y GitHub Pages accesible.
- [ ] Navegación móvil, teclado, contraste, modo claro/oscuro y búsqueda probados.
- [ ] README, ADR, guía editorial, guía de mantenimiento y procedimiento de rollback.
- [ ] Aviso no oficial, créditos y permisos de recursos comprobados; sin claves ni datos personales expuestos.

## 14. Instrucciones para el agente de desarrollo

Trabajar por fases y PR pequeños, no implementar todo en un único cambio. Leer este plan, inspeccionar repositorio y fuentes antes de escribir código. Crear issues con criterios verificables; registrar decisiones y supuestos. No inventar cartas, fechas, precios, legalidad, reglas o fuentes. Usar fixtures explícitamente ficticios solo en pruebas. Si una fuente no está disponible, bloquear la afirmación afectada, no el trabajo independiente. Mantener contenido y lógica separados. Ejecutar checks antes de entregar cada fase y reportar comandos, resultados reales, archivos modificados y pendientes. No publicar ni cambiar configuración remota sin autorización. Actualizar plan y matriz de cobertura cuando cambie el alcance.

## 15. Riesgos y decisiones pendientes

| Riesgo / decisión | Mitigación |
|---|---|
| Rotación o lanzamientos no verificados | Fase 0 bloqueante; no seleccionar líderes definitivos todavía |
| Cambios en HTML oficial o falta de API | Adaptadores, fixtures, revisión manual y snapshots |
| Derechos sobre PDF, cartas e ilustraciones | Explicaciones originales, enlaces y permisos antes de redistribuir |
| Errores de interpretación | Revisión por jugador experimentado/juez y trazabilidad |
| GitHub Pages estático y cron no garantizado | Fechas visibles, caducidad, ejecución manual, rollback a versión segura |
| Presupuesto CLP variable | Fuente fechada o valor desconocido |
| Identidad y nombre | OPTCG Academy es nombre provisional; branding final por confirmar |
| Alcance del motor | Escenarios educativos, no simulador universal |

Decisiones propuestas sin confirmación específica: nombre, slugs, npm, umbrales de caducidad, objetivos de rendimiento y orden de fases. Son ajustables. Este documento define el desarrollo; no acredita que el sitio, automatizaciones o recomendaciones ya estén implementados o validados.


## 16. Investigación futura: Oplay y OPTCGSim (fuera del MVP)

Objetivo: evaluar si existe código reutilizable o conocimiento arquitectónico útil para ampliar los simuladores educativos. No incorporar un simulador completo, multijugador, matchmaking, IA rival ni motor universal al alcance inicial. No depender de estos proyectos para entregar el MVP.

Spike posterior al lanzamiento, acotado inicialmente a 2–3 jornadas de trabajo (estimación propuesta):

1. Identificar los proyectos exactos, repositorios oficiales, autores, versiones y licencias. No asumir que Oplay u OPTCGSim tienen código fuente público o licencia abierta; no se ha verificado su disponibilidad ni se ha extraído código.
2. Inspeccionar únicamente código publicado y autorizado: modelo de estado, acciones, validación, timings, resolución de efectos, datos y pruebas. No descompilar binarios ni extraer código privado o recursos sin autorización.
3. Evaluar compatibilidad con TypeScript, ejecución local en navegador, Astro/Svelte y GitHub Pages; identificar dependencias de servidor, protocolos, rendimiento, mantenimiento y cobertura real de reglas.
4. Revisar licencias, obligaciones de atribución y redistribución, compatibilidad de dependencias y derechos independientes sobre cartas e imágenes. Un repositorio público sin licencia explícita no autoriza reutilización.
5. Si es viable y autorizado, realizar una prueba aislada de una mecánica concreta (por ejemplo, resolución de combate) mediante adaptador, sin acoplar el dominio existente. Comparar con la implementación educativa propia usando fixtures oficiales y Q&A revisados.
6. Entregar ADR con decisión: reutilizar un módulo autorizado, adoptar únicamente ideas arquitectónicas mediante implementación propia, o descartar. Incluir coste de integración, mantenimiento, licencias, resultados de pruebas y justificación.

Criterio go/no-go: licencia y procedencia claras, beneficio educativo medible, compatibilidad estática, exactitud comprobable y coste de mantenimiento razonable. Si falla cualquiera de estos requisitos o el beneficio no justifica la complejidad, descartar la integración. No copiar código por defecto. El motor educativo independiente permanece como solución base.
