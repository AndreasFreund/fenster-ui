import {
  Children,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { flushSync } from 'react-dom';
import { UNSAFE_PortalProvider } from 'react-aria';
import { Button as RACButton } from 'react-aria-components';
import { Arrow } from './Icon';
import { useLocale } from 'react-aria-components';
import { cx } from './utils';

/**
 * Applies the base type and colours. Overlays opened inside render inside it, so data-theme and data-density
 * set on this element apply to them.
 */
export function Root({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const portal = useRef<HTMLDivElement>(null);
  return (
    <div {...props} className={cx('fui-root', className)}>
      <UNSAFE_PortalProvider getContainer={() => portal.current}>{children}</UNSAFE_PortalProvider>
      <div ref={portal} className="fui-portal" />
    </div>
  );
}

/** A full-height Root laid out as a column: bars, panes, status bar. */
export function AppFrame({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Root {...props} className={cx('fui-app', className)} />;
}

export interface SplitViewProps extends HTMLAttributes<HTMLDivElement> {
  /** `vertical` stacks the panes; the size props then set the first pane's height. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Adds a window splitter between the two panes: drag it, or focus it and use the arrow keys. */
  resizable?: boolean;
  /** Starting width of the navigation pane. Defaults to --nav-w. */
  defaultNavWidth?: number;
  /** @default 120 */
  minNavWidth?: number;
  /** @default 480 */
  maxNavWidth?: number;
  /** Accessible name of the splitter. Required when `resizable`. */
  splitterLabel?: string;
  /**
   * Dragging the splitter well below the minimum hides the navigation pane, leaving a narrow rail with a
   * button to show it again. Enter on the splitter toggles it. Needs `expandLabel`.
   */
  collapsible?: boolean;
  /** Accessible name of the rail's button. */
  expandLabel?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/** A navigation pane and a content pane divided by a line. */
export function SplitView({
  orientation = 'horizontal', resizable, defaultNavWidth, minNavWidth = 120, maxNavWidth = 480, splitterLabel,
  collapsible, expandLabel, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange,
  className, style, children, ...props
}: SplitViewProps) {
  const { direction } = useLocale();
  const vertical = orientation === 'vertical';
  const sign = !vertical && direction === 'rtl' ? -1 : 1;
  const pos = (e: PointerEvent) => (vertical ? e.clientY : e.clientX);
  // Undefined until the user resizes, so the width comes from --nav-w.
  const [width, setWidth] = useState<number | undefined>(defaultNavWidth);
  const [collapsedState, setCollapsedState] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? collapsedState;
  const setCollapsed = (c: boolean) => {
    if (c === collapsed) return;
    setCollapsedState(c);
    onCollapsedChange?.(c);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const [sized, setSized] = useState(false);
  // The rendered size: on a narrow window the default width is capped, so the stored width may be larger.
  const navWidth = () => rootRef.current?.querySelector(':scope > :first-child')?.getBoundingClientRect()[vertical ? 'height' : 'width'] ?? width ?? 200;
  const resize = (w: number) => {
    setSized(true);
    setWidth(clamp(w));
  };
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, w: 0 });
  const clamp = (w: number) => Math.min(maxNavWidth, Math.max(minNavWidth, Math.round(w)));
  const [nav, ...rest] = Children.toArray(children);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone; the drag still follows moves over the splitter.
    }
    start.current = { x: pos(e), w: collapsed ? 0 : navWidth() };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const w = start.current.w + (pos(e) - start.current.x) * sign;
    if (collapsible && !vertical && w < minNavWidth / 2) {
      // Reopens at the width the pane had before this drag.
      if (start.current.w) setWidth(clamp(start.current.w));
      return setCollapsed(true);
    }
    // Applied at once: a pending update would otherwise be flushed inside a virtualized list's resize handling,
    // resizing the pane a second time within one ResizeObserver delivery.
    flushSync(() => {
      setCollapsed(false);
      resize(w);
    });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && collapsible && !vertical) {
      e.preventDefault();
      return setCollapsed(!collapsed);
    }
    const step = (e.shiftKey ? 40 : 8) * sign;
    const w = collapsed ? 0 : navWidth();
    const [less, more] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    const next = { [less]: w - step, [more]: w + step, Home: minNavWidth, End: maxNavWidth }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setCollapsed(false);
    resize(next);
  };

  return (
    <div
      {...props}
      ref={rootRef}
      style={width == null ? style : ({ ...style, '--fui-nav-w': `${width}px` } as CSSProperties)}
      className={cx('fui-split', vertical && 'fui-split--vertical', resizable && 'fui-split--resizable', collapsed && 'fui-split--collapsed', dragging && 'fui-split--dragging', sized && 'fui-split--sized', className)}
    >
      {nav}
      {resizable && (
        <div className="fui-split-divider">
          <div
            role="separator"
            aria-orientation={vertical ? 'horizontal' : 'vertical'}
            aria-label={splitterLabel}
            aria-valuenow={collapsed ? 0 : Math.round(navWidth())}
            aria-valuemin={collapsible ? 0 : minNavWidth}
            aria-valuemax={maxNavWidth}
            tabIndex={0}
            className="fui-splitter"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={onKeyDown}
          />
          {collapsed && (
            <RACButton className="fui-split-expand" aria-label={expandLabel} excludeFromTabOrder onPress={() => setCollapsed(false)}>
              <Arrow dir="right" />
            </RACButton>
          )}
        </div>
      )}
      {rest}
    </div>
  );
}

export function Pane({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={cx('fui-pane', className)} />;
}

/** A status bar; its first cell stretches. Mark a cell `live` to have screen readers announce its changes. */
export function StatusBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx('fui-statusbar', className)} />;
}

export function StatusCell({ mono, live, className, ...props }: HTMLAttributes<HTMLDivElement> & { mono?: boolean; live?: boolean }) {
  return <div role={live ? 'status' : undefined} {...props} className={cx(mono && 'fui-mono', className)} />;
}
