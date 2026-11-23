import { useLayoutEffect, useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import {
  Button as RACButton,
  Dialog as RACDialog,
  Heading,
  Modal,
  Popover as RACPopover,
  ModalOverlay,
  type DialogProps as RACDialogProps,
  type ModalOverlayProps,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components';
import { cx } from './utils';

export { DialogTrigger } from 'react-aria-components';

/** Keeps a centred element on whole pixels, so its 1px borders stay sharp. */
function useSnapToPixel(ref: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const snap = () => {
      el.style.translate = '';
      const r = el.getBoundingClientRect();
      el.style.translate = `${Math.round(r.left) - r.left}px ${Math.round(r.top) - r.top}px`;
    };
    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(el);
    window.addEventListener('resize', snap);
    return () => { observer.disconnect(); window.removeEventListener('resize', snap); };
  }, [ref, active]);
}

/** Places a floating dialog inside `over`, or inside the window, on whole pixels. */
function useFloatingPlacement(ref: RefObject<HTMLElement | null>, active: boolean, placement: 'top end' | 'center', over: RefObject<HTMLElement | null> | undefined) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const edge = 8;
    const place = () => {
      const anchor = over?.current;
      const a = anchor ? anchor.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      const { width, height } = el.getBoundingClientRect();
      let left = a.left + (a.width - width) / 2;
      let top = a.top + (a.height - height) / 2;
      if (placement === 'top end') {
        top = a.top + edge;
        left = getComputedStyle(el).direction === 'rtl' ? a.left + edge : a.left + a.width - width - edge;
      }
      // Stays inside the window when the anchor is smaller than the dialog or partly out of view.
      left = Math.max(edge, Math.min(left, window.innerWidth - width - edge));
      top = Math.max(edge, Math.min(top, window.innerHeight - height - edge));
      el.style.inset = `${Math.round(top)}px auto auto ${Math.round(left)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    if (over?.current) observer.observe(over.current);
    window.addEventListener('resize', place);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); el.style.inset = ''; };
  }, [ref, active, placement, over]);
}

export interface DialogProps extends Omit<RACDialogProps, 'children'> {
  /** Heading in the `title` type style. */
  title: ReactNode;
  children: RACDialogProps['children'];
  role?: 'dialog' | 'alertdialog';
  /** Shows a close button in the title row. */
  closeIcon?: ReactNode;
  /** Accessible name of the close button. */
  closeLabel?: string;
  /** Non-modal dialogs float without blocking the app; Escape closes them. @default true */
  isModal?: boolean;
  /** Non-modal only: where it floats. @default 'top end' */
  placement?: 'top end' | 'center';
  /** Non-modal only: the element to place it in, such as a Pane; otherwise the window. */
  over?: RefObject<HTMLElement | null>;
  /** Modal only: whether clicking outside closes it. @default false */
  isDismissable?: ModalOverlayProps['isDismissable'];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

/** A dialog. Use inside a DialogTrigger, or control `isOpen`. */
export function Dialog({ title, children, closeIcon, closeLabel, isModal = true, placement = 'top end', over, isDismissable, isOpen, onOpenChange, className, ...props }: DialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  useSnapToPixel(modalRef, isModal && isOpen !== false);
  const floatingRef = useRef<HTMLDivElement>(null);
  useFloatingPlacement(floatingRef, !isModal && !!isOpen && (placement === 'center' || over != null), placement, over);
  const body = (
    <RACDialog {...props} className={cx('fui-dialog', className as string)}>
      {(state) => (
        <>
          <div className="fui-dialog-head">
            <Heading slot="title" className="fui-title">{title}</Heading>
            {closeIcon && (
              <RACButton slot="close" className="fui-icon-btn" aria-label={closeLabel}>
                <span className="fui-icon-slot" aria-hidden="true">{closeIcon}</span>
              </RACButton>
            )}
          </div>
          {typeof children === 'function' ? children(state) : children}
        </>
      )}
    </RACDialog>
  );
  if (!isModal) {
    if (!isOpen) return null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onOpenChange?.(false); }
    };
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- catches keys bubbling from the dialog content
    return <div ref={floatingRef} className="fui-floating fui-modal" onKeyDown={onKeyDown}>{body}</div>;
  }
  return (
    <ModalOverlay className="fui-modal-overlay" isDismissable={isDismissable} isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal ref={modalRef} className="fui-modal">{body}</Modal>
    </ModalOverlay>
  );
}

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

/** The dialog's button row. */
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div {...props} className={cx('fui-dialog-footer', className)} />;
}

export interface PopoverProps extends Omit<RACDialogProps, 'children'> {
  /** Optional heading; without one, give the popover an aria-label. */
  title?: ReactNode;
  children: RACDialogProps['children'];
  /** @default 'bottom start' */
  placement?: RACPopoverProps['placement'];
}

/** A small dialog attached to the control that opens it. Use inside a DialogTrigger; Escape or a click outside closes it. */
export function Popover({ title, children, placement = 'bottom start', className, ...props }: PopoverProps) {
  return (
    <RACPopover className="fui-popover" placement={placement} offset={2}>
      <RACDialog {...props} className={cx('fui-popover-dialog', className as string)}>
        {(state) => (
          <>
            {title && <Heading slot="title" className="fui-strong">{title}</Heading>}
            {typeof children === 'function' ? children(state) : children}
          </>
        )}
      </RACDialog>
    </RACPopover>
  );
}
