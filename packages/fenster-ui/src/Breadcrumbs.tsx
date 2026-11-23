import { Breadcrumb, Breadcrumbs as RACBreadcrumbs, Link as RACLink } from 'react-aria-components';
import { cx } from './utils';

export interface BreadcrumbItem { id: string; label: string; href?: string }

/** A path of links separated by slashes; the last item is the current place and isn't a link. */
/** A bar showing where the content is; place it at the top of a pane, edge to edge. */
export function Breadcrumbs({ items, onAction, className }: { items: BreadcrumbItem[]; onAction?: (id: string) => void; className?: string }) {
  return (
    <RACBreadcrumbs items={items} onAction={(k) => onAction?.(String(k))} className={cx('fui-bar fui-breadcrumbs', className)}>
      {(item) => (
        <Breadcrumb id={item.id} className="fui-crumb">
          <RACLink href={item.href} className="fui-crumb-link">{item.label}</RACLink>
        </Breadcrumb>
      )}
    </RACBreadcrumbs>
  );
}
