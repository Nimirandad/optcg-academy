<script lang="ts">
  import type { Snippet } from 'svelte';
  import { MAX_CHARACTERS, activePlayer, powerOf } from '../../domain/game/state';
  import type { Card, FieldCard, GameState, PlayerId } from '../../domain/game/types';
  import PlayCard from '../combat/PlayCard.svelte';
  import CardArt from '../art/CardArt.svelte';
  import { describe } from './cards';

  let {
    state: game,
    player,
    showHand = true,
    fieldActions,
    handActions,
    fieldTap,
    handTap,
  }: {
    state: GameState;
    player: PlayerId;
    showHand?: boolean;
    fieldActions?: Snippet<[FieldCard, PlayerId]>;
    handActions?: Snippet<[Card, PlayerId]>;
    fieldTap?: (item: FieldCard, player: PlayerId) => { label: string; run: () => void; selected?: boolean } | undefined;
    handTap?: (item: Card, player: PlayerId) => { label: string; run: () => void } | undefined;
  } = $props();

  const data = $derived(game.players[player]);
  const turn = $derived(activePlayer(game) === player);
</script>

{#snippet onField(item: FieldCard)}
  {@const tap = fieldTap?.(item, player)}
  <li class="card" class:rested={item.rested}>
    {#if tap}
      <PlayCard card={item.card} field={item} power={powerOf(game, item.card.uid)} action={tap.label} onuse={tap.run} role={tap.selected ? 'attacker' : undefined} />
    {:else}
    <div class="face"><span class="portrait"><CardArt id={item.card.id} /></span><strong>{item.card.name}</strong></div>
    <span>
      {item.rested ? 'Rested' : 'Active'}{item.card.power === undefined
        ? ''
        : ` · poder ${powerOf(game, item.card.uid)}`}{item.don ? ` · ${item.don} DON!!` : ''}
    </span>
    {/if}
    <span class="meta">{describe(item.card)}</span>
    {#if fieldActions}<span class="actions">{@render fieldActions(item, player)}</span>{/if}
  </li>
{/snippet}

<section class="board" aria-label="Campo de {data.name}">
  <h4>{data.name}{turn ? ' · su turno' : ''}</h4>

  <h5>Leader</h5>
  <ul class="zone">{@render onField(data.leader)}</ul>

  <h5>Characters ({data.characters.length}/{MAX_CHARACTERS})</h5>
  <ul class="zone">
    {#each data.characters as item (item.card.uid)}{@render onField(item)}{:else}<li class="meta">Vacía.</li>{/each}
  </ul>

  <h5>Stage ({data.stage ? 1 : 0}/1)</h5>
  <ul class="zone">
    {#if data.stage}{@render onField(data.stage)}{:else}<li class="meta">Vacía.</li>{/if}
  </ul>

  <dl class="counts">
    <div><dt>Coste (DON!!)</dt><dd>{data.donActive} Active, {data.donRested} Rested</dd></div>
    <div><dt>Mazo de DON!!</dt><dd>{data.donDeck}</dd></div>
    <div><dt>Mazo (boca abajo)</dt><dd>{data.deck.length}</dd></div>
    <div><dt>Life (boca abajo)</dt><dd>{data.life.length}</dd></div>
    <div><dt>Mano</dt><dd>{data.hand.length}</dd></div>
    <div><dt>Trash</dt><dd>{data.trash.length}</dd></div>
  </dl>

  {#if data.trash.length}
    <p class="meta">Trash, de arriba abajo: {data.trash.map((card) => card.name).join(', ')}.</p>
  {/if}

  <h5>Mano</h5>
  {#if showHand}
    <ul class="zone">
      {#each data.hand as card (card.uid)}
        {@const tap = handTap?.(card, player)}
        <li class="card">
          {#if tap}<PlayCard {card} action={tap.label} onuse={tap.run} />{:else}
          <div class="face"><span class="portrait"><CardArt id={card.id} /></span><strong>{card.name}</strong></div>
          {/if}
          <span class="meta">{describe(card)}</span>
          {#if handActions}<span class="actions">{@render handActions(card, player)}</span>{/if}
        </li>
      {:else}
        <li class="meta">Vacía.</li>
      {/each}
    </ul>
  {:else}
    <p class="meta">Oculta: {data.hand.length} cartas.</p>
  {/if}
</section>


<style>
  .face { display: flex; align-items: center; gap: 0.45rem; }
  .portrait { flex: 0 0 3.75rem; }
</style>
