<script lang="ts">
  import { onMount } from 'svelte';
  import { withBase } from '../../lib/paths';
  import { loadProgress } from '../../lib/progress';

  interface Island {
    level: number;
    name: string;
    teaser: string;
    href: string;
    lessons: string[];
  }
  let { islands }: { islands: Island[] } = $props();

  let done = $state<Record<string, number>>({});
  let current = $state(1);

  function refresh() {
    const { progress } = loadProgress(() => localStorage);
    done = Object.fromEntries(
      islands.map((island) => [island.level, island.lessons.filter((id) => progress.lessons[id]).length]),
    );
    current = (islands.find((island) => done[island.level] < island.lessons.length) ?? islands.at(-1)!).level;
  }

  onMount(refresh);
</script>

<svelte:window onpageshow={refresh} onstorage={refresh} />

<ol class="route">
  {#each islands as island, index (island.level)}
    {@const complete = done[island.level] ?? 0}
    {@const locked = island.level > current}
    <li class:here={current === island.level} class:locked>
      {#snippet info()}
        <span class="isle" aria-hidden="true">
          <img
            src={withBase(`arte/isla-${island.level}.webp`)}
            srcset={`${withBase(`arte/isla-${island.level}-160.webp`)} 160w, ${withBase(`arte/isla-${island.level}.webp`)} 320w`}
            sizes="(max-width: 325px) 52px, (max-width: 800px) 16vw, 128px"
            width="320" height="320" loading="lazy" alt=""
          />
          <span class="number">{island.level}</span>
        </span>
        <span class="text">
          <strong>{island.name}</strong>
          <span>{island.teaser}</span>
          <span class="meter">
            <span class="bar" aria-hidden="true"><span style:width="{(complete / island.lessons.length) * 100}%"></span></span>
            {complete} de {island.lessons.length} lecciones
          </span>
          {#if locked}<span class="flag">🔒 Completa las islas anteriores</span>{/if}
          {#if current === island.level}<span class="flag">⛵ Estás aquí</span>{/if}
        </span>
      {/snippet}
      {#if locked}
        <div class="island-card">{@render info()}</div>
      {:else}
        <a class="island-card" href={island.href}>{@render info()}</a>
      {/if}
      {#if index < islands.length - 1}
        <svg class="connector" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M 0 0 C 0 24, 100 16, 100 40" vector-effect="non-scaling-stroke" />
        </svg>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .route { list-style: none; margin: 0; padding: 0; display: grid; gap: 2.15rem; container-type: inline-size; --offset: clamp(2rem, 14cqi, 8rem); }
  li { position: relative; margin-inline-end: var(--offset); }
  li:nth-child(even) { margin-inline-start: var(--offset); margin-inline-end: 0; }
  .connector { position: absolute; top: 100%; left: 50%; width: var(--offset); height: 2.15rem; overflow: visible; pointer-events: none; }
  .connector path { fill: none; stroke: #f7d789; stroke-width: 2; stroke-linecap: round; }
  li:nth-child(even) .connector { left: calc(50% - var(--offset)); transform: scaleX(-1); }
  .island-card { position: relative; z-index: 1; display: flex; align-items: center; gap: clamp(0.5rem, 2vw, 1.1rem); min-height: 6rem; padding: 0.55rem; border-radius: 1rem; border: 1px solid #9bd5c9; background: linear-gradient(120deg, #174a50, #102f38); color: #fff; text-decoration: none; box-shadow: 0 0.6rem 1rem #071b255c; transition: transform 0.24s, box-shadow 0.24s; }
  .locked .island-card { border-style: dashed; }
  .locked img { filter: saturate(0.5); }
  a:hover, a:focus-visible { transform: translateY(-4px); box-shadow: 0 0.8rem 1.5rem #071b2599; outline: 3px solid #ffe08a; }
  .here a { border-color: #ffe08a; box-shadow: 0 0 0 2px #ffe08a60, 0 0.6rem 1.5rem #071b257a; }
  .isle { position: relative; width: clamp(3.25rem, 16vw, 8rem); flex: none; overflow: hidden; border-radius: 0.7rem; }
  .isle img { display: block; width: 100%; height: auto; transition: transform 0.4s; }
  a:hover .isle img { transform: scale(1.08); }
  .number { position: absolute; left: 0; top: 0; width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center; background: #ffd76a; color: #2b1d00; font-weight: 900; }
  .text { display: flex; flex-direction: column; gap: 0.2rem; flex: 1 1 11rem; min-width: 0; }
  .text strong { font-size: 1.25rem; }
  .meter { display: flex; flex-direction: column; font-size: 0.8rem; color: #cfe6f7; }
  .bar { display: block; height: 0.5rem; background: #06182c; border-radius: 1rem; overflow: hidden; margin-block: 0.25rem 0.1rem; }
  .bar span { display: block; height: 100%; background: #ffd76a; transition: width 0.8s; }
  @media (max-width: 30rem) { .route { --offset: 1rem; } .text strong { font-size: 1rem; } }
  .flag { color: #ffe08a; font-weight: 800; }
</style>
