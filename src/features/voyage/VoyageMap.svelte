<script lang="ts">
  import { onMount } from 'svelte';
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

  onMount(() => {
    const { progress } = loadProgress(() => localStorage);
    done = Object.fromEntries(
      islands.map((island) => [island.level, island.lessons.filter((id) => progress.lessons[id]).length]),
    );
    current = (islands.find((island) => done[island.level] < island.lessons.length) ?? islands.at(-1)!).level;
  });
</script>

<ol class="route">
  {#each islands as island (island.level)}
    {@const complete = done[island.level] ?? 0}
    <li class:here={current === island.level}>
      <a href={island.href}>
        <span class="isle" aria-hidden="true">
          <svg viewBox="0 0 100 80" focusable="false">
            <path d="M8 66Q28 40 50 46T92 66Z" fill="#e8cd8c" />
            <path d="M20 62Q38 36 56 48T80 62Z" fill="#3f8a5f" />
            <path d="M52 50Q58 30 50 20" fill="none" stroke="#6b432a" stroke-width="4" stroke-linecap="round" />
            <path d="M50 21Q34 12 28 24Q42 18 50 21Q46 6 62 6Q54 12 50 21Q66 10 74 24Q60 18 50 21Z" fill="#2f7a4b" />
            <path d="M0 70q12-8 25 0t25 0 25 0 25 0" fill="none" stroke="#8fd0ee" stroke-width="3" />
          </svg>
          <span class="number">{island.level}</span>
        </span>
        <span class="text">
          <strong>{island.name}</strong>
          <span>{island.teaser}</span>
          <span class="meter">
            <span class="bar" aria-hidden="true"><span style:width="{(complete / island.lessons.length) * 100}%"></span></span>
            {complete} de {island.lessons.length} lecciones
          </span>
          {#if current === island.level}<span class="flag">⛵ Estás aquí</span>{/if}
        </span>
      </a>
    </li>
  {/each}
</ol>

<style>
  .route { list-style: none; margin: 0; padding: 0; display: grid; gap: 2rem; }
  li { position: relative; width: min(100%, 30rem); }
  li:nth-child(even) { justify-self: end; }
  /* Trazo discontinuo que une cada isla con la siguiente. */
  li:not(:last-child)::after { content: ''; position: absolute; left: 50%; top: 100%; height: 2rem; border-inline-start: 4px dashed #ffe08a; }
  a { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.9rem; border-radius: 1.25rem; border: 2px solid #8fb4d4; background: #0e2c4a; color: #fff; text-decoration: none; transition: transform 0.25s, box-shadow 0.25s; }
  a:hover, a:focus-visible { transform: translateY(-0.4rem) rotate(-0.6deg); box-shadow: 0 1rem 2rem rgb(0 0 0 / 0.4); outline: 3px solid #ffe08a; }
  .here a { border-color: #ffe08a; box-shadow: 0 0 1.5rem rgb(255 208 90 / 0.55); }
  .isle { position: relative; width: 7rem; flex: none; }
  a:hover .isle svg { animation: bob 1s ease-in-out infinite; }
  .number { position: absolute; left: 0; top: 0; width: 2rem; height: 2rem; border-radius: 50%; display: grid; place-items: center; background: #ffd76a; color: #2b1d00; font-weight: 900; }
  .text { display: flex; flex-direction: column; gap: 0.2rem; flex: 1 1 11rem; min-width: 0; }
  .text strong { font-size: 1.25rem; }
  .meter { display: flex; flex-direction: column; font-size: 0.8rem; color: #cfe6f7; }
  .bar { display: block; height: 0.5rem; background: #06182c; border-radius: 1rem; overflow: hidden; margin-block: 0.25rem 0.1rem; }
  .bar span { display: block; height: 100%; background: #ffd76a; transition: width 0.8s; }
  .flag { color: #ffe08a; font-weight: 800; }
  @keyframes bob { 50% { transform: translateY(-0.35rem); } }
</style>
