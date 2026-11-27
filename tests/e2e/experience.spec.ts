import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function check(page: Page, where: string) {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => `${where}: ${violation.id}`)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

// La reducción de movimiento quita las pausas y permite comprobar estados estables.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('la portada lleva al combate y al recorrido', async ({ page }) => {
  await page.goto('');
  await expect(page.getByText('⛵ Estás aquí')).toHaveCount(1);
  await check(page, 'portada');
  await page.getByRole('link', { name: '⚔ Prueba un combate' }).click();
  await expect(page.locator('h1')).toHaveText('Aprende a atacar jugando');
});

test('los cinco retos se superan', async ({ page }) => {
  await page.goto('jugar/');
  const main = page.getByRole('main');
  const press = (name: string) => page.locator('.actions').getByRole('button', { name }).click();
  const won = () => expect(main.getByText('★ Reto superado.')).toBeVisible();
  const next = () => press('Siguiente reto →');

  await press('Atacar al Líder rival');
  await won();
  await check(page, 'reto superado');
  await next();

  await press('Dar 1 DON!! al Vigía');
  await press('Atacar al Líder rival');
  await won();
  await next();

  await press('Atacar al Grumete');
  await expect(main.getByText('Esa jugada no se puede.')).toBeVisible();
  await press('Atacar al Vigía');
  await won();
  await next();

  await press('Bloquear con la Escudera');
  await won();
  await next();

  await press('Usar Vigía (+2000)');
  await press('Resolver el ataque');
  await won();
  await expect(page.getByRole('heading', { name: '¡Superaste los 5 retos!' })).toBeVisible();
});

test('se juega tocando cartas con teclado y se puede repetir', async ({ page }) => {
  await page.goto('jugar/');
  const card = page.getByRole('button', { name: 'Atacar al Líder rival: Líder rival' });
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('★ Reto superado.')).toBeVisible();
  await page.getByRole('button', { name: 'Repetir reto' }).click();
  await expect(card).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tu primer ataque' })).toBeFocused();
});

test('la lección de ataques incluye solo sus retos', async ({ page }) => {
  await page.goto('aprende/ataques/');
  const stage = page.getByRole('group', { name: 'Mesa de juego' });
  await stage.scrollIntoViewIfNeeded();
  await expect(page.getByText('Reto 1 de 2')).toBeVisible();
  await page.getByRole('button', { name: 'Atacar al Líder rival: Líder rival' }).click();
  await page.locator('.actions').getByRole('button', { name: 'Siguiente reto →' }).click();
  await page.locator('.actions').getByRole('button', { name: 'Atacar al Vigía' }).click();
  await expect(page.getByRole('heading', { name: '¡Superaste los 2 retos!' })).toBeVisible();
  await check(page, 'lección jugada');
});

test('reglas por temas: pasos de uno en uno, todos juntos y enlace a la regla', async ({ page }) => {
  await page.goto('reglas/');
  await check(page, 'índice de reglas');
  await page.getByRole('link', { name: /¿Qué hago cuando me toca\?/ }).click();
  await expect(page.getByRole('heading', { name: '1. Refresh' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '2. Draw' })).toBeHidden();
  await page.getByRole('button', { name: 'Siguiente paso →' }).click();
  await expect(page.getByRole('heading', { name: '2. Draw' })).toBeVisible();
  await check(page, 'paso 2');
  await page.getByRole('button', { name: 'Ver todo junto' }).click();
  await expect(page.getByRole('heading', { name: '5. End' })).toBeVisible();
  await check(page, 'todo junto');
  await page.getByRole('link', { name: '6-3-1' }).click();
  await expect(page).toHaveURL(/reglas\/6\/#regla-6-3-1$/);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('el tema se lee completo', async ({ page }) => {
    await page.goto('reglas/tema/turno/');
    await expect(page.getByRole('heading', { name: '5. End' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver todo junto' })).toHaveCount(0);
  });
});

test.describe('con movimiento', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test('la entrada de un paso no ensancha la página', async ({ page }) => {
    await page.goto('reglas/tema/preparar/');
    await expect(page.getByRole('button', { name: 'Ver todo junto' })).toBeVisible();
    await page.getByRole('button', { name: 'Siguiente paso →' }).click();
    // Detiene las animaciones en su primer fotograma, el más desplazado.
    const overflow = await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = 0;
      }
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
