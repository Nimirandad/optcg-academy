<script lang="ts">
  import { onMount } from 'svelte';
  import { evaluatePreferences, type PreferenceResult } from '../../domain/recommendation/preferences';
  import { colorProfiles } from './colors';
  import { preferenceQuestions } from './questions';

  const order = colorProfiles.map((profile) => profile.id);
  const profile = (id: string) => colorProfiles.find((item) => item.id === id)!;
  const names = (ids: string[]) => ids.map((id) => profile(id).name).join(', ');

  let ready = $state(false);
  let answers = $state<Record<string, string>>({});
  let result = $state<PreferenceResult | undefined>();
  const complete = $derived(preferenceQuestions.every((question) => answers[question.id]));

  function submit(event: SubmitEvent) {
    event.preventDefault();
    result = evaluatePreferences(preferenceQuestions, answers, order);
  }

  function reset() {
    answers = {};
    result = undefined;
  }

  onMount(() => (ready = true));
</script>

<form onsubmit={submit}>
  <fieldset class="root" disabled={!ready}>
    {#each preferenceQuestions as question, index (question.id)}
      <fieldset>
        <legend>{index + 1}. {question.prompt}</legend>
        {#each question.options as option (option.id)}
          <label>
            <input type="radio" name={question.id} value={option.id} bind:group={answers[question.id]} onchange={() => (result = undefined)} />
            {option.label}
          </label>
        {/each}
      </fieldset>
    {/each}
    <p class="meta">Responde las {preferenceQuestions.length} preguntas para ver el resultado.</p>
    <button type="submit" disabled={!complete}>Ver colores afines</button>
    <button type="button" onclick={reset}>Reiniciar</button>
  </fieldset>
</form>

<div role="status">
  {#if result}
    {#if result.ranking.length === 0}
      <p>Tus respuestas no inclinan hacia ningún color.</p>
    {:else}
      <p class="result">
        {result.top.length > 1 ? `Empate entre: ${names(result.top)}.` : `Color más afín: ${names(result.top)}.`}
      </p>
      <ol>
        {#each result.ranking as entry (entry.color)}
          <li>
            <strong>{profile(entry.color).name}</strong>: {entry.points} de {preferenceQuestions.length} respuestas
            ({entry.reasons.join('; ')}).
          </li>
        {/each}
      </ol>
      {#if result.pair}
        <p>Para explorar una combinación: {names(result.pair)}. No implica que exista un Leader vigente con esos colores.</p>
      {/if}
    {/if}
    <p class="meta">Es una orientación sobre tendencias generales, no un diagnóstico ni una recomendación de mazo.</p>
  {/if}
</div>

<style>
  fieldset { min-width: 0; margin-block-end: 0.75rem; border: 1px solid var(--border); border-radius: 0.5rem; }
  fieldset.root { border: 0; margin: 0; padding: 0; }
  legend { font-weight: 700; padding-inline: 0.25rem; }
  label { display: flex; align-items: center; gap: 0.5rem; min-height: 44px; }
  input { width: 1.25rem; height: 1.25rem; flex: none; }
  button { min-height: 44px; font: inherit; padding-inline: 0.9rem; margin-inline-end: 0.5rem; margin-block-end: 0.5rem; border: 1px solid var(--border); border-radius: 0.4rem; background: var(--surface); color: var(--text); cursor: pointer; }
  button:disabled { cursor: default; opacity: 0.7; }
  .meta { color: var(--muted); font-size: 0.875rem; }
  .result { font-weight: 700; }
</style>
