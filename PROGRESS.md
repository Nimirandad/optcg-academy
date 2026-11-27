# Estado del desarrollo

**Última actualización:** 2026-11-27 · **Fase actual:** 1 (Base), implementada en local; falta CI remota y despliegue de prueba.

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

En este equipo se necesitó configuración local de certificados para instalar herramientas; la verificación TLS no se desactivó.

Sin verificar: CI en GitHub, despliegue en Pages, Firefox, Safari, lector de pantalla y Lighthouse.

Los scripts de extracción fueron temporales y no están en el repositorio; T2.1 creará el validador permanente.

## Alertas con fecha

- **2026-11-27:** nuevas parejas prohibidas (EB05-001 con OP13-001 y con OP01-002).
- **2026-12-18:** ST-37 y ST-38. Reglas, Q&A y restricciones deben revisarse de nuevo antes de publicar.
- **2027-04-01:** bloques 1 y 2 salen de Standard, salvo excepciones.

## Bloqueos (requieren al propietario)

1. Autorizar el primer commit y push (necesario para T1.8).
2. Autorizar Pages y el despliegue de prueba (T1.9).

## Definido por el propietario

- El repositorio de GitHub no existe y se creará con GitHub CLI.
- La revisión humana de reglas la hará el propietario junto con su grupo de juego.
- ADR-002 a ADR-009 aprobadas, incluidas las dependencias de ADR-005 y la política de contenido de ADR-006.
- Descarga de los PDF oficiales de reglas y Q&A autorizada y realizada.
- 2026-11-27: Fase 0 aprobada con T0.8 pendiente (ADR-012); repositorio público; instalación de Node 24 y dependencias autorizada; commits con correo personal.

## Próximos pasos

1. T1.8: push y primera ejecución de CI.
2. T1.9: despliegue de prueba bajo la subruta.
3. T0.8 (antes de la Fase 2): revisión humana con `docs/coverage/revision-reglamento-T0.8.xlsx` (hoja lista, sin completar).
