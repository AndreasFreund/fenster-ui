import {
  Tooltip as RACTooltip,
  TooltipTrigger as RACTooltipTrigger,
  type TooltipProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import { withClass } from './utils';

/** Wraps one focusable element and a Tooltip. */
export function TooltipTrigger({ delay = 500, closeDelay = 0, ...props }: TooltipTriggerComponentProps) {
  return <RACTooltipTrigger {...props} delay={delay} closeDelay={closeDelay} />;
}

export function Tooltip({ className, offset = 6, placement = 'bottom start', ...props }: TooltipProps) {
  return <RACTooltip {...props} offset={offset} placement={placement} className={withClass('fui-tooltip', className)} />;
}
