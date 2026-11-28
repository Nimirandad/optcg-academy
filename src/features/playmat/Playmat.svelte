<script lang="ts">
  import { onMount } from 'svelte';
  import { apply } from '../../domain/game/reducer';
  import { MAX_CHARACTERS, activePlayer, other } from '../../domain/game/state';
  import { phaseNames } from '../../domain/game/turns';
  import type { Action, Card, FieldCard, PlayerId, RuleError } from '../../domain/game/types';
  import BattleControls from '../shared/BattleControls.svelte';
  import Board from '../shared/Board.svelte';
  import GameLog from '../shared/GameLog.svelte';
  import { tables } from './setup';

  let { base }: { base: string } = $props();

  let ready = $state(false);
  let tableId = $state<string>(tables[2].id);
  let game = $state.raw(tables[2].create());
  let error = $state.raw<RuleError | null>(null);
  let attacker = $state<string | null>(null);
  let incoming = $state.raw<Card | null>(null);
  let hands = $state<'turno' | 'ambas' | 'ninguna'>('turno');

  const turn = $derived(activePlayer(game));
  /** Quien debe decidir ahora: en una batalla, quien defiende. */
  const deciding = $derived(game.battle ? other(turn) : turn);
  const main = $derived(game.phase === 'main' && !game.battle && !game.result);
  const shows = (player: PlayerId) => hands === 'ambas' || (hands === 'turno' && player === deciding);

  function act(action: Action) {
    const result = apply(game, action);
    if (result.ok) {
      game = result.state;
      attacker = null;
      incoming = null;
    }
    error = result.ok ? null : result.error;
  }

  function reset() {
    game = tables.find((table) => table.id === tableId)!.create();
    error = null;
    attacker = null;
    incoming = null;
  }

  function playCard(card: Card) {
    const full = card.kind === 'character' && game.players[turn].characters.length >= MAX_CHARACTERS;
    // Con el campo lleno se pide elegir antes de jugar; si falta DON!!, responde el motor.
    if (full && game.players[turn].donActive >= (card.cost ?? 0) && main) {
      incoming = card;
      attacker = null;
      error = null;
    } else act({ type: 'play', uid: card.uid });
  }

  function toggleAttacker(uid: string) {
    attacker = attacker === uid ? null : uid;
    error = null;
  }

  function fieldTap(item: FieldCard, owner: PlayerId) {
    const uid = item.card.uid;
    if (!main || item.card.kind === 'stage') return;
    if (owner === turn && !incoming) {
      return { label: 'Seleccionar atacante', run: () => toggleAttacker(uid), selected: attacker === uid };
    }
    if (owner !== turn && attacker) {
      const from = attacker;
      return { label: 'Atacar a', run: () => act({ type: 'attack', attacker: from, target: uid }) };
    }
  }

  const handTap = (card: Card, owner: PlayerId) =>
    main && owner === turn ? { label: 'Jugar carta', run: () => playCard(card) } : undefined;

  onMount(() => (ready = true));
</script>

{#snippet fieldActions(item: FieldCard, player: PlayerId)}
  {#if main && player === turn && item.card.kind !== 'stage'}
    {#if incoming && item.card.kind === 'character'}
      <button type="button" onclick={() => act({ type: 'play', uid: incoming!.uid, replace: item.card.uid })}>
        Mandar al Trash: {item.card.name}
      </button>
    {:else if !incoming}
      <button type="button" onclick={() => act({ type: 'attach', uid: item.card.uid })}>
        Dar DON!! a {item.card.name}
      </button>
      <button
        type="button"
        aria-pressed={attacker === item.card.uid}
        onclick={() => toggleAttacker(item.card.uid)}
      >
        Atacar con {item.card.name}
      </button>
    {/if}
  {:else if main && player !== turn && attacker && item.card.kind !== 'stage'}
    <button type="button" onclick={() => act({ type: 'attack', attacker: attacker!, target: item.card.uid })}>
      Elegir objetivo: {item.card.name}
    </button>
  {/if}
{/snippet}

{#snippet handActions(card: Card, player: PlayerId)}
  {#if main && player === turn}
    <button type="button" onclick={() => playCard(card)}>Jugar {card.name}</button>
  {/if}
{/snippet}

<div class="sim">
  <fieldset class="root" disabled={!ready}>
    <div class="options">
      <label>
        Mesa
        <select bind:value={tableId} onchange={reset}>
          {#each tables as table (table.id)}<option value={table.id}>{table.title}</option>{/each}
        </select>
      </label>
      <label>
        Manos visibles
        <select bind:value={hands}>
          <option value="turno">Solo quien decide</option>
          <option value="ambas">Las dos</option>
          <option value="ninguna">Ninguna</option>
        </select>
      </label>
    </div>

    <p><strong>Turno {game.turn}: {game.players[turn].name}, {phaseNames[game.phase]}.</strong></p>
    <div class="actions">
      <button type="button" onclick={() => act({ type: 'advance' })}>Avanzar fase</button>
      <button type="button" onclick={reset}>Reiniciar mesa</button>
    </div>
    {#if attacker}<p>Elige el objetivo en el campo rival, o vuelve a pulsar «Atacar con» para cancelar.</p>{/if}
    {#if incoming}
      <p>
        Ya hay 5 Characters. Elige cuál mandar al Trash para jugar {incoming.name}.
        <button type="button" onclick={() => (incoming = null)}>Cancelar</button>
      </p>
    {/if}

    <BattleControls state={game} {act} />
    {#if game.result}<p class="result">Partida terminada. {game.result.reason}</p>{/if}
    <GameLog {base} log={game.log} {error} />

    <p class="rules"><a href={`${base.replace(/\/$/, '')}/reglas/3/#regla-3-7`}>Regla 3-7 · Characters</a></p>
    <div class="boards">
      <Board state={game} player={1} showHand={shows(1)} {fieldActions} {handActions} {fieldTap} {handTap} />
      <Board state={game} player={0} showHand={shows(0)} {fieldActions} {handActions} {fieldTap} {handTap} />
    </div>
  </fieldset>
</div>
