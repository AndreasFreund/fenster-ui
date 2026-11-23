import type { ReactNode } from 'react';
import {
  Button as RACButton,
  ColorArea as RACColorArea,
  ColorField as RACColorField,
  ColorPicker as RACColorPicker,
  ColorSlider as RACColorSlider,
  ColorSwatch as RACColorSwatch,
  ColorSwatchPicker as RACColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  ColorWheel as RACColorWheel,
  ColorWheelTrack,
  Dialog as RACDialog,
  DialogTrigger,
  Input,
  Label,
  Popover,
  SliderTrack,
  type Color,
  type ColorAreaProps,
  type ColorFieldProps as RACColorFieldProps,
  type ColorPickerProps as RACColorPickerProps,
  type ColorSliderProps,
  type ColorSwatchPickerProps,
  type ColorSwatchProps,
  type ColorWheelProps as RACColorWheelProps,
} from 'react-aria-components';
import { HelpAndError } from './Field';
import { useIsDisabled } from './disabled';
import { withClass } from './utils';

/** A colour sample. */
export function ColorSwatch({ className, ...props }: ColorSwatchProps) {
  return <RACColorSwatch {...props} className={withClass('fui-color-swatch', className)} />;
}

export interface ColorFieldProps extends RACColorFieldProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
}

/** A hex colour field. */
export function ColorField({ label, description, errorMessage, className, isDisabled, ...props }: ColorFieldProps) {
  return (
    <RACColorField {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field', className)}>
      <Label className="fui-label">{label}</Label>
      <Input className="fui-input fui-mono" />
      <HelpAndError description={description} errorMessage={errorMessage} />
    </RACColorField>
  );
}

/** A saturation/brightness area. */
export function ColorArea({ className, ...props }: ColorAreaProps) {
  return (
    <RACColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness" {...props} className={withClass('fui-color-area', className)}>
      <ColorThumb className="fui-color-thumb" />
    </RACColorArea>
  );
}

/** A single-channel slider (hue by default). */
export function ColorSlider({ className, channel = 'hue', colorSpace = 'hsb', ...props }: Omit<ColorSliderProps, 'channel'> & { channel?: ColorSliderProps['channel'] }) {
  return (
    <RACColorSlider {...props} channel={channel} colorSpace={colorSpace} className={withClass('fui-color-slider', className)}>
      <SliderTrack className="fui-color-track">
        <ColorThumb className="fui-color-thumb" />
      </SliderTrack>
    </RACColorSlider>
  );
}

/** A hue ring. */
export function ColorWheel({ className, outerRadius = 64, innerRadius = 48, ...props }: Partial<RACColorWheelProps>) {
  return (
    <RACColorWheel {...props} outerRadius={outerRadius} innerRadius={innerRadius} className={withClass('fui-color-wheel', className)}>
      <ColorWheelTrack className="fui-color-wheel-track" />
      <ColorThumb className="fui-color-thumb" />
    </RACColorWheel>
  );
}

/** A row of colour choices. */
export function ColorSwatchPicker({ className, colors, ...props }: Omit<ColorSwatchPickerProps, 'children'> & { colors: string[] }) {
  return (
    <RACColorSwatchPicker {...props} className={withClass('fui-swatch-picker', className)}>
      {colors.map((c) => (
        <ColorSwatchPickerItem key={c} color={c} className="fui-swatch-item">
          <ColorSwatch />
        </ColorSwatchPickerItem>
      ))}
    </RACColorSwatchPicker>
  );
}

export interface ColorPickerProps extends Omit<RACColorPickerProps, 'children'> {
  /** Accessible name of the button. */
  'aria-label': string;
  isDisabled?: boolean;
  /** Accessible name of the hue slider in the drop-down. */
  hueLabel: string;
  /** Visible label of the hex field in the drop-down. */
  hexLabel: ReactNode;
  /** Extra content in the drop-down, such as a ColorSwatchPicker of presets. */
  children?: ReactNode;
}

/** A button showing the colour; opens an area, a hue slider and a hex field. */
export function ColorPicker({ 'aria-label': ariaLabel, hueLabel, hexLabel, isDisabled, children, ...props }: ColorPickerProps) {
  const disabled = useIsDisabled(isDisabled);
  return (
    <RACColorPicker {...props}>
      {({ color }: { color: Color }) => (
        <DialogTrigger>
          <RACButton className="fui-btn fui-color-btn" aria-label={ariaLabel} isDisabled={disabled}>
            <ColorSwatch />
            <span className="fui-mono">{color.toString('hex')}</span>
          </RACButton>
          <Popover className="fui-popover" placement="bottom start" offset={2}>
            <RACDialog className="fui-color-dialog" aria-label={ariaLabel}>
              <ColorArea />
              <ColorSlider aria-label={hueLabel} />
              <ColorField label={hexLabel} />
              {children}
            </RACDialog>
          </Popover>
        </DialogTrigger>
      )}
    </RACColorPicker>
  );
}
