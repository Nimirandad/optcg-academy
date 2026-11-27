<script lang="ts">
  import type { Card, FieldCard } from '../../domain/game/types';
  import Emblem from '../art/Emblem.svelte';

  let { card, field, power, action, onuse, role }: {
    card: Card;
    /** Estado en la mesa; ausente en las cartas de la mano. */
    field?: FieldCard;
    power?: number;
    /** Texto de la acción que se ejecuta al tocar la carta. */
    action?: string;
    onuse?: () => void;
    role?: 'attacker' | 'target';
  } = $props();

  const art = $derived(card.id === 'capitana' ? 'leader' : card.id);
  const blocker = $derived(card.keywords?.includes('blocker'));
</script>

{#snippet face()}
  <span class="name">{card.name}</span>
  <span class="art"><Emblem name={art} /></span>
  {#if field}
    <span class="power">{power}</span>
  {:else}
    <span class="power">+{card.counter}</span>
    <span class="caption">Counter</span>
  {/if}
  {#if blocker}<span class="tag">Blocker</span>{/if}
  {#if field?.don}<span class="don">+{field.don} DON!!</span>{/if}
  {#if field?.rested}<span class="rest">Rested</span>{/if}
{/snippet}

<div class="slot" data-uid={card.uid} class:attacker={role === 'attacker'} class:target={role === 'target'}>
  {#if action}
    <button type="button" class="card usable {card.kind}" class:rested={field?.rested} onclick={onuse} aria-label="{action}: {card.name}">
      {@render face()}
    </button>
  {:else}
    <div class="card {card.kind}" class:rested={field?.rested}>{@render face()}</div>
  {/if}
</div>

<style>
  .slot { width: clamp(5.25rem, 24vw, 6.5rem); }
  .card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.1rem; width: 100%; min-height: 7.4rem; padding: 0.25rem 0.25rem 0.35rem; border: 2px solid #8fb4d4; border-radius: 0.7rem; background: linear-gradient(160deg, #1d4668, #0e2440 70%); color: #fff; font: inherit; line-height: 1.15; box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.35); transition: transform 0.25s, box-shadow 0.25s; }
  .card.leader { border-color: #e8cd8c; background: linear-gradient(160deg, #6b3a2c, #2b1622 75%); }
  .card.rested { transform: rotate(12deg); border-style: dashed; }
  .usable { cursor: pointer; animation: beckon 1.6s ease-in-out infinite; }
  .usable:hover, .usable:focus-visible { transform: translateY(-0.4rem) scale(1.04); outline: 3px solid #ffe08a; outline-offset: 3px; }
  .name { font-size: 0.72rem; font-weight: 700; text-align: center; min-height: 2.3em; display: flex; align-items: center; }
  .art { width: 2.4rem; aspect-ratio: 1; color: #f4d995; }
  .power { font-size: 1.15rem; font-weight: 900; font-variant-numeric: tabular-nums; }
  .caption { font-size: 0.65rem; }
  .tag, .don, .rest { font-size: 0.62rem; font-weight: 800; border-radius: 1rem; padding: 0.05rem 0.4rem; text-transform: uppercase; }
  .tag { background: #bfe6ff; color: #0b1d38; }
  .don { background: #ffe08a; color: #2b1d00; animation: pop 0.4s; }
  .rest { background: #0b1d38; color: #fff; border: 1px solid #fff; }
  .attacker .card { box-shadow: 0 0 0 3px #ffb15c, 0 0 1.5rem #ff7a3d; }
  .target .card { box-shadow: 0 0 0 3px #ff8f8f, 0 0 1.5rem #e0484d; }
  @keyframes beckon { 50% { box-shadow: 0 0 0 4px #ffe08a, 0 0 1.4rem #ffd25a; } }
  @keyframes pop { from { transform: scale(2); } }
</style>
