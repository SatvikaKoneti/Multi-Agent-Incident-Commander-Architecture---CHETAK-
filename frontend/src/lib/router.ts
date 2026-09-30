import { useEffect, useState } from 'react';

export function pathSegs(hash: string): string[] {
  const clean = hash.replace(/^#/, '').split('?')[0];
  return clean.split('/').filter(Boolean).map(decodeURIComponent);
}

const stripTrailingQuery = (hash: string) => hash.split('?')[0];

export function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(stripTrailingQuery(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function navigate(path: string): void {
  const clean = '#/' + path.replace(/^\/+/, '');
  if (stripTrailingQuery(window.location.hash) !== clean) {
    window.location.hash = clean;
  }
}

export function routeOfSegs(segs: string[]): { role: string; rest: string[] } {
  if (!segs.length) return { role: 'home', rest: [] };
  const role = segs[0];
  return { role, rest: segs.slice(1) };
}