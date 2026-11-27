<script lang="ts">
  import { createOrder, resolvePending, type PendingEffect } from '../../domain/game/order';
  import type { PlayerId, RuleError } from '../../domain/game/types';
  import GameLog from '../shared/GameLog.svelte';
  import { playerNames } from './scenarios';

  let { base, turnPlayer, pending }: { base: string; turnPlayer: PlayerId; pending: readonly PendingEffect[] } = $props();

  // El componente se vuelve a crear al cambiar de escenario o reiniciar.
  // svelte-ignore state_referenced_locally
  let order = $state.raw(createOrder(turnPlayer, pending));
  let error = $state.raw<RuleError | null>(null);
  const waiting = $derived(order.waves.flat());

  function choose(id: string) {
    const result = resolvePending(order, id);
    if (result.ok) order = result.state;
    error = result.ok ? null : result.error;
  }
</script>

<h4>Pendientes</h4>
{#if waiting.length}
  <ul>
    {#each waiting as effect (effect.id)}
      <li>
        {playerNames[effect.owner]}:
        <button type="button" onclick={() => choose(effect.id)}>Resolver {effect.label}</button>
      </li>
    {/each}
  </ul>
{:else}
  <p class="result">No queda ningún efecto pendiente.</p>
{/if}
<GameLog {base} log={order.log} {error} />
