import type { HTMLAttributes, ReactNode } from 'react';
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
}

/** A framed message tinted by its tone. */
export function Callout({ tone = 'neutral', marker, title, children, className, ...props }: CalloutProps) {
  return (
    <div {...props} className={cx('fui-callout', `fui-tone--${tone}`, marker == null && 'fui-callout--plain', className)}>
      {marker}
      <div className="fui-callout-body">
        {title != null && <strong className="fui-callout-title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}
