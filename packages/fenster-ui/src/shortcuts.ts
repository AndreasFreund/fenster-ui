import { useEffect, useRef } from 'react';

/**
 * Shortcut notation: modifiers then a key, joined by "+": "Mod+S", "Alt+N", "Mod+Shift+Z", "Delete".
 * "Mod" is Ctrl, or Command on macOS.
 */
export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test((navigator as any).userAgentData?.platform ?? navigator.platform ?? navigator.userAgent);

interface Parsed { mod: boolean; ctrl: boolean; alt: boolean; shift: boolean; key: string }

function parse(shortcut: string): Parsed {
  const parts = shortcut.split('+');
  const key = parts.pop()!;
  const has = (m: string) => parts.includes(m);
  return { mod: has('Mod'), ctrl: has('Ctrl'), alt: has('Alt'), shift: has('Shift'), key };
}

const MAC_KEYS: Record<string, string> = { Delete: '⌦', Backspace: '⌫', Enter: '↩', Escape: 'Esc', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
const PC_KEYS: Record<string, string> = { Delete: 'Del', Escape: 'Esc', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' };

/** Formats a shortcut for the platform ("Ctrl+S", "⌘S"). `keyNames` replaces key legends, e.g. { Ctrl: 'Strg' }. */
export function formatShortcut(shortcut: string, keyNames: Partial<Record<string, string>> = {}): string {
  const p = parse(shortcut);
  if (isMac) {
    return (p.ctrl ? '⌃' : '') + (p.alt ? '⌥' : '') + (p.shift ? '⇧' : '') + (p.mod ? '⌘' : '') + (MAC_KEYS[p.key] ?? p.key.toUpperCase());
  }
  const n = (k: string, legend: string) => keyNames[k] ?? legend;
  return [p.mod || p.ctrl ? n('Ctrl', 'Ctrl') : '', p.alt ? n('Alt', 'Alt') : '', p.shift ? n('Shift', 'Shift') : '', keyNames[p.key] ?? PC_KEYS[p.key] ?? (p.key.length === 1 ? p.key.toUpperCase() : p.key)]
    .filter(Boolean)
    .join('+');
}

/** The value for an aria-keyshortcuts attribute. */
export function ariaShortcut(shortcut: string): string {
  const p = parse(shortcut);
  return [p.mod ? (isMac ? 'Meta' : 'Control') : '', p.ctrl ? 'Control' : '', p.alt ? 'Alt' : '', p.shift ? 'Shift' : '', p.key.length === 1 ? p.key.toUpperCase() : p.key]
    .filter(Boolean)
    .join('+');
}

export function matchShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const p = parse(shortcut);
  const wantCtrl = p.ctrl || (p.mod && !isMac);
  const wantMeta = p.mod && isMac;
  if (e.ctrlKey !== wantCtrl || e.metaKey !== wantMeta || e.altKey !== p.alt || e.shiftKey !== p.shift) return false;
  // Match letters and digits by physical key: Alt/Option changes e.key.
  if (/^[A-Za-z]$/.test(p.key)) return e.code === `Key${p.key.toUpperCase()}`;
  if (/^[0-9]$/.test(p.key)) return e.code === `Digit${p.key}`;
  return e.key === p.key;
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return !el.readOnly;
  if (el instanceof HTMLInputElement) return !el.readOnly && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(el.type);
  return false;
}

/** Keys left to a focused text field. */
const TEXT_EDITING_KEYS = new Set(['Z', 'Y', 'A', 'C', 'V', 'X', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

export type ShortcutMap = Record<string, ((e: KeyboardEvent) => void) | false | null | undefined>;

/**
 * Binds shortcuts on the window. A falsy handler disables a shortcut. While a text field has focus,
 * unmodified keys and text-editing combinations are left to the field.
 */
export function useShortcuts(map: ShortcutMap, { enabled = true }: { enabled?: boolean } = {}) {
  const ref = useRef(map);
  ref.current = map;
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      for (const [shortcut, handler] of Object.entries(ref.current)) {
        if (!handler || !matchShortcut(e, shortcut)) continue;
        const p = parse(shortcut);
        if (isEditable(e.target) && (!(p.mod || p.ctrl || p.alt) || TEXT_EDITING_KEYS.has(p.key.length === 1 ? p.key.toUpperCase() : p.key))) return;
        e.preventDefault();
        if (!e.repeat) handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
