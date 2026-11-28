# Mantenimiento y rollback

## Verificar una actualización

1. Revisar las fuentes oficiales de reglamento, rotación, restricciones, erratas, lanzamientos y Q&A. Anotar URL, fecha y estado de revisión. Cada consulta automatizada requiere autorización. Los workflows de sincronización de GitHub se ejecutan manualmente y abren o actualizan una incidencia si encuentran diferencias o fallos.
2. Mantener las descargas de PDF y las imágenes oficiales para desarrollo en `references/`. El sitio enlaza al original y publica explicaciones propias. Aplicar la [guía editorial](editorial.md) para revisar cambios y resolver conflictos.
3. Si alguna fuente falla, conservar los datos aprobados y la última comprobación íntegra. Si aparece una prohibición pendiente de revisión, preparar la suspensión correspondiente según el [README](../README.md). Al aprobar una comparación completa, guardar el informe en `docs/sources/` y actualizar `src/lib/standard-checks.ts`.
4. Ejecutar las verificaciones con el Node indicado por `.nvmrc`. El E2E genera un build de producción bajo la subruta de Pages.

   ```sh
   npm ci
   npm run check
   npm run lint
   npm run validate
   npm run validate:decks
   npm test
   npm run test:e2e
   ```

5. Antes de autorizar la fusión, comprobar las tareas de lanzamiento y que el artefacto `dist/` excluya copias de Bandai, PDF, archivos locales y credenciales. Revisar el diff para descartar datos personales. La CI publica al fusionar en `main` si pasan las verificaciones.

## Restaurar una versión segura

1. En **Actions → CI**, identificar el último despliegue exitoso y anotar su SHA. Compararlo con el cambio que causó el problema. Revisar si restaurar una versión anterior quitaría suspensiones o incorporaría datos vencidos.
2. Preparar en una rama un commit de reversión del cambio defectuoso. Si la publicación viene de un commit de fusión, verificar su primer padre antes de usar `git revert -m 1 <sha-de-la-fusión>`. Para un commit corriente, usar `git revert <sha-del-commit>`. Conservar o reaplicar las suspensiones y correcciones vigentes.
3. Ejecutar las verificaciones con el contenido restaurado y abrir el PR con los SHA de referencia. Tras la autorización de publicación, fusionar y comprobar que CI y Pages terminen correctamente.
4. Comprobar la portada, una regla con ancla, la búsqueda y una ficha de mazo en la dirección de Pages. Confirmar la fecha y el estado de Standard. Registrar el SHA restaurado, el motivo y la ejecución en `PROGRESS.md`.

Si los datos de `main` ya son correctos y solo falló el despliegue, una ejecución manual de **CI** en `main` vuelve a publicar esa versión tras las verificaciones.
