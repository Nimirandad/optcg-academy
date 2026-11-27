# OPTCG Academy

Plataforma educativa **no oficial** de ONE PIECE Card Game en español de Latinoamérica. No está afiliada ni respaldada por Bandai ni por los titulares de ONE PIECE.

**Estado:** Fase 1 (base). Las reglas, lecciones, mazos y Q&A todavía no tienen contenido. Ver [PROGRESS.md](PROGRESS.md).

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
| `npm run build` | Sitio estático en `dist/` e índice de Pagefind |
| `npm run preview` | Sirve `dist/` bajo la subruta |
| `npm run test:e2e` | Build y pruebas de navegador (Playwright) |

`npm run check` no revisa los tipos dentro de archivos `.svelte`.

## Dirección del sitio

Por defecto: `https://nimirandad.github.io/optcg-academy/`. Se cambia con las variables `SITE_URL` y `BASE_PATH`. Los enlaces internos deben usar `withBase` (`src/lib/paths.ts`). Las pruebas de navegador asumen la subruta por defecto.

## Publicación

El despliegue es manual y requiere autorización del propietario:

1. La fuente de Pages ya está configurada como **GitHub Actions** (*Settings → Pages*).
2. En *Actions → Desplegar en GitHub Pages*, ejecutar el workflow sobre `main`.
3. Comprobar el sitio publicado.

Para volver a una versión anterior, revertir el commit en `main` y desplegar de nuevo.

## Actualización de datos

Todavía es manual: verificar las fuentes oficiales, editar el contenido, anotar URL y fecha de consulta, y ejecutar los comandos de arriba. La sincronización automática corresponde a la Fase 6.

## Derechos

No se versionan textos extensos, imágenes ni PDF oficiales (ver ADR-006 en [DECISIONS.md](DECISIONS.md)). Para usar el reglamento local, copiar el PDF oficial en `references/`.
