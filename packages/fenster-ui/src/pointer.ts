import { useState, type PointerEvent } from 'react';
import { flushSync } from 'react-dom';

/**
 * Whether the last press inside the element came from touch or a pen. React Aria runs a row's action on tap instead
 * of selecting it; rows drop their action while this is true, so a tap selects as a click does.
 */
export function useTouchPresses() {
  const [touch, setTouch] = useState(false);
  const onPointerDownCapture = (e: PointerEvent) => {
    const next = e.pointerType === 'touch' || e.pointerType === 'pen';
    // Applied before the row handles the same press.
    if (next !== touch) flushSync(() => setTouch(next));
  };
  return { touch, onPointerDownCapture };
}
