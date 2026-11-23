import { createContext, useContext, type ReactNode } from 'react';

/** Words that components render themselves. */
export interface FrameworkLabels {
  /** Status word shown before a field's error message. Without it, errors show text only. */
  invalid?: string;
  /** Replacements for key legends in shortcut labels, e.g. { Ctrl: 'Strg' }. */
  keyNames?: Partial<Record<'Ctrl' | 'Alt' | 'Shift' | 'Delete' | 'Escape' | 'Enter' | 'Backspace' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', string>>;
}

const LabelsContext = createContext<FrameworkLabels | null>(null);

export function LabelsProvider({ labels, children }: { labels: FrameworkLabels; children: ReactNode }) {
  return <LabelsContext.Provider value={labels}>{children}</LabelsContext.Provider>;
}

export function useLabels(): FrameworkLabels | null {
  return useContext(LabelsContext);
}
