<script lang="ts">
  import { onMount } from 'svelte';
  import { saveAttempt, type ProgressIssue } from '../../lib/progress';
  import { score, type Answers } from '../../lib/quiz';
  import { withBase } from '../../lib/paths';
  import { rulePath } from '../../lib/rules';
  import type { Question } from '../../lib/schemas';

  /** Los casos añaden título, mecánicas, resolución y enlaces a aclaraciones. */
  type Item = Question & {
    title?: string;
    mechanics?: string[];
    steps?: string[];
    links?: { href: string; label: string }[];
  };
  let { base, lessonId, questions }: { base: string; lessonId: string; questions: Item[] } = $props();

  let ready = $state(false);
  let chosen = $state<Record<string, string>>({});
  let checked = $state<Answers>({});
  let notice = $state('');

  const result = $derived(score(questions, checked));
  const done = $derived(result.answered === result.total);

  const messages: Record<ProgressIssue, string> = {
    blocked: 'No se pudo guardar: el navegador no permite almacenar datos. Puedes seguir practicando.',
    future: 'No se guardó: hay progreso de una versión más nueva del sitio y no se modificó.',
    corrupt: 'El progreso anterior no se podía leer; se respaldó y se guardó este resultado.',
  };

  function check(id: string) {
    if (!chosen[id]) return;
    checked = { ...checked, [id]: chosen[id] };
    const now = score(questions, checked);
    if (now.answered < now.total) return;
    const { saved, issue } = saveAttempt(() => localStorage, lessonId, now, new Date().toISOString());
    notice = issue ? messages[issue] : saved ? 'Resultado guardado en este navegador.' : '';
  }

  function reset() {
    chosen = {};
    checked = {};
    notice = '';
    document.getElementById(`${questions[0].id}-pregunta`)?.focus();
  }

  onMount(() => (ready = true));
</script>

<noscript><p>El cuestionario necesita JavaScript. La lección y las reglas se pueden leer sin él.</p></noscript>

{#each questions as question, index (question.id)}
  {@const answer = checked[question.id]}
  {#if question.title}
    <h3 id="caso-{question.id}">{question.title}</h3>
    <p class="meta">Mecánicas: {question.mechanics?.join(', ')}</p>
  {/if}
  <form onsubmit={(event) => { event.preventDefault(); check(question.id); }}>
    <fieldset>
      <legend id="{question.id}-pregunta" tabindex="-1">{index + 1}. {question.prompt}</legend>
      {#if question.assumption}<p class="meta">Supuesto: {question.assumption}</p>{/if}
      {#each question.options as option (option.id)}
        <div class="option">
          <label>
            <input type="radio" name={question.id} value={option.id} bind:group={chosen[question.id]} disabled={!ready || !!answer} />
            <span>{option.text}</span>
          </label>
          {#if answer}
            <p class="feedback">
              <strong>
                {option.id === question.answer ? 'Correcta' : 'Incorrecta'}{option.id === answer ? ' (tu respuesta)' : ''}.
              </strong>
              {option.rationale}
            </p>
          {/if}
        </div>
      {/each}
    </fieldset>
    {#if !answer}
      <button type="submit" disabled={!ready || !chosen[question.id]}>Comprobar respuesta {index + 1}</button>
    {/if}
    <p role="status">{answer ? (answer === question.answer ? 'Respuesta correcta.' : 'Respuesta incorrecta. Revisa las explicaciones.') : ''}</p>
    {#if answer && question.steps}
      <p><strong>Resolución paso a paso</strong></p>
      <ol>
        {#each question.steps as step (step)}<li>{step}</li>{/each}
      </ol>
    {/if}
    {#if answer && question.links?.length}
      <p class="meta">
        Aclaraciones:
        {#each question.links as link, i (link.href)}{i > 0 ? ', ' : ''}<a href={link.href}>{link.label}</a>{/each}
      </p>
    {/if}
    {#if answer}
      <p class="meta">
        Reglas:
        {#each question.ruleIds as id, i (id)}{i > 0 ? ', ' : ''}<a href={withBase(rulePath(id), base)}>{id}</a>{/each}
      </p>
    {/if}
  </form>
{/each}

<div role="status">
  {#if done}<p><strong>Terminaste: {result.correct} de {result.total} correctas.</strong> {notice}</p>{/if}
</div>
{#if result.answered > 0}
  <button type="button" onclick={reset}>Repetir cuestionario</button>
{/if}

<style>
  form { margin-block: 1.25rem; }
  fieldset { border: 2px solid var(--border); border-radius: 1rem; background: var(--surface); margin: 0; padding: 0.75rem; min-width: 0; }
  legend { font-weight: 700; padding-inline: 0.25rem; }
  label { display: flex; gap: 0.6rem; align-items: center; min-height: 44px; padding-inline: 0.5rem; border-radius: 2rem; border: 2px solid transparent; cursor: pointer; }
  label:hover:not(:has(:disabled)) { border-color: var(--link); }
  label:has(:checked) { border-color: var(--link); font-weight: 700; }
  input { width: 1.25rem; height: 1.25rem; flex: none; }
  .feedback { margin: 0 0 0.5rem 1.85rem; border-inline-start: 3px solid var(--border); padding-inline-start: 0.6rem; }
  .meta { color: var(--muted); font-size: 0.875rem; }
  button { min-height: 44px; font: inherit; padding-inline: 0.9rem; margin-top: 0.6rem; border: 2px solid var(--border); border-radius: 2rem; background: var(--surface); color: var(--text); font-weight: 700; cursor: pointer; }
  button:enabled { background: var(--sun); border-color: var(--sun); color: var(--sun-text); }
  button:disabled { cursor: default; opacity: 0.7; }
  a { display: inline-block; padding-block: 0.25rem; }
</style>
