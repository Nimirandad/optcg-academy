// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

// Valores por defecto para GitHub Pages del repositorio; se pueden sobrescribir por entorno.
const site = process.env.SITE_URL || 'https://nimirandad.github.io';
const base = process.env.BASE_PATH || '/optcg-academy';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [svelte(), sitemap()],
});
