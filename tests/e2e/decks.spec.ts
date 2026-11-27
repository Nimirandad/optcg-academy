import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('mazos: colores, enlaces a reglas y ningún mazo recomendado', async ({ page }) => {
  await page.goto('mazos/');
  await expect(page.getByRole('main')).toContainText('no se recomienda ninguno');
  await expect(page.locator('h3[id^="color-"]')).toHaveCount(6);
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
