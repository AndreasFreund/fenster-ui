import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './utils';

/**
 * A colour role. Apps can add their own: `.fui-tone--archived { --fui-tone: …; --fui-tone-bg: …; }`.
 */
export type Tone = 'neutral' | 'info' | 'positive' | 'caution' | 'critical' | (string & {});

export interface StatusMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  /** @default 'neutral' */
  tone?: Tone;
  /** The status word. */
  children: ReactNode;
}

/** A coloured square and a status word. */
export function StatusMarker({ tone = 'neutral', className, ...props }: StatusMarkerProps) {
  return <span {...props} className={cx('fui-marker', `fui-tone--${tone}`, className)} />;
}
