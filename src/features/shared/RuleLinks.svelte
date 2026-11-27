<script lang="ts">
  import { withBase } from '../../lib/paths';
  import { rulePath } from '../../lib/rules';

  let { base, ids }: { base: string; ids: readonly string[] } = $props();
</script>

{#if ids.length}
  <span class="rules">
    Reglas:
    {#each ids as id, i (id)}{i > 0 ? ', ' : ''}<a href={withBase(rulePath(id), base)}>{id}</a>{/each}
  </span>
{/if}
