<script lang="ts">
  import { createReplacement, decide, type Replacement } from '../../domain/game/order';
  import type { PlayerId } from '../../domain/game/types';
  import GameLog from '../shared/GameLog.svelte';
  import { playerNames } from './scenarios';

  let {
    base,
    turnPlayer,
    process,
    options,
  }: { base: string; turnPlayer: PlayerId; process: string; options: readonly Replacement[] } = $props();

  // El componente se vuelve a crear al cambiar de escenario o reiniciar.
  // svelte-ignore state_referenced_locally
  let current = $state.raw(createReplacement(turnPlayer, process, options));
  const next = $derived(current.queue[0]);

  function choose(use: boolean) {
    const result = decide(current, use);
    if (result.ok) current = result.state;
  }
</script>

<p>Proceso que se puede reemplazar: <strong>{current.process}</strong></p>
{#if next}
  <p>Decide {playerNames[next.owner]}. {next.label}: en su lugar, {next.instead}.</p>
  <div class="actions">
    <button type="button" onclick={() => choose(true)}>Usar el reemplazo</button>
    <button type="button" onclick={() => choose(false)}>No usarlo</button>
  </div>
{:else}
  <p class="result">{current.outcome}</p>
{/if}
<GameLog {base} log={current.log} />
