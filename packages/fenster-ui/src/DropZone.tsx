import { DropZone as RACDropZone, type DropZoneProps } from 'react-aria-components';
import { withClass } from './utils';

export { FileTrigger } from 'react-aria-components';

/** An area that accepts dropped files or items. */
export function DropZone({ className, ...props }: DropZoneProps) {
  return <RACDropZone {...props} className={withClass('fui-dropzone', className)} />;
}
