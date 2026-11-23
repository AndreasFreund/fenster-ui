import { type ReactNode } from 'react';
import {
  Label,
  Slider as RACSlider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  type SliderProps as RACSliderProps,
} from 'react-aria-components';
import { useIsDisabled } from './disabled';
import { withClass } from './utils';

export interface SliderProps extends Omit<RACSliderProps<number>, 'children'> {
  label: ReactNode;
  /** Hide the value next to the track. */
  hideValue?: boolean;
}

/** A labelled slider. */
export function Slider({ label, hideValue, className, isDisabled, ...props }: SliderProps) {
  return (
    <RACSlider {...props} isDisabled={useIsDisabled(isDisabled)} className={withClass('fui-field fui-slider', className)}>
      <Label className="fui-label">{label}</Label>
      <div className="fui-slider-row">
        <SliderTrack className="fui-slider-track">
          {({ state }) => (
            <>
              <div className="fui-slider-fill" style={{ width: `${state.getThumbPercent(0) * 100}%` }} />
              <SliderThumb className="fui-slider-thumb" />
            </>
          )}
        </SliderTrack>
        {!hideValue && <SliderOutput className="fui-slider-output fui-mono" />}
      </div>
    </RACSlider>
  );
}
