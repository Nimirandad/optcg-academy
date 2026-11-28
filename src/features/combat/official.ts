/** Datos de los retos introductorios, cotejados en los listados ST-31, ST-32 y ST-33. */
import type { CardDef } from '../../domain/game/types';

export const officialCombatCards = {
  zoro: { id: 'OP12-020', name: 'Roronoa Zoro', kind: 'leader', power: 5000, life: 5 },
  kuzan: { id: 'OP12-040', name: 'Kuzan', kind: 'leader', power: 5000, life: 5 },
  luffy: { id: 'ST21-001', name: 'Monkey.D.Luffy', kind: 'leader', power: 5000, life: 5 },
  robin: { id: 'OP11-009', name: 'Nico Robin', kind: 'character', cost: 3, power: 4000, counter: 1000 },
  kawamatsu: { id: 'OP12-023', name: 'Kawamatsu', kind: 'character', cost: 5, power: 6000, counter: 2000 },
  zephyr: { id: 'OP12-046', name: 'Zephyr(Navy)', kind: 'character', cost: 5, power: 5000, counter: 2000 },
  jango: { id: 'OP12-045', name: 'Jango', kind: 'character', cost: 6, power: 8000, counter: 1000 },
  jinbe: { id: 'ST31-002', name: 'Jinbe', kind: 'character', cost: 5, power: 6000, counter: 1000, keywords: ['blocker'] },
} as const satisfies Record<string, CardDef>;
