# Guía editorial del reglamento

## Fuente

`references/rule_comprehensive.pdf`, versión 1.2.1 (local, no versionada; ADR-006). El SHA-256 está en `docs/coverage/rules-inventory.json`. Ante cualquier duda manda el original oficial.

## Formato

Un archivo por capítulo: `src/content/rules/chapter-NN.json`. Hay una entrada por cada ID del inventario, incluido el del capítulo (su resumen).

| Campo | Uso |
|---|---|
| `id` | ID original, sin cambios |
| `title` | Título propio; obligatorio en las secciones `X-Y` |
| `explanation` | Qué dice la regla, con palabras propias |
| `example` | Situación inventada que la ilustra; sin cartas reales |
| `tip` | Consejo de juego; nunca añade ni cambia reglas |
| `relatedIds` | Otras reglas relevantes |
| `reviewStatus` | `pending` hasta que una persona revise |
| `note` | Discrepancia u observación sobre la fuente, visible en el sitio |
| `reviewedBy` | Quién revisó; obligatorio con `reviewed` |

Plantilla:

```json
{ "id": "X-Y-Z", "explanation": "…", "relatedIds": [], "reviewStatus": "pending" }
```

## Redacción

- Español de Latinoamérica, trato de «tú», frases cortas.
- No traducir literalmente ni copiar pasajes del reglamento: explicar.
- Conservar todas las condiciones, excepciones y cantidades. «Puede» y «debe» no son intercambiables.
- Términos oficiales en inglés para zonas, fases, estados y keywords cuando ayuden a leer las cartas (`Active`, `Rested`, `Blocker`).
- Cada excepción aparece junto a su regla o se enlaza.
- Los IDs escritos en el texto se convierten en enlaces; citar solo IDs existentes.
- Ejemplos y consejos van en su campo, separados de la explicación.
- Si el original es ambiguo, usar `conflict` y describir la duda; no resolverla sin respaldo oficial (ADR-010).

## Revisión

1. Comparar cada entrada con la página indicada del PDF.
2. Corregir y, solo una persona, cambiar a `reviewed` con `reviewedBy`.
3. `npm run validate -- --write` y `npm run check`.

Si cambia la versión del reglamento: actualizar el inventario, revisar las reglas afectadas y devolverlas a `pending`.

## Q&A

- Los PDF y el texto extraído viven en `references/qa/`, que no se versiona (ADR-006).
- `src/data/qa/documents.json` es generado: IDs, páginas, cartas citadas, keywords detectadas y huella de cada fila. No editar a mano.
- Las explicaciones van en `src/content/qa/<documento>.json`: `id`, `sourceHash` (copiado del índice), `question` y `answer` con palabras propias, `ruleIds`, `note` y `reviewStatus`.
- No traducir literalmente ni extrapolar una respuesta sobre una carta a otras.
- Si la aclaración y el reglamento no calzan, usar `conflict` y describir la duda en `note`.

Para regenerar el índice (la extracción requiere macOS):

```bash
swift scripts/sync/extract-qa.swift references/qa references/qa/extracted.json
```

```bash
node scripts/sync/build-qa-index.ts
```

Antes, los PDF nuevos deben quedar registrados con su URL, fecha y SHA-256 en `docs/sources/descargas-2026-11-26.json`. Si la huella de una pregunta cambia, `npm run validate` marca su explicación como desactualizada. Los ID dependen de la posición en la página: tras una actualización, revisar que cada explicación siga apuntando a la pregunta correcta.

Carga manual de respaldo: si una tabla se extrae mal, crear `references/qa/manual.json` con la forma `{"archivo.pdf": {"3": [["OP00-000", "Nombre", "Pregunta?", "Respuesta."]]}}`. Cada página indicada reemplaza por completo a la extraída, así que hay que incluir todas sus filas.

## Hoja de revisión (T2.10)

`npm run review-sheet` crea `docs/coverage/revision-contenido-T2.10.csv`. En cada fila, la persona revisora anota resultado, nombre, fecha y comentario. Después se refleja en el JSON: `reviewed` con `reviewedBy` (y `reviewedAt` en Q&A). La hoja por sí sola no cambia estados.

## Lecciones y cuestionarios

- Lección: `src/content/lessons/<id>.md` con objetivo, nivel, orden, prerrequisitos, reglas y `exerciseIds`.
- Preguntas: `src/data/questions/<id>.json`. Al menos tres opciones, una correcta, y cada una con el motivo (`rationale`).
- Cada lección lleva explicación breve, un ejemplo visual en tabla o lista, una práctica y preguntas.
- Declarar los supuestos en `assumption` cuando una carta podría cambiar la respuesta.
- Separar los consejos de las reglas. No usar cartas reales como ejemplo.
- Al cambiar una pregunta, subir su `version`. El build falla si hay referencias rotas.
- Casos: `src/data/cases/<id>.json`, con nivel, mecánicas, pasos, reglas y las aclaraciones (`qaIds`) en que se apoyan.
