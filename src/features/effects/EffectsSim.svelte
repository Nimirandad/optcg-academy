<script lang="ts">
  import { onMount } from 'svelte';
  import GameEffects from './GameEffects.svelte';
  import OrderEffects from './OrderEffects.svelte';
  import ReplacementEffects from './ReplacementEffects.svelte';
  import { effectScenarios } from './scenarios';

  let { base }: { base: string } = $props();

  let ready = $state(false);
  let scenarioId = $state(effectScenarios[0]!.id);
  let round = $state(0);
  const scenario = $derived(effectScenarios.find((item) => item.id === scenarioId)!);

  onMount(() => (ready = true));
</script>

<div class="sim">
  <fieldset class="root" disabled={!ready}>
    <label>
      Escenario de efectos
      <select bind:value={scenarioId}>
        {#each effectScenarios as item (item.id)}<option value={item.id}>{item.title}</option>{/each}
      </select>
    </label>
    <p>{scenario.goal}</p>

    {#key `${scenarioId}-${round}`}
      {#if scenario.kind === 'game'}
        <GameEffects {base} initial={scenario.create()} />
      {:else if scenario.kind === 'order'}
        <OrderEffects {base} turnPlayer={scenario.turnPlayer} pending={scenario.pending} />
      {:else}
        {#if scenario.note}<p class="meta">{scenario.note}</p>{/if}
        <ReplacementEffects
          {base}
          turnPlayer={scenario.turnPlayer}
          process={scenario.process}
          options={scenario.options}
        />
      {/if}
    {/key}
    <div class="actions"><button type="button" onclick={() => round++}>Reiniciar efectos</button></div>
  </fieldset>
</div>
