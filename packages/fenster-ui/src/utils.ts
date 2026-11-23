import { composeRenderProps } from 'react-aria-components';

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Merge a base class into a React Aria className prop, which may be a string or a function of render props. */
export function withClass<T>(
  base: string,
  className: string | ((values: T & { defaultClassName: string | undefined }) => string) | undefined
) {
  return composeRenderProps(className, (cls) => cx(base, cls));
}
