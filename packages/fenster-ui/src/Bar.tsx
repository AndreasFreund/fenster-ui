import { type HTMLAttributes, type ReactNode, type Ref } from 'react';
import {
  Button as RACButton,
  Input,
  Label,
  SearchField,
  Separator,
  TextField,
  type ButtonProps as RACButtonProps,
  type SearchFieldProps,
  type TextFieldProps,
  } from 'react-aria-components';
import { cx, withClass } from './utils';

/** A bar of controls, each its own Tab stop. Needs an aria-label. */
export function CommandBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" {...props} className={cx('fui-bar fui-toolbar', className)} />;
}

export interface BarButtonProps extends RACButtonProps {
  /** Shown before the text. Without text the button is square and needs an aria-label. */
  icon?: ReactNode;
}

/** A small button for a CommandBar. */
export function BarButton({ icon, className, children, ...props }: BarButtonProps) {
  return (
    <RACButton {...props} className={withClass(cx('fui-bar-btn', icon != null && children == null && 'fui-bar-btn--icon'), className)}>
      {(state) => (
        <>
          {icon && <span className="fui-icon-slot" aria-hidden="true">{icon}</span>}
          {typeof children === 'function' ? children(state) : children}
        </>
      )}
    </RACButton>
  );
}

export function BarSeparator() {
  return <Separator orientation="vertical" className="fui-bar-sep" />;
}

/** Pushes the following items to the end of the bar. */
export function BarSpacer() {
  return <span className="fui-bar-spacer" aria-hidden="true" />;
}

export interface BarTextFieldProps extends TextFieldProps {
  label: ReactNode;
  placeholder?: string;
  mono?: boolean;
  stretch?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

/** A labelled text field for a bar. */
export function BarTextField({ label, placeholder, mono, stretch, inputRef, className, ...props }: BarTextFieldProps) {
  return (
    <TextField {...props} className={withClass(cx('fui-bar-field', stretch && 'fui-bar-field--stretch'), className)}>
      <Label className="fui-label">{label}</Label>
      <Input ref={inputRef} className={cx('fui-input', mono && 'fui-mono')} placeholder={placeholder} />
    </TextField>
  );
}

export interface BarSearchFieldProps extends SearchFieldProps {
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/** A search field for a bar. Needs an aria-label. */
export function BarSearchField({ placeholder, inputRef, className, ...props }: BarSearchFieldProps) {
  return (
    <SearchField {...props} className={withClass('fui-bar-searchfield', className)}>
      <Input ref={inputRef} className="fui-input fui-bar-search" placeholder={placeholder} />
    </SearchField>
  );
}
