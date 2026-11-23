import { createContext, useContext } from 'react';

/** True inside a disabled GroupBox. */
export const GroupDisabledContext = createContext(false);

export function useIsDisabled(isDisabled: boolean | undefined): boolean {
  return useContext(GroupDisabledContext) || !!isDisabled;
}
