import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Density } from './appearance';

const read = (): Density =>
  typeof document !== 'undefined' && document.documentElement.dataset.density === 'comfortable' ? 'comfortable' : 'compact';

/** The density set by data-density on <html>, updated when it changes. */
export function useDensity(): Density {
  const [density, setDensity] = useState<Density>(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setDensity(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-density'] });
    return () => observer.disconnect();
  }, []);
  return density;
}

/** Token values in pixels, for code that needs numbers. */
export interface Metrics { rowHeight: number; controlHeight: number; checkColumn: number }

const TOKENS: Record<keyof Metrics, string> = { rowHeight: '--row-h', controlHeight: '--control-h', checkColumn: '--check-col' };
const FALLBACK: Metrics = { rowHeight: 20, controlHeight: 22, checkColumn: 28 };

let current = FALLBACK;
let probe: HTMLElement | null = null;
const listeners = new Set<() => void>();

function measure() {
  const next = { ...current };
  for (const el of probe!.children as HTMLCollectionOf<HTMLElement>) next[el.dataset.metric as keyof Metrics] = el.offsetWidth;
  if ((Object.keys(next) as (keyof Metrics)[]).some((k) => next[k] !== current[k])) {
    current = next;
    listeners.forEach((fn) => fn());
  }
}

/** Measures the tokens in a hidden element, so changes to density or the browser's text size are picked up. */
function subscribe(fn: () => void) {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;top:0;left:0';
    const observer = new ResizeObserver(measure);
    for (const [key, token] of Object.entries(TOKENS)) {
      const el = document.createElement('div');
      el.dataset.metric = key;
      el.style.cssText = `width:var(${token});height:1px`;
      probe.append(el);
      observer.observe(el);
    }
    document.body.append(probe);
    measure();
  }
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Current pixel values of the row, control and checkbox-column tokens. */
export function useMetrics(): Metrics {
  return useSyncExternalStore(subscribe, () => current, () => FALLBACK);
}
