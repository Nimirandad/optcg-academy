import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sources from '../../data/cards-art.json';

/** Las imágenes autorizadas están disponibles en desarrollo y quedan fuera del build público. */
export const getStaticPaths: GetStaticPaths = () => import.meta.env.DEV
  ? Object.keys(sources).map((card) => ({ params: { card } }))
  : [];

export const GET: APIRoute = async ({ params }) => {
  if (!import.meta.env.DEV || !params.card || !Object.hasOwn(sources, params.card)) {
    return new Response(null, { status: 404 });
  }
  try {
    const image = await readFile(join(process.cwd(), 'references/card-art', `${params.card}.png`));
    return new Response(new Uint8Array(image), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
};
