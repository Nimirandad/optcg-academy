import { expect, test } from '@playwright/test';

async function search(page: import('@playwright/test').Page, term: string) {
  await page.goto('buscar/');
  await page.getByRole('searchbox').fill(term);
  await page.getByRole('search').getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('status')).toContainText('encontrada');
  return page.getByRole('list', { name: 'Resultados' });
}

test('busca por número de regla y llega al ancla', async ({ page }) => {
  const results = await search(page, '1-3-5-1');
  await expect(results.getByRole('link', { name: /Capítulo 1:/ })).toBeVisible();
  await page.getByRole('link', { name: 'Ir a la regla 1-3-5-1' }).click();
  await expect(page).toHaveURL(/\/optcg-academy\/reglas\/1\/#regla-1-3-5-1$/);
  await expect(page.locator('[id="regla-1-3-5-1"]')).toBeInViewport();
});

for (const term of ['Blocker', 'Bloqueador']) {
  test(`busca "${term}" y abre el glosario bajo la subruta`, async ({ page }) => {
    const results = await search(page, term);
    await results.getByRole('link', { name: 'Glosario' }).click();
    await expect(page).toHaveURL(/\/optcg-academy\/glosario\/$/);
  });
}

test('acepta la consulta en la dirección', async ({ page }) => {
  await page.goto('buscar/?q=8.4.');
  await expect(page.getByRole('link', { name: 'Ir a la regla 8-4' })).toBeVisible();
});

test('busca una carta y encuentra su documento de Q&A', async ({ page }) => {
  const results = await search(page, 'OP18-001');
  await expect(results.getByRole('link', { name: /Q&A: OP-18/ })).toBeVisible();
});
