import type { HTMLAttributes, ReactNode } from 'react';
import { Button as RACButton } from 'react-aria-components';
import type { Tone } from './Tag';
import { cx } from './utils';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Background tint. @default 'neutral' */
  tone?: Tone;
  /** Usually a StatusMarker. */
  marker?: ReactNode;
  /** Optional bold lead, such as what happened. */
  title?: ReactNode;
  children?: ReactNode;
  /** Shows a close button; the parent removes the callout. Needs `closeIcon`. */
  onDismiss?: () => void;
  closeIcon?: ReactNode;
  /** Accessible name of the close button. */
  closeLabel?: string;
}

/** A framed message tinted by its tone. */
export function Callout({ tone = 'neutral', marker, title, children, onDismiss, closeIcon, closeLabel, className, ...props }: CalloutProps) {
  const closable = onDismiss != null && closeIcon != null;
  return (
    <div {...props} className={cx('fui-callout', `fui-tone--${tone}`, marker == null && 'fui-callout--plain', closable && 'fui-callout--closable', className)}>
      {marker}
      <div className="fui-callout-body">
        {title != null && <strong className="fui-callout-title">{title}</strong>}
        {children}
      </div>
      {closable && (
        <RACButton className="fui-icon-btn fui-callout-close" aria-label={closeLabel} onPress={onDismiss}>
          <span className="fui-icon-slot" aria-hidden="true">{closeIcon}</span>
        </RACButton>
      )}
    </div>
  );
}
