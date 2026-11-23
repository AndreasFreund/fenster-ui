import { useMemo, useRef, useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { AppearanceDialog } from './AppearanceDialog';
import { copy } from './copy';
import { closeIcon, commandIcons, fileIcon, refreshIcon, treeIcon } from './icons';
import { Collection, type Key, type Selection, type SortDescriptor } from 'react-aria-components';
import {
  AppFrame, BarButton, BarMenu, BarSearchField, BarSeparator, BarSpacer, Button, Callout, Checkbox, CommandBar, Dialog,
  DialogFooter, Form, GroupBox, Link, ListBody, ListCell, ListColumn, ListHeader, ListRow, ListView, MenuBar, MenuItem,
  MenuSeparator, Pane, Radio, RadioGroup, Select, SelectItem, SplitView, StatusBar, StatusCell, Tab, TabList,
  TabPanel, Tabs, TextField, TreeView, isMac, useCommands, type Command, type TreeNode,
  Submenu, Tooltip, TooltipTrigger, ProgressBar, Meter, NumberField, ComboBox, CheckboxGroup, ListBox, ListBoxOption,
  ToggleButton, ToggleButtonGroup, Slider, DateField, TimeField, DatePicker, ColorPicker, ColorSwatchPicker, ListLoadMore,
  useDragAndDrop, Switch, TagGroup, Tag, Disclosure, DisclosureGroup, Breadcrumbs, ToastRegion, DropZone, FileTrigger,
  ColorArea, ColorWheel, IconLabel, DialogTrigger, Popover,
} from '@andreasfreund/fenster-ui';
import { kinds, notify, Status, type Kind } from './status';

const tree: TreeNode[] = [
  {
    id: 'proj', label: 'billing-service', children: [
      {
        id: 'src', label: 'src', children: [
          { id: 'api', label: 'api', children: [{ id: 'invoices.ts', label: 'invoices.ts' }, { id: 'payments.ts', label: 'payments.ts', marker: <Status kind="warning" /> }] },
          { id: 'db', label: 'db', children: [{ id: 'schema.sql', label: 'schema.sql' }, { id: 'migrate.ts', label: 'migrate.ts', marker: <Status kind="failed" /> }] },
          { id: 'index.ts', label: 'index.ts' },
        ],
      },
      { id: 'tests', label: 'tests', children: [{ id: 'invoices.test.ts', label: 'invoices.test.ts', marker: <Status kind="ok" /> }] },
      { id: 'package.json', label: 'package.json' },
    ],
  },
  { id: 'shared', label: 'shared-config', children: [{ id: 'tsconfig.json', label: 'tsconfig.json' }] },
];

interface FileRow { id: string; name: string; size: number; modified: string; status: Kind }
const initialFiles: FileRow[] = [
  { id: 'invoices.ts', name: 'invoices.ts', size: 14_208, modified: '2026-11-12 09:41', status: 'ok' },
  { id: 'payments.ts', name: 'payments.ts', size: 9_870, modified: '2026-11-14 16:05', status: 'warning' },
  { id: 'schema.sql', name: 'schema.sql', size: 3_412, modified: '2026-10-30 11:22', status: 'note' },
  { id: 'migrate.ts', name: 'migrate.ts', size: 6_154, modified: '2026-11-15 08:17', status: 'failed' },
  { id: 'index.ts', name: 'index.ts', size: 812, modified: '2026-09-02 14:50', status: 'ok' },
];

// Breadcrumbs: every tree node by its path ("billing-service/src/api"), and each node's ancestors.
const byPath = new Map<string, Key>();
const pathOf = new Map<Key, string>();
(function index(nodes: TreeNode[], parents: TreeNode[]) {
  for (const n of nodes) {
    const path = [...parents, n].map((x) => x.label).join('/');
    byPath.set(path.toLowerCase(), n.id);
    pathOf.set(n.id, path);
    if (n.children) index(n.children, [...parents, n]);
  }
})(tree, []);

const FOLDERS = new Set<Key>(['proj', 'src', 'api', 'db', 'tests', 'shared']);
const LEVELS: Kind[] = ['note', 'note', 'note', 'ok', 'warning', 'failed'];
const makeLog = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const id = from + i;
    const d = new Date(Date.UTC(2026, 10, 15, 8, 0, 0) + id * 7000);
    return { id, time: d.toISOString().slice(11, 19), status: LEVELS[(id * 7) % LEVELS.length], text: `Request ${1000 + id} handled by worker ${(id % 8) + 1}` };
  });

/** The data-key of the list row that contains `target`, for the debug readouts. */
const rowKey = (target: EventTarget) => (target as HTMLElement).closest('[role="row"]')?.getAttribute('data-key') ?? undefined;

type Change = { kind: 'delete' | 'create'; items: { file: FileRow; index: number }[] };
const describe = (c: Change) => (c.items.length === 1 ? c.items[0].file.name : `${c.items.length} files`);

// Ctrl+N is reserved by browsers, so New file is Alt+N.
const KEYS = {
  newFile: 'Alt+N',
  open: 'Mod+O',
  save: 'Mod+S',
  delete: isMac ? 'Mod+Backspace' : 'Delete',
  undo: 'Mod+Z',
  redo: isMac ? 'Mod+Shift+Z' : 'Mod+Y',
  find: 'Mod+F',
};

const OPTIONS = [
  { id: 'hidden', label: 'Show hidden files' },
  { id: 'ext', label: 'Show file extensions' },
  { id: 'sync', label: 'Sync subfolders' },
];

function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function App() {
  const [files, setFiles] = useState(initialFiles);
  const [undoStack, setUndo] = useState<Change[]>([]);
  const [redoStack, setRedo] = useState<Change[]>([]);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('Ready');
  const [working, setWorking] = useState(false);
  const [treeSel, setTreeSel] = useState<Selection>(new Set(['api']));
  const [rowSel, setRowSel] = useState<Selection>(new Set(['payments.ts']));
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['proj', 'src', 'api', 'db']));
  const [port, setPort] = useState('80800');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);
  const [log, setLog] = useState(() => makeLog(0, 300));
  const [logLoading, setLogLoading] = useState(false);
  const [labels, setLabels] = useState(['backend', 'billing', 'nightly']);
  const [dropped, setDropped] = useState<string[]>([]);
  const [logSel, setLogSel] = useState<Selection>(new Set());
  const [focusedFile, setFocusedFile] = useState<string>();
  const [focusedLog, setFocusedLog] = useState<string>();
  const [logSort, setLogSort] = useState<SortDescriptor | undefined>(undefined);
  const [options, setOptions] = useState<Set<string>>(new Set(['hidden']));
  const toggleOption = (id: string, on: boolean) => setOptions((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
  const filterRef = useRef<HTMLInputElement>(null);
  const treeKey = treeSel === 'all' ? undefined : ([...treeSel][0] as Key | undefined);
  const currentPath = (treeKey !== undefined && pathOf.get(treeKey)) || '';
  const untitled = useRef(1);

  const visible = useMemo(() => files.filter((f) => f.name.toLowerCase().includes(filter.trim().toLowerCase())), [files, filter]);
  const sorted = useMemo(() => {
    if (!sort) return visible; // unsorted: natural order
    const k = sort.column as keyof FileRow;
    const out = [...visible].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return sort.direction === 'descending' ? out.reverse() : out;
  }, [visible, sort]);
  const sortedLog = useMemo(() => {
    if (!logSort) return log;
    const k = logSort.column as 'id' | 'time' | 'status';
    const out = [...log].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return logSort.direction === 'descending' ? out.reverse() : out;
  }, [log, logSort]);
  const loadMoreLog = () => {
    if (logLoading || log.length >= 3000) return;
    setLogLoading(true);
    setTimeout(() => { setLog((l) => [...l, ...makeLog(l.length, 300)]); setLogLoading(false); }, 400);
  };
  // Ctrl+A gives 'all': that means every visible row.
  const selectedFiles = rowSel === 'all' ? visible : files.filter((f) => rowSel.has(f.id));
  const selectionLabel =
    selectedFiles.length === 0 ? 'No selection' : selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`;
  const portInvalid = !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535;

  const apply = (c: Change, direction: 'do' | 'undo') => {
    const remove = (c.kind === 'delete') === (direction === 'do');
    const ids = new Set(c.items.map((i) => i.file.id));
    setFiles((fs) => {
      if (remove) return fs.filter((f) => !ids.has(f.id));
      // Re-insert at the original positions, lowest index first.
      const next = [...fs];
      for (const { file, index } of [...c.items].sort((a, b) => a.index - b.index)) next.splice(index, 0, file);
      return next;
    });
    setRowSel(new Set(remove ? [] : ids));
  };
  const record = (c: Change) => {
    apply(c, 'do');
    setUndo((u) => [...u, c]);
    setRedo([]);
  };

  const actions = {
    newFile: () => {
      const name = `untitled-${untitled.current++}.ts`;
      record({ kind: 'create', items: [{ file: { id: name, name, size: 0, modified: now(), status: 'draft' }, index: files.length }] });
      setMessage(`Created ${name}.`);
    },
    open: () => setMessage(selectedFiles.length ? `Opened ${selectionLabel.replace(' selected', '')}.` : 'Select a file to open.'),
    save: () => setMessage('All files saved.'),
    askDelete: () => (selectedFiles.length ? setDialogOpen(true) : setMessage('Select a file to delete.')),
    confirmDelete: () => {
      if (!selectedFiles.length) return;
      const c: Change = { kind: 'delete', items: selectedFiles.map((file) => ({ file, index: files.indexOf(file) })) };
      record(c);
      setMessage(`Deleted ${describe(c)}.`);
    },
    undo: () => {
      const c = undoStack.at(-1);
      if (!c) return;
      apply(c, 'undo');
      setUndo((u) => u.slice(0, -1));
      setRedo((r) => [...r, c]);
      setMessage(`Undid ${c.kind === 'delete' ? 'delete' : 'create'} ${describe(c)}.`);
    },
    redo: () => {
      const c = redoStack.at(-1);
      if (!c) return;
      apply(c, 'do');
      setRedo((r) => r.slice(0, -1));
      setUndo((u) => [...u, c]);
      setMessage(`Redid ${c.kind === 'delete' ? 'delete' : 'create'} ${describe(c)}.`);
    },
    find: () => {
      filterRef.current?.focus();
      filterRef.current?.select();
    },
    refresh: () => {
      // The app stays usable while refreshing: show the working-in-background pointer.
      setWorking(true);
      setMessage('Refreshing...');
      setTimeout(() => {
        setWorking(false);
        setMessage('Refreshed.');
        notify('ok', 'Refresh finished.', 'The folder list is up to date.');
      }, 1500);
    },
  };

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
      record({ kind: 'delete', items: moved.map((file) => ({ file, index: files.indexOf(file) })) });
      setMessage(`Moved ${moved.length === 1 ? moved[0].name : `${moved.length} files`} to ${pathOf.get(e.target.key)}.`);
    },
  });

  const commands: Record<string, Command> = {
    newFile: { id: 'new', label: 'New file', shortcut: KEYS.newFile, run: actions.newFile, icon: commandIcons.newFile },
    open: { id: 'open', label: 'Open', shortcut: KEYS.open, run: actions.open, icon: commandIcons.open },
    save: { id: 'save', label: 'Save', shortcut: KEYS.save, run: actions.save, icon: commandIcons.save },
    saveAs: { id: 'saveas', label: 'Save as', run: actions.save },
    delete: { id: 'delete', label: 'Delete', shortcut: KEYS.delete, run: actions.askDelete, isDisabled: !selectedFiles.length },
    undo: { id: 'undo', label: 'Undo', shortcut: KEYS.undo, run: actions.undo, isDisabled: !undoStack.length },
    redo: { id: 'redo', label: 'Redo', shortcut: KEYS.redo, run: actions.redo, isDisabled: !redoStack.length },
    find: { id: 'find', label: 'Find', shortcut: KEYS.find, run: actions.find, icon: commandIcons.find },
    refresh: { id: 'refresh', label: 'Refresh', run: actions.refresh, isDisabled: working },
    appearance: { id: 'appearance', label: 'Appearance...', run: () => setAppearanceOpen(true) },
  };
  // oxlint-disable-next-line react/refs -- the commands read refs when they run, not during render
  useCommands(Object.values(commands), { enabled: !dialogOpen && !appearanceOpen });

  const allOptions = options.size === OPTIONS.length;
  const someOptions = options.size > 0 && !allOptions;

  return (
    <AppFrame className={working ? 'fui-working' : undefined}>
      <MenuBar aria-label="Menu bar">
        <BarMenu label="File">
          <MenuItem command={commands.newFile} />
          <MenuItem command={commands.open} />
          <MenuItem command={commands.save} />
          <MenuItem command={commands.saveAs} />
          <MenuSeparator />
          <MenuItem command={commands.delete} />
        </BarMenu>
        <BarMenu label="Edit">
          <MenuItem command={commands.undo} />
          <MenuItem command={commands.redo} />
          <MenuSeparator />
          <MenuItem command={commands.find} />
        </BarMenu>
        <BarMenu label="View">
          <Submenu
            label="Sort by"
            selectionMode="single"
            selectedKeys={[sort ? String(sort.column) : 'natural']}
            onSelectionChange={(keys) => { const k = [...(keys as Set<Key>)][0]; if (k) setSort(k === 'natural' ? undefined : { column: k, direction: 'ascending' }); }}
          >
            <MenuItem id="natural">Original order</MenuItem>
            <MenuSeparator />
            <MenuItem id="name">Name</MenuItem>
            <MenuItem id="size">Size</MenuItem>
            <MenuItem id="modified">Modified</MenuItem>
          </Submenu>
          <MenuItem command={commands.refresh} />
          <MenuSeparator />
          <MenuItem command={commands.appearance} />
        </BarMenu>
        <BarMenu label="Help">
          <MenuItem id="about">About</MenuItem>
        </BarMenu>
      </MenuBar>
      <CommandBar aria-label="Actions">
        <BarButton icon={commandIcons.newFile} onPress={commands.newFile.run}>New file</BarButton>
        <TooltipTrigger>
          <BarButton icon={refreshIcon} aria-label="Refresh" isDisabled={commands.refresh.isDisabled} onPress={commands.refresh.run} />
          <Tooltip>Refresh</Tooltip>
        </TooltipTrigger>
        <BarSeparator />
        <DialogTrigger>
          <BarButton>View options</BarButton>
          <Popover title="View options">
            {OPTIONS.map((o) => (
              <Checkbox key={o.id} isSelected={options.has(o.id)} onChange={(on) => toggleOption(o.id, on)}>{o.label}</Checkbox>
            ))}
          </Popover>
        </DialogTrigger>
        <BarSpacer />
        <BarSearchField aria-label="Filter files" placeholder="Filter files" value={filter} onChange={setFilter} inputRef={filterRef} />
      </CommandBar>

      <SplitView resizable collapsible splitterLabel={copy.resizeFolderPane} expandLabel={copy.showFolders}>
        <Pane aria-label="Folders">
          <TreeView
            aria-label="Folders"
            selectionMode="multiple"
            dragAndDropHooks={folderDrop.dragAndDropHooks}
            itemIcon={treeIcon}
            items={tree}
            selectedKeys={treeSel}
            onSelectionChange={setTreeSel}
            expandedKeys={expanded}
            onExpandedChange={setExpanded}
          />
        </Pane>
        <Pane>
          <Breadcrumbs
            items={(currentPath || 'billing-service').split('/').map((label, i, all) => ({ id: all.slice(0, i + 1).join('/'), label }))}
            onAction={(path) => { const id = byPath.get(path.toLowerCase()); if (id !== undefined) setTreeSel(new Set([id])); }}
          />
          <div className="fui-pane-body fui-stack">
            <h1 className="fui-display">billing-service</h1>
            <Tabs defaultSelectedKey="files">
              <TabList aria-label="Views">
                <Tab id="files">Files</Tab>
                <Tab id="props">Properties</Tab>
                <Tab id="status">Status</Tab>
                <Tab id="controls">Controls</Tab>
                <Tab id="log">Log</Tab>
                <Tab id="locked" isDisabled>History</Tab>
              </TabList>

              <TabPanel id="files" style={{ padding: 0 }}>
                <div onFocus={(e) => setFocusedFile(rowKey(e.target))}>
                <ListView aria-label="Files" selectionMode="multiple" selectedKeys={rowSel} onSelectionChange={setRowSel} sortDescriptor={sort} onSortChange={setSort} resizableColumns onRowAction={(k) => setMessage(`Opened ${k}.`)} dragAndDropHooks={fileDrag.dragAndDropHooks}>
                  <ListHeader>
                    <ListColumn id="name" isRowHeader allowsSorting allowsResizing defaultWidth="2fr" minWidth={100}>Name</ListColumn>
                    <ListColumn id="size" numeric allowsSorting allowsResizing defaultWidth="1fr" minWidth={60}>Size</ListColumn>
                    <ListColumn id="modified" numeric allowsSorting allowsResizing defaultWidth="1.5fr" minWidth={120}>Modified</ListColumn>
                    <ListColumn id="status" defaultWidth={90} minWidth={70}>State</ListColumn>
                  </ListHeader>
                  <ListBody items={sorted} renderEmptyState={() => (filter ? 'No files match the filter.' : 'This folder is empty.')}>
                    {(f) => (
                      <ListRow id={f.id}>
                        <ListCell><IconLabel icon={fileIcon(f.name)}>{f.name}</IconLabel></ListCell>
                        <ListCell numeric>{f.size.toLocaleString('en-US')}</ListCell>
                        <ListCell numeric>{f.modified}</ListCell>
                        <ListCell><Status kind={f.status} /></ListCell>
                      </ListRow>
                    )}
                  </ListBody>
                </ListView>
                </div>
                <div className="fui-pane-body fui-mono fui-muted">
                  Selected: {selectedFiles.length ? selectedFiles.map((f) => f.name).join(', ') : 'none'}{' · '}Focused: {focusedFile ?? 'none'}
                </div>
              </TabPanel>

              <TabPanel id="props">
                <div className="fui-stack">
                  <h2 className="fui-heading">Connection</h2>
                  <Form onSubmit={(e) => e.preventDefault()}>
                    <TextField label="Host" defaultValue="db.internal" />
                    <TextField
                      label="Port"
                      mono
                      value={port}
                      onChange={setPort}
                      isInvalid={portInvalid}
                      errorMessage="Port is out of range. Enter a number from 1 to 65535."
                    />
                    <TextField label="Data folder" mono defaultValue="/var/lib/billing" description="Absolute path on the server." />
                    <TextField label="Replica" isDisabled defaultValue="none" />
                    <Select label="Driver" defaultSelectedKey="pg">
                      <SelectItem id="pg">PostgreSQL</SelectItem>
                      <SelectItem id="mysql">MySQL</SelectItem>
                      <SelectItem id="sqlite">SQLite</SelectItem>
                    </Select>
                    <RadioGroup label="Mode" defaultValue="rw">
                      <Radio value="rw">Read and write</Radio>
                      <Radio value="ro">Read only</Radio>
                      <Radio value="off" isDisabled>Offline</Radio>
                    </RadioGroup>
                  </Form>
                  <GroupBox legend="Folder options">
                    <Checkbox
                      isSelected={allOptions}
                      isIndeterminate={someOptions}
                      onChange={(on) => setOptions(new Set(on ? OPTIONS.map((o) => o.id) : []))}
                    >
                      All options
                    </Checkbox>
                    <div className="fui-option-indent" style={{ display: 'flex', flexDirection: 'column' }}>
                      {OPTIONS.map((o) => (
                        <Checkbox
                          key={o.id}
                          isSelected={options.has(o.id)}
                          onChange={(on) => toggleOption(o.id, on)}
                        >
                          {o.label}
                        </Checkbox>
                      ))}
                    </div>
                    <Checkbox isDisabled defaultSelected>Compress on save</Checkbox>
                  </GroupBox>
                  <GroupBox legend="Network share (not connected)" isDisabled>
                    <Checkbox defaultSelected>Reconnect at sign-in</Checkbox>
                    <Checkbox>Use different credentials</Checkbox>
                  </GroupBox>
                  <div className="fui-row-gap">
                    <Button variant="primary">Apply</Button>
                    <Button>Cancel</Button>
                    <Button isDisabled>Reset</Button>
                  </div>
                </div>
              </TabPanel>

              <TabPanel id="status">
                <div className="fui-stack">
                  <Callout tone="info" marker={<Status kind="note" />} title="Index rebuilt.">The search index now covers 1,284 files.</Callout>
                  <Callout tone="positive" marker={<Status kind="ok" />} title="All tests passed.">42 tests ran in 3.1 seconds.</Callout>
                  <Callout tone="caution" marker={<Status kind="warning" />} title="payments.ts has unsaved changes.">Save the file before you run the migration.</Callout>
                  <Callout tone="critical" marker={<Status kind="failed" />} title="Cannot delete schema.sql.">The file is open in another program.</Callout>
                  <div className="fui-row-gap">
                    {(Object.keys(kinds) as Kind[]).map((k) => <Status key={k} kind={k} />)}
                    <Link href="#view-log">View log</Link>
                  </div>
                </div>
              </TabPanel>
              <TabPanel id="controls">
                <div className="fui-stack">
                  <h2 className="fui-heading">Schedule</h2>
                  <Form onSubmit={(e) => e.preventDefault()}>
                    <NumberField label="Retries" defaultValue={3} minValue={0} maxValue={10} />
                    <ComboBox label="Region" defaultInputValue="eu-central-1" allowsCustomValue>
                      <SelectItem id="eu-central-1">eu-central-1</SelectItem>
                      <SelectItem id="eu-west-1">eu-west-1</SelectItem>
                      <SelectItem id="us-east-1">us-east-1</SelectItem>
                      <SelectItem id="ap-south-1">ap-south-1</SelectItem>
                    </ComboBox>
                    <DateField label="Start date" defaultValue={today(getLocalTimeZone())} />
                    <TimeField label="Start time" />
                    <DatePicker label="End date" defaultValue={today(getLocalTimeZone()).add({ days: 14 })} />
                    <CheckboxGroup label="Notify" defaultValue={['email']}>
                      <Checkbox value="email">By email</Checkbox>
                      <Checkbox value="chat">In chat</Checkbox>
                      <Checkbox value="pager">By pager</Checkbox>
                    </CheckboxGroup>
                    <Slider label="Batch size" defaultValue={40} minValue={10} maxValue={100} step={10} />
                    <TextField label="Notes" multiline rows={3} defaultValue="Runs after the nightly backup." />
                  </Form>
                  <h2 className="fui-heading">Lists and toggles</h2>
                  <div className="fui-row-gap" style={{ alignItems: 'flex-start' }}>
                    <ListBox aria-label="Workers" selectionMode="multiple" defaultSelectedKeys={['w2']} style={{ width: 160 }}>
                      {[1, 2, 3, 4, 5, 6].map((n) => <ListBoxOption key={n} id={`w${n}`}>{`Worker ${n}`}</ListBoxOption>)}
                    </ListBox>
                    <div className="fui-stack" style={{ gap: 8, alignItems: 'flex-start' }}>
                      <ToggleButtonGroup aria-label="View mode" selectionMode="single" defaultSelectedKeys={['details']} disallowEmptySelection>
                        {[['details', 'Details', 'Show files as a details list'], ['list', 'List', 'Show files as a plain list'], ['tiles', 'Tiles', 'Show files as tiles']].map(([id, label, tip]) => (
                          <TooltipTrigger key={id}>
                            <ToggleButton id={id}>{label}</ToggleButton>
                            <Tooltip>{tip}</Tooltip>
                          </TooltipTrigger>
                        ))}
                      </ToggleButtonGroup>
                      <ToggleButton defaultSelected>Word wrap</ToggleButton>
                      <ColorPicker aria-label="Label colour" hueLabel={copy.hue} hexLabel={copy.hex} defaultValue="#1f5fbf">
                        <ColorSwatchPicker aria-label="Presets" colors={['#006e78', '#1f5fbf', '#4f46b8', '#85307f', '#43586e']} />
                      </ColorPicker>
                    </div>
                  </div>
                  <h2 className="fui-heading">Other</h2>
                  <div className="fui-stack" style={{ gap: 12, maxWidth: 520 }}>
                    <Switch defaultSelected>Sync automatically</Switch>
                    <TagGroup
                      label="Labels"
                      addLabel="Add label"
                      onAdd={(text) => setLabels((l) => (l.includes(text) ? l : [...l, text]))}
                      onRemove={(keys) => setLabels((l) => l.filter((x) => !keys.has(x)))}
                    >
                      {labels.map((l) => <Tag key={l} id={l}>{l}</Tag>)}
                    </TagGroup>
                    <DisclosureGroup defaultExpandedKeys={['general']}>
                      <Disclosure id="general" title="General">
                        <p style={{ margin: 0 }}>Name, owner and description of the service.</p>
                      </Disclosure>
                      <Disclosure id="advanced" title="Advanced">
                        <p style={{ margin: 0 }}>Timeouts, retries and connection pooling.</p>
                      </Disclosure>
                    </DisclosureGroup>
                    <DropZone
                      onDrop={async (e) => setDropped(e.items.filter((i) => i.kind === 'file').map((i) => (i as { name: string }).name))}
                    >
                      <span className="fui-muted">{dropped.length ? `Received: ${dropped.join(', ')}` : copy.dropFilesHere}</span>
                      <FileTrigger allowsMultiple onSelect={(list) => setDropped(list ? [...list].map((f) => f.name) : [])}>
                        <Button>Choose files</Button>
                      </FileTrigger>
                    </DropZone>
                    <div className="fui-row-gap" style={{ alignItems: 'flex-start' }}>
                      <ColorArea aria-label="Colour area" defaultValue="hsb(200, 70%, 60%)" />
                      <ColorWheel aria-label="Hue" defaultValue="hsl(200, 70%, 45%)" />
                    </div>
                    <div className="fui-row-gap">
                      <Button onPress={() => notify('failed', 'Cannot reach db.internal.', 'Check the connection and try again.')}>Show error notification</Button>
                      <Button onPress={() => { for (let n = 1; n <= 5; n++) notify('ok', `Build ${n} of 5 finished.`); }}>Show five notifications</Button>
                      <Button onPress={() => setErrorOpen(true)}>Show error dialog</Button>
                    </div>
                  </div>
                  <h2 className="fui-heading">Progress</h2>
                  <div className="fui-stack" style={{ gap: 8, maxWidth: 420 }}>
                    <ProgressBar label="Copying" value={62} />
                    <ProgressBar label="Connecting" isIndeterminate />
                    <Meter label="Disk" value={81} />
                  </div>
                </div>
              </TabPanel>

              <TabPanel id="log" style={{ padding: 0 }}>
                <div onFocus={(e) => setFocusedLog(rowKey(e.target))}>
                <ListView
                  aria-label="Log"
                  virtualized
                  height="calc(13 * var(--row-h))"
                  selectionMode="multiple"
                  selectionCheckboxes
                  selectedKeys={logSel}
                  onSelectionChange={setLogSel}
                  sortDescriptor={logSort}
                  onSortChange={setLogSort}
                >
                  <ListHeader>
                    <ListColumn id="id" numeric allowsSorting width={70}>No.</ListColumn>
                    <ListColumn id="time" numeric allowsSorting width={90}>Time</ListColumn>
                    <ListColumn id="status" allowsSorting width={80}>Level</ListColumn>
                    <ListColumn id="text" isRowHeader>Message</ListColumn>
                  </ListHeader>
                  <ListBody>
                    <Collection items={sortedLog}>
                      {(r) => (
                        <ListRow id={r.id}>
                          <ListCell numeric>{r.id + 1}</ListCell>
                          <ListCell numeric>{r.time}</ListCell>
                          <ListCell><Status kind={r.status} /></ListCell>
                          <ListCell>{r.text}</ListCell>
                        </ListRow>
                      )}
                    </Collection>
                    {log.length < 3000 && <ListLoadMore isLoading={logLoading} onLoadMore={loadMoreLog}>{copy.loadingMore}</ListLoadMore>}
                  </ListBody>
                </ListView>
                </div>
                <div className="fui-pane-body fui-mono fui-muted">
                  Selected: {logSel === 'all' ? `all ${log.length} rows` : logSel.size ? [...logSel].map((k) => Number(k) + 1).sort((a, b) => a - b).join(', ') : 'none'}
                  {' · '}Focused: {focusedLog != null ? Number(focusedLog) + 1 : 'none'}
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </Pane>
      </SplitView>

      <StatusBar>
        <StatusCell live>{message}</StatusCell>
        <StatusCell>{selectionLabel}</StatusCell>
        <StatusCell mono>{visible.length === files.length ? `${files.length} files` : `${visible.length} of ${files.length} files`}</StatusCell>
      </StatusBar>

      <Dialog role="alertdialog" title={selectedFiles.length > 1 ? "Delete files" : "Delete file"} isOpen={dialogOpen} onOpenChange={setDialogOpen}>
        {({ close }) => (
          <>
            <p style={{ margin: 0 }}>
              Delete {selectedFiles.length === 1 ? <span className="fui-mono">{selectedFiles[0].name}</span> : `${selectedFiles.length} files`}? You can undo this from the Edit menu.
            </p>
            <DialogFooter>
              <Button variant="danger" onPress={() => { actions.confirmDelete(); close(); }}>Delete</Button>
              <Button onPress={close} autoFocus>Cancel</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
      <Dialog role="alertdialog" title="Cannot reach db.internal." closeIcon={closeIcon} closeLabel={copy.close} isOpen={errorOpen} onOpenChange={setErrorOpen}>
        {({ close }) => (
          <>
            <Callout tone="critical" marker={<Status kind="failed" />}>The connection timed out after 30 seconds. Check the host name and your network, then try again.</Callout>
            <DialogFooter>
              <Button variant="primary" onPress={close}>Try again</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
      <ToastRegion closeLabel={copy.close} closeIcon={closeIcon} waitingLabel={copy.moreNotifications} />
      <AppearanceDialog
        isOpen={appearanceOpen}
        onOpenChange={setAppearanceOpen}
        onSave={() => setMessage('Appearance saved.')}
      />
    </AppFrame>
  );
}
