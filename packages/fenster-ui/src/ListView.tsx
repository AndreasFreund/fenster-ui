import { createContext, useContext, type ReactNode } from 'react';
import {
  Cell,
  Collection,
  Column,
  ColumnResizer,
  ResizableTableContainer,
  Row,
  Table,
  TableBody,
  TableHeader,
  TableLayout,
  TableLoadMoreItem,
  Virtualizer,
  useTableOptions,
  type CellProps,
  type ColumnProps,
  type RowProps,
  type TableBodyProps,
  type TableHeaderProps,
  type TableProps,
  type SortDescriptor,
} from 'react-aria-components';
import { Checkbox } from './Choice';
import { Arrow } from './Icon';
import { cx, withClass } from './utils';
import { useMetrics } from './density';
import { useTouchPresses } from './pointer';

const ListOptions = createContext({ checkboxes: false });

export interface ListViewProps extends Omit<TableProps, 'onSortChange'> {
  /** Header presses cycle ascending, descending and unsorted (`undefined`). */
  onSortChange?: (descriptor: SortDescriptor | undefined) => void;
  /** Adds a selection checkbox column. */
  selectionCheckboxes?: boolean;
  /** Lets columns with `allowsResizing` be resized. */
  resizableColumns?: boolean;
  /** Renders only visible rows. Needs `height`. */
  virtualized?: boolean;
  height?: number | string;
}

/** A table with column headers. Single selection by default; double-click or Enter runs `onRowAction`. A tap selects. */
export function ListView({
  className, selectionMode = 'single', selectionBehavior = 'replace', disallowEmptySelection,
  selectionCheckboxes = false, resizableColumns, virtualized, height, style, sortDescriptor, onSortChange, ...props
}: ListViewProps) {
  const metrics = useMetrics();
  const { touch, onPointerDownCapture } = useTouchPresses();
  let table = (
    <Table
      {...props}
      onRowAction={touch ? undefined : props.onRowAction}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange && ((next) => {
        // A press on a descending column clears the sort.
        const again = sortDescriptor && next.column === sortDescriptor.column && sortDescriptor.direction === 'descending';
        onSortChange(again ? undefined : next);
      })}
      style={virtualized ? { ...style, height: resizableColumns ? '100%' : height } : style}
      selectionMode={selectionMode}
      selectionBehavior={selectionBehavior}
      disallowEmptySelection={disallowEmptySelection ?? selectionMode === 'single'}
      className={withClass(cx('fui-list', virtualized && 'fui-list--virtual', resizableColumns && 'fui-list--resizable'), className)}
    />
  );
  if (virtualized) table = <Virtualizer layout={TableLayout} layoutOptions={{ rowHeight: metrics.rowHeight, headingHeight: metrics.rowHeight }}>{table}</Virtualizer>;
  if (resizableColumns) {
    // The container scrolls, so it takes the height and the table fills it.
    table = (
      <ResizableTableContainer className="fui-list-container" style={virtualized ? { height } : undefined}>
        {table}
      </ResizableTableContainer>
    );
  }
  return (
    <ListOptions.Provider value={{ checkboxes: selectionCheckboxes }}>
      <div className="fui-list-wrap" onPointerDownCapture={onPointerDownCapture}>{table}</div>
    </ListOptions.Provider>
  );
}

export function ListHeader<T extends object>({ columns, children, ...props }: TableHeaderProps<T>) {
  const { checkboxes } = useContext(ListOptions);
  const { selectionMode } = useTableOptions();
  const { checkColumn } = useMetrics();
  return (
    <TableHeader {...props} columns={columns}>
      {checkboxes && (
        <Column width={checkColumn} minWidth={checkColumn} className="fui-list-col fui-list-col--check">
          {selectionMode === 'multiple' ? <Checkbox slot="selection" /> : null}
        </Column>
      )}
      <Collection items={columns}>{children}</Collection>
    </TableHeader>
  );
}

export interface ListColumnProps extends Omit<ColumnProps, 'children'> {
  /** Monospaced, end-aligned. */
  numeric?: boolean;
  /** Needs `resizableColumns` on the ListView. */
  allowsResizing?: boolean;
  children?: ReactNode;
}

export function ListColumn({ numeric, allowsResizing, children, className, ...props }: ListColumnProps) {
  return (
    <Column {...props} className={withClass(cx('fui-list-col', numeric && 'fui-num'), className)}>
      {({ sortDirection }) => (
        <div className="fui-col-head">
          <span className="fui-col-label">{children}</span>
          {sortDirection && <Arrow dir={sortDirection === 'ascending' ? 'up' : 'down'} />}
          {allowsResizing && <ColumnResizer className="fui-col-resizer" />}
        </div>
      )}
    </Column>
  );
}

export function ListBody<T extends object>({ renderEmptyState, ...props }: TableBodyProps<T>) {
  const empty = renderEmptyState;
  return <TableBody {...props} renderEmptyState={empty ? (s) => <div className="fui-list-empty">{empty(s)}</div> : undefined} />;
}

export function ListRow<T extends object>({ columns, children, className, ...props }: RowProps<T>) {
  const { checkboxes } = useContext(ListOptions);
  return (
    <Row {...props} columns={columns} className={withClass('fui-list-row', className)}>
      {checkboxes && (
        <Cell className="fui-list-cell fui-list-cell--check">
          <Checkbox slot="selection" />
        </Cell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  );
}

export interface ListCellProps extends CellProps {
  /** Monospaced, end-aligned. */
  numeric?: boolean;
}

export function ListCell({ numeric, className, children, ...props }: ListCellProps) {
  return (
    <Cell {...props} className={withClass(cx('fui-list-cell', numeric && 'fui-num'), className)}>
      {(state) => <div className="fui-cell">{typeof children === 'function' ? children(state) : children}</div>}
    </Cell>
  );
}

/** A loading row; `onLoadMore` fires when it scrolls into view. */
export function ListLoadMore({ isLoading, onLoadMore, children }: { isLoading?: boolean; onLoadMore?: () => void; children: ReactNode }) {
  return (
    <TableLoadMoreItem isLoading={isLoading} onLoadMore={onLoadMore} className="fui-list-loader">
      <span className="fui-muted">{children}</span>
    </TableLoadMoreItem>
  );
}
