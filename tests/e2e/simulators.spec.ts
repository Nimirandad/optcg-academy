import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Abre la página e hidrata la isla de la sección indicada. */
async function open(page: Page, heading: string): Promise<Locator> {
  await page.goto('simuladores/');
  const section = page.locator('section', { has: page.getByRole('heading', { level: 2, name: heading, exact: true }) });
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('fieldset.root')).toBeEnabled();
  return section;
}

const button = (scope: Locator, name: string | RegExp) => scope.getByRole('button', { name, exact: typeof name === 'string' });

async function check(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((violation) => violation.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

test('alcance visible', async ({ page }) => {
  await page.goto('simuladores/');
  await expect(page.getByRole('heading', { name: 'Qué cubren y qué no' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Cartas oficiales y sus textos.');
  await expect(page.getByRole('main')).toContainText('pendiente de revisión');
});

test('combate: Counter, resolución, referencias y reinicio', async ({ page }) => {
  const sim = await open(page, 'Combate');
  await sim.getByLabel('Escenario').selectOption({ label: 'Counter con Character y con Event' });
  await button(sim, 'Declarar ataque').click();
  await button(sim, 'No bloquear').click();
  await button(sim, /^Counter: Vigía/).click();
  await button(sim, /^Counter: Maniobra/).click();
  await expect(sim.getByRole('region', { name: 'Batalla en curso' })).toContainText('Diferencia: -5000.');
  await check(page);
  await button(sim, 'Resolver el daño').click();
  // El anuncio incluye todo lo que produjo la jugada, no solo el último paso.
  await expect(sim.locator('.status [role="status"]')).toContainText(/El ataque falla.*End of the Battle/);
  await expect(sim).toContainText('Batalla terminada.');
  await expect(sim.getByRole('link', { name: '7-1-4-2' }).first()).toHaveAttribute('href', /reglas\/7\/#regla-7-1-4-2$/);
  await button(sim, 'Reiniciar escenario').click();
  await expect(button(sim, 'Declarar ataque')).toBeVisible();
});

test('combate: acción ilegal explicada, poder elegido y derrota sin Life', async ({ page }) => {
  const sim = await open(page, 'Combate');
  await sim.getByLabel('Escenario').selectOption({ label: '[Unblockable]' });
  await button(sim, 'Declarar ataque').click();
  await button(sim, 'Bloquear con Escudera').click();
  await expect(sim.getByRole('alert')).toContainText('[Unblockable]');
  await sim.getByLabel('Escenario').selectOption({ label: 'Daño con 0 cartas de Life' });
  await sim.getByLabel('Poder base del atacante').fill('7000');
  await button(sim, 'Declarar ataque').click();
  await button(sim, 'No bloquear').click();
  await expect(sim.getByRole('region', { name: 'Batalla en curso' })).toContainText('Diferencia: 2000.');
  await button(sim, 'Resolver el daño').click();
  await expect(sim).toContainText('Partida terminada. Jugador B recibe daño con 0 cartas de Life.');
});

test('turnos: primer turno y acciones ilegales', async ({ page }) => {
  const sim = await open(page, 'Turnos');
  await button(sim, 'Asignar 1 DON!! al Leader').click();
  await expect(sim.getByRole('alert')).toContainText('Solo se puede hacer en la Main Phase');
  await button(sim, 'Avanzar fase').click();
  await expect(sim).toContainText('no roba en su primer turno');
  await button(sim, 'Avanzar fase').click();
  await expect(sim).toContainText('añade 1 DON!!');
  await button(sim, 'Avanzar fase').click();
  await button(sim, 'Atacar al Leader rival').click();
  await expect(sim.getByRole('alert')).toContainText('Nadie puede atacar en su primer turno.');
  await button(sim, 'Reiniciar partida').click();
  await expect(sim.getByRole('alert')).toBeEmpty();
  await sim.getByLabel('Va primero').selectOption({ label: 'Jugador B' });
  await expect(sim).toContainText('Turno 1 de la partida: Jugador B.');
});

test('playmat: reemplazo al límite, Stage único y visibilidad', async ({ page }) => {
  const sim = await open(page, 'Playmat');
  await sim.getByLabel('Mesa').selectOption({ label: 'Mesa avanzada (límites del campo)' });
  const mine = sim.getByRole('region', { name: 'Campo de Jugador A' });
  const rival = sim.getByRole('region', { name: 'Campo de Jugador B' });
  await expect(rival).toContainText('Oculta: 2 cartas.');
  await button(mine, 'Jugar Corredora').click();
  await expect(sim).toContainText('Ya hay 5 Characters.');
  await button(mine, 'Mandar al Trash: Grumete').click();
  await expect(sim).toContainText('No es un K.O.');
  await expect(mine.getByRole('heading', { name: 'Characters (5/5)' })).toBeVisible();
  await button(mine, 'Jugar Faro de práctica (Stage)').click();
  await expect(mine).toContainText('Trash, de arriba abajo: Puerto de práctica (Stage), Grumete.');
  await sim.getByLabel('Manos visibles').selectOption({ label: 'Las dos' });
  await expect(rival.getByText('Maniobra evasiva (Event)')).toBeVisible();
  await check(page);
});

test('playmat: ataque completo solo con el teclado', async ({ page }) => {
  const sim = await open(page, 'Playmat');
  await sim.getByLabel('Mesa').selectOption({ label: 'Mesa avanzada (límites del campo)' });
  const press = async (name: string) => {
    await button(sim, name).focus();
    await page.keyboard.press('Enter');
  };
  await press('Dar DON!! a Capitana de práctica');
  await press('Atacar con Capitana de práctica');
  await press('Elegir objetivo: Almirante de práctica');
  // El botón usado desaparece: el foco no vuelve al principio de la página.
  await expect(sim.locator('.status')).toBeFocused();
  await press('No bloquear');
  await press('Resolver el daño');
  await press('Activar [Trigger]');
  await expect(sim).toContainText('End of the Battle');
});

test('efectos: condición, coste y Once Per Turn', async ({ page }) => {
  const sim = await open(page, 'Efectos');
  await button(sim, 'Activar efecto').click();
  await expect(sim.getByRole('alert')).toContainText('[DON!! x1]');
  await sim.getByRole('region', { name: 'Campo de Jugador A' }).locator('li', { hasText: 'Cronista' }).getByRole('button', { name: 'Dar DON!!' }).click();
  await button(sim, 'Activar efecto').click();
  await expect(sim).toContainText('se pagan los costes');

  await sim.getByLabel('Escenario de efectos').selectOption({ label: '[Once Per Turn] con dos copias' });
  const copy = button(sim, 'Activar efecto').first();
  await copy.click();
  await copy.click();
  await expect(sim.getByRole('alert')).toContainText('[Once Per Turn]');
  await button(sim, 'Reiniciar efectos').click();
  await expect(sim.getByRole('alert')).toBeEmpty();

  await sim.getByLabel('Escenario de efectos').selectOption({ label: 'DON!! −X y descarte como coste' });
  await sim.getByLabel('DON!! 1').selectOption('cost-active');
  await sim.getByLabel('DON!! 2').selectOption('cost-rested');
  await sim.getByRole('checkbox', { name: 'Grumete' }).check();
  await button(sim, 'Activar efecto').click();
  await expect(sim).toContainText('roba 2 cartas');
  await check(page);
});

test('efectos: orden de resolución y reemplazo', async ({ page }) => {
  const sim = await open(page, 'Efectos');
  await sim.getByLabel('Escenario de efectos').selectOption({ label: 'Efectos simultáneos de ambas personas' });
  await button(sim, 'Resolver el efecto B (Jugador B)').click();
  await expect(sim.getByRole('alert')).toContainText('Todavía no le toca');
  await button(sim, 'Resolver el efecto A (Jugador A)').click();
  await button(sim, 'Resolver el efecto B (Jugador B)').click();
  await button(sim, 'Resolver el efecto C (Jugador A)').click();
  await expect(sim).toContainText('No queda ningún efecto pendiente.');

  await sim.getByLabel('Escenario de efectos').selectOption({ label: 'Dos efectos de reemplazo' });
  await expect(sim).toContainText('Decide Jugador A (turno).');
  await button(sim, 'No usarlo').click();
  await button(sim, 'Usar el reemplazo').click();
  await expect(sim).toContainText('En lugar de «el Vigía sufre K.O.»: el Vigía queda Rested.');
});
