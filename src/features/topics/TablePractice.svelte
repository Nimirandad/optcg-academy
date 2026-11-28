<script lang="ts">
  import Emblem from '../art/Emblem.svelte';

  const zones = [
    { id: 'life', label: 'Life', note: 'Allí se apilan las cartas de vida boca abajo.', rule: '3-10' },
    { id: 'characters', label: 'Characters', note: 'Aquí juegas tus personajes. Caben hasta cinco.', rule: '3-7' },
    { id: 'deck', label: 'Mazo', note: 'Aquí va tu mazo principal, boca abajo.', rule: '3-2' },
    { id: 'leader', label: 'Leader', note: 'Tu Leader va boca arriba desde la preparación.', rule: '3-6' },
    { id: 'stage', label: 'Stage', note: 'Solo cabe un Stage en esta zona.', rule: '3-8' },
    { id: 'trash', label: 'Trash', note: 'Aquí van los Characters con K.O. y los Events que activaste.', rule: '3-5' },
    { id: 'don-deck', label: 'Mazo DON!!', note: 'Aquí quedan los DON!! que aún no entran al campo.', rule: '3-3' },
    { id: 'cost', label: 'Coste', note: 'Los DON!! que sacas de su mazo entran en esta zona.', rule: '3-9' },
  ];
  const prompts = [
    { zone: 'leader', text: 'Estás preparando la partida. Coloca tu carta Leader.' },
    { zone: 'characters', text: 'Ya pagaste el coste. Coloca el Character que acabas de jugar.' },
    { zone: 'stage', text: 'Juegas un Stage y esa zona está libre. ¿Dónde lo dejas?' },
    { zone: 'cost', text: 'Sacaste un DON!! de su mazo durante la DON!! Phase. ¿Dónde entra?' },
    { zone: 'life', text: 'Durante la preparación, ¿dónde pones las cartas de vida?' },
    { zone: 'trash', text: 'Tu Character acaba de sufrir K.O. ¿Adónde va?' },
  ];
  let { base }: { base: string } = $props();
  let step = $state(0);
  let selected = $state('');
  const prompt = $derived(prompts[step]);
  const correct = $derived(selected === prompt.zone);
  const zone = $derived(zones.find((entry) => entry.id === selected));

  function next() {
    step = (step + 1) % prompts.length;
    selected = '';
  }
</script>

<section aria-label="Práctica de zonas" class="practice">
  <h2>Coloca la carta</h2>
  <p><strong>{step + 1} de {prompts.length}</strong> · {prompt.text}</p>
  <div class="table" role="group" aria-label="Tu lado de la mesa">
    {#each zones as entry (entry.id)}
      <button type="button" class={entry.id} class:correct={correct && selected === entry.id}
        aria-pressed={selected === entry.id} onclick={() => (selected = entry.id)}>
        {entry.label}
        {#if correct && selected === entry.id}
          <span class="card"><Emblem name="cartas" /></span>
        {/if}
      </button>
    {/each}
  </div>
  <p class="feedback" role="status">{zone ? (correct ? `¡Correcto! ${zone.note}` : `Prueba otra zona. ${zone.note}`) : 'Toca una zona de la mesa.'}</p>
  {#if correct && zone}
    <a href={`${base.replace(/\/$/, '')}/reglas/3/#regla-${zone.rule}`}>Regla {zone.rule}</a>
    <button class="advance" type="button" onclick={next}>{step === prompts.length - 1 ? 'Volver a empezar' : 'Siguiente carta'}</button>
  {/if}
  <p class="source"><a href="https://en.onepiece-cardgame.com/pdf/rule_manual.pdf#page=7">Official Rule Manual v1.11, p. 5</a> · Consultado el 27 de noviembre de 2026.</p>
</section>

<style>
  .practice { padding: clamp(0.8rem, 3vw, 1.5rem); margin-block: 1rem; border-radius: 1rem; background: var(--sea); color: white; }
  h2 { margin: 0; }
  a { color: #ffe08a; }
  .table { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.35rem; grid-template-areas: 'life characters characters deck' 'life leader stage trash' 'don cost cost trash'; }
  button { min-height: 56px; cursor: pointer; border-radius: 0.5rem; background: #143638; border: 1px solid #a2c3b7; color: white; font: inherit; font-weight: 700; padding: 0.35rem; overflow-wrap: anywhere; }
  button:focus-visible { outline-color: #ffe08a; }
  .life { grid-area: life; }.characters { grid-area: characters; }.deck { grid-area: deck; }.leader { grid-area: leader; }
  .stage { grid-area: stage; }.trash { grid-area: trash; }.don-deck { grid-area: don; }.cost { grid-area: cost; }
  [aria-pressed='true'] { outline: 2px solid #ffb3a2; outline-offset: -3px; }
  .correct, .advance { background: #ffd76a; color: #302300; outline-color: #fff; }
  .card { display: block; width: 2rem; margin: 0.2rem auto 0; animation: place 0.25s ease-out; }
  .advance { min-height: 44px; margin-inline-start: 0.5rem; padding-inline: 0.75rem; }
  .feedback { min-height: 2lh; }
  .source { font-size: 0.85rem; }
  @keyframes place { from { transform: translateY(-0.5rem); opacity: 0; } }
</style>
