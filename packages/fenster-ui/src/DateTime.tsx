import {
  Button as RACButton,
  Calendar as RACCalendar,
  CalendarCell,
  CalendarGrid,
  DateField as RACDateField,
  DateInput,
  DatePicker as RACDatePicker,
  DateSegment,
  Dialog as RACDialog,
  Group,
  Heading,
  Label,
  Popover,
  TimeField as RACTimeField,
  type CalendarProps,
  type DateFieldProps as RACDateFieldProps,
  type DatePickerProps as RACDatePickerProps,
  type DateValue,
  type TimeFieldProps as RACTimeFieldProps,
  type TimeValue,
} from 'react-aria-components';
import { FieldTextProps, HelpAndError } from './Field';
import { Arrow } from './Icon';
import { useIsDisabled } from './disabled';
import { withClass } from './utils';

function Segments() {
  return (
    <DateInput className="fui-input fui-dateinput">
      {(segment) => <DateSegment segment={segment} className="fui-seg" />}
    </DateInput>
  );
}

export interface DateFieldProps<T extends DateValue> extends RACDateFieldProps<T>, FieldTextProps {}

/** A date field. */
export function DateField<T extends DateValue>({ label, description, errorMessage, className, isDisabled, ...props }: DateFieldProps<T>) {
  return (
    <RACDateField {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field', className)}>
      <Label className="fui-label">{label}</Label>
      <Segments />
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACDateField>
  );
}

export interface TimeFieldProps<T extends TimeValue> extends RACTimeFieldProps<T>, FieldTextProps {}

export function TimeField<T extends TimeValue>({ label, description, errorMessage, className, isDisabled, ...props }: TimeFieldProps<T>) {
  return (
    <RACTimeField {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field', className)}>
      <Label className="fui-label">{label}</Label>
      <Segments />
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACTimeField>
  );
}

/** A month calendar. */
export function Calendar<T extends DateValue>({ className, ...props }: CalendarProps<T>) {
  return (
    <RACCalendar {...props} className={withClass('fui-calendar', className)}>
      <header className="fui-cal-head">
        <RACButton slot="previous" className="fui-cal-nav"><Arrow dir="left" /></RACButton>
        <Heading className="fui-strong" />
        <RACButton slot="next" className="fui-cal-nav"><Arrow dir="right" /></RACButton>
      </header>
      <CalendarGrid className="fui-cal-grid">{(date) => <CalendarCell date={date} className="fui-cal-cell" />}</CalendarGrid>
    </RACCalendar>
  );
}

export interface DatePickerProps<T extends DateValue> extends RACDatePickerProps<T>, FieldTextProps {}

/** A date field with a drop-down calendar. */
export function DatePicker<T extends DateValue>({ label, description, errorMessage, className, isDisabled, ...props }: DatePickerProps<T>) {
  return (
    <RACDatePicker {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field fui-select', className)}>
      <Label className="fui-label">{label}</Label>
      <Group className="fui-combo">
        <DateInput className="fui-input fui-dateinput">{(segment) => <DateSegment segment={segment} className="fui-seg" />}</DateInput>
        <RACButton className="fui-combo-btn"><Arrow dir="down" /></RACButton>
      </Group>
      <HelpAndError description={description} errorMessage={errorMessage} />
      <Popover className="fui-popover" offset={-1} placement="bottom end">
        <RACDialog className="fui-cal-dialog">
          <Calendar />
        </RACDialog>
      </Popover>
    </RACDatePicker>
  );
}
