import { type ReactNode } from 'react';
import {
  Meter as RACMeter,
  ProgressBar as RACProgressBar,
  type MeterProps as RACMeterProps,
  type ProgressBarProps as RACProgressBarProps,
} from 'react-aria-components';
import { cx, withClass } from './utils';

export interface ProgressBarProps extends Omit<RACProgressBarProps, 'children'> {
  label?: ReactNode;
  /** Show the percentage after the bar. @default true */
  showValue?: boolean;
}

/** A progress bar. Needs a label or an aria-label. */
export function ProgressBar({ label, showValue = true, className, ...props }: ProgressBarProps) {
  return (
    <RACProgressBar {...props} className={withClass('fui-progress', className)}>
      {({ percentage, valueText, isIndeterminate }) => (
        <>
          {label && <span className="fui-label">{label}</span>}
          <span className={cx('fui-progress-track', isIndeterminate && 'fui-progress-track--indeterminate')}>
            {!isIndeterminate && <span className="fui-progress-fill fui-progress-fill--blocks" style={{ width: `${percentage}%` }} />}
          </span>
          {showValue && !isIndeterminate && <span className="fui-mono fui-progress-value">{valueText}</span>}
        </>
      )}
    </RACProgressBar>
  );
}

export interface MeterProps extends Omit<RACMeterProps, 'children'> {
  label?: ReactNode;
  showValue?: boolean;
}

/** A level within a range. */
export function Meter({ label, showValue = true, className, ...props }: MeterProps) {
  return (
    <RACMeter {...props} className={withClass('fui-progress', className)}>
      {({ percentage, valueText }) => (
        <>
          {label && <span className="fui-label">{label}</span>}
          <span className="fui-progress-track">
            <span className="fui-progress-fill" style={{ width: `${percentage}%` }} />
          </span>
          {showValue && <span className="fui-mono fui-progress-value">{valueText}</span>}
        </>
      )}
    </RACMeter>
  );
}
