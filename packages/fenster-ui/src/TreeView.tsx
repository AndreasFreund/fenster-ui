import { useTouchPresses } from './pointer';
import { createContext, useContext, useRef, type CSSProperties, type KeyboardEvent, type MutableRefObject, type ReactNode } from 'react';
import {
  Button as RACButton,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  TreeLoadMoreItem,
  type Key,
  type TreeItemProps,
  type TreeItemRenderProps,
  type TreeProps,
} from 'react-aria-components';
import { withClass } from './utils';

/** The data shape for TreeView's default rows. */
export interface TreeNode {
  id: Key;
  label: string;
  children?: TreeNode[];
  /** Shown at the end of the row, usually a StatusMarker. */
  marker?: ReactNode;
  className?: string;
}

type AnyTreeState = TreeItemRenderProps['state'];
/** Rows publish the tree state here for TreeView's own key and action handling. */
const StateRefContext = createContext<MutableRefObject<AnyTreeState | null> | null>(null);
type CNode = { key: Key; type: string; nextKey?: Key | null; parentKey?: Key | null };

function hasNextSibling(state: AnyTreeState, node: CNode | null): boolean {
  let key = node?.nextKey;
  while (key != null) {
    const n = state.collection.getItem(key) as CNode | null;
    if (!n) return false;
    if (n.type === 'item' || n.type === 'loader') return true;
    key = n.nextKey;
  }
  return false;
}

/** The connector lines of one row. */
function Guides({ state, id, level, isExpanded, hasChildItems }: { state: AnyTreeState; id: Key; level: number; isExpanded: boolean; hasChildItems: boolean }) {
  const lines: ReactNode[] = [];
  const node = state.collection.getItem(id) as CNode | null;
  // Ancestors from the parent upwards; the ancestor at level k draws a line through this row if it has a later sibling.
  let parent = node?.parentKey != null ? (state.collection.getItem(node.parentKey) as CNode | null) : null;
  for (let k = level - 1; parent && k >= 2; k--) {
    if (hasNextSibling(state, parent)) lines.push(<span key={`a${k}`} className="fui-tree-guide fui-tree-guide--at" style={{ '--k': k } as CSSProperties} />);
    parent = parent.parentKey != null ? (state.collection.getItem(parent.parentKey) as CNode | null) : null;
  }
  if (level >= 2) {
    const last = !hasNextSibling(state, node);
    lines.push(
      <span key="s" className={last ? 'fui-tree-guide fui-tree-guide--at fui-tree-guide--half' : 'fui-tree-guide fui-tree-guide--at'} style={{ '--k': level } as CSSProperties} />,
      <span key="e" className={hasChildItems ? 'fui-tree-elbow' : 'fui-tree-elbow fui-tree-elbow--leaf'} />
    );
  }
  if (hasChildItems && isExpanded) lines.push(<span key="d" className="fui-tree-guide fui-tree-guide--stub" />);
  return <>{lines}</>;
}

export interface TreeViewItemProps extends Omit<TreeItemProps, 'children' | 'textValue'> {
  label: ReactNode;
  /** Required when `label` isn't a string: used for type-ahead. */
  textValue?: string;

  /** Shown at the end of the row, usually a StatusMarker. */
  marker?: ReactNode;
  /** An icon, or a function of the row's expanded state. */
  icon?: ReactNode | ((state: { isExpanded: boolean; hasChildItems: boolean }) => ReactNode);
  /** Child TreeViewItems (or a <Collection>). */
  children?: ReactNode;
}

/** A TreeView row. Nest TreeViewItems for children. */
export function TreeViewItem({ label, textValue, marker, icon, children, className, ...props }: TreeViewItemProps) {
  const stateRef = useContext(StateRefContext);
  return (
    <TreeItem {...props} textValue={textValue ?? (typeof label === 'string' ? label : '')} className={withClass('fui-tree-item', className)}>
      <TreeItemContent>
        {({ level, isExpanded, hasChildItems, state, id }) => {
          if (stateRef) stateRef.current = state;
          return (
          <div className="fui-tree-row" style={{ '--tree-level': level } as CSSProperties}>
            <Guides state={state} id={id} level={level} isExpanded={isExpanded} hasChildItems={hasChildItems} />
            {hasChildItems ? <RACButton slot="chevron" className="fui-twist" /> : <span className="fui-twist fui-twist--empty" aria-hidden="true" />}
            {icon != null && (
              <span className="fui-icon-slot" aria-hidden="true">{typeof icon === 'function' ? icon({ isExpanded, hasChildItems }) : icon}</span>
            )}
            <span className="fui-tree-label">{label}</span>
            {marker}
          </div>
          );
        }}
      </TreeItemContent>
      {children}
    </TreeItem>
  );
}

/** A loading row; `onLoadMore` fires when it scrolls into view. */
export function TreeViewLoadMore({ isLoading, onLoadMore, children }: { isLoading?: boolean; onLoadMore?: () => void; children: ReactNode }) {
  return (
    <TreeLoadMoreItem isLoading={isLoading} onLoadMore={onLoadMore} className="fui-tree-item fui-tree-loader">
      <div className="fui-tree-row fui-muted">{children}</div>
    </TreeLoadMoreItem>
  );
}

type ItemIcon = (node: TreeNode, state: { isExpanded: boolean; hasChildItems: boolean }) => ReactNode;
const ItemIconContext = createContext<ItemIcon | undefined>(undefined);

/** The default row for TreeNode data; reads TreeView's `itemIcon`. */
function DefaultNode({ node }: { node: TreeNode }) {
  const itemIcon = useContext(ItemIconContext);
  return (
    <TreeViewItem id={node.id} label={node.label} marker={node.marker} className={node.className} icon={itemIcon && ((s) => itemIcon(node, s))}>
      {node.children?.length ? <Collection items={node.children}>{renderNode}</Collection> : null}
    </TreeViewItem>
  );
}
const renderNode = (node: TreeNode): ReactNode => <DefaultNode key={node.id} node={node} />;

export interface TreeViewProps<T extends object> extends Omit<TreeProps<T>, 'children'> {
  /** Without `children`, items must be TreeNodes. */
  items?: Iterable<T>;
  /** A render function for `items`, or static TreeViewItems. */
  children?: ReactNode | ((item: T) => ReactNode);
  /** For TreeNode data without `children`: the icon for each row. */
  itemIcon?: ItemIcon;
}

/**
 * A tree. Single selection by default. + and - expand and collapse the focused row, * expands all below it.
 * Double-click or Enter runs `onAction`, which toggles the row by default. A tap selects; the +/- box toggles.
 */
export function TreeView<T extends object>({
  items, children, itemIcon, className, selectionMode = 'single', selectionBehavior = 'replace', disallowEmptySelection, onAction, renderEmptyState, ...props
}: TreeViewProps<T>) {
  const stateRef = useRef<AnyTreeState | null>(null);
  const emptyState = renderEmptyState;
  const body = children ?? (renderNode as unknown as (item: T) => ReactNode);

  const keyOf = (target: EventTarget): Key | undefined => {
    const attr = (target as HTMLElement).closest?.('[data-key]')?.getAttribute('data-key');
    const state = stateRef.current;
    if (attr == null || !state) return undefined;
    for (const k of state.collection.getKeys()) if (String(k) === attr) return k;
    return undefined;
  };

  const descendants = (state: AnyTreeState, key: Key): Key[] => {
    const out: Key[] = [];
    for (const child of (state.collection.getChildren?.(key) ?? []) as Iterable<CNode>) {
      if (child.type !== 'item') continue;
      out.push(child.key, ...descendants(state, child.key));
    }
    return out;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const state = stateRef.current;
    if (!state || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = keyOf(e.target);
    if (key == null) return;
    const expanded = new Set(state.expandedKeys);
    if (e.key === '+') expanded.add(key);
    else if (e.key === '-') expanded.delete(key);
    else if (e.key === '*') [key, ...descendants(state, key)].forEach((k) => expanded.add(k));
    else return;
    e.preventDefault();
    state.setExpandedKeys(expanded);
  };

  const { touch, onPointerDownCapture } = useTouchPresses();
  return (
    <ItemIconContext.Provider value={itemIcon}>
    <StateRefContext.Provider value={stateRef}>
    {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- catches keys bubbling from the interactive children */}
    <div className="fui-tree-wrap" onKeyDown={onKeyDown} onPointerDownCapture={onPointerDownCapture}>
      <Tree
        {...props}
        items={items}
        selectionMode={selectionMode}
        selectionBehavior={selectionBehavior}
        disallowEmptySelection={disallowEmptySelection ?? selectionMode === 'single'}
        onAction={touch ? undefined : onAction ?? ((key) => stateRef.current?.toggleKey(key))}
        renderEmptyState={emptyState ? (s) => <div className="fui-tree-empty fui-muted">{emptyState(s)}</div> : undefined}
        className={withClass('fui-tree', className)}
      >
        {body}
      </Tree>
    </div>
    </StateRefContext.Provider>
    </ItemIconContext.Provider>
  );
}
