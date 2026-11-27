---
title: "Bucles infinitos"
objective: "Resolver acciones que podrían repetirse sin fin."
level: 5
order: 4
prerequisites: ["procesamiento-de-reglas"]
ruleIds: ["11-1-1", "11-1-1-1", "11-1-1-2", "11-1-1-3"]
exerciseIds: ["bucles-1", "bucles-2", "bucles-3"]
reviewStatus: pending
---

## Tres casos

| ¿Quién puede detenerlo? | Procedimiento |
|---|---|
| Nadie | Empate |
| Una persona | Declara cuántas veces y se corta cuando pueda detenerlo |
| Ambas | Primero declara el jugador de turno, luego la otra; se hace la cantidad menor |

Después no se puede reiniciar el bucle desde el mismo estado, salvo obligación.

## Practica

<details><summary>Ambos pueden detenerlo. Tú (con el turno) dices 10 y tu rival 4. ¿Cuántas veces se hace?</summary>

4, y se corta en un momento en que tu rival pueda detenerlo.

</details>
