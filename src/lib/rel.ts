// Relative links, so the site works at any host or folder (preview and live).
export function makeRel(url: URL) {
  const depth = Math.max(0, url.pathname.split('/').filter(Boolean).length - 1);
  const prefix = '../'.repeat(depth);
  return (p: string) => (p.startsWith('http') || p.startsWith('#') || p.startsWith('mailto:') ? p : prefix + p);
}
