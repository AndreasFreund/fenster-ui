import {
  ListBox as RACListBox,
  ListBoxItem,
  type ListBoxItemProps,
  type ListBoxProps,
} from 'react-aria-components';
import { withClass } from './utils';

/** An always-open, framed list. Selection works like ListView. Needs an aria-label or aria-labelledby. */
export function ListBox<T extends object>({ className, selectionMode = 'single', selectionBehavior = 'replace', disallowEmptySelection, ...props }: ListBoxProps<T>) {
  return (
    <RACListBox
      {...props}
      selectionMode={selectionMode}
      selectionBehavior={selectionBehavior}
      disallowEmptySelection={disallowEmptySelection ?? selectionMode === 'single'}
      className={withClass('fui-listbox', className)}
    />
  );
}

export function ListBoxOption({ className, ...props }: ListBoxItemProps) {
  const textValue = props.textValue ?? (typeof props.children === 'string' ? props.children : undefined);
  return <ListBoxItem {...props} textValue={textValue} className={withClass('fui-listbox-item', className)} />;
}
