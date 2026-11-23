import { type ReactNode } from 'react';
import { cx } from './utils';

/** An icon followed by text. The icon is hidden from assistive technology. */
export function IconLabel({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cx('fui-icon-label', className)}>
      <span className="fui-icon-slot" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

/** A small triangle pointing in a direction. Left and right mirror in right-to-left text. */
export function Arrow({ dir }: { dir: 'up' | 'down' | 'left' | 'right' }) {
  return <span className={`fui-arrow fui-arrow--${dir}`} aria-hidden="true" />;
}
