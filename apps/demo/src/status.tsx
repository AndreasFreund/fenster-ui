import { StatusMarker, toasts, type Tone } from '@andreasfreund/fenster-ui';

/** The demo's states: colour, word and notification behaviour in one place. */
export const kinds = {
  note: { tone: 'info', word: 'INFO', timeout: undefined },
  ok: { tone: 'positive', word: 'OK', timeout: undefined },
  warning: { tone: 'caution', word: 'WARN', timeout: undefined },
  failed: { tone: 'critical', word: 'FAIL', timeout: undefined },
  draft: { tone: 'neutral', word: 'DRAFT', timeout: undefined },
} satisfies Record<string, { tone: Tone; word: string; timeout: number | undefined }>;

export type Kind = keyof typeof kinds;

export function Status({ kind }: { kind: Kind }) {
  return <StatusMarker tone={kinds[kind].tone}>{kinds[kind].word}</StatusMarker>;
}

export function notify(kind: Kind, title: string, description?: string) {
  return toasts.add({ title, description, marker: <Status kind={kind} /> }, { timeout: kinds[kind].timeout });
}
