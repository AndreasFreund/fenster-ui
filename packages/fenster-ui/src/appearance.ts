import { useEffect, useState } from 'react';

/**
 * Theme, accent colour and density. Applied as data-theme, data-density and the --fui-accent-* variables
 * that tokens.css reads; saved in localStorage.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type AccentChoice = { kind: 'preset'; id: string } | { kind: 'custom'; color: string };
export type Density = 'compact' | 'comfortable';
export interface Appearance { theme: ThemeChoice; accent: AccentChoice; density: Density }

/** A preset accent, by id. The app provides display names. */
export interface AccentPreset { id: string; light: string; dark: string }

/** Each colour has at least 4.5:1 contrast against `bg` in its theme. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'teal', light: '#006e78', dark: '#35c9bd' },
  { id: 'blue', light: '#1f5fbf', dark: '#6aa8ff' },
  { id: 'indigo', light: '#4f46b8', dark: '#a59dff' },
  { id: 'plum', light: '#85307f', dark: '#e08ad6' },
  { id: 'slate', light: '#43586e', dark: '#9fb4c9' },
];

export const DEFAULT_APPEARANCE: Appearance = { theme: 'system', accent: { kind: 'preset', id: 'teal' }, density: 'compact' };
const STORAGE_KEY = 'fenster-ui:appearance';
/** What applies while nothing is saved: DEFAULT_APPEARANCE, with the app's own defaults from `initAppearance`. */
let defaults = DEFAULT_APPEARANCE;

/** `bg` of each theme, as in tokens.css. */
const LIGHT_BG = '#ffffff';
const DARK_BG = '#141414';

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** Mix `a` toward `b` by t (0..1). */
const mix = (a: string, b: string, t: number) => {
  const x = toRgb(a), y = toRgb(b);
  return toHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
};
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const isHex = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

/** Moves a colour toward `toward` until it has 4.5:1 contrast with `against`. */
function ensureContrast(color: string, against: string, toward: string): string {
  let c = color;
  for (let t = 0.04; contrast(c, against) < 4.5 && t <= 1; t += 0.04) c = mix(color, toward, t);
  return c;
}

export interface ResolvedAccent {
  light: string; lightBg: string; dark: string; darkBg: string;
  /** Whether the custom colour was changed to reach the contrast minimum. */
  adjustedLight: boolean; adjustedDark: boolean;
}

export function resolveAccent(choice: AccentChoice): ResolvedAccent {
  const preset = choice.kind === 'preset' ? ACCENT_PRESETS.find((p) => p.id === choice.id) ?? ACCENT_PRESETS[0] : undefined;
  const base = choice.kind === 'custom' ? choice.color.toLowerCase() : undefined;
  const light = preset ? preset.light : ensureContrast(base!, LIGHT_BG, '#000000');
  const dark = preset ? preset.dark : ensureContrast(base!, DARK_BG, '#ffffff');
  return {
    light,
    dark,
    lightBg: mix(LIGHT_BG, light, 0.15),
    darkBg: mix(DARK_BG, dark, 0.3),
    adjustedLight: !!base && light !== base,
    adjustedDark: !!base && dark !== base,
  };
}

export function loadAppearance(): Appearance {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    const theme: ThemeChoice = ['system', 'light', 'dark'].includes(raw?.theme) ? raw.theme : defaults.theme;
    const a = raw?.accent;
    const accent: AccentChoice =
      a?.kind === 'custom' && isHex(a.color) ? { kind: 'custom', color: a.color }
      : a?.kind === 'preset' && ACCENT_PRESETS.some((p) => p.id === a.id) ? { kind: 'preset', id: a.id }
      : defaults.accent;
    const density: Density = ['compact', 'comfortable'].includes(raw?.density) ? raw.density : defaults.density;
    return { theme, accent, density };
  } catch {
    return defaults; // Storage can be missing or blocked; fall back quietly.
  }
}

export function saveAppearance(a: Appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* Storage unavailable: the choice applies for this page only. */
  }
}

export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement) {
  if (a.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = a.theme;
  if (a.density === 'comfortable') root.dataset.density = 'comfortable';
  else delete root.dataset.density;
  const isDefault = a.accent.kind === 'preset' && a.accent.id === 'teal';
  const r = resolveAccent(a.accent);
  const vars: Record<string, string> = {
    '--fui-accent-light': r.light, '--fui-accent-bg-light': r.lightBg,
    '--fui-accent-dark': r.dark, '--fui-accent-bg-dark': r.darkBg,
  };
  for (const [k, v] of Object.entries(vars)) {
    if (isDefault) root.style.removeProperty(k);
    else root.style.setProperty(k, v);
  }
}

/**
 * Apply the saved appearance. Call once before the first render to avoid a flash of the default theme.
 * `appDefaults` replace parts of DEFAULT_APPEARANCE for users who have saved nothing, here and in `loadAppearance`.
 */
export function initAppearance(appDefaults: Partial<Appearance> = {}) {
  defaults = { ...DEFAULT_APPEARANCE, ...appDefaults };
  if (typeof document !== 'undefined') applyAppearance(loadAppearance());
}

const darkQuery = () => (typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : undefined);

/** Whether a theme choice resolves to dark, following the OS for "system". */
export function useEffectiveDark(theme: ThemeChoice): boolean {
  const [systemDark, setSystemDark] = useState(() => !!darkQuery()?.matches);
  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener('change', on);
    return () => query.removeEventListener('change', on);
  }, []);
  return theme === 'dark' || (theme === 'system' && systemDark);
}
