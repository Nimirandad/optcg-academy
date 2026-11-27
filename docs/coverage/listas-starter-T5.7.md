# Listas de ST-31 a ST-36: fuentes y revisión (T5.7)

**Consulta:** 2026-11-27. **Estado:** ST-31 a ST-35 aprobadas por el propietario el 2026-11-27 (ADR-030), en `src/data/decks/starter-decks.json`. ST-36 pendiente.

Hoja: [listas-starter-T5.7.csv](listas-starter-T5.7.csv). No se completó fila por fila ni se cotejó con mazos físicos; sirve para hacerlo más adelante.

## Fuentes

- Oficiales (`en.onepiece-cardgame.com`, y las páginas de producto de ST-31 en la edición asiática y japonesa): dan las 15 cartas de cada mazo, pero en lo consultado no aparecen las cantidades. Las páginas de producto dicen 51 cartas (incluido el Leader) o 50 más el Leader.
- Terceros, no oficiales: las cantidades de la hoja salen de `https://tier-one-onepiece.jp/blog/stNN-card-list/` (NN = 31 a 35; edición japonesa).
- Contraste de ST-31: `https://x.com/OPMerchandise/status/2073444961509605822`.

| Mazo | Respaldo | Observación |
|---|---|---|
| ST-31 | Dos fuentes | Coinciden por nombre; la publicación de X confunde los números ST31-002 a 004 y OP11-003. La tabla de la primera omite la cantidad del Leader en el formato leído (se asume 1) |
| ST-32 | Una fuente | Imprime OP10-036 dos veces; la fila de Kawamatsu corresponde a OP12-023 |
| ST-33 | Una fuente | — |
| ST-34 | Una fuente | — |
| ST-35 | Una fuente | — |
| ST-36 | Ninguna | La página no trae la tabla y no se hallaron cantidades en las demás consultadas |

## Comprobaciones hechas

ST-31 a ST-35 suman 50 cartas más el Leader, usan exactamente las cartas de la lista oficial de cada producto y el validador no encuentra infracciones ni datos desconocidos con el snapshot vigente (resultado `pending-review`). Esto no demuestra que las cantidades sean las del producto: varias distribuciones suman 50.

Que la edición inglesa traiga las mismas cantidades que la japonesa no se ha comprobado.
