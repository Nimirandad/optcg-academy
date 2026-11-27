import { readFileSync, readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const lessons = [
  'objetivo-del-juego', 'anatomia-de-las-cartas', 'colores', 'zonas-de-juego', 'recursos-don',
  'construccion-del-mazo', 'preparacion', 'mulligan', 'fases-del-turno',
  'ataques', 'don-en-combate', 'blocker', 'counter', 'dano-y-trigger',
  'costes-de-activacion', 'condiciones', 'tipos-y-momentos', 'palabras-clave', 'orden-de-resolucion',
  'principios-y-excepciones', 'procesamiento-de-reglas', 'informacion-oculta', 'bucles', 'casos-complejos',
];

interface Item {
  answer: string;
  options: { id: string; text: string; rationale: string }[];
}
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const questionsOf = (id: string): Item[] => read(`src/data/questions/${id}.json`).questions;

/** Responde bien la pregunta `number` y comprueba su retroalimentación. */
async function answerCorrectly(scope: Page | ReturnType<Page['locator']>, page: Page, item: Item, number: number) {
  const group = scope.getByRole('group', { name: new RegExp(`^${number}\\.`) });
  const right = item.options.findIndex((option) => option.id === item.answer);
  await group.getByRole('radio').nth(right).check();
  await scope.getByRole('button', { name: `Comprobar respuesta ${number}`, exact: true }).click();
  await expect(group).toContainText('Correcta (tu respuesta).');
  for (const option of item.options) await expect(group).toContainText(option.rationale);
}

async function answerFirstOptions(page: Page) {
  for (let number = 1; number <= 3; number++) {
    const question = page.getByRole('group', { name: new RegExp(`^${number}\\.`) });
    await question.getByRole('radio').first().check();
    await page.getByRole('button', { name: `Comprobar respuesta ${number}` }).click();
  }
}

test('recorrido completo desde cero: todas las lecciones, respuestas y progreso', async ({ page }) => {
  test.setTimeout(240_000);
  expect(lessons).toHaveLength(readdirSync('src/content/lessons').length);
  await page.goto('aprende/');
  await expect(page.getByText(`Lecciones completadas: 0 de ${lessons.length}.`)).toBeVisible();
  await page.getByRole('link', { name: 'Cómo se gana y se pierde' }).click();
  for (const [index, id] of lessons.entries()) {
    await expect(page).toHaveURL(new RegExp(`/aprende/${id}/$`));
    for (const [position, item] of questionsOf(id).entries()) await answerCorrectly(page, page, item, position + 1);
    await expect(page.getByText('Terminaste: 3 de 3 correctas.')).toBeVisible();
    if (index < lessons.length - 1) await page.getByRole('link', { name: /^Siguiente:/ }).click();
  }
  await page.getByRole('link', { name: 'Todas las lecciones' }).click();
  await expect(page.getByText(`Lecciones completadas: ${lessons.length} de ${lessons.length}.`)).toBeVisible();
});

test('casos: resolución paso a paso y enlace a la aclaración', async ({ page }) => {
  await page.goto('casos/');
  const files = readdirSync('src/data/cases').sort();
  const level3 = files.map((file) => read(`src/data/cases/${file}`)).filter((item) => item.level === 3);
  const section = page.locator('section', { has: page.locator('#nivel-3') });
  await section.scrollIntoViewIfNeeded();
  for (const [index, item] of level3.entries()) {
    await answerCorrectly(section, page, item, index + 1);
    for (const step of item.steps) await expect(section).toContainText(step);
  }
  await section.getByRole('link', { name: level3[0].qaIds[0] }).first().click();
  await expect(page).toHaveURL(new RegExp(`#${level3[0].qaIds[0]}$`));
});

test('desafíos: un cuestionario por nivel', async ({ page }) => {
  await page.goto('desafios/');
  await expect(page.locator('details')).toHaveCount(5);
  await page.getByText('Nivel 1: Fundamentos').click();
  const first = page.locator('details').first();
  await answerCorrectly(first, page, questionsOf('objetivo-del-juego')[0], 1);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

test('retroalimentación por opción, progreso persistente, repetición y borrado', async ({ page }) => {
  await page.goto('aprende/objetivo-del-juego/');
  const first = page.getByRole('group', { name: /^1\./ });
  await first.getByRole('radio', { name: 'Pierdes de inmediato.' }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta 1' }).click();
  await expect(first).toContainText('Incorrecta (tu respuesta).');
  await expect(first).toContainText('La condición de derrota combina');
  await expect(first.getByRole('radio').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Repetir cuestionario' }).click();
  await expect(first.getByRole('radio').first()).toBeEnabled();

  await answerFirstOptions(page);
  await expect(page.getByText(/Terminaste: \d de 3 correctas\./)).toBeVisible();
  await expect(page.getByText('Resultado guardado en este navegador.')).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

  await page.goto('aprende/');
  await expect(page.getByText('Lecciones completadas: 1 de 24.')).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Completada \(mejor resultado/)).toHaveCount(1);
  await page.getByRole('button', { name: 'Borrar progreso' }).click();
  await page.getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(page.getByText('Lecciones completadas: 0 de 24.')).toBeVisible();
});

test('responde solo con el teclado', async ({ page }) => {
  await page.goto('aprende/colores/');
  const radio = page.getByRole('group', { name: /^1\./ }).getByRole('radio').first();
  await expect(radio).toBeEnabled();
  await radio.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Respuesta correcta.')).toBeVisible();
});

test('funciona sin almacenamiento y avisa', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('bloqueado'); } });
  });
  await page.goto('aprende/mulligan/');
  await answerFirstOptions(page);
  await expect(page.getByText(/No se pudo guardar/)).toBeVisible();
});
