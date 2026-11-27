<script lang="ts">
  import { onMount } from 'svelte';
  import { withBase } from '../../lib/paths';
  import { normalizeRuleId, rulePath } from '../../lib/rules';

  let { base, ruleIds }: { base: string; ruleIds: string[] } = $props();

  interface Result {
    url: string;
    title: string;
  }
  interface Pagefind {
    search(query: string): Promise<{ results: { data(): Promise<{ url: string; meta: { title?: string } }> }[] }>;
  }

  let query = $state('');
  let results = $state<Result[]>([]);
  let status = $state('');
  let ready = $state(false);
  let run = 0;

  const exact = $derived.by(() => {
    const id = normalizeRuleId(query);
    return id && ruleIds.includes(id) ? id : null;
  });

  async function search() {
    const current = ++run;
    const term = query.trim();
    results = [];
    if (!term) {
      status = '';
      return;
    }
    status = 'Buscando…';
    try {
      const url = withBase('pagefind/pagefind.js', base);
      const pagefind: Pagefind = await import(/* @vite-ignore */ url);
      const found = await pagefind.search(term);
      const data = await Promise.all(found.results.slice(0, 10).map((result) => result.data()));
      if (current !== run) return;
      results = data.map((item) => ({ url: item.url, title: item.meta.title ?? item.url }));
      status = results.length === 1 ? '1 página encontrada.' : `${results.length} páginas encontradas.`;
    } catch {
      if (current === run) status = 'La búsqueda no está disponible. Se genera al construir el sitio.';
    }
  }

  onMount(() => {
    ready = true;
    query = new URLSearchParams(location.search).get('q') ?? '';
    search();
  });
</script>

<form role="search" onsubmit={(event) => { event.preventDefault(); search(); }}>
  <label for="consulta">Número de regla, término o título</label>
  <div>
    <input id="consulta" type="search" bind:value={query} disabled={!ready} autocomplete="off" />
    <button type="submit" disabled={!ready}>Buscar</button>
  </div>
</form>

{#if exact}
  <p><a href={withBase(rulePath(exact), base)}>Ir a la regla {exact}</a></p>
{/if}
<p role="status">{status}</p>
<ul aria-label="Resultados">
  {#each results as result (result.url)}
    <li><a href={result.url}>{result.title}</a></li>
  {/each}
</ul>

<style>
  label { display: block; font-weight: 700; margin-bottom: 0.25rem; }
  div { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  input { flex: 1 1 12rem; min-width: 0; }
  input, button { min-height: 44px; font: inherit; padding-inline: 0.75rem; border: 1px solid var(--border); border-radius: 0.4rem; background: var(--surface); color: var(--text); }
  button { cursor: pointer; }
  li a { display: inline-flex; align-items: center; min-height: 44px; }
</style>
