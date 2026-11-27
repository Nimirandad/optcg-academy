<script lang="ts">
  /** Ilustraciones propias en SVG; no representan cartas ni personajes oficiales. */
  let { name }: { name: string } = $props();
  const paths: Record<string, string> = {
    // Timón
    leader: 'M32 18a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm0 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM32 4v22M32 38v22M4 32h22M38 32h22M12 12l15 15M37 37l15 15M52 12 37 27M27 37 12 52',
    // Calavera de mar: boya
    almirante: 'M32 8 56 52H8ZM32 8v44M20 38h24M26 26h12',
    // Catalejo
    vigia: 'm8 46 30-22 8 11-30 21ZM38 24l10-8 9 12-11 7M20 52l-4 8M28 47l8 13',
    // Cañón
    artillero: 'M10 24h34a10 10 0 0 1 0 20H10ZM54 34h6M20 44a8 8 0 1 0 .1 0M10 24v20',
    // Escudo
    escudo: 'M32 6 54 14v18c0 14-9 22-22 26C19 54 10 46 10 32V14ZM32 16v32M20 28h24',
    // Ancla
    grumete: 'M32 20v38M32 8a6 6 0 1 0 .1 0M18 28h28M10 40c2 12 12 18 22 18s20-6 22-18l-8 5M10 40l8 5',
    trofeo: 'M20 10h24v14a12 12 0 0 1-24 0ZM20 14H8c0 10 5 14 13 14M44 14h12c0 10-5 14-13 14M32 36v10M20 54h24M24 54l3-8h10l3 8',
    cartas: 'M22 12h28v38H22ZM14 20v38h28M30 24h12M30 32h12',
    mapa: 'M8 14l16-6 16 6 16-6v42l-16 6-16-6-16 6ZM24 8v42M40 14v42',
    reloj: 'M32 8a24 24 0 1 0 .1 0ZM32 18v15l11 7',
    moneda: 'M32 8a24 24 0 1 0 .1 0ZM32 16a16 16 0 1 0 .1 0ZM32 23v18M23 32h18',
    canon: 'M10 24h34a10 10 0 0 1 0 20H10ZM54 34h6M20 44a8 8 0 1 0 .1 0M10 24v20',
    destello: 'M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6ZM50 8v10M45 13h10',
    llave: 'M22 22a12 12 0 1 0 .1 0ZM31 37l22 20M45 50l7-7M38 44l6-6',
  };
</script>

<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
  <path d={paths[name] ?? paths.grumete} fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>

<style>
  svg { width: 100%; height: 100%; }
</style>
