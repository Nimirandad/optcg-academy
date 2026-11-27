<script lang="ts">
  import { apply } from '../../domain/game/reducer';
  import { activePlayer } from '../../domain/game/state';
  import { phaseNames } from '../../domain/game/turns';
  import type { Action, DonSource, Effect, FieldCard, GameState, RuleError } from '../../domain/game/types';
  import Board from '../shared/Board.svelte';
  import GameLog from '../shared/GameLog.svelte';

  let { base, initial }: { base: string; initial: GameState } = $props();

  // El componente se vuelve a crear al cambiar de escenario o reiniciar.
  // svelte-ignore state_referenced_locally
  let game = $state.raw(initial);
  let error = $state.raw<RuleError | null>(null);
  let discard = $state<string[]>([]);
  let sources = $state<string[]>(['', '']);

  const player = $derived(game.players[activePlayer(game)]);
  const own = $derived([player.leader, ...player.characters]);
  const needs = (key: 'donMinus' | 'trashFromHand') =>
    Math.max(0, ...own.flatMap((item) => item.card.effects?.map((effect) => effect[key] ?? 0) ?? []));

  function act(action: Action) {
    const result = apply(game, action);
    if (result.ok) {
      game = result.state;
      discard = [];
      sources = ['', ''];
    }
    error = result.ok ? null : result.error;
  }

  const use = (uid: string, effect: Effect) =>
    act({
      type: 'activate',
      uid,
      effectId: effect.id,
      discard: effect.trashFromHand ? discard : [],
      donFrom: effect.donMinus ? (sources.filter(Boolean) as DonSource[]) : [],
    });
</script>

{#snippet fieldActions(item: FieldCard, owner: 0 | 1)}
  {#if owner === activePlayer(game)}
    {#if item.card.kind !== 'stage'}
      <button type="button" onclick={() => act({ type: 'attach', uid: item.card.uid })}>Dar DON!!</button>
    {/if}
    {#each item.card.effects ?? [] as effect (effect.id)}
      <span class="meta">{effect.text}</span>
      <button type="button" onclick={() => use(item.card.uid, effect)}>Activar efecto</button>
    {/each}
  {/if}
{/snippet}

<p><strong>Turno {game.turn}: {player.name}, {phaseNames[game.phase]}.</strong></p>

{#if needs('donMinus')}
  <fieldset>
    <legend>DON!! que devuelves al mazo de DON!!</legend>
    <div class="options">
      {#each [0, 1] as i (i)}
        <label>
          DON!! {i + 1}
          <select bind:value={sources[i]}>
            <option value="">Sin elegir</option>
            <option value="cost-active">Zona de coste (Active)</option>
            <option value="cost-rested">Zona de coste (Rested)</option>
            {#each own as item (item.card.uid)}
              <option value={item.card.uid}>{item.card.name} ({item.don} asignados)</option>
            {/each}
          </select>
        </label>
      {/each}
    </div>
  </fieldset>
{/if}

{#if needs('trashFromHand')}
  <fieldset>
    <legend>Cartas de la mano que descartas</legend>
    <div class="options">
      {#each player.hand as card (card.uid)}
        <label><input type="checkbox" value={card.uid} bind:group={discard} /> {card.name}</label>
      {/each}
    </div>
  </fieldset>
{/if}

<div class="actions"><button type="button" onclick={() => act({ type: 'advance' })}>Avanzar fase</button></div>
<GameLog {base} log={game.log} {error} />
<div class="boards"><Board state={game} player={0} {fieldActions} /></div>
