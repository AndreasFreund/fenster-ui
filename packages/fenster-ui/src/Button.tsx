import { Button as RACButton, Link as RACLink, type ButtonProps as RACButtonProps, type LinkProps as RACLinkProps } from 'react-aria-components';
import { withClass } from './utils';
import { useIsDisabled } from './disabled';

export interface ButtonProps extends RACButtonProps {
  /** @default 'default' */
  variant?: 'default' | 'primary' | 'danger';
}

export function Button({ variant = 'default', className, isDisabled, ...props }: ButtonProps) {
  isDisabled = useIsDisabled(isDisabled);
  const base = variant === 'default' ? 'fui-btn' : `fui-btn fui-btn--${variant}`;
  return <RACButton {...props} isDisabled={isDisabled} className={withClass(base, className)} />;
}

export function Link({ className, ...props }: RACLinkProps) {
  return <RACLink {...props} className={withClass('fui-link', className)} />;
}
