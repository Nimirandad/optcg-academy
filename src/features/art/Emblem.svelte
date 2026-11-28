<script lang="ts">
  import { withBase } from '../../lib/paths';

  let { name }: { name: string } = $props();

  const topicIcons = ['trofeo', 'cartas', 'mapa', 'reloj', 'moneda', 'canon', 'escudo', 'destello', 'llave'];
  const illustrations: Record<string, string> = {
    leader: 'capitana',
    almirante: 'almirante',
    vigia: 'vigia',
    artillero: 'artillero',
    escudo: 'escudo',
    grumete: 'grumete',
    trofeo: 'brujula',
    cartas: 'cartas',
    mapa: 'isla',
    reloj: 'brujula',
    moneda: 'timon',
    canon: 'artillero',
    destello: 'timon',
    llave: 'cartas',
  };
</script>

<img src={withBase(`arte/${name.startsWith('tema-') && topicIcons.includes(name.slice(5)) ? name : illustrations[name] ?? 'brujula'}.webp`)} width="192" height="192" alt="" />

<style>
  img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 0.35rem; }
</style>
