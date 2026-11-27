/** Une una ruta interna con la base del sitio (`BASE_URL`). */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const root = `/${base.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
  return root + path.replace(/^\/+/, '');
}
