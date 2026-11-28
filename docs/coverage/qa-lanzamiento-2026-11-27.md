# QA de lanzamiento · 2026-11-27

## Accesibilidad

- Antes de las correcciones, `E2E_PORT=4331 npm run test:e2e -- --workers=3` completó 194 de 194 pruebas. La repetición completa tras las correcciones se interrumpió por tiempos de espera. La repetición dirigida de Academia, portada y simuladores con un trabajador completó 12 de 12, incluidos los dos recorridos que habían agotado el tiempo.
- Chromium de escritorio y a 320 px. La suite recorre lecciones, casos, simuladores, búsqueda, reglas y mazos. Las pruebas con axe cubren modos claro y oscuro. También se prueba la navegación sin JavaScript.
- Con teclado en Chrome se verificaron el salto al contenido, la entrada al combate, la ejecución del primer ataque y el foco en «Repetir reto» después del resultado.
- Lighthouse detectó que el nombre accesible de la carta inicial de Combate omitía datos visibles. Se añadieron al nombre del botón y la auditoría de coincidencia pasó en la segunda medición.
- VoiceOver se activó con autorización y se volvió a desactivar. El árbol de accesibilidad expuso el nombre actualizado de la carta. Queda pendiente confirmar la salida del lector al navegar, ejecutar la jugada y recibir su resultado. Repetir también con el cuestionario y el diálogo de mazos para confirmar los anuncios y el retorno del foco.

## Rendimiento e imágenes

Lighthouse móvil 13.6.0 en Chrome headless contra el build local. Una medición por ruta después de los ajustes.

| Ruta | Rendimiento | Accesibilidad | LCP | CLS | TBT | Transferencia |
|---|---:|---:|---:|---:|---:|---:|
| Portada | 98 | 100 | 2,41 s | 0 | 0 ms | 250 KiB |
| Aprende | 100 | 100 | 1,89 s | 0 | 0 ms | 145 KiB |
| Mazos | 100 | 100 | 1,36 s | 0 | 0 ms | 66 KiB |
| Combate guiado | 100 | 100 | 0,91 s | 0 | 0 ms | 110 KiB |

La portada transfirió 255.527 bytes frente a 460.653 de la primera pasada, un 45 % menos. El mapa eligió variantes de 160 px y la ilustración principal móvil pasó de 127.906 a 105.212 bytes. Lighthouse aún señala tamaño reducible en la ilustración y el logotipo. TBT es una métrica de laboratorio. El INP de campo queda por medir.

## Permisos, créditos y privacidad

- El aviso no oficial está en el pie de página y en Acerca. Acerca acredita las ilustraciones propias, incluidas piezas hechas con ImageGen, y explica dónde se guarda el avance.
- Las fuentes de Bandai y las listas de terceros se atribuyen por enlace. Según ADR-006 y ADR-045, las copias de cartas para desarrollo se sirven desde `references/card-art/` y se excluyen de producción. Se inspeccionó `dist/` y se comprobó la ausencia de copias de cartas oficiales, PDF, hojas de cálculo, archivos de entorno y mapas de código fuente.
- La búsqueda de patrones de correos personales, rutas de usuario y claves en `src/`, `public/`, `docs/` y `dist/` no encontró coincidencias. Se comprobó la ausencia de integraciones de analítica en los archivos del sitio.

## Definición de terminado

| Criterio de plan.md §13 | Estado y evidencia |
|---|---|
| Reglamento completo y revisado | Snapshot de referencia v1.2.1 con 11 capítulos y 492/492 explicaciones revisadas. Reconfirmar vigencia antes de publicar. |
| Q&A trazables, buscables y revisados | 49 documentos y 1.502 aclaraciones revisadas en el snapshot, cobertura y enlaces comprobados. Reconfirmar nuevos avisos y cambios antes de publicar. |
| Academia, glosario, casos y cuestionarios | Recorrido E2E de las 24 lecciones, incluidos progreso y retroalimentación. Cobertura editorial registrada en T2.10 y T3.6. |
| Simuladores y casos críticos | Pruebas unitarias y E2E para combate, turnos, mesa y efectos, con límites visibles. |
| Recomendador y fichas | Filtros, test, nueve fichas y cinco listas revisadas. Las cuatro referencias conservan su estado editorial. El sitio deja sin confirmar la vigencia cuando caducan los datos o falta un snapshot aplicable. Los campos estratégicos y precios sin respaldo siguen pendientes. |
| Fuentes y vigencia visibles | Fichas Standard con fecha de comprobación, región, cambios conocidos y caducidad. Ningún snapshot aprobado desde el 2028-04-01. |
| CI, build, actualización y Pages | Build y verificaciones locales. El workflow de formato pasó en GitHub. Falta verificar la incidencia (T6.5) y publicar esta versión. |
| Móvil, teclado, contraste, tema y búsqueda | E2E en escritorio y a 320 px con auditorías en ambos temas. Pendiente completar salida de VoiceOver. |
| Documentación y rollback | README, ADR, guía editorial y procedimiento de mantenimiento y rollback actualizados. |
| Aviso no oficial, créditos y privacidad | Revisados para el artefacto local conforme a los ADR de contenido y arte. |
