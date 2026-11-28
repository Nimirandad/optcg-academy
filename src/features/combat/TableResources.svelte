<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { PlayerState } from '../../domain/game/types';

  let { player, calm }: { player: PlayerState; calm: boolean } = $props();
</script>

<dl class="resources" aria-label="Recursos de {player.name}">
  <div class="resource">
    <dt>Mazo</dt>
    <dd>
      {#key player.deck.length}<span class="pile deck" class:empty={!player.deck.length} aria-hidden="true"></span>{/key}
      <strong>{player.deck.length}</strong>
    </dd>
  </div>
  <div class="resource">
    <dt>Mazo DON!!</dt>
    <dd>
      {#key player.donDeck}<span class="pile don-deck" class:empty={!player.donDeck} aria-hidden="true">⚡</span>{/key}
      <strong>{player.donDeck}</strong>
    </dd>
  </div>
  <div class="resource cost">
    <dt>Zona de coste</dt>
    <dd>
      <span class="tokens" aria-hidden="true">
        {#each { length: player.donActive }, i (i)}
          <span class="token" in:scale={{ duration: calm ? 0 : 320, delay: calm ? 0 : i * 45 }}>⚡</span>
        {/each}
        {#each { length: player.donRested }, i (i)}
          <span class="token spent" in:scale={{ duration: calm ? 0 : 180 }}>⚡</span>
        {/each}
      </span>
      <span>{player.donActive} Active · {player.donRested} Rested</span>
    </dd>
  </div>
</dl>

<style>
  .resources { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 0.35rem; max-width: 30rem; margin: 0.35rem auto; }
  .resource { min-width: 0; background: #211a20; border: 1px solid #a99178; border-radius: 0.55rem; padding: 0.35rem 0.45rem; text-align: center; }
  dt { font-size: 0.73rem; font-weight: 750; color: #ffe8b4; }
  dd { margin: 0.25rem 0 0; font-size: 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; align-items: center; }
  .pile { display: grid; place-items: center; width: 1.45rem; height: 1.85rem; border: 1px solid #d7bd88; border-radius: 0.25rem; box-shadow: 2px 2px #83633e, 4px 4px #ba9563; animation: settle 0.32s ease-out; }
  .deck { background: repeating-linear-gradient(135deg, #144354 0 3px, #227184 3px 5px); }
  .don-deck { background: #66382a; color: #ffe279; }
  .empty { opacity: 0.4; box-shadow: none; }
  .tokens { min-height: 1.85rem; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.35rem; }
  .token { display: grid; place-items: center; width: 0.95rem; height: 1.25rem; background: #a6401e; color: #ffe279; border: 1px solid #ffd76a; border-radius: 0.2rem; font-size: 0.65rem; }
  .spent { transform: rotate(80deg); background: #363043; border-style: dashed; }
  @keyframes settle { from { transform: translateY(-4px); } }
</style>
