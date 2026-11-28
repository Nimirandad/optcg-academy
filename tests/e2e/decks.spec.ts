import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('mazos: colores y enlaces a reglas', async ({ page }) => {
  await page.goto('mazos/');
  await expect(page.getByRole('main')).toContainText('Elige un color');
  await expect(page.getByRole('navigation', { name: 'Colores de mazo' }).getByRole('link')).toHaveCount(6);
  await page.getByRole('navigation', { name: 'Colores de mazo' }).getByRole('link', { name: /^Amarillo/ }).click();
  const modal = page.getByRole('dialog', { name: 'Mazo Amarillo' });
  await expect(modal).toBeVisible();
  await modal.getByText('Cómo se juega y fuentes').click();
  await page.getByRole('link', { name: '[Trigger] (10-1-5)' }).click();
  await expect(page).toHaveURL(/\/reglas\/10\/#regla-10-1-5$/);
  await expect(page.locator('[id="regla-10-1-5"]')).toHaveCount(1);
});

test('test de preferencias con teclado: resultado explicado y reinicio', async ({ page }) => {
  await page.goto('mazos/');
  const submit = page.getByRole('button', { name: 'Ver colores afines' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeDisabled();
  const answers = ['Presionar desde temprano', 'Quitar sus cartas del campo', 'Los personajes en el campo', 'Decisiones directas', 'Atacar antes de que se organice'];
  for (const answer of answers) {
    const radio = page.getByRole('radio', { name: answer });
    await expect(radio).toBeEnabled();
    await radio.focus();
    await page.keyboard.press('Space');
  }
  await submit.focus();
  await page.keyboard.press('Enter');
  const result = page.getByRole('status').filter({ hasText: 'afín' });
  await expect(result).toContainText('Color más afín: Rojo.');
  await expect(result).toContainText('4 de 5 respuestas');
  await expect(result).toContainText('no un diagnóstico');

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: 'Reiniciar' }).click();
  await expect(submit).toBeDisabled();
  await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
});

test('catálogo de cartas de Bandai por Starter Deck', async ({ page }) => {
  await page.goto('mazos/');
  const catalog = page.getByRole('region', { name: 'Elige un color' });
  const black = catalog.getByRole('link', { name: /^Negro/ });
  const red = catalog.getByRole('link', { name: /^Rojo/ });
  await black.click();
  const blackModal = page.getByRole('dialog', { name: 'Mazo Negro' });
  await expect(blackModal.getByRole('heading', { name: 'Marshall.D.Teach', exact: true }).first()).toBeVisible();
  await expect(blackModal.getByRole('button', { name: 'Cerrar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(blackModal).toBeHidden();
  await expect(black).toBeFocused();

  await black.click();
  await expect(blackModal).toBeVisible();
  await blackModal.getByRole('heading', { name: 'Marshall.D.Teach', exact: true }).first().click();
  await expect(blackModal).toBeVisible();
  await page.mouse.click(1, 1);
  await expect(blackModal).toHaveAttribute('data-closing', '');
  await expect(blackModal).toBeHidden();
  await expect(black).toBeFocused();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await red.focus();
  await page.keyboard.press('Enter');
  const starter = page.getByRole('dialog', { name: 'Mazo Rojo' });
  await expect(starter).toBeVisible();
  await expect(page).not.toHaveURL(/#mazo-/);
  await expect(starter.getByRole('list', { name: 'Cartas de ST-31' }).getByRole('listitem')).toHaveCount(15);
  const nami = starter.getByRole('list', { name: 'Cartas de ST-31' }).getByRole('listitem').filter({ hasText: 'OP01-016' });
  await expect(nami.getByRole('heading', { name: 'Nami' })).toBeVisible();
  await expect(nami).toContainText('OP01-016 · ×4');
  await starter.getByText('Cómo se juega y fuentes').click();
  await expect(starter.getByRole('textbox')).toHaveValue(/^1xST21-001\n4xOP01-016/m);
  await expect(nami.getByRole('link', { name: 'Ficha de Bandai' })).toHaveAttribute('href', 'https://en.onepiece-cardgame.com/cardlist/?series=569031');
  const axe = await new AxeBuilder({ page }).include('#mazo-modal').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);
  const close = starter.getByRole('button', { name: 'Cerrar' });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(starter).toBeHidden();
  await expect(red).toBeFocused();
});

test('filtros de mazos combinables y compartibles', async ({ page }) => {
  await page.goto('mazos/?color=red&color=black&colores=multi&tipo=starter&desde=2026-07-31');
  const filters = page.locator('#filtros-mazos');
  const matches = filters.getByRole('list', { name: 'Resultados de mazos' });

  await expect(filters.getByRole('checkbox', { name: 'Rojo' })).toBeChecked();
  await expect(filters.getByRole('status')).toHaveText('1 mazo encontrado.');
  await expect(matches.getByRole('link')).toHaveText(['ST-35 · Sabo']);
  await matches.getByRole('link', { name: 'ST-35 · Sabo' }).click();
  await expect(page.getByRole('article', { name: 'Mazo Rojo y Negro' })).toBeVisible();

  await filters.getByRole('combobox', { name: 'Tipo de mazo' }).selectOption('built');
  await filters.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(filters.getByRole('status')).toHaveText('Ningún mazo coincide con los filtros.');
  await expect(page).toHaveURL(/tipo=built/);
  await filters.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(filters.getByRole('status')).toHaveText('9 mazos encontrados.');
  await expect(filters.getByRole('spinbutton', { name: /Presupuesto máximo/ })).toBeDisabled();

  await filters.getByRole('combobox', { name: 'Tipo de mazo' }).selectOption('built');
  await filters.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(matches.getByRole('link')).toHaveCount(2);
  await matches.getByRole('link', { name: /OP10-099/ }).click();
  await expect(page.getByRole('textbox', { name: 'Lista del Leader en texto' })).toHaveValue(/^1xOP10-099/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  const axe = await new AxeBuilder({ page }).include('#filtros-mazos').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);
});

test('ficha de mazo con exportación, caducidad y referencias', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-28T17:30:00Z'));
  await page.goto('mazos/');
  await page.getByRole('navigation', { name: 'Colores de mazo' }).getByRole('link', { name: /^Rojo/ }).click();
  await page.getByRole('link', { name: 'Ver ficha de ST-31' }).click();
  await expect(page).toHaveURL(/\/optcg-academy\/mazos\/st-31\/$/);
  const state = page.locator('[data-state]');
  await expect(state).toHaveText('Lista apta para Standard según las fuentes registradas.');
  await expect(page.getByRole('textbox', { name: 'Lista copiable' })).toHaveValue(/^1xST21-001\n4xOP01-016/m);
  await page.getByText('Validación contra los snapshots del proyecto').click();
  await expect(page.getByText('2027-04-01', { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map(({ id }) => id)).toEqual([]);

  await page.clock.setFixedTime(new Date('2026-11-30T17:30:00Z'));
  await page.reload();
  await expect(state).toContainText('supera las 48 horas');

  await page.clock.setFixedTime(new Date('2026-12-05T17:30:00Z'));
  await page.reload();
  await expect(state).toContainText('las comprobaciones caducaron');

  await page.goto('mazos/st-36/');
  await expect(page.getByText('Referencia pendiente de revisión.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Lista copiable' })).toHaveValue(/^1xOP10-099/);
  await page.goto('mazos/op10-099/');
  await expect(page.getByRole('heading', { name: /^Lista de torneo/ })).toBeVisible();
  await expect(page.locator('[data-standard]')).toHaveCount(0);
});
