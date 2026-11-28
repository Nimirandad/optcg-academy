import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Abre la página e hidrata la isla de la sección indicada. */
async function open(page: Page, heading: string): Promise<Locator> {
  const routes: Record<string, string> = { Combate: 'laboratorio', Turnos: 'turnos', Playmat: 'playmat', Efectos: 'efectos' };
  await page.goto(heading === 'Combate' ? 'simuladores/laboratorio/' : `simuladores/libre/${routes[heading]}/`);
  const section = page.getByRole('region', { name: heading === 'Combate' ? 'Laboratorio de combate' : heading, exact: true });
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('fieldset.root')).toBeEnabled();
  return section;
}

const button = (scope: Locator, name: string | RegExp) => scope.getByRole('button', { name, exact: typeof name === 'string' });

async function check(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
}

test('alcance visible', async ({ page }) => {
  await page.goto('simuladores/');
  await page.getByText('Alcance de los simuladores libres').click();
  await expect(page.getByRole('heading', { name: 'Qué cubren y qué no' })).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Automatización de todos los efectos impresos en cartas oficiales.');
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

test('simuladores: la mesa guiada comparte los controles del reto en los cuatro modos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('simuladores/');
  const nav = page.getByRole('navigation', { name: 'Simuladores' });
  const table = page.getByRole('group', { name: 'Mesa de juego' });
  const play = (name: string) => table.getByRole('button', { name }).click();
  const won = () => expect(page.getByText('★ Reto superado.')).toBeVisible();

  await nav.getByRole('link', { name: 'Combate', exact: true }).click();
  await play('Atacar a Jango: Jango');
  await expect(page.getByText('Esa jugada no se puede.')).toBeVisible();
  await play('Atacar a Zephyr: Zephyr(Navy)');
  await page.getByRole('button', { name: 'Pasar bloqueo' }).click();
  await page.getByRole('button', { name: 'Resolver daño' }).click();
  await won();

  await nav.getByRole('link', { name: 'Turnos', exact: true }).click();
  const field = table.getByRole('group', { name: 'Tu campo' });
  const hand = table.getByRole('group', { name: 'Tu mano' });
  const resources = table.locator('dl[aria-label="Recursos de Tú"]');
  const jinbe = field.locator('[data-uid="ST31-002"]');
  await expect(jinbe).toContainText('Rested');
  await expect(hand).toContainText('Tu mano · 1');
  const refresh = table.getByRole('button', { name: 'Enderezar cartas · Refresh' });
  for (const side of ['Tu campo', 'Campo rival']) {
    const playerField = table.getByRole('group', { name: side });
    const leader = playerField.getByRole('group', { name: 'Líder', exact: true });
    const y = await leader.evaluate((element) => {
      const side = element.closest('.side')!;
      return {
        leader: element.getBoundingClientRect().top,
        cards: side.querySelector('[aria-label="Cartas jugadas"]')?.getBoundingClientRect().top,
        resources: side.querySelector('dl')!.getBoundingClientRect().top,
        fieldRight: element.getBoundingClientRect().right,
        lifeLeft: side.querySelector('.life-pile')!.getBoundingClientRect().left,
      };
    });
    expect(y.fieldRight).toBeLessThan(y.lifeLeft);
    if (side === 'Campo rival') {
      expect(y.resources).toBeLessThan(y.leader);
      if (y.cards !== undefined) expect(y.leader).toBeLessThan(y.cards);
    } else {
      expect(y.leader).toBeLessThan(y.resources);
      if (y.cards !== undefined) expect(y.cards).toBeLessThan(y.leader);
    }
  }
  await table.evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await expect(refresh).toBeInViewport({ ratio: 1 });
  await refresh.click();
  await expect(jinbe).toContainText('Active');
  await expect(jinbe).not.toContainText('Rested');
  await expect(jinbe).not.toContainText('+1 DON!!');
  await page.getByRole('button', { name: 'Robar 1 carta' }).click();
  await expect(hand).toContainText('Tu mano · 2');
  await expect(hand).toContainText('Nico Robin');
  await expect(resources.locator('.deck + strong')).toHaveText('2');
  await page.getByRole('button', { name: 'Añadir 2 DON!!' }).click();
  await expect(resources.locator('.don-deck + strong')).toHaveText('6');
  await expect(resources).toContainText('4 Active · 0 Rested');
  await page.getByRole('button', { name: 'Entrar a Main Phase' }).click();
  await play('Asignar DON!! al Leader: Monkey.D.Luffy');
  await expect(field).toContainText('+1 DON!!');
  await play('Jugar Nico Robin: Nico Robin');
  await expect(field).toContainText('Nico Robin');
  await expect(hand).toContainText('Tu mano · 1');
  await expect(hand).not.toContainText('Nico Robin');
  await expect(resources).toContainText('0 Active · 3 Rested');
  await page.getByRole('button', { name: 'Terminar el turno' }).click();
  await won();

  await nav.getByRole('link', { name: 'Playmat', exact: true }).click();
  await play('Jugar Jinbe: Jinbe');
  await expect(page.getByText('Esa jugada no se puede.')).toBeVisible();
  await play('Jugar Nico Robin: Nico Robin');
  await won();

  await nav.getByRole('link', { name: 'Efectos', exact: true }).click();
  await table.getByRole('button', { name: 'Activar efecto de Luffy y dar 2 DON!! a Jinbe', exact: true }).click();
  await expect(page.getByText('Esa jugada no se puede.')).toBeVisible();
  await expect(resources).toContainText('1 Active · 2 Rested');
  await play('Asignar 1 DON!! al Leader: Monkey.D.Luffy');
  await play('Activar efecto de Luffy y dar 2 DON!! a Jinbe: Jinbe');
  await expect(field.locator('[data-uid="0-leader"]')).toContainText('+1 DON!!');
  await expect(field.locator('[data-uid="ST31-002"]')).toContainText('+2 DON!!');
  await expect(resources).toContainText('0 Active · 0 Rested');
  await won();
  await check(page);
  await table.getByRole('button', { name: 'Repetir reto' }).click();
  await expect(table.getByRole('button', { name: 'Asignar 1 DON!! al Leader: Monkey.D.Luffy' })).toBeVisible();
});
