<script lang="ts">
  import RuleLinks from '../shared/RuleLinks.svelte';
  import PlayCard from '../combat/PlayCard.svelte';
  import { onMount } from 'svelte';
  import { apply } from '../../domain/game/reducer';
  import { activePlayer, other } from '../../domain/game/state';
  import { phaseNames } from '../../domain/game/turns';
  import type { Action, Phase, PlayerId, RuleError } from '../../domain/game/types';
  import BattleControls from '../shared/BattleControls.svelte';
  import GameLog from '../shared/GameLog.svelte';
  import { trainingTurn } from './setup';

  let { base }: { base: string } = $props();

  let ready = $state(false);
  let first = $state<PlayerId>(0);
  let game = $state.raw(trainingTurn(0));
  let error = $state.raw<RuleError | null>(null);

  const id = $derived(activePlayer(game));
  const player = $derived(game.players[id]);
  const phases = Object.keys(phaseNames) as Phase[];

  function act(action: Action) {
    const result = apply(game, action);
    if (result.ok) game = result.state;
    error = result.ok ? null : result.error;
  }

  function reset() {
    game = trainingTurn(first);
    error = null;
  }

  /** La carta de menor coste que no sea un Event, para probar la acción de jugar. */
  function playOne() {
    const card = [...player.hand].filter((c) => c.kind !== 'event').sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))[0];
    const full = card?.kind === 'character' && player.characters.length >= 5;
    act({ type: 'play', uid: card?.uid ?? '', replace: full ? player.characters[0]!.card.uid : undefined });
  }

  function attackLeader() {
    act({ type: 'attack', attacker: player.leader.card.uid, target: game.players[other(id)].leader.card.uid });
  }

  onMount(() => (ready = true));
</script>

<div class="sim">
  <fieldset class="root" disabled={!ready}>
    <div class="options">
      <label>
        Va primero
        <select bind:value={first} onchange={reset}>
          <option value={0}>Jugador A</option>
          <option value={1}>Jugador B</option>
        </select>
      </label>
    </div>

    <p><strong>Turno {game.turn} de la partida: {player.name}.</strong></p>
    <p><RuleLinks {base} ids={[`6-${phases.indexOf(game.phase) + 2}`]} /></p>
    <ol class="phases" aria-label="Fases del turno">
      {#each phases as phase (phase)}
        <li aria-current={phase === game.phase ? 'step' : undefined}>
          {phaseNames[phase]}{phase === game.phase ? ' (actual)' : ''}
        </li>
      {/each}
    </ol>

    <div class="actions">
      <button type="button" onclick={() => act({ type: 'advance' })}>Avanzar fase</button>
      <button type="button" onclick={reset}>Reiniciar partida</button>
    </div>

    <h4>Acciones de {player.name}</h4>
    <p class="meta">Pruébalas en cualquier momento: si no son legales, se explica el motivo.</p>
    <div class="actions">
      <button type="button" onclick={playOne}>Jugar la carta más barata</button>
      <button type="button" onclick={() => act({ type: 'attach', uid: player.leader.card.uid })}>
        Asignar 1 DON!! al Leader
      </button>
      <button type="button" onclick={attackLeader}>Atacar al Leader rival</button>
      <button type="button" onclick={() => act({ type: 'concede', player: id })}>Conceder</button>
    </div>

    <BattleControls state={game} {act} />
    {#if game.result}<p class="result">Partida terminada. {game.result.reason}</p>{/if}
    <GameLog {base} log={game.log} {error} />

    <div class="boards">
      {#each game.players as data, index (data.name)}
        <section class="board" aria-label="Recursos de {data.name}">
          <h4>{data.name}{index === id ? ' · su turno' : ''}</h4>
          <div class="crew">
            <PlayCard card={data.leader.card} field={data.leader} power={data.leader.card.power}
              action={index === id ? 'Asignar DON!! a' : 'Atacar a'}
              onuse={index === id ? () => act({ type: 'attach', uid: player.leader.card.uid }) : attackLeader} />
            {#each data.characters as character (character.card.uid)}
              <PlayCard card={character.card} field={character} power={character.card.power} />
            {/each}
          </div>
          <dl class="counts">
            <div><dt>Mano</dt><dd>{data.hand.length}</dd></div>
            <div><dt>Mazo</dt><dd>{data.deck.length}</dd></div>
            <div><dt>Life</dt><dd>{data.life.length}</dd></div>
            <div><dt>Mazo de DON!!</dt><dd>{data.donDeck}</dd></div>
            <div><dt>DON!! Active</dt><dd>{data.donActive}</dd></div>
            <div><dt>DON!! Rested</dt><dd>{data.donRested}</dd></div>
            <div><dt>DON!! en el Leader</dt><dd>{data.leader.don}</dd></div>
            <div><dt>Leader</dt><dd>{data.leader.rested ? 'Rested' : 'Active'}</dd></div>
            <div><dt>Characters</dt><dd>{data.characters.length}/5</dd></div>
          </dl>
        </section>
      {/each}
    </div>
  </fieldset>
</div>

<style>
  .phases { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; }
  .phases li { border: 1px solid var(--border); border-radius: 0.4rem; padding: 0.25rem 0.6rem; }
  .phases li[aria-current] { border: 2px solid #ffd76a; color: #221800; background: #ffd76a; font-weight: 700; animation: phase-flash 0.3s ease-out; }
  @keyframes phase-flash { from { transform: scale(0.94); } }
  .crew { display: flex; flex-wrap: wrap; gap: 0.55rem; }
</style>
