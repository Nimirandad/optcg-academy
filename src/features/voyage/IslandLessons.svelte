<script lang="ts">
  import { onMount } from 'svelte';
  import ProgressList from '../quizzes/ProgressList.svelte';
  import { loadProgress } from '../../lib/progress';

  let { lessons, required }: {
    lessons: { id: string; title: string; href: string }[];
    required: { name: string; lessons: string[] }[];
  } = $props();
  let ready = $state(false);
  let missing = $state<string>();
  function refresh() {
    const { progress } = loadProgress(() => localStorage);
    missing = required.find((island) => island.lessons.some((id) => !progress.lessons[id]))?.name;
    ready = true;
  }

  onMount(refresh);
</script>

<svelte:window onpageshow={refresh} onstorage={refresh} />

{#if !required.length || (ready && !missing)}
  <ProgressList levels={[{ title: 'Lecciones de esta isla', lessons }]} />
{:else if ready}
  <p class="notice" role="status">Isla bloqueada. Completa las lecciones de «{missing}» para entrar.</p>
{:else}
  <p role="status">Comprobando el progreso de las islas.</p>
  <noscript><p>Activa JavaScript para consultar tu progreso y desbloquear esta isla.</p></noscript>
{/if}
