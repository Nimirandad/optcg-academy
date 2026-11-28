<script lang="ts">
  import { withBase } from '../../lib/paths';
  import sources from '../../data/cards-art.json';
  import Emblem from './Emblem.svelte';

  let { id }: { id: string } = $props();
  const image = $derived(import.meta.env.DEV && Object.hasOwn(sources, id) ? withBase(`arte-oficial/${id}.png`) : undefined);
  let missing = $state('');
</script>

{#if image && missing !== id}
  <img src={image} width="90" height="126" alt="" onerror={() => (missing = id)} />
{:else}
  <span class="emblem"><Emblem name={id === 'capitana' ? 'leader' : id} /></span>
{/if}

<style>
  img, .emblem { display: block; width: 100%; border-radius: 0.3rem; }
  img { height: auto; }
  .emblem { max-width: 3rem; margin-inline: auto; }
</style>
