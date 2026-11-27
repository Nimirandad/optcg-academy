<script lang="ts">
  import { onMount } from 'svelte';
  import { clearProgress, emptyProgress, loadProgress, type Progress, type ProgressIssue } from '../../lib/progress';

  interface Level {
    title: string;
    lessons: { id: string; title: string; href: string }[];
  }
  let { levels }: { levels: Level[] } = $props();

  let progress = $state<Progress>(emptyProgress());
  let issue = $state<ProgressIssue | undefined>();
  let ready = $state(false);
  let confirming = $state(false);
  let message = $state('');

  const total = $derived(levels.reduce((sum, level) => sum + level.lessons.length, 0));
  const completed = $derived(
    levels.flatMap((level) => level.lessons).filter((lesson) => progress.lessons[lesson.id]).length,
  );
  const warnings: Record<ProgressIssue, string> = {
    blocked: 'El navegador no permite guardar datos: el progreso no se conservará.',
    future: 'Hay progreso de una versión más nueva del sitio; no se muestra ni se modifica.',
    corrupt: 'Parte del progreso guardado no se podía leer.',
  };

  function refresh() {
    ({ progress, issue } = loadProgress(() => localStorage));
  }

  function erase() {
    message = clearProgress(() => localStorage) ? 'Progreso borrado.' : 'No se pudo borrar el progreso.';
    confirming = false;
    refresh();
  }

  onMount(() => {
    refresh();
    ready = true;
  });
</script>

{#if ready}
  <p>Lecciones completadas: {completed} de {total}.</p>
  {#if issue}<p class="warning">{warnings[issue]}</p>{/if}
{/if}

{#each levels as level (level.title)}
  <h2>{level.title}</h2>
  <ol>
    {#each level.lessons as lesson (lesson.id)}
      {@const done = progress.lessons[lesson.id]}
      <li>
        <a href={lesson.href}>{lesson.title}</a>
        {#if done}
          <span> · Completada{done.total ? ` (mejor resultado: ${done.correct} de ${done.total})` : ''}</span>
        {/if}
      </li>
    {/each}
  </ol>
{/each}

<p class="meta">El progreso se guarda solo en este navegador. No se envía a ningún servidor.</p>
{#if ready && (completed > 0 || issue === 'corrupt' || issue === 'future')}
  {#if confirming}
    <p>¿Borrar todo el progreso? No se puede deshacer.</p>
    <button type="button" onclick={erase}>Sí, borrar</button>
    <button type="button" onclick={() => (confirming = false)}>Cancelar</button>
  {:else}
    <button type="button" onclick={() => { confirming = true; message = ''; }}>Borrar progreso</button>
  {/if}
{/if}
<p role="status">{message}</p>

<style>
  ol { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr)); gap: 0.6rem; padding: 0; list-style-position: inside; }
  li { border: 2px solid var(--border); border-radius: 1rem; background: var(--surface); padding: 0.25rem 0.9rem; transition: transform 0.2s; }
  li:hover, li:focus-within { transform: translateY(-0.2rem); border-color: var(--link); }
  li::marker { font-weight: 900; }
  li a { display: inline-flex; align-items: center; min-height: 44px; font-weight: 700; }
  h2 { scroll-margin-top: 1rem; }
  .meta { color: var(--muted); font-size: 0.875rem; }
  .warning { border-inline-start: 4px solid var(--notice); background: var(--surface); padding: 0.5rem 0.75rem; }
  button { min-height: 44px; font: inherit; padding-inline: 0.9rem; margin-inline-end: 0.5rem; border: 2px solid var(--border); border-radius: 2rem; background: var(--surface); color: var(--text); cursor: pointer; }
</style>
