# OPTCG Academy

Plataforma educativa **no oficial** de ONE PIECE Card Game en español de Latinoamérica. No está afiliada ni respaldada por Bandai ni por los titulares de ONE PIECE.

**Estado:** Fase 7 de QA de lanzamiento. El sitio reúne el reglamento y las aclaraciones de referencia, 24 lecciones, cuatro simuladores educativos y un catálogo de mazos con fichas. El seguimiento de cobertura, vigencia y verificaciones está en [PROGRESS.md](PROGRESS.md).

## Requisitos

Node 24 (ver `.nvmrc`) y npm 11 o posterior.

```bash
nvm install
npm ci
npx playwright install --no-shell chromium
```

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo (sin búsqueda de texto) |
| `npm run check` | Tipos de Astro y TypeScript, y esquemas de contenido |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run validate` | Cobertura del reglamento; con `-- --write` regenera `docs/coverage/rules-matrix.csv` |
| `npm run review-sheet` | Crea la hoja de revisión humana de contenido |
| `npm run build` | Sitio estático en `dist/` e índice de Pagefind |
| `npm run preview` | Sirve `dist/` bajo la subruta |
| `npm run test:e2e` | Build y pruebas de navegador (Playwright) |

Si el puerto 4321 está ocupado, las pruebas de navegador aceptan otro: `E2E_PORT=4322 npm run test:e2e`.

`npm run check` no revisa los tipos dentro de archivos `.svelte`.

## Dirección del sitio

Por defecto: `https://nimirandad.github.io/optcg-academy/`. Se cambia con las variables `SITE_URL` y `BASE_PATH`. Los enlaces internos deben usar `withBase` (`src/lib/paths.ts`). Las pruebas de navegador asumen la subruta por defecto.

## Publicación

Cada fusión (o push) en `main` publica el sitio: el workflow **CI** verifica y, si todo pasa, despliega en GitHub Pages (ADR-042). Los PR solo se verifican. Fusionar equivale a publicar, así que las comprobaciones previas a publicar se hacen antes.

- La fuente de Pages está configurada como **GitHub Actions** (*Settings → Pages*).
- Para volver a publicar sin cambios: *Actions → CI → Run workflow* sobre `main`.
- La [guía de mantenimiento y rollback](docs/mantenimiento.md) describe qué verificar antes de publicar y cómo restaurar una versión segura.

## Actualización de datos

Es manual: verificar las fuentes oficiales, editar el contenido, anotar URL y fecha de consulta, y ejecutar los comandos de arriba.

`npm run sync` compara las fuentes con los datos y solo informa (salida 0 sin diferencias, 2 con diferencias, 1 si falla una fuente). Lee las copias locales de `references/`; `-- --red` consulta el sitio oficial y requiere autorización del propietario (ADR-006, ADR-035). `-- --pdf` compara también las huellas de los PDF y `-- --salida informe.json` guarda el informe. En GitHub, los workflows «Sincronizar …» (*Actions*) hacen la misma comparación con `--red`; solo se lanzan a mano y cada ejecución consulta el sitio. Con diferencias o fallos abren o actualizan una incidencia (ADR-040). No hay sincronización programada ni PR automáticos.

La redacción de reglas, Q&A y lecciones sigue [docs/editorial.md](docs/editorial.md).

Las cartas prohibidas se actualizan a mano en `src/data/restrictions/standard.json`, con la fecha de consulta.

### Mazos y suspensiones

`npm run validate:decks` muestra la legalidad de cada mazo hoy y en las fechas con cambios conocidos (salida 2 si hoy no hay formato o algún mazo es ilegal; `-- --fecha AAAA-MM-DD` cambia la fecha).

Las fichas Standard y el informe de legalidad toman la fecha más antigua de la comparación completa aprobada en `src/lib/standard-checks.ts`. Al aprobar una nueva comparación, guarda el informe de `--salida` en `docs/sources/` y actualiza la importación. Usa un informe de las cuatro áreas, con consulta real autorizada, todas las fuentes correctas y sin diferencias pendientes. Las fichas muestran un aviso pasadas 48 horas y dejan la vigencia sin confirmar pasados 7 días. El informe muestra por separado el resultado del validador y cuántos mazos se pueden recomendar en la fecha actual.

Ante un cambio detectado y aún sin revisar (por ejemplo, una prohibición), añadir una entrada a `src/data/safety/standard.json`, ejecutar los comandos de arriba y publicar con prioridad (al fusionar en `main`):

| Campo | Valor |
|---|---|
| `id`, `reason` | Identificador en minúsculas y motivo |
| `target` | `{"kind":"card","cardId":…}`, `{"kind":"pair","cardIds":[…,…]}` o `{"kind":"format"}` |
| `effectiveFrom`, `effectiveUntil` | Desde cuándo suspender; `null` mientras siga abierta |
| `sourceRef`, `reviewStatus` | Fuente con URL y fecha de consulta; estado de revisión |

Actualizar también `updatedAt`. La suspensión se retira cuando el snapshot de formato revisado recoja el cambio.

## Derechos

No se versionan textos extensos, imágenes ni PDF oficiales (ver ADR-006 en [DECISIONS.md](DECISIONS.md)). Para usar el reglamento local, copiar el PDF oficial en `references/`.
