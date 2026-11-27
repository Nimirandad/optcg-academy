<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { LogEntry, RuleError } from '../../domain/game/types';
  import RuleLinks from './RuleLinks.svelte';

  let { base, log, error = null }: { base: string; log: readonly LogEntry[]; error?: RuleError | null } = $props();

  let status: HTMLDivElement;
  /** Lo que produjo la última jugada, para anunciarlo completo. */
  let latest = $state('');
  let announced = 0;

  // El control usado puede desaparecer con la jugada; se recuerda cuál tenía el foco.
  let focused: Element | null = null;

  onMount(() => {
    const island = status.closest('.sim')!;
    const remember = (event: Event) => (focused = event.target as Element);
    island.addEventListener('focusin', remember);
    return () => island.removeEventListener('focusin', remember);
  });

  // Si desapareció, el foco vuelve al resultado y no al inicio de la página.
  $effect(() => {
    void error;
    if (log.length !== announced) {
      latest = log
        .slice(announced < log.length ? announced : 0)
        .map((entry) => entry.text)
        .join(' ');
      announced = log.length;
    }
    tick().then(() => {
      const gone = focused && (!focused.isConnected || focused.matches(':disabled'));
      if (!gone) return;
      focused = null;
      if (document.activeElement === document.body) status.focus();
    });
  });
</script>

<div class="status" bind:this={status} tabindex="-1">
  <div role="alert">
    {#if error}
      <p class="error"><strong>Acción no permitida.</strong> {error.message} <RuleLinks {base} ids={error.ruleIds} /></p>
    {/if}
  </div>
  <p role="status">{error ? '' : latest}</p>
</div>

{#if log.length}
  <details open>
    <summary>Pasos ({log.length})</summary>
    <ol>
      {#each log as entry, i (i)}
        <li>{entry.text} <RuleLinks {base} ids={entry.ruleIds} /></li>
      {/each}
    </ol>
  </details>
{/if}
