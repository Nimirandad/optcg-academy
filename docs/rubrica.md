# Rúbrica de recomendación de mazos

**Estado:** propuesta, sin aprobar (ADR-026). Los pesos vienen de `plan.md` §7; los anclajes son editoriales.

Cada criterio se puntúa de 0 a 100 y exige una evidencia escrita. Sin evidencia se deja `null`: no se estima.

| Criterio (peso) | 0 | 50 | 100 | Evidencia mínima |
|---|---|---|---|---|
| `ease` Facilidad (30 %) | Exige secuencias largas desde el primer turno | Algunas decisiones encadenadas | Plan claro y pocas decisiones simultáneas | Plan de primeros turnos y errores frecuentes |
| `colorIdentity` Identidad del color (25 %) | No muestra la tendencia del color | La muestra en parte | El plan principal la representa | Cartas del mazo que la sostienen |
| `affordability` Accesibilidad económica (20 %) | La opción más cara del catálogo comparable | Intermedia | La más económica | Precio en CLP con URL y fecha; sin fuente, `null` |
| `consistency` Consistencia (15 %) | El plan depende de pocas cartas concretas | Varias formas de acercarse al plan | El plan funciona con casi cualquier mano razonable | Composición del mazo; no usar tasas de victoria |
| `upgrades` Mejoras futuras (10 %) | Sin sustituciones revisadas | Algunas | Ruta de mejora legal y revisada | Lista de sustituciones legales |

Los valores intermedios se permiten si la evidencia explica por qué.

## Cálculo

- Puntaje = suma de valor × peso de los criterios con datos, dividida por la suma de esos pesos, con un decimal.
- La cobertura es la suma de los pesos con datos; se muestra junto al puntaje. Sin ningún dato no hay puntaje.
- Antes de ordenar se descartan los mazos cuya validación no sea `valid`.
- Orden: puntaje, afinidad del test (solo desempata) e identificador. Un mazo sin puntaje va al final.

Código: `src/domain/recommendation/score.ts`.
