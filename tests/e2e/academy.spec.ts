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
  await expect(page.getByRole('link', { name: 'Cómo se gana y se pierde' })).toHaveCount(0);
  await page.locator('a[href$="aprende/islas/1/"]').click();
  await page.getByRole('link', { name: 'Cómo se gana y se pierde' }).click();
  for (const [index, id] of lessons.entries()) {
    if (/\/aprende\/islas\/\d+\/$/.test(new URL(page.url()).pathname)) {
      await page.locator(`a[href$="aprende/${id}/"]`).click();
    }
    await expect(page).toHaveURL(new RegExp(`/aprende/${id}/$`));
    for (const [position, item] of questionsOf(id).entries()) await answerCorrectly(page, page, item, position + 1);
    await expect(page.getByText('Terminaste: 3 de 3 correctas.')).toBeVisible();
    if (index < lessons.length - 1) await page.getByRole('link', { name: /^Siguiente:/ }).click();
  }
  await page.getByRole('link', { name: 'Todas las lecciones' }).click();
  await expect(page.locator('.route .meter')).toHaveText([5, 4, 5, 5, 5].map((count) => `${count} de ${count} lecciones`));
});

test('casos: resolución paso a paso y enlace a la aclaración', async ({ page }) => {
  await page.goto('casos/');
  await page.getByRole('link', { name: /Nivel 3/ }).click();
  await expect(page.locator('#nivel-2')).toHaveCount(0);
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

test('simuladores: abre y resuelve los ejercicios guiados', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('simuladores/');
  const brand = page.getByRole('link', { name: 'Inicio de OPTCG Academy' });
  await expect(brand).toHaveText('');
  await expect(brand.locator('img')).toHaveAttribute('src', /marca-optcg-academy\.png$/);
  await expect(brand.locator('img')).toHaveJSProperty('complete', true);
  const brandBox = await brand.boundingBox();
  const searchBox = await page.getByRole('link', { name: 'Buscar', exact: true }).first().boundingBox();
  expect(Math.abs(brandBox!.y - searchBox!.y)).toBeLessThan(12);
  expect(await brand.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const nav = page.getByRole('navigation', { name: 'Simuladores' });
  const exercises = ['El último robo', 'Bloqueo y Counter', 'Duelo en negativo'];
  const icons = await Promise.all(exercises.map((name) => nav.getByRole('link', { name }).locator('img').getAttribute('src')));
  expect(new Set(icons).size).toBe(exercises.length);
  expect(icons.every(Boolean)).toBe(true);
  await nav.getByRole('link', { name: 'El último robo' }).click();
  await expect(nav.getByRole('link', { name: 'El último robo' })).toHaveAttribute('aria-current', 'page');
  const table = page.getByRole('group', { name: 'Mesa de juego' });
  await table.getByRole('button', { name: 'Robar la última carta' }).click();
  await expect(table.getByText(/la partida termina y pierdes/)).toBeVisible();
  await expect(table.getByRole('group', { name: 'Tu mano' })).toContainText('Nico Robin');
  await nav.getByRole('link', { name: 'Bloqueo y Counter' }).click();
  await table.getByRole('button', { name: 'Bloquear con Jinbe: Jinbe' }).click();
  await table.getByRole('button', { name: 'Usar Nico Robin (+1000): Nico Robin' }).click();
  await table.getByRole('button', { name: 'Resolver el ataque' }).click();
  await expect(table.getByText(/Jinbe cambió el objetivo/)).toBeVisible();

  await nav.getByRole('link', { name: 'Duelo en negativo' }).click();
  await table.getByRole('button', { name: 'Atacar a Zephyr: Zephyr(Navy)' }).click();
  await table.getByRole('button', { name: 'Resolver el ataque' }).click();
  await expect(table.getByText(/Zephyr fue al Trash/)).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
});

test('desafíos enlaza a los casos sin repetir las preguntas de Aprende', async ({ page }) => {
  await page.goto('desafios/');
  await expect(page).toHaveURL(/\/casos\/$/);
  await expect(page.getByRole('heading', { name: 'Casos y desafíos' })).toBeVisible();
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

  await page.goto('aprende/islas/1/');
  await expect(page.getByText(/Lecciones completadas: 1 de \d+/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Completada \(mejor resultado/)).toHaveCount(1);
  await page.getByRole('button', { name: 'Borrar progreso' }).click();
  await page.getByRole('button', { name: 'Sí, borrar' }).click();
  await expect(page.getByText(/Lecciones completadas: 0 de \d+/)).toBeVisible();
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

test('islas: se bloquean hasta completar todas las lecciones anteriores', async ({ page }) => {
  const first = lessons.slice(0, 5);
  const save = (ids: string[]) => page.evaluate((completed) => {
    localStorage.setItem('optcg:progress', JSON.stringify({ version: 0, completed }));
  }, ids);

  await page.goto('aprende/');
  const second = page.locator('a[href$="aprende/islas/2/"]');
  const third = page.locator('a[href$="aprende/islas/3/"]');
  await expect(second).toHaveCount(0);
  await save(first.slice(0, -1));
  await page.goto('aprende/islas/2/');
  await expect(page.getByText(/Isla bloqueada/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lecciones de esta isla' })).toHaveCount(0);

  await save(first);
  await page.goto('aprende/');
  await expect(second).toBeVisible();
  await expect(third).toHaveCount(0);
  await second.click();
  await expect(page.getByRole('heading', { name: 'Lecciones de esta isla' })).toBeVisible();
});
