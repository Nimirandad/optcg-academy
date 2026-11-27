<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { scale } from 'svelte/transition';
  import { apply } from '../../domain/game/reducer';
  import { powerOf } from '../../domain/game/state';
  import type { Action, FieldCard, GameState, PlayerId } from '../../domain/game/types';
  import { withBase } from '../../lib/paths';
  import { rulePath } from '../../lib/rules';
  import PlayCard from './PlayCard.svelte';
  import { clashOf, scenes as all, verdict, type Choice, type Clash } from './scenes';

  /** `only` limita los retos a los de una lección; sin él se juegan todos. */
  let { base, only, next }: { base: string; only?: string[]; next?: { href: string; label: string } } = $props();
  // La selección no cambia durante la vida de la isla.
  const scenes = untrack(() => (only ? all.filter((item) => only.includes(item.id)) : all));
  const several = scenes.length > 1;

  const phases = [
    { id: 'attack', label: 'Ataque' },
    { id: 'block', label: 'Bloqueo' },
    { id: 'counter', label: 'Counter' },
    { id: 'damage', label: 'Daño' },
  ];

  let index = $state(0);
  let game = $state.raw<GameState>(scenes[0].create());
  let clash = $state.raw<Clash | null>(clashOf(game));
  let notice = $state('');
  let won = $state<string[]>([]);
  let ready = $state(false);
  let calm = $state(false);
  let impact = $state(0);
  let board: HTMLElement | undefined = $state();
  let heading: HTMLElement | undefined = $state();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const scene = $derived(scenes[index]);
  const result = $derived(verdict(scene, game));
  const choices = $derived(ready ? scene.choices(game) : []);
  const phase = $derived(result ? 'damage' : (game.battle?.step ?? 'attack'));
  const finished = $derived(won.length === scenes.length);

  const choiceFor = (uid: string) => choices.find((choice) => choice.card === uid);
  const roleOf = (uid: string) =>
    clash?.attacker === uid ? 'attacker' : clash?.target === uid ? 'target' : undefined;
  const field = (player: PlayerId): FieldCard[] => [...game.players[player].characters, game.players[player].leader];

  /** Desplaza el atacante hacia su objetivo y vuelve. */
  async function lunge(attacker: string, target: string) {
    if (calm) return;
    await tick();
    const from = board?.querySelector<HTMLElement>(`[data-uid="${attacker}"]`);
    const to = board?.querySelector<HTMLElement>(`[data-uid="${target}"]`);
    if (!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const move = `translate(${(b.x - a.x) * 0.7}px, ${(b.y - a.y) * 0.7}px) scale(1.12)`;
    from.animate([{ transform: 'none' }, { transform: move, offset: 0.55 }, { transform: 'none' }], {
      duration: 700,
      easing: 'cubic-bezier(.3,.7,.3,1)',
    });
  }

  function act(action: Action) {
    clearTimeout(timer);
    const response = apply(game, action);
    if (!response.ok) {
      notice = response.error.message;
      return;
    }
    notice = '';
    const before = clashOf(game);
    game = response.state;
    clash = clashOf(game) ?? before;
    if (action.type === 'attack') lunge(action.attacker, action.target);
    if (action.type === 'resolve') {
      impact += 1;
      if (before) lunge(before.attacker, before.target);
      if (verdict(scene, game) === 'win' && !won.includes(scene.id)) won = [...won, scene.id];
    }
    schedule();
  }

  function schedule() {
    const next = scene.auto(game);
    if (next) timer = setTimeout(() => act(next), calm ? 0 : 1100);
  }

  async function use(choice: Choice) {
    act(choice.action);
    // Si el control pulsado desaparece, el foco no debe perderse.
    await tick();
    if (document.activeElement === document.body) board?.focus({ preventScroll: true });
  }

  async function open(next: number, focus = true) {
    clearTimeout(timer);
    index = next;
    game = scenes[next].create();
    clash = clashOf(game);
    notice = '';
    await tick();
    if (focus) heading?.focus();
    if (clash) lunge(clash.attacker, clash.target);
    schedule();
  }

  onMount(() => {
    calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    ready = true;
  });
  onDestroy(() => clearTimeout(timer));
</script>

<noscript><p>Esta lección interactiva necesita JavaScript.</p></noscript>

{#if several}
<ol class="progress" aria-label="Retos">
  {#each scenes as item, i (item.id)}
    <li>
      <button type="button" disabled={!ready} aria-current={i === index ? 'step' : undefined} class:done={won.includes(item.id)} onclick={() => open(i)}>
        <span aria-hidden="true">{won.includes(item.id) ? '★' : i + 1}</span>
        <span class="sr">Reto {i + 1}: {item.title}{won.includes(item.id) ? ' (superado)' : ''}</span>
      </button>
    </li>
  {/each}
</ol>
{/if}

<section class="stage" aria-labelledby="reto">
  <p class="count">{several ? `Reto ${index + 1} de ${scenes.length}` : 'Reto jugable'}</p>
  <h2 id="reto" tabindex="-1" bind:this={heading}>{scene.title}</h2>
  <p class="mission">{scene.mission}</p>

  <ol class="phases" aria-label="Momento de la batalla">
    {#each phases as item (item.id)}
      <li aria-current={phase === item.id ? 'step' : undefined}>{item.label}</li>
    {/each}
  </ol>

  <div class="board" bind:this={board} tabindex="-1" role="group" aria-label="Mesa de juego">
    {#each [1, 0] as const as player (player)}
      <div class="side" class:rival={player === 1}>
        <p class="owner">
          {player === 1 ? 'Rival' : 'Tú'} ·
          <span class="life">
            Life:
            {#key game.players[player].life.length}
              <span class="hearts" aria-hidden="true">{'◆'.repeat(game.players[player].life.length)}</span>
            {/key}
            <strong>{game.players[player].life.length}</strong>
          </span>
          {#if player === 0 && game.players[0].donActive}<span class="pool">DON!! libres: {game.players[0].donActive}</span>{/if}
        </p>
        <div class="row">
          {#each field(player) as item (item.card.uid)}
            <div out:scale={{ duration: calm ? 0 : 700, start: 0.2 }}>
              <PlayCard card={item.card} field={item} power={powerOf(game, item.card.uid)} role={roleOf(item.card.uid)}
                action={choiceFor(item.card.uid)?.label} onuse={() => use(choiceFor(item.card.uid)!)} />
            </div>
          {/each}
        </div>
      </div>
      {#if player === 1}
        <div class="versus">
          {#if clash}
            {#key impact}
              <p class:hit={impact > 0}>
                <span class="sr">Poder del ataque</span><strong class="atk">{clash.attack}</strong>
                <span aria-hidden="true">⚔</span><span class="sr">contra</span>
                <strong class="def">{clash.defense}</strong>
              </p>
            {/key}
          {:else}
            <p class="calm-sea" aria-hidden="true">〜〜〜</p>
          {/if}
        </div>
      {/if}
    {/each}

    {#if game.players[0].hand.length && scene.id === 'counter'}
      <div class="side">
        <p class="owner">Tu mano</p>
        <div class="row">
          {#each game.players[0].hand as card (card.uid)}
            <div out:scale={{ duration: calm ? 0 : 500 }}>
              <PlayCard {card} action={choiceFor(card.uid)?.label} onuse={() => use(choiceFor(card.uid)!)} />
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <div class="actions">
    {#each choices as choice (choice.id)}
      <button type="button" onclick={() => use(choice)}>{choice.label}</button>
    {/each}
  </div>

  <div role="status" class="speech">
    {#if result}
      <p class={result} in:scale={{ duration: calm ? 0 : 350, start: 0.7 }}>
        <strong>{result === 'win' ? '★ Reto superado.' : 'Casi.'}</strong> {result === 'win' ? scene.win : scene.retry}
      </p>
    {:else if notice}
      <p class="retry"><strong>Esa jugada no se puede.</strong> {notice}</p>
    {/if}
  </div>

  {#if result}
    <div class="actions">
      <button type="button" class="secondary" onclick={() => open(index)}>Repetir reto</button>
      {#if index < scenes.length - 1}
        <button type="button" onclick={() => open(index + 1)}>Siguiente reto →</button>
      {/if}
    </div>
  {/if}

  <details>
    <summary>Dame una pista</summary>
    <p>{scene.hint}</p>
    <p>Reglas: {#each scene.ruleIds as id, i (id)}{i > 0 ? ', ' : ''}<a href={withBase(rulePath(id), base)}>{id}</a>{/each}</p>
  </details>
</section>

{#if finished}
  <section class="trophy" in:scale={{ duration: calm ? 0 : 500, start: 0.5 }}>
    <h2>{several ? `¡Superaste los ${scenes.length} retos!` : '¡Reto completado!'}</h2>
    {#if !only}<p>Ya sabes atacar, sumar poder, elegir objetivo, bloquear y usar Counter.</p>{/if}
    {#if next}<a href={next.href}>{next.label}</a>{/if}
  </section>
{/if}

<style>
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  button { font: inherit; cursor: pointer; }
  button:disabled { cursor: default; }
  .progress { display: flex; justify-content: center; gap: 0.5rem; list-style: none; padding: 0; }
  .progress button { width: 2.75rem; height: 2.75rem; border-radius: 50%; border: 2px solid var(--border); background: var(--surface); color: var(--text); font-weight: 800; }
  .progress button[aria-current] { border-color: var(--link); box-shadow: 0 0 0 3px var(--link); }
  .progress button.done { background: #ffd76a; color: #2b1d00; border-color: #8a6400; }
  .stage { border-radius: 1.25rem; padding: 1rem clamp(0.5rem, 3vw, 1.5rem); background: radial-gradient(circle at 50% 0, #17507a, #082038 65%); color: #fff; box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 0.3); }
  .stage :focus-visible { outline: 3px solid #ffe08a; outline-offset: 3px; }
  .stage a { color: #bfe6ff; display: inline-block; padding-block: 0.25rem; }
  .count { margin: 0; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem; color: #ffe08a; }
  h2 { margin: 0; font-size: clamp(1.4rem, 5vw, 2rem); }
  .mission { font-size: 1.1rem; margin-block: 0.4rem 0.75rem; }
  .phases { display: flex; flex-wrap: wrap; gap: 0.35rem; list-style: none; padding: 0; font-size: 0.8rem; }
  .phases li { padding: 0.2rem 0.7rem; border: 1px solid #8fb4d4; border-radius: 2rem; transition: background 0.3s; }
  .phases li[aria-current] { background: #ffe08a; border-color: #ffe08a; color: #2b1d00; font-weight: 800; }
  .board { border: 3px solid #c9a45c; border-radius: 1rem; background: repeating-linear-gradient(90deg, #4a2f1d 0 3rem, #432a1a 3rem 6rem); padding: 0.25rem; overflow: hidden; }
  .row { display: flex; justify-content: center; align-items: flex-start; flex-wrap: wrap; gap: clamp(0.6rem, 3vw, 1.5rem); padding: 0.35rem 0.25rem; }
  .owner { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.25rem 0.5rem; margin: 0.15rem 0; font-weight: 700; font-size: 0.9rem; }
  .hearts { color: #ff9d9d; letter-spacing: 0.15em; display: inline-block; margin-inline: 0.25rem; animation: shake 0.5s; }
  .pool { color: #ffe08a; }
  .versus { display: grid; place-items: center; min-height: 2.75rem; }
  .versus p { display: flex; align-items: center; gap: 0.75rem; margin: 0; font-size: 1.5rem; background: #06182c; border: 2px solid #8fb4d4; border-radius: 3rem; padding: 0.15rem 1.25rem; }
  .versus .calm-sea { border: 0; background: none; color: #e8cd8c; }
  .versus p.hit { animation: clash 0.6s; }
  .atk { color: #ffc27d; }
  .def { color: #bfe6ff; }
  .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; margin-top: 0.75rem; }
  .actions button { min-height: 48px; padding: 0.5rem 1.2rem; border: 0; border-radius: 3rem; background: #ffd76a; color: #2b1d00; font-weight: 800; box-shadow: 0 0.25rem 0 #9a7415; transition: transform 0.15s; }
  .actions button:hover { transform: translateY(-2px); }
  .actions button:active { transform: translateY(3px); box-shadow: none; }
  .actions button.secondary { background: #d5e8f7; color: #0b1d38; box-shadow: 0 0.25rem 0 #5c7f9d; }
  .speech p { border-radius: 0.8rem; padding: 0.75rem 1rem; margin-bottom: 0; }
  .speech .win { background: #d9f5df; color: #0d3318; }
  .speech .retry { background: #ffe5d6; color: #4a1f08; }
  summary { cursor: pointer; min-height: 44px; align-content: center; font-weight: 700; margin-top: 0.5rem; }
  .trophy { text-align: center; margin-top: 1.5rem; border: 3px solid var(--accent); border-radius: 1.25rem; padding: 1rem; background: var(--surface); }
  .trophy a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; }
  @keyframes clash { 30% { transform: scale(1.45) rotate(-4deg); background: #7a1f24; } }
  @keyframes shake { 25% { transform: translateY(-0.25rem); } 60% { transform: translateY(0.15rem); } }
</style>
