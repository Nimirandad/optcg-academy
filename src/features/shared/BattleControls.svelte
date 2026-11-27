<script lang="ts">
  import { activePlayer, findOnField, other, powerOf } from '../../domain/game/state';
  import type { Action, GameState } from '../../domain/game/types';

  let { state: game, act }: { state: GameState; act: (action: Action) => void } = $props();

  const battle = $derived(game.battle);
  const defender = $derived(game.players[other(activePlayer(game))]);
  const own = $derived([defender.leader, ...defender.characters]);
  const blockers = $derived(own.filter((item) => item.card.keywords?.includes('blocker')));
  const counters = $derived(defender.hand.filter((card) => card.counter || card.counterEvent));
  const stepNames = { block: 'Block Step', counter: 'Counter Step', trigger: 'Decisión de [Trigger]' };

  let chosenTarget = $state('');
  const counterTarget = $derived(own.some((item) => item.card.uid === chosenTarget) ? chosenTarget : battle?.target);
  const attack = $derived(battle ? powerOf(game, battle.attacker) : 0);
  const defense = $derived(battle ? powerOf(game, battle.target) : 0);
</script>

{#if battle}
  <section class="battle" aria-label="Batalla en curso">
    <h4>{stepNames[battle.step]}: decide {defender.name}</h4>
    <p>
      {findOnField(game, battle.attacker)?.field.card.name} <strong>{attack}</strong> ataca a
      {findOnField(game, battle.target)?.field.card.name} <strong>{defense}</strong>. Diferencia: {attack - defense}.
    </p>

    {#if battle.step === 'block'}
      <div class="actions">
        {#each blockers as item (item.card.uid)}
          <button type="button" onclick={() => act({ type: 'block', uid: item.card.uid })}>
            Bloquear con {item.card.name}
          </button>
        {/each}
        <button type="button" onclick={() => act({ type: 'skip-block' })}>No bloquear</button>
      </div>
    {:else if battle.step === 'counter'}
      {#if counters.length}
        <label>
          El Counter sube el poder de
          <select value={counterTarget} onchange={(event) => (chosenTarget = event.currentTarget.value)}>
            {#each own as item (item.card.uid)}<option value={item.card.uid}>{item.card.name}</option>{/each}
          </select>
        </label>
      {:else}
        <p class="meta">No quedan cartas con Counter en la mano.</p>
      {/if}
      <div class="actions">
        {#each counters as card (card.uid)}
          <button type="button" onclick={() => act({ type: 'counter', uid: card.uid, target: counterTarget! })}>
            Counter: {card.name} (+{card.counter ?? card.counterEvent}{card.kind === 'event' ? `, coste ${card.cost}` : ''})
          </button>
        {/each}
        <button type="button" onclick={() => act({ type: 'resolve' })}>Resolver el daño</button>
      </div>
    {:else if battle.trigger}
      <p>La carta de Life es {battle.trigger.name} y tiene [Trigger]: roba {battle.trigger.trigger?.draw}.</p>
      <div class="actions">
        <button type="button" onclick={() => act({ type: 'trigger', activate: true })}>Activar [Trigger]</button>
        <button type="button" onclick={() => act({ type: 'trigger', activate: false })}>No activar</button>
      </div>
    {/if}
  </section>
{/if}
