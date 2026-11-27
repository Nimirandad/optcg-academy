import { describe, expect, it } from 'vitest';
import { matchesFilters, parseFilters, type FilterableDeck } from '../../src/domain/recommendation/filters.ts';
import { evaluatePreferences } from '../../src/domain/recommendation/preferences.ts';
import { rankDecks, scoreDeck, weights } from '../../src/domain/recommendation/score.ts';
import { colorProfiles } from '../../src/features/recommender/colors.ts';
import { preferenceQuestions } from '../../src/features/recommender/questions.ts';
import rules from '../../docs/coverage/rules-inventory.json';
import { deck } from '../fixtures/decks.fictitious.ts';

const item = (value: number) => ({ value, evidence: 'Ficticia' });
const full = { ease: item(100), colorIdentity: item(80), affordability: item(60), consistency: item(40), upgrades: item(20) };

describe('puntuación', () => {
  it('pesa los cinco criterios', () => {
    expect(Object.values(weights).reduce((sum, weight) => sum + weight, 0)).toBe(100);
    expect(scoreDeck(full)).toEqual({ score: 70, coverage: 100, missing: [] });
  });

  it('renormaliza sin precio e informa la cobertura', () => {
    // (3000 + 2000 + 600 + 200) / 80 = 72,5
    expect(scoreDeck({ ...full, affordability: null })).toEqual({ score: 72.5, coverage: 80, missing: ['affordability'] });
  });

  it('sin datos no inventa un puntaje', () => {
    expect(scoreDeck(deck().scoreBreakdown)).toMatchObject({ score: null, coverage: 0 });
  });

  it('solo ordena mazos válidos; empates por afinidad e ID', () => {
    const candidate = (id: string, ease: number | null, status = 'valid' as const, affinity = 0) => ({
      deck: { id, scoreBreakdown: { ...deck().scoreBreakdown, ease: ease === null ? null : item(ease) } },
      validation: { status },
      affinity,
    });
    const ranked = rankDecks([
      candidate('sin-datos', null),
      candidate('b', 50),
      candidate('a', 50),
      candidate('afin', 50, 'valid', 2),
      candidate('mejor', 90),
      ...(['invalid', 'unknown', 'pending-review'] as const).map((status) => candidate(status, 100, status as 'valid')),
    ]);
    expect(ranked.map((entry) => entry.deck.id)).toEqual(['mejor', 'afin', 'a', 'b', 'sin-datos']);
  });
});

describe('filtros', () => {
  const filterable: FilterableDeck = {
    colors: ['red', 'green'],
    kind: 'starter',
    styles: ['presion'],
    theme: 'ficticio',
    difficulty: 2,
    price: { clp: 10000 },
    releasedAt: '2026-06-01',
  };

  it('combina criterios', () => {
    expect(matchesFilters(filterable, {})).toBe(true);
    expect(
      matchesFilters(filterable, { colors: ['green'], colorCount: 'multi', maxClp: 10000, maxDifficulty: 2, style: 'presion', kind: 'starter', theme: 'ficticio', releasedSince: '2026-06-01' }),
    ).toBe(true);
    for (const filters of [{ colors: ['blue' as const] }, { colorCount: 'mono' as const }, { maxClp: 9999 }, { maxDifficulty: 1 }, { kind: 'built' as const }, { releasedSince: '2026-06-02' }]) {
      expect(matchesFilters(filterable, filters)).toBe(false);
    }
  });

  it('un dato desconocido no cumple el filtro', () => {
    const unknown = { ...filterable, price: null, difficulty: null, releasedAt: null };
    for (const filters of [{ maxClp: 1_000_000 }, { maxDifficulty: 3 }, { releasedSince: '2000-01-01' }]) {
      expect(matchesFilters(unknown, filters)).toBe(false);
    }
  });

  it('lee parámetros de URL e ignora los inválidos', () => {
    expect(parseFilters(new URLSearchParams('color=red&color=red&color=rosa&colores=mono&presupuesto=-1&dificultad=2&tipo=otro&desde=ayer'))).toEqual({
      colors: ['red'],
      colorCount: 'mono',
      maxDifficulty: 2,
    });
    expect(parseFilters(new URLSearchParams())).toEqual({});
  });
});

describe('test de preferencias', () => {
  const order = colorProfiles.map((profile) => profile.id);
  const run = (answers: Record<string, string>) => evaluatePreferences(preferenceQuestions, answers, order);

  it('explica de qué respuestas sale cada color', () => {
    const result = run({ ritmo: 'rapido', interaccion: 'eliminar', recursos: 'campo', complejidad: 'baja', victoria: 'ataque' });
    expect(result.top).toEqual(['red']);
    expect(result.ranking[0]).toMatchObject({ color: 'red', points: 4 });
    expect(result.ranking[0]!.reasons).toHaveLength(4);
  });

  it('muestra empates sin elegir una pareja al azar', () => {
    const result = run({ ritmo: 'pausado' });
    expect(result.top).toEqual(['blue', 'black']);
    expect(result.pair).toEqual(['blue', 'black']);
    expect(run({ complejidad: 'alta' }).pair).toBeNull();
  });

  it('sin respuestas con color no sugiere nada', () => {
    expect(run({ ritmo: 'indiferente' })).toEqual({ ranking: [], top: [], pair: null });
  });

  it('todo color es alcanzable y los datos son coherentes', () => {
    const reachable = new Set(preferenceQuestions.flatMap((question) => question.options.flatMap((option) => option.colors)));
    expect([...reachable].sort()).toEqual([...order].sort());
    const ids = new Set(rules.rules.map((rule) => rule.ruleId));
    for (const profile of colorProfiles) for (const mechanic of profile.mechanics) expect(ids).toContain(mechanic.ruleId);
  });
});
