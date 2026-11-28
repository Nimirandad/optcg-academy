<script lang="ts">
  /** Recorre los pasos de un tema de uno en uno. Sin JavaScript se muestran todos. */
  import { onMount } from 'svelte';
  import { withBase } from '../../lib/paths';
  import { rulePath } from '../../lib/rules';
  import type { Topic } from '../../lib/topic-schema';
  import Emblem from '../art/Emblem.svelte';

  let { base, icon, steps }: { base: string; icon: Topic['icon']; steps: Topic['steps'] } = $props();

  let ready = $state(false);
  let all = $state(false);
  let index = $state(0);
  const single = $derived(ready && !all);

  onMount(() => (ready = true));
</script>

<div class="walk">
  {#if ready}
    <ol class="dots" aria-label="Pasos">
      {#each steps as step, i (step.title)}
        <li>
          <button type="button" class:seen={i < index} aria-current={single && i === index ? 'step' : undefined}
            aria-label="Paso {i + 1}: {step.title}" onclick={() => { index = i; all = false; }}>{i + 1}</button>
        </li>
      {/each}
    </ol>
  {/if}

  <ol class="steps" class:single aria-live="polite">
    {#each steps as step, i (step.title)}
      <li hidden={single && i !== index}>
        <span class="icon" aria-hidden="true"><Emblem name={`tema-${icon}`} /></span>
        <div>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          <p class="rules">
            {step.ruleIds.length === 1 ? 'Regla' : 'Reglas'}:
            {#each step.ruleIds as id, n (id)}{n > 0 ? ', ' : ''}<a href={withBase(rulePath(id), base)}>{id}</a>{/each}
          </p>
        </div>
      </li>
    {/each}
  </ol>

  {#if ready}
    <div class="controls">
      {#if !all}
        <button type="button" disabled={index === 0} onclick={() => (index -= 1)}>← Anterior</button>
        <button type="button" class="next" disabled={index === steps.length - 1} onclick={() => (index += 1)}>Siguiente paso →</button>
      {/if}
      <button type="button" aria-pressed={all} onclick={() => (all = !all)}>Ver todo junto</button>
    </div>
  {/if}
</div>

<style>
  .walk { border-radius: 1.25rem; padding: 0.75rem clamp(0.5rem, 3vw, 1.5rem) 1rem; background: radial-gradient(circle at 50% 0, #17507a, #082038 65%); color: #fff; box-shadow: var(--shadow); }
  .walk :focus-visible { outline: 3px solid #ffe08a; outline-offset: 2px; }
  ol { list-style: none; margin: 0; padding: 0; }
  .dots { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-bottom: 0.75rem; }
  button { min-height: 44px; font: inherit; font-weight: 800; cursor: pointer; border-radius: 3rem; border: 2px solid #8fb4d4; background: #0e2c4a; color: #fff; padding-inline: 1.1rem; transition: transform 0.15s; }
  button:disabled { cursor: default; opacity: 0.5; }
  button:enabled:hover { transform: translateY(-2px); }
  .dots button { width: 2.75rem; padding: 0; }
  .dots .seen { background: #2a6a94; }
  .dots button[aria-current], .controls .next:enabled { background: #ffd76a; border-color: #ffd76a; color: #2b1d00; }
  .controls button[aria-pressed='true'] { background: #bfe6ff; color: #0b1d38; }
  /* La entrada desliza el paso desde la derecha: se recorta para no ensanchar la página. */
  .steps { display: grid; gap: 0.75rem; overflow: clip; }
  .steps li { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; border: 2px solid #c9a45c; border-radius: 1rem; background: #0e2c4a; padding: 1rem; }
  .steps li[hidden] { display: none; }
  .single li { min-height: 12rem; align-content: center; animation: enter 0.4s; }
  .icon { width: 4rem; height: 4rem; color: #ffe08a; flex: none; }
  .single .icon { width: 6rem; height: 6rem; }
  li div { flex: 1 1 13rem; min-width: 0; }
  h3 { margin: 0; font-size: 1.35rem; }
  li p { margin-block: 0.35rem; font-size: 1.1rem; }
  li .rules { font-size: 0.85rem; color: #cfe6f7; }
  a { display: inline-block; padding: 0.25rem 0.1rem; color: #bfe6ff; }
  .controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; margin-top: 0.75rem; }
  @keyframes enter { from { opacity: 0; transform: translateX(2rem); } }
</style>
