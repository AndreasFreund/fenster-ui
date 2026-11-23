import { type ReactNode } from 'react';
import {
  Checkbox as RACCheckbox,
  CheckboxGroup as RACCheckboxGroup,
  Label,
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  Switch as RACSwitch,
  type CheckboxGroupProps as RACCheckboxGroupProps,
  type CheckboxProps as RACCheckboxProps,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioProps as RACRadioProps,
  type SwitchProps as RACSwitchProps,
} from 'react-aria-components';
import { FieldTextProps, Form, HelpAndError } from './Field';
import { ListView } from './ListView';
import { useIsDisabled } from './disabled';
import { cx, withClass } from './utils';

export interface CheckboxGroupProps extends Omit<RACCheckboxGroupProps, 'children'>, FieldTextProps { children: ReactNode }

/** Checkboxes under one label. */
export function CheckboxGroup({ label, description, errorMessage, children, className, isDisabled, ...props }: CheckboxGroupProps) {
  return (
    <RACCheckboxGroup {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field fui-field--multi', className)}>
      <Label className="fui-label">{label}</Label>
      <div className="fui-radio-list">{children}</div>
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACCheckboxGroup>
  );
}

export type SwitchProps = Omit<RACSwitchProps, 'children'> & { children?: ReactNode };

/** An on/off switch. */
export function Switch({ children, className, isDisabled, ...props }: SwitchProps) {
  return (
    <RACSwitch {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-option fui-switch', className)}>
      <span className="fui-switch-track" aria-hidden="true"><span className="fui-switch-thumb" /></span>
      {children}
    </RACSwitch>
  );
}

export type CheckboxProps = Omit<RACCheckboxProps, 'children'> & { children?: ReactNode };

export function Checkbox({ children, className, isDisabled, ...props }: CheckboxProps) {
  return (
    <RACCheckbox {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-option', className)}>
      <span className="fui-check" aria-hidden="true" />
      {children}
    </RACCheckbox>
  );
}

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'>, FieldTextProps {
  children: ReactNode;
}

/** A labelled set of radio buttons. */
export function RadioGroup({ label, description, errorMessage, children, className, orientation = 'vertical', isDisabled, ...props }: RadioGroupProps) {
  return (
    <RACRadioGroup {...props} isDisabled={useIsDisabled(isDisabled)} orientation={orientation} className={withClass('fui-field fui-field--multi', className)}>
      <Label className="fui-label">{label}</Label>
      <div className={cx('fui-radio-list', orientation === 'horizontal' && 'fui-radio-list--horizontal')}>{children}</div>
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACRadioGroup>
  );
}

export type RadioProps = Omit<RACRadioProps, 'children'> & { children?: ReactNode };

export function Radio({ children, className, ...props }: RadioProps) {
  return (
    <RACRadio {...props} className={withClass('fui-option', className)}>
      <span className="fui-radio" aria-hidden="true" />
      {children}
    </RACRadio>
  );
}
