import { useMemo, useState } from 'react';
import { Collection, type Key, type Selection, type SortDescriptor } from 'react-aria-components';
import {
  BarButton, BarSearchField, BarSpacer, Button, Checkbox, CheckboxGroup, CommandBar, Dialog, DialogFooter, Form, IconLabel,
  ListBody, ListBox, ListBoxOption, ListCell, ListColumn, ListHeader, ListLoadMore, ListRow, ListView, Tab, TabList,
  TabPanel, Tabs, Tag, TagGroup, TreeView, useDragAndDrop, type TreeNode,
} from '@andreasfreund/fenster-ui';
import { copy } from '../copy';
import { FOLDERS, initialFiles, makeLog, pathOf, tree, type FileRow } from '../data';
import { Example, useDemo } from '../demo';
import { closeIcon, fileIcon, fileKind, treeIcon } from '../icons';
import { Status } from '../status';

/** The file list's optional columns; Name always shows. */
const COLUMNS = [
  { id: 'kind', label: 'Kind' },
  { id: 'size', label: 'Size' },
  { id: 'modified', label: 'Modified' },
  { id: 'status', label: 'State' },
];

const LIST = `
<ListView aria-label="Files" selectionMode="multiple" resizableColumns
  sortDescriptor={sort} onSortChange={setSort} onRowAction={open}>
  <ListHeader>
    <ListColumn id="name" isRowHeader allowsSorting allowsResizing>Name</ListColumn>
    <ListColumn id="size" numeric allowsSorting allowsResizing>Size</ListColumn>
    <ListColumn id="status" allowsResizing>State</ListColumn>
  </ListHeader>
  <ListBody items={files}>
    {(f) => (
      <ListRow id={f.id}>
        <ListCell><IconLabel icon={fileIcon(f.name)}>{f.name}</IconLabel></ListCell>
        <ListCell numeric>{f.size}</ListCell>
        <ListCell><Status kind={f.status} /></ListCell>
      </ListRow>
    )}
  </ListBody>
</ListView>`;

function FilesExample() {
  const { say, contentRef } = useDemo();
  const [filter, setFilter] = useState('');
  const [rowSel, setRowSel] = useState<Selection>(new Set(['payments.ts']));
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);
  const [columns, setColumns] = useState(COLUMNS.map((c) => c.id));
  // View options previews live; this holds the columns to return to on Cancel while it is open.
  const [columnsBefore, setColumnsBefore] = useState<string[] | null>(null);
  const viewOpen = columnsBefore !== null;
  const cancelView = () => { if (columnsBefore) setColumns(columnsBefore); setColumnsBefore(null); };
  const shows = (id: string) => columns.includes(id);
  // A hidden column can't sort the list: the state that orders the rows must be on screen.
  const activeSort = sort && (sort.column === 'name' || shows(String(sort.column))) ? sort : undefined;

  const visible = useMemo(() => initialFiles.filter((f) => f.name.toLowerCase().includes(filter.trim().toLowerCase())), [filter]);
  const sorted = useMemo(() => {
    if (!activeSort) return visible;
    const k = activeSort.column as keyof FileRow;
    const out = [...visible].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return activeSort.direction === 'descending' ? out.reverse() : out;
  }, [visible, activeSort]);
  // Ctrl+A gives 'all': that means every visible row.
  const selected = rowSel === 'all' ? visible : initialFiles.filter((f) => rowSel.has(f.id));

  return (
    <>
      <CommandBar aria-label="List actions">
        <BarButton isDisabled={viewOpen} onPress={() => setColumnsBefore(columns)}>View options</BarButton>
        <BarSpacer />
        <BarSearchField aria-label="Filter files" placeholder="Filter files" clearIcon={closeIcon} clearLabel={copy.clearFilter} value={filter} onChange={setFilter} />
      </CommandBar>
      <ListView aria-label="Files" selectionMode="multiple" selectedKeys={rowSel} onSelectionChange={setRowSel} sortDescriptor={activeSort} onSortChange={setSort} resizableColumns onRowAction={(k) => say(`Opened ${k}.`)}>
        <ListHeader>
          <ListColumn id="name" isRowHeader allowsSorting allowsResizing defaultWidth="2fr" minWidth={100}>Name</ListColumn>
          {shows('kind') && <ListColumn id="kind" allowsResizing defaultWidth="1fr" minWidth={80}>Kind</ListColumn>}
          {shows('size') && <ListColumn id="size" numeric allowsSorting allowsResizing defaultWidth="1fr" minWidth={60}>Size</ListColumn>}
          {shows('modified') && <ListColumn id="modified" numeric allowsSorting allowsResizing defaultWidth="1.5fr" minWidth={120}>Modified</ListColumn>}
          {shows('status') && <ListColumn id="status" allowsResizing defaultWidth={90} minWidth={70}>State</ListColumn>}
        </ListHeader>
        <ListBody items={sorted} renderEmptyState={() => 'No files match the filter.'}>
          {(f) => (
            <ListRow id={f.id}>
              <ListCell><IconLabel icon={fileIcon(f.name)}>{f.name}</IconLabel></ListCell>
              {shows('kind') && <ListCell>{fileKind(f.name)}</ListCell>}
              {shows('size') && <ListCell numeric>{f.size.toLocaleString('en-US')}</ListCell>}
              {shows('modified') && <ListCell numeric>{f.modified}</ListCell>}
              {shows('status') && <ListCell><Status kind={f.status} /></ListCell>}
            </ListRow>
          )}
        </ListBody>
      </ListView>
      <p className="demo-readout fui-mono fui-muted">
        {visible.length === initialFiles.length ? `${initialFiles.length} files` : `${visible.length} of ${initialFiles.length} files`}
        {' · '}Selected: {selected.length ? selected.map((f) => f.name).join(', ') : 'none'}
      </p>
      <Dialog title="View options" isModal={false} placement="center" over={contentRef} isOpen={viewOpen} onOpenChange={(open) => { if (!open) cancelView(); }}>
        <Form onSubmit={(e) => { e.preventDefault(); setColumnsBefore(null); }}>
          <CheckboxGroup label="Columns" value={columns} onChange={setColumns} description="Name always shows. The list changes as you choose.">
            {COLUMNS.map((c) => <Checkbox key={c.id} value={c.id}>{c.label}</Checkbox>)}
          </CheckboxGroup>
          <DialogFooter className="fui-form-full">
            <Button variant="primary" type="submit">OK</Button>
            <Button onPress={cancelView}>Cancel</Button>
          </DialogFooter>
        </Form>
      </Dialog>
    </>
  );
}

function LogExample() {
  const [log, setLog] = useState(() => makeLog(0, 300));
  const [loading, setLoading] = useState(false);
  const [logSel, setLogSel] = useState<Selection>(new Set());
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);
  const sorted = useMemo(() => {
    if (!sort) return log;
    const k = sort.column as 'id' | 'time' | 'status';
    const out = [...log].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return sort.direction === 'descending' ? out.reverse() : out;
  }, [log, sort]);
  const loadMore = () => {
    if (loading || log.length >= 3000) return;
    setLoading(true);
    setTimeout(() => { setLog((l) => [...l, ...makeLog(l.length, 300)]); setLoading(false); }, 400);
  };
  return (
    <>
      <ListView aria-label="Log" virtualized height="calc(11 * var(--row-h))" selectionMode="multiple" selectionCheckboxes selectedKeys={logSel} onSelectionChange={setLogSel} sortDescriptor={sort} onSortChange={setSort}>
        <ListHeader>
          <ListColumn id="id" numeric allowsSorting width={70}>No.</ListColumn>
          <ListColumn id="time" numeric allowsSorting width={90}>Time</ListColumn>
          <ListColumn id="status" allowsSorting width={80}>Level</ListColumn>
          <ListColumn id="text" isRowHeader>Message</ListColumn>
        </ListHeader>
        <ListBody>
          <Collection items={sorted}>
            {(r) => (
              <ListRow id={r.id}>
                <ListCell numeric>{r.id + 1}</ListCell>
                <ListCell numeric>{r.time}</ListCell>
                <ListCell><Status kind={r.status} /></ListCell>
                <ListCell>{r.text}</ListCell>
              </ListRow>
            )}
          </Collection>
          {log.length < 3000 && <ListLoadMore isLoading={loading} onLoadMore={loadMore}>{copy.loadingMore}</ListLoadMore>}
        </ListBody>
      </ListView>
      <p className="demo-readout fui-mono fui-muted">
        {log.length} rows loaded · Selected: {logSel === 'all' ? 'all' : logSel.size || 'none'}
      </p>
    </>
  );
}

export function Lists() {
  return (
    <>
      <Example
        title="Sorting, resizing and columns"
        note="A header press sorts ascending, then descending, then not at all. Drag a column border to resize. View options floats over this pane without blocking it: the list changes as you choose, and Cancel puts the columns back."
        code={LIST}
        flush
      >
        <FilesExample />
      </Example>
      <Example title="Many rows" note="A virtualized list renders only the rows in view and loads more as you reach the end. Checkboxes are an extra way to select." flush>
        <LogExample />
      </Example>
    </>
  );
}

const TREE = `
<TreeView aria-label="Folders" items={tree} itemIcon={treeIcon}
  selectedKeys={selected} onSelectionChange={setSelected}
  expandedKeys={expanded} onExpandedChange={setExpanded} />`;

export function Trees() {
  const { say } = useDemo();
  const [treeSel, setTreeSel] = useState<Selection>(new Set(['api']));
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['proj', 'src', 'api', 'db']));
  const [files, setFiles] = useState(initialFiles);
  const fileDrag = useDragAndDrop<FileRow>({
    getItems: (keys) => [...keys].map((k) => ({ 'application/x-fui-file': String(k), 'text/plain': String(k) })),
  });
  const folderDrop = useDragAndDrop<TreeNode>({
    acceptedDragTypes: ['application/x-fui-file'],
    getDropOperation: (target) => (target.type === 'item' && target.dropPosition === 'on' && FOLDERS.has(target.key) ? 'move' : 'cancel'),
    onItemDrop: async (e) => {
      const ids = await Promise.all(e.items.map((i) => (i.kind === 'text' ? i.getText('application/x-fui-file') : '')));
      const moved = files.filter((f) => ids.includes(f.id));
      if (!moved.length) return;
      setFiles((fs) => fs.filter((f) => !ids.includes(f.id)));
      say(`Moved ${moved.length === 1 ? moved[0].name : `${moved.length} files`} to ${pathOf.get(e.target.key)}.`);
    },
  });
  const key = treeSel === 'all' ? undefined : [...treeSel][0];
  return (
    <>
      <Example
        title="Tree"
        note="Rows run from edge to edge. The icon shows the kind of object; a row's state is a marker at its end. Plus and minus expand and collapse the focused row, and the asterisk expands everything below it."
        code={TREE}
        flush
      >
        <TreeView aria-label="Folders" itemIcon={treeIcon} items={tree} selectedKeys={treeSel} onSelectionChange={setTreeSel} expandedKeys={expanded} onExpandedChange={setExpanded} />
        <p className="demo-readout fui-mono fui-muted">Selected: {(key !== undefined && pathOf.get(key)) || 'none'}</p>
      </Example>
      <Example title="Drag and drop" note="Drag a file from the list onto a folder in the tree. Only folders accept the drop." flush>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start' }}>
          <TreeView aria-label="Target folders" itemIcon={treeIcon} items={tree} defaultExpandedKeys={['proj', 'src']} dragAndDropHooks={folderDrop.dragAndDropHooks} />
          <ListView aria-label="Files to move" selectionMode="multiple" dragAndDropHooks={fileDrag.dragAndDropHooks}>
            <ListHeader>
              <ListColumn id="name" isRowHeader>Name</ListColumn>
            </ListHeader>
            <ListBody items={files} renderEmptyState={() => 'Every file was moved.'}>
              {(f) => (
                <ListRow id={f.id}>
                  <ListCell><IconLabel icon={fileIcon(f.name)}>{f.name}</IconLabel></ListCell>
                </ListRow>
              )}
            </ListBody>
          </ListView>
        </div>
      </Example>
    </>
  );
}

export function Smaller() {
  const [labels, setLabels] = useState(['backend', 'billing', 'nightly']);
  return (
    <>
      <Example title="List box" note="An always-open list for a handful of choices.">
        <ListBox aria-label="Workers" selectionMode="multiple" defaultSelectedKeys={['w2']} style={{ width: 160 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => <ListBoxOption key={n} id={`w${n}`}>{`Worker ${n}`}</ListBoxOption>)}
        </ListBox>
      </Example>
      <Example title="Tabs" note="One row of tabs; tabs that do not fit scroll sideways. A tab that does not apply is disabled, not hidden.">
        <Tabs defaultSelectedKey="general">
          <TabList aria-label="Settings">
            <Tab id="general">General</Tab>
            <Tab id="network">Network</Tab>
            <Tab id="history" isDisabled>History</Tab>
          </TabList>
          <TabPanel id="general">Name, owner and description of the service.</TabPanel>
          <TabPanel id="network">Host, port and timeouts.</TabPanel>
          <TabPanel id="history">Past changes.</TabPanel>
        </Tabs>
      </Example>
      <Example title="Tags" note="Type a label and press Enter to add it. Backspace or the tag's button removes one.">
        <TagGroup
          label="Labels"
          addLabel="Add label"
          onAdd={(text) => setLabels((l) => (l.includes(text) ? l : [...l, text]))}
          onRemove={(keys) => setLabels((l) => l.filter((x) => !keys.has(x)))}
        >
          {labels.map((l) => <Tag key={l} id={l}>{l}</Tag>)}
        </TagGroup>
      </Example>
    </>
  );
}
