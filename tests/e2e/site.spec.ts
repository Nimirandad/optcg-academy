import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '', 'aprende/', 'reglas/',
  ...Array.from({ length: 11 }, (_, i) => `reglas/${i + 1}/`),
  'mazos/', 'simuladores/', 'glosario/', 'qa/', 'casos/', 'desafios/', 'actualizaciones/', 'acerca/', 'buscar/',
];

for (const route of routes) {
  test(`carga /${route} sin desbordes ni errores`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toContainText('Proyecto no oficial');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`accesibilidad automatizada en modo ${colorScheme}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ colorScheme });
    for (const route of [...routes, 'no-existe/']) {
      await page.goto(route);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map((v) => `${route}: ${v.id}`)).toEqual([]);
    }
  });
}

test('no hay enlaces ni recursos internos rotos bajo la subruta', async ({ page, request, baseURL }) => {
  const base = new URL(baseURL!);
  const targets = new Map<string, Set<string>>();
  for (const route of [...routes, 'no-existe/']) {
    await page.goto(route);
    const urls = await page.$$eval('a[href], link[href], script[src], astro-island', (elements) =>
      elements.flatMap((el) =>
        ['href', 'src', 'component-url', 'renderer-url']
          .map((name) => el.getAttribute(name))
          .filter((value): value is string => !!value)
          .map((value) => new URL(value, document.baseURI).href),
      ),
    );
    for (const href of urls) {
      const url = new URL(href);
      // canonical y og:url apuntan al dominio de publicación.
      if (url.origin !== base.origin) continue;
      // En la propia página 404, sus anclas locales resuelven contra la ruta inexistente.
      if (url.pathname === `${base.pathname}no-existe/`) continue;
      expect(url.pathname.startsWith(base.pathname), `${href} sale de la subruta`).toBe(true);
      const anchors = targets.get(url.pathname) ?? new Set<string>();
      if (url.hash) anchors.add(decodeURIComponent(url.hash.slice(1)));
      targets.set(url.pathname, anchors);
    }
  }
  for (const [path, anchors] of targets) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const body = anchors.size ? await response.text() : '';
    for (const anchor of anchors) expect(body, `${path}#${anchor}`).toContain(`id="${anchor}"`);
  }
});

test('página 404 con enlace de regreso', async ({ page }) => {
  const response = await page.goto('no-existe/');
  expect(response?.status()).toBe(404);
  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page.locator('h1')).toHaveText('OPTCG Academy');
});

test('sitemap y metadatos usan la subruta', async ({ page, request }) => {
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  expect(sitemap).toContain('https://nimirandad.github.io/optcg-academy/reglas/10/');
  await page.goto('reglas/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nimirandad.github.io/optcg-academy/reglas/');
});

test('teclado: saltar al contenido y navegar', async ({ page, isMobile }, info) => {
  await page.goto('');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const nav = page.getByRole('navigation', { name: 'Principal' });
  const menu = page.getByRole('button', { name: 'Menú' });
  if (info.project.name === 'movil-320' || isMobile) {
    await expect(nav).toBeHidden();
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
    await page.keyboard.press('Enter');
  } else {
    await expect(menu).toBeHidden();
  }
  await nav.getByRole('link', { name: 'Reglas' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Reglas');
});

test('el modo oscuro se conserva entre páginas', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('');
  const toggle = page.getByRole('button', { name: 'Modo oscuro' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.goto('acerca/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('funciona con almacenamiento bloqueado', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('bloqueado'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('');
  await page.getByRole('button', { name: 'Modo oscuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('la navegación sigue visible', async ({ page }) => {
    await page.goto('');
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Reglas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menú' })).toBeHidden();
  });
});
