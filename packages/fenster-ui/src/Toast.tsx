import {
  Button as RACButton,
  Text,
  UNSTABLE_Toast as RACToast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as RACToastQueue,
  UNSTABLE_ToastRegion as RACToastRegion,
} from 'react-aria-components';
import { useSyncExternalStore, type ReactNode } from 'react';
import { cx } from './utils';

export interface ToastMessage {
  title: string;
  description?: string;
  /** Shown before the title, usually a StatusMarker. */
  marker?: ReactNode;
}

type AddOptions = Parameters<RACToastQueue<ToastMessage>['add']>[1];

/** Keeps the newest toasts visible and counts the ones waiting behind them. */
class ToastQueue extends RACToastQueue<ToastMessage> {
  private keys = new Set<string>();
  /** The most recently added toast. */
  latest?: string;
  /** Milliseconds before toasts close on their own, unless a toast has its own `timeout`. @default undefined (stay open) */
  timeout?: number;

  add(content: ToastMessage, options: AddOptions = {}) {
    const timeout = 'timeout' in options ? options.timeout : this.timeout;
    const key = super.add(content, { ...options, timeout });
    this.keys.add(key);
    this.latest = key;
    return key;
  }

  close(key: string) {
    this.keys.delete(key);
    super.close(key);
  }

  /** Toasts not shown because the visible slots are full. */
  get waiting() {
    return this.keys.size - this.visibleToasts.length;
  }
}

/**
 * The notification queue: `toasts.add({ title, description, marker }, { timeout })`. Toasts stay until closed unless
 * given a `timeout` or `toasts.timeout` is set. The newest three show; older ones wait.
 */
export const toasts = new ToastQueue({ maxVisibleToasts: 3 });

const subscribe = (fn: () => void) => toasts.subscribe(fn);
const getWaiting = () => toasts.waiting;

export interface ToastRegionProps {
  closeLabel: string;
  closeIcon?: ReactNode;
  /** Text for the count of waiting toasts, e.g. `(n) => `${n} more``. */
  waitingLabel: (count: number) => string;
}

/** Renders the notification queue. Render once. With `closeIcon`, `closeLabel` becomes the button's accessible name. */
export function ToastRegion({ closeLabel, closeIcon, waitingLabel }: ToastRegionProps) {
  const waiting = useSyncExternalStore(subscribe, getWaiting, getWaiting);
  return (
    <RACToastRegion queue={toasts} className="fui-toast-region" data-waiting={waiting > 0 ? waitingLabel(waiting) : undefined}>
      {({ toast }) => (
        <RACToast toast={toast} className={cx('fui-toast fui-root', toast.key === toasts.latest && 'fui-toast--new')}>
          {toast.content.marker}
          <ToastContent className="fui-toast-content">
            <Text slot="title" className="fui-strong">{toast.content.title}</Text>
            {toast.content.description && <Text slot="description">{toast.content.description}</Text>}
          </ToastContent>
          {closeIcon ? (
            <RACButton slot="close" className="fui-icon-btn" aria-label={closeLabel}>
              <span className="fui-icon-slot" aria-hidden="true">{closeIcon}</span>
            </RACButton>
          ) : (
            <RACButton slot="close" className="fui-bar-btn">{closeLabel}</RACButton>
          )}
        </RACToast>
      )}
    </RACToastRegion>
  );
}
