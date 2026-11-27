# Revisión asistida del 2026-11-27

Revisión hecha por el asistente que también redactó el contenido. **No es la revisión humana de T2.10** y no cambia ningún estado a `reviewed`.

## Fuentes en línea (consultadas el 2026-11-27)

| Fuente | Resultado |
|---|---|
| `/rules/` | Comprehensive Rules sigue enlazado con fecha 2026-08-28 |
| `/rules/faq/` | Los 49 PDF mantienen nombre y fecha de URL; ninguno nuevo ni retirado |
| `/news/restriction.html` y avisos de abril, octubre y noviembre de 2026, `/topics/019.php`, `/topics/029.php` e historial | 6 cartas prohibidas, 5 parejas, ninguna restringida |
| 6 avisos de errata | Leídos y resumidos en `src/data/qa/errata.json` |
| `/rules/errata_card/` | Leída; 105 números de carta, 92 de ellos citados en alguna pregunta inventariada |

No se volvieron a descargar los PDF: la comparación es por fecha de URL, no por hash.

## Q&A (1.502 explicaciones)

| Cotejo contra el texto extraído | Alcance | Resultado |
|---|---|---|
| Huella de cada fila | 1.502 | Todas coinciden |
| Sentido «Yes/No» | Automático, 1.502 | 16 diferencias, todas del tipo «Yes, … cannot»: correctas |
| Cifras y números de carta | Automático, 1.502 | Sin errores (una errata del original: «OP011-035») |
| Keywords y posiciones (arriba, abajo, boca abajo) | Automático, 1.502 | Sin errores |
| Lectura enfrentada de respuestas de más de 110 caracteres | 290 más las 11 de «cannot be rested» | 2 correcciones |

Las respuestas cortas restantes solo pasaron los cotejos automáticos: **no se comprobó una por una que la pregunta parafraseada conserve todas las condiciones**. Tampoco se verificó la asociación con reglas.

## Reglas (492) y glosario (24)

Cifras y referencias cruzadas comparadas automáticamente, y lectura enfrentada de las 492 explicaciones con el texto del PDF: 2 correcciones de redacción (8-4-4-2 y 11-2-1). Glosario contrastado con 10-1 y 10-2 sin cambios.

## Cambios

- `rules-p7-5`: se quitó una afirmación que no estaba en la aclaración.
- `op13-p4-6`: pasa a `conflict` frente a 5-2-1-5-1.
- `op06-p2-4`: deja de estar en `conflict`; la errata de OP06-034 explica la respuesta.
- `op02-p10-3`, `op15-eb04-p5-3`, `op16-p7-2`: citan la errata correspondiente.
- `op06-p1-3` a `p1-5`: siguen en `conflict`; OP06-009 no figura en la lista de erratas.

## Conflictos que requieren a una persona o un juez

| Entrada | Duda |
|---|---|
| Regla 5-1-2-4 | Referencia cruzada aparentemente errónea |
| Regla 8-1-3-4-2 | Qué carta «generó» el reemplazo prioritario |
| rules-p3-4 | Zona de Stage en DON!! −X |
| op03-p3-4, p3-5, p4-3, p4-5, p4-6 | Efecto por daño antes del [Trigger], frente a 8-6-2 |
| op06-p1-3, p1-4, p1-5 | Texto actualizado de OP06-009 no verificado |
| op13-p4-6 | Orden de efectos «al comenzar la partida» |
| op15-eb04-p6-3 | Solo menciona DON!! Rested |
| op15-eb04-p7-4 | Nota aparentemente interna en la respuesta oficial |
