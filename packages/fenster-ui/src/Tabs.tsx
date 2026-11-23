import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Tab as RACTab,
  TabList as RACTabList,
  TabPanel as RACTabPanel,
  Tabs as RACTabs,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type TabsProps,
} from 'react-aria-components';
import { cx, withClass } from './utils';

/** Tabs with a framed panel. Horizontal only. */
export function Tabs({ className, ...props }: Omit<TabsProps, 'orientation'>) {
  return <RACTabs {...props} orientation="horizontal" className={withClass('fui-tabs-root', className)} />;
}

/**
 * Tabs in one row. When they don't fit, the row scrolls sideways and a marker shows at each edge with more tabs
 * beyond it; with a mouse, clicking the marker brings the next tab into view. The selected or focused tab is kept
 * in view.
 */
export function TabList<T extends object>({ className, ...props }: TabListProps<T>) {
  const scroller = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const left = Math.abs(el.scrollLeft);
    const next = { start: left > 1, end: left + el.clientWidth < el.scrollWidth - 1 };
    setMore((m) => (m.start === next.start && m.end === next.end ? m : next));
  }, []);

  /** Scrolls the least amount that shows the tab whole, clear of the markers. */
  const reveal = useCallback((tab: HTMLElement | null) => {
    const el = scroller.current;
    if (!el || !tab) return;
    const cap = parseFloat(getComputedStyle(el).getPropertyValue('--fui-tabs-cap')) || 0;
    const box = el.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    if (r.left < box.left + cap) el.scrollLeft -= box.left + cap - r.left;
    else if (r.right > box.right - cap) el.scrollLeft += r.right - (box.right - cap);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    const resize = new ResizeObserver(update);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    const selection = new MutationObserver(() => reveal(el.querySelector<HTMLElement>('.fui-tab[data-selected]')));
    selection.observe(el, { subtree: true, attributes: true, attributeFilter: ['data-selected'] });
    reveal(el.querySelector<HTMLElement>('.fui-tab[data-selected]'));
    return () => {
      resize.disconnect();
      selection.disconnect();
    };
  }, [update, reveal]);

  const step = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const tabs = [...el.querySelectorAll<HTMLElement>('.fui-tab')];
    const next = dir > 0
      ? tabs.find((t) => t.getBoundingClientRect().right > box.right - 12)
      : tabs.reverse().find((t) => t.getBoundingClientRect().left < box.left + 12);
    reveal(next ?? null);
  };

  return (
    <div className={cx('fui-tabstrip', more.start && 'fui-tabstrip--more-start', more.end && 'fui-tabstrip--more-end')}>
      <div ref={scroller} className="fui-tabs-scroll" onScroll={update} onFocus={(e) => reveal((e.target as HTMLElement).closest('.fui-tab'))}>
        <RACTabList {...props} className={withClass('fui-tabs', className)} />
      </div>
      {more.start && <div className="fui-tabs-more fui-tabs-more--start" aria-hidden="true" onClick={() => step(-1)} />}
      {more.end && <div className="fui-tabs-more fui-tabs-more--end" aria-hidden="true" onClick={() => step(1)} />}
    </div>
  );
}

export function Tab({ className, ...props }: TabProps) {
  return <RACTab {...props} className={withClass('fui-tab', className)} />;
}

export function TabPanel({ className, ...props }: TabPanelProps) {
  return <RACTabPanel {...props} className={withClass('fui-tabpanel', className)} />;
}
