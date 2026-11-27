<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { apply } from '../../domain/game/reducer';
  import { findOnField } from '../../domain/game/state';
  import type { Action, ActionResult, RuleError } from '../../domain/game/types';
  import BattleControls from '../shared/BattleControls.svelte';
  import Board from '../shared/Board.svelte';
  import GameLog from '../shared/GameLog.svelte';
  import { declareAttack, scenarios } from './scenarios';

  let { base }: { base: string } = $props();

  let ready = $state(false);
  let scenarioId = $state(scenarios[0]!.id);
  const first = scenarios[0]!;
  let game = $state.raw(first.create());
  let error = $state.raw<RuleError | null>(null);
  let attacker = $state(first.attacker);
  let target = $state(first.target);
  let don = $state(0);
  let attackerPower = $state<number | null>(null);
  let targetPower = $state<number | null>(null);

  const scenario = $derived(scenarios.find((item) => item.id === scenarioId)!);
  const declared = $derived(game.log.length > 0);
  const attackers = $derived([game.players[0].leader, ...game.players[0].characters]);
  const targets = $derived([game.players[1].leader, ...game.players[1].characters]);

  function reset() {
    untrack(() => {
      game = scenario.create();
      error = null;
      attacker = scenario.attacker;
      target = scenario.target;
      don = 0;
      attackerPower = null;
      targetPower = null;
    });
  }

  function commit(result: ActionResult) {
    if (result.ok) game = result.state;
    error = result.ok ? null : result.error;
  }

  const act = (action: Action) => commit(apply(game, action));

  function declare(event: SubmitEvent) {
    event.preventDefault();
    commit(
      declareAttack(game, {
        attacker,
        target,
        don,
        attackerPower: attackerPower ?? undefined,
        targetPower: targetPower ?? undefined,
      }),
    );
  }

  onMount(() => (ready = true));
</script>

<div class="sim">
  <fieldset class="root" disabled={!ready}>
    <label>
      Escenario
      <select bind:value={scenarioId} onchange={reset}>
        {#each scenarios as item (item.id)}<option value={item.id}>{item.title}</option>{/each}
      </select>
    </label>
    <p>{scenario.goal}</p>

    {#if !declared}
      <form onsubmit={declare}>
        <div class="options">
          <label>
            Atacante
            <select bind:value={attacker}>
              {#each attackers as item (item.card.uid)}<option value={item.card.uid}>{item.card.name}</option>{/each}
            </select>
          </label>
          <label>
            Objetivo
            <select bind:value={target}>
              {#each targets as item (item.card.uid)}<option value={item.card.uid}>{item.card.name}</option>{/each}
            </select>
          </label>
          <label>
            DON!! para el atacante
            <select bind:value={don}>
              {#each { length: game.players[0].donActive + 1 }, n}<option value={n}>{n}</option>{/each}
            </select>
          </label>
          <label>
            Poder base del atacante
            <input
              type="number"
              min="0"
              step="1000"
              placeholder={String(findOnField(game, attacker)?.field.card.power ?? '')}
              bind:value={attackerPower}
            />
          </label>
          <label>
            Poder base del objetivo
            <input
              type="number"
              min="0"
              step="1000"
              placeholder={String(findOnField(game, target)?.field.card.power ?? '')}
              bind:value={targetPower}
            />
          </label>
        </div>
        <div class="actions"><button type="submit">Declarar ataque</button></div>
      </form>
    {/if}

    <BattleControls state={game} {act} />
    {#if game.result}
      <p class="result">Partida terminada. {game.result.reason}</p>
    {:else if declared && !game.battle}
      <p class="result">Batalla terminada.</p>
    {/if}
    <GameLog {base} log={game.log} {error} />
    <div class="actions"><button type="button" onclick={reset}>Reiniciar escenario</button></div>

    <div class="boards">
      <Board state={game} player={0} />
      <Board state={game} player={1} />
    </div>
  </fieldset>
</div>
