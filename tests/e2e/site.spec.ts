import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = [
  '', 'jugar/', 'aprende/', 'aprende/ataques/', 'aprende/counter/',
  ...['ganar', 'preparar', 'mesa', 'turno', 'don', 'atacar', 'defender', 'efectos', 'palabras'].map((id) => `reglas/tema/${id}/`), 'aprende/objetivo-del-juego/', 'aprende/zonas-de-juego/', 'aprende/fases-del-turno/', 'aprende/palabras-clave/', 'aprende/casos-complejos/', 'reglas/',
  ...Array.from({ length: 11 }, (_, i) => `reglas/${i + 1}/`),
  'mazos/', 'simuladores/', 'glosario/', 'qa/', 'qa/rules/', 'qa/op18/', 'qa/op17/', 'qa/op14-eb04/', 'qa/op03/', 'casos/', 'desafios/', 'actualizaciones/', 'acerca/', 'buscar/',
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
    // Una auditoría por ruta; en equipos cargados supera los 3 minutos.
    test.setTimeout(420_000);
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

test('cada regla del inventario tiene ancla y explicación', async ({ page }) => {
  let anchors = 0;
  for (let chapter = 1; chapter <= 11; chapter++) {
    await page.goto(`reglas/${chapter}/`);
    anchors += await page.locator('[id^="regla-"]').count();
    await expect(page.getByText('Explicación pendiente.')).toHaveCount(0);
  }
  expect(anchors).toBe(492);
});

test('Q&A: cobertura, conflictos, erratas y enlace desde la regla', async ({ page }) => {
  await page.goto('qa/');
  await expect(page.getByRole('main')).toContainText('Pendientes: 0');
  await expect(page.getByRole('link', { name: 'Regla 5-1-2-4' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aclaración rules-p3-4' })).toBeVisible();
  await expect(page.getByRole('link', { name: /OP13-077/ })).toBeVisible();

  await page.goto('reglas/10/');
  const rule = page.locator('section', { has: page.locator('[id="regla-10-1-4-1"]') });
  await rule.getByText(/Aclaraciones oficiales relacionadas/).click();
  await rule.getByRole('link', { name: /Rested\?$/ }).click();
  await expect(page).toHaveURL(/\/qa\/rules\/#rules-p5-4$/);
});

test('Q&A señala cartas y parejas prohibidas', async ({ page }) => {
  await page.goto('qa/');
  await expect(page.getByRole('main')).toContainText('OP14-020, desde el 2026-10-12');
  await expect(page.getByRole('main')).toContainText('EB05-001 con OP13-001, desde el 2026-11-27');
  await page.goto('qa/op03/');
  await expect(page.locator('[id="op03-p3-4"]')).toContainText('Carta prohibida: OP03-040, desde el 2025-08-30');
  await expect(page.locator('[id="op03-p1-1"]')).not.toContainText('prohibida');
  await page.goto('qa/op13/');
  await expect(page.locator('[id="op13-p1-1"]')).toContainText('Pareja prohibida: OP13-001');
});

test('página 404 con enlace de regreso', async ({ page }) => {
  const response = await page.goto('no-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('link[rel="canonical"], meta[property="og:url"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page.locator('h1')).toHaveText('Zarpa hacia tu primera partida');
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
