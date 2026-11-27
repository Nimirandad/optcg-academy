/**
 * Textos editoriales por color, sin revisión humana. La tendencia sale de `plan.md` §7:
 * orienta, no es una regla ni describe cartas concretas.
 */
import type { Color } from '../../lib/deck-schemas.ts';

export interface ColorProfile {
  id: Color;
  name: string;
  tendency: string;
  strength: string;
  challenge: string;
  mechanics: { label: string; ruleId: string }[];
}

export const colorProfiles: ColorProfile[] = [
  {
    id: 'red',
    name: 'Rojo',
    tendency: 'Presión, ataques y modificación de poder.',
    strength: 'Propone un plan directo: atacar y ajustar el poder en los combates.',
    challenge: 'Decidir cuántos recursos gastar al atacar sin quedarse sin defensa.',
    mechanics: [
      { label: 'Ataques', ruleId: '7-1' },
      { label: '[Rush]', ruleId: '10-1-1' },
    ],
  },
  {
    id: 'green',
    name: 'Verde',
    tendency: 'Control de campo, cartas Rested y reactivación.',
    strength: 'Aprovecha el estado Active o Rested de las cartas.',
    challenge: 'Anticipar qué cartas estarán disponibles en cada turno.',
    mechanics: [
      { label: 'Zonas de juego', ruleId: '3-1' },
      { label: 'Refresh Phase', ruleId: '6-2' },
    ],
  },
  {
    id: 'blue',
    name: 'Azul',
    tendency: 'Gestión de mano y mazo, y devolución de cartas.',
    strength: 'Ofrece formas de elegir y reordenar los recursos disponibles.',
    challenge: 'Planificar varios turnos y recordar la información conocida.',
    mechanics: [
      { label: 'Mano', ruleId: '3-4' },
      { label: 'Mazo', ruleId: '3-2' },
    ],
  },
  {
    id: 'purple',
    name: 'Morado',
    tendency: 'Aceleración y administración de DON!!.',
    strength: 'Gira en torno a cuántos DON!! tienes y cuándo los usas.',
    challenge: 'Calcular costes como DON!! −X sin frenar el turno siguiente.',
    mechanics: [
      { label: 'DON!! −X', ruleId: '10-2-10' },
      { label: 'DON!! Phase', ruleId: '6-4' },
    ],
  },
  {
    id: 'black',
    name: 'Negro',
    tendency: 'Reducción de costes y eliminación.',
    strength: 'Busca preparar la salida de cartas rivales del campo.',
    challenge: 'Encadenar los efectos en el orden correcto.',
    mechanics: [
      { label: 'K.O.', ruleId: '10-2-1' },
      { label: 'Coste', ruleId: '2-7' },
    ],
  },
  {
    id: 'yellow',
    name: 'Amarillo',
    tendency: 'Cartas de Life y [Trigger].',
    strength: 'Da protagonismo a las cartas de Life y a lo que revelan.',
    challenge: 'Jugar con resultados que dependen de cartas que no se ven.',
    mechanics: [
      { label: '[Trigger]', ruleId: '10-1-5' },
      { label: 'Zona de Life', ruleId: '3-10' },
    ],
  },
];
