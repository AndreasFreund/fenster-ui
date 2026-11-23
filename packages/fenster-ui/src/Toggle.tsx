import {
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components';
import { useIsDisabled } from './disabled';
import { cx, withClass } from './utils';

export interface ToggleButtonProps extends RACToggleButtonProps {
  /** The CommandBar size. */
  bar?: boolean;
}

/** A button that stays pressed while on. */
export function ToggleButton({ bar, className, isDisabled, ...props }: ToggleButtonProps) {
  return <RACToggleButton {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass(cx(bar ? 'fui-bar-btn' : 'fui-btn', 'fui-toggle'), className)} />;
}

/** Joined toggle buttons. */
export function ToggleButtonGroup({ className, ...props }: ToggleButtonGroupProps) {
  return <RACToggleButtonGroup {...props} className={withClass('fui-toggle-group', className)} />;
}
