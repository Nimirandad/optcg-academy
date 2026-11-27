/** Preguntas del test (`plan.md` §7). La relación opción–color es editorial y está sin revisar. */
import type { PreferenceQuestion } from '../../domain/recommendation/preferences.ts';

export const preferenceQuestions: PreferenceQuestion[] = [
  {
    id: 'ritmo',
    prompt: '¿Qué ritmo de partida prefieres?',
    options: [
      { id: 'rapido', label: 'Presionar desde temprano', colors: ['red'] },
      { id: 'creciente', label: 'Acumular recursos y crecer', colors: ['purple'] },
      { id: 'pausado', label: 'Controlar y avanzar con calma', colors: ['blue', 'black'] },
      { id: 'indiferente', label: 'Me da lo mismo', colors: [] },
    ],
  },
  {
    id: 'interaccion',
    prompt: '¿Cómo prefieres responder a tu rival?',
    options: [
      { id: 'eliminar', label: 'Quitar sus cartas del campo', colors: ['black'] },
      { id: 'devolver', label: 'Devolver sus cartas', colors: ['blue'] },
      { id: 'inmovilizar', label: 'Dejar sus cartas Rested', colors: ['green'] },
      { id: 'indiferente', label: 'Prefiero centrarme en mi plan', colors: [] },
    ],
  },
  {
    id: 'recursos',
    prompt: '¿Qué recurso te gustaría administrar?',
    options: [
      { id: 'don', label: 'Los DON!!', colors: ['purple'] },
      { id: 'mano', label: 'La mano y el mazo', colors: ['blue'] },
      { id: 'life', label: 'Las cartas de Life', colors: ['yellow'] },
      { id: 'campo', label: 'Los personajes en el campo', colors: ['red', 'green'] },
    ],
  },
  {
    id: 'complejidad',
    prompt: '¿Cuánta planificación quieres?',
    options: [
      { id: 'baja', label: 'Decisiones directas', colors: ['red'] },
      { id: 'media', label: 'Algunas combinaciones', colors: ['green', 'yellow'] },
      { id: 'alta', label: 'Secuencias que preparar con cuidado', colors: ['blue', 'black', 'purple'] },
    ],
  },
  {
    id: 'victoria',
    prompt: '¿Qué forma de ganar te atrae más?',
    options: [
      { id: 'ataque', label: 'Atacar antes de que se organice', colors: ['red'] },
      { id: 'dominio', label: 'Dominar el campo', colors: ['green', 'black'] },
      { id: 'grandes', label: 'Llegar antes a las cartas grandes', colors: ['purple'] },
      { id: 'sorpresa', label: 'Aguantar y sorprender', colors: ['yellow'] },
    ],
  },
];
