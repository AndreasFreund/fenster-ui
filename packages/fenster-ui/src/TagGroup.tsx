import { type KeyboardEvent, type ReactNode } from 'react';
import {
  Button as RACButton,
  Input,
  Label,
  Tag as RACTag,
  TagGroup as RACTagGroup,
  TagList,
  type TagGroupProps as RACTagGroupProps,
  type TagProps as RACTagProps,
} from 'react-aria-components';
import { cx, withClass } from './utils';

export interface TagGroupProps<T extends object> extends Omit<RACTagGroupProps, 'children'> {
  label?: ReactNode;
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactNode);
  /** Shows a field after the tags; Enter calls this with the trimmed text and clears the field. */
  onAdd?: (text: string) => void;
  /** Placeholder and accessible name of the add field. */
  addLabel?: string;
}

/** Selectable, removable tags, optionally with a field to add more. */
export function TagGroup<T extends object>({ label, items, children, onAdd, addLabel, className, ...props }: TagGroupProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const text = e.currentTarget.value.trim();
    if (e.key !== 'Enter' || !text) return;
    e.preventDefault();
    onAdd?.(text);
    e.currentTarget.value = '';
  };
  return (
    <RACTagGroup {...props} className={cx('fui-taggroup', className as string)}>
      {label && <Label className="fui-label">{label}</Label>}
      <div className="fui-tag-row">
        <TagList items={items} className="fui-taglist">{children}</TagList>
        {onAdd && <Input className="fui-input fui-tag-add" aria-label={addLabel} placeholder={addLabel} onKeyDown={onKeyDown} />}
      </div>
    </RACTagGroup>
  );
}

/** A tag in a TagGroup. */
export function Tag({ children, className, ...props }: Omit<RACTagProps, 'children'> & { children: ReactNode }) {
  const textValue = props.textValue ?? (typeof children === 'string' ? children : undefined);
  return (
    <RACTag {...props} textValue={textValue} className={withClass('fui-chip', className)}>
      {({ allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && <RACButton slot="remove" className="fui-chip-remove" />}
        </>
      )}
    </RACTag>
  );
}
