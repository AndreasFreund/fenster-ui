import {
  useContext,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  Button as RACButton,
  ComboBox as RACComboBox,
  FieldError,
  Form as RACForm,
  Group,
  Header,
  Input,
  Label,
  ListBox,
  ListBox as RACListBox,
  ListBoxItem,
  ListBoxSection,
  NumberField as RACNumberField,
  Popover,
  Select as RACSelect,
  SelectStateContext,
  SelectValue,
  Text,
  TextArea,
  TextField as RACTextField,
  type ComboBoxProps as RACComboBoxProps,
  type FormProps as RACFormProps,
  type ListBoxItemProps,
  type NumberFieldProps as RACNumberFieldProps,
  type SelectProps as RACSelectProps,
  type TextFieldProps as RACTextFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import { Arrow } from './Icon';
import { StatusMarker } from './Tag';
import { useLabels } from './labels';
import { GroupDisabledContext, useIsDisabled } from './disabled';
import { cx, withClass } from './utils';

export interface NumberFieldProps extends RACNumberFieldProps, FieldTextProps { placeholder?: string }

/** A number field with step buttons. */
export function NumberField({ label, description, errorMessage, placeholder, className, isDisabled, ...props }: NumberFieldProps) {
  return (
    <RACNumberField {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field', className)}>
      <Label className="fui-label">{label}</Label>
      <Group className="fui-spin">
        <Input className="fui-input fui-mono" placeholder={placeholder} />
        <span className="fui-spin-btns">
          <RACButton slot="increment" className="fui-spin-btn" ><Arrow dir="up" /></RACButton>
          <RACButton slot="decrement" className="fui-spin-btn" ><Arrow dir="down" /></RACButton>
        </span>
      </Group>
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACNumberField>
  );
}

export interface ComboBoxProps<T extends object> extends Omit<RACComboBoxProps<T>, 'children'>, FieldTextProps {
  placeholder?: string;
  children: ReactNode | ((item: T) => ReactNode);
}

/** An editable drop-down. Options are SelectItems. */
export function ComboBox<T extends object>({ label, description, errorMessage, placeholder, children, items, className, isDisabled, ...props }: ComboBoxProps<T>) {
  return (
    <RACComboBox {...props} items={items} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field fui-select', className)}>
      <Label className="fui-label">{label}</Label>
      <div className="fui-combo">
        <Input className="fui-input" placeholder={placeholder} />
        <RACButton className="fui-combo-btn"><Arrow dir="down" /></RACButton>
      </div>
      <HelpAndError description={description} errorMessage={errorMessage} />
      <Popover className="fui-popover" offset={-1} placement="bottom start">
        <RACListBox className="fui-menu">{children}</RACListBox>
      </Popover>
    </RACComboBox>
  );
}

/** A form laid out as label and control columns. */
export function Form({ className, ...props }: RACFormProps & FormHTMLAttributes<HTMLFormElement>) {
  return <RACForm {...props} className={cx('fui-form', className)} />;
}

export interface FieldTextProps {
  label: ReactNode;
  /** Helper text under the control. */
  description?: ReactNode;
  /** Shown when the value is invalid. */
  errorMessage?: ReactNode | ((v: ValidationResult) => ReactNode);
}

export function HelpAndError({ description, errorMessage }: Omit<FieldTextProps, 'label'>) {
  const invalid = useLabels()?.invalid;
  return (
    <>
      {description && <Text slot="description" className="fui-help fui-muted">{description}</Text>}
      <FieldError className="fui-help">
        {(v) => (
          <>
            {invalid && <StatusMarker tone="critical">{invalid}</StatusMarker>}
            {typeof errorMessage === 'function' ? errorMessage(v) : errorMessage ?? v.validationErrors.join(' ')}
          </>
        )}
      </FieldError>
    </>
  );
}

export interface TextFieldProps extends RACTextFieldProps, FieldTextProps {
  mono?: boolean;
  placeholder?: string;

  multiline?: boolean;
  /** Visible lines when multiline. @default 4 */
  rows?: number;
}

/** A labelled text field. */
export function TextField({ label, description, errorMessage, mono, placeholder, multiline, rows = 4, className, isDisabled, ...props }: TextFieldProps) {
  return (
    <RACTextField {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass(cx('fui-field', multiline && 'fui-field--multi'), className)}>
      <Label className="fui-label">{label}</Label>
      {multiline ? (
        <TextArea rows={rows} className={cx('fui-input fui-textarea', mono && 'fui-mono')} placeholder={placeholder} />
      ) : (
        <Input className={cx('fui-input', mono && 'fui-mono')} placeholder={placeholder} />
      )}
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACTextField>
  );
}

export interface SelectProps<T extends object> extends Omit<RACSelectProps<T>, 'children'>, FieldTextProps {
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactNode);
}

/** A labelled drop-down list. */
export function Select<T extends object>({ label, description, errorMessage, items, children, className, isDisabled, ...props }: SelectProps<T>) {
  return (
    <RACSelect {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field fui-select', className)}>
      <Label className="fui-label">{label}</Label>
      <SelectKeys>
        <RACButton className="fui-select-btn">
          <SelectValue className="fui-select-value" />
        </RACButton>
      </SelectKeys>
      <HelpAndError description={description} errorMessage={errorMessage} />
      <Popover className="fui-popover" offset={-1} placement="bottom start">
        <ListBox items={items} className="fui-menu">
          {children}
        </ListBox>
      </Popover>
    </RACSelect>
  );
}

/** On the closed trigger, Up/Down/Home/End change the value and Alt+Down or F4 opens the list. */
function SelectKeys({ children }: { children: ReactNode }) {
  const state = useContext(SelectStateContext);
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (!state || state.isOpen) return;
    const c = state.collection;
    const keys = [...c.getKeys()].filter((k) => c.getItem(k)?.type === 'item' && !state.disabledKeys.has(k));
    if (!keys.length) return;
    const i = state.selectedKey != null ? keys.indexOf(state.selectedKey) : -1;
    let next: (typeof keys)[number] | undefined;
    if ((e.key === 'ArrowDown' && e.altKey) || e.key === 'F4') { e.preventDefault(); e.stopPropagation(); state.open('first'); return; }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowDown') next = keys[Math.min(keys.length - 1, i + 1)];
    else if (e.key === 'ArrowUp') next = keys[Math.max(0, i - 1)];
    else if (e.key === 'Home') next = keys[0];
    else if (e.key === 'End') next = keys[keys.length - 1];
    else return;
    e.preventDefault();
    e.stopPropagation();
    if (next != null) state.setSelectedKey(next);
  };
  return <div className="fui-select-keys" onKeyDownCapture={onKeyDownCapture}>{children}</div>;
}

export function SelectSection<T extends object>({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <ListBoxSection<T>>
      {title && <Header className="fui-menu-section-header">{title}</Header>}
      {children}
    </ListBoxSection>
  );
}

export function SelectItem({ className, ...props }: ListBoxItemProps) {
  const textValue = props.textValue ?? (typeof props.children === 'string' ? props.children : undefined);
  const { children } = props;
  return (
    <ListBoxItem {...props} textValue={textValue} className={withClass('fui-menu-item', className)}>
      {typeof children === 'function' ? children : (
        <>
          <span className="fui-menu-gutter" aria-hidden="true" />
          <span className="fui-menu-item-label">{children}</span>
        </>
      )}
    </ListBoxItem>
  );
}

export interface GroupBoxProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'disabled'> {
  legend: ReactNode;
  /** Disables every control inside. */
  isDisabled?: boolean;
}

/** A framed group of controls with a legend. */
export function GroupBox({ legend, children, className, isDisabled, ...props }: GroupBoxProps) {
  const disabled = useIsDisabled(isDisabled);
  return (
    <fieldset {...props} disabled={disabled} className={cx('fui-group', className)}>
      <legend>{legend}</legend>
      <GroupDisabledContext.Provider value={disabled}>
        <div className="fui-group-body">{children}</div>
      </GroupDisabledContext.Provider>
    </fieldset>
  );
}
