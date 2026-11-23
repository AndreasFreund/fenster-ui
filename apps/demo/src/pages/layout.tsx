import { useRef, useState } from 'react';
import type { Key, Selection, SortDescriptor } from 'react-aria-components';
import {
  BarButton, BarMenu, BarSearchField, BarSeparator, BarSpacer, BarTextField, Button, CommandBar, Dialog, DialogFooter,
  ListBody, ListCell, ListColumn, ListHeader, ListRow, ListView, MenuBar, MenuItem, MenuSeparator, Pane, SplitView,
  StatusBar, StatusCell, Submenu, ToggleButton, Tooltip, TooltipTrigger, isMac, useCommands, type Command,
} from '@andreasfreund/fenster-ui';
import { copy } from '../copy';
import { initialFiles, now, type FileRow } from '../data';
import { Example, useDemo } from '../demo';
import { closeIcon, commandIcons, refreshIcon } from '../icons';
import { notify, Status } from '../status';

const FRAME = `
<AppFrame>
  <MenuBar aria-label="Menu bar">…</MenuBar>
  <CommandBar aria-label="Actions">…</CommandBar>
  <SplitView resizable collapsible splitterLabel="Resize navigation" expandLabel="Show navigation">
    <Pane aria-label="Navigation">…</Pane>
    <Pane>…</Pane>
  </SplitView>
  <StatusBar>
    <StatusCell live>{message}</StatusCell>
    <StatusCell mono>12 files</StatusCell>
  </StatusBar>
</AppFrame>`;

export function Frame() {
  return (
    <>
      <Example
        title="Structure"
        note="An AppFrame fills the window. Only its panes scroll. The window around this page is the full example."
        code={FRAME}
      />
      <Example title="Split view" note="Drag the divider, or focus it and use the arrow keys. The first status cell stretches; the rest size to their text." flush>
        <div className="demo-frame">
          <SplitView resizable defaultNavWidth={160} splitterLabel={copy.resizeExamplePane}>
            <Pane aria-label="Example navigation"><div className="fui-pane-body">Navigation</div></Pane>
            <Pane><div className="fui-pane-body">Content</div></Pane>
          </SplitView>
          <StatusBar>
            <StatusCell>Ready</StatusCell>
            <StatusCell mono>2 panes</StatusCell>
          </StatusBar>
        </div>
      </Example>
    </>
  );
}

type Change = { kind: 'delete' | 'create'; items: { file: FileRow; index: number }[] };
const describe = (c: Change) => (c.items.length === 1 ? c.items[0].file.name : `${c.items.length} files`);

// Ctrl+N is reserved by browsers, so New file is Alt+N.
const KEYS = {
  newFile: 'Alt+N',
  save: 'Mod+S',
  delete: isMac ? 'Mod+Backspace' : 'Delete',
  undo: 'Mod+Z',
  redo: isMac ? 'Mod+Shift+Z' : 'Mod+Y',
};

const COMMANDS = `
const commands = {
  save: { id: 'save', label: 'Save', shortcut: 'Mod+S', run: save, icon: saveIcon },
  delete: { id: 'delete', label: 'Delete', shortcut: 'Delete', run: askDelete, isDisabled: !selection.length },
};
useCommands(Object.values(commands)); // binds the shortcuts

<BarMenu label="File">
  <MenuItem command={commands.save} />
  <MenuItem command={commands.delete} />
</BarMenu>`;

function CommandsExample() {
  const { say } = useDemo();
  const [files, setFiles] = useState(initialFiles);
  const [undoStack, setUndo] = useState<Change[]>([]);
  const [redoStack, setRedo] = useState<Change[]>([]);
  const [rowSel, setRowSel] = useState<Selection>(new Set(['payments.ts']));
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const untitled = useRef(1);

  const sorted = (() => {
    if (!sort) return files;
    const k = sort.column as keyof FileRow;
    const out = [...files].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return sort.direction === 'descending' ? out.reverse() : out;
  })();
  const selected = rowSel === 'all' ? files : files.filter((f) => rowSel.has(f.id));

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
      say(`Created ${name}.`);
    },
    save: () => say('All files saved.'),
    confirmDelete: () => {
      const c: Change = { kind: 'delete', items: selected.map((file) => ({ file, index: files.indexOf(file) })) };
      record(c);
      say(`Deleted ${describe(c)}.`);
    },
    undo: () => {
      const c = undoStack.at(-1);
      if (!c) return;
      apply(c, 'undo');
      setUndo((u) => u.slice(0, -1));
      setRedo((r) => [...r, c]);
      say(`Undid ${c.kind} ${describe(c)}.`);
    },
    redo: () => {
      const c = redoStack.at(-1);
      if (!c) return;
      apply(c, 'do');
      setRedo((r) => r.slice(0, -1));
      setUndo((u) => [...u, c]);
      say(`Redid ${c.kind} ${describe(c)}.`);
    },
    refresh: () => {
      // The page stays usable while refreshing: show the working-in-background pointer.
      setWorking(true);
      say('Refreshing...');
      setTimeout(() => {
        setWorking(false);
        say('Refreshed.');
        notify('ok', 'Refresh finished.', 'The file list is up to date.');
      }, 1500);
    },
  };

  const commands: Record<string, Command> = {
    newFile: { id: 'new', label: 'New file', shortcut: KEYS.newFile, run: actions.newFile, icon: commandIcons.newFile },
    save: { id: 'save', label: 'Save', shortcut: KEYS.save, run: actions.save, icon: commandIcons.save },
    delete: { id: 'delete', label: 'Delete', shortcut: KEYS.delete, run: () => setDialogOpen(true), isDisabled: !selected.length },
    undo: { id: 'undo', label: 'Undo', shortcut: KEYS.undo, run: actions.undo, isDisabled: !undoStack.length },
    redo: { id: 'redo', label: 'Redo', shortcut: KEYS.redo, run: actions.redo, isDisabled: !redoStack.length },
    refresh: { id: 'refresh', label: 'Refresh', run: actions.refresh, isDisabled: working },
  };
  // oxlint-disable-next-line react/refs -- the commands read refs when they run, not during render
  useCommands(Object.values(commands), { enabled: !dialogOpen });

  return (
    <div className={working ? 'fui-working' : undefined}>
      <MenuBar aria-label="Example menu bar">
        <BarMenu label="File">
          <MenuItem command={commands.newFile} />
          <MenuItem command={commands.save} />
          <MenuSeparator />
          <MenuItem command={commands.delete} />
        </BarMenu>
        <BarMenu label="Edit">
          <MenuItem command={commands.undo} />
          <MenuItem command={commands.redo} />
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
          </Submenu>
          <MenuItem command={commands.refresh} />
        </BarMenu>
      </MenuBar>
      <CommandBar aria-label="Example actions">
        <BarButton icon={commandIcons.newFile} onPress={commands.newFile.run}>New file</BarButton>
        <BarButton isDisabled={commands.delete.isDisabled} onPress={commands.delete.run}>Delete</BarButton>
        <BarSeparator />
        <TooltipTrigger>
          <BarButton icon={refreshIcon} aria-label="Refresh" isDisabled={commands.refresh.isDisabled} onPress={commands.refresh.run} />
          <Tooltip>Refresh</Tooltip>
        </TooltipTrigger>
      </CommandBar>
      <ListView aria-label="Files" selectionMode="multiple" selectedKeys={rowSel} onSelectionChange={setRowSel} sortDescriptor={sort} onSortChange={setSort} onRowAction={(k) => say(`Opened ${k}.`)}>
        <ListHeader>
          <ListColumn id="name" isRowHeader allowsSorting>Name</ListColumn>
          <ListColumn id="size" numeric allowsSorting>Size</ListColumn>
          <ListColumn id="status">State</ListColumn>
        </ListHeader>
        <ListBody items={sorted} renderEmptyState={() => 'This folder is empty.'}>
          {(f) => (
            <ListRow id={f.id}>
              <ListCell>{f.name}</ListCell>
              <ListCell numeric>{f.size.toLocaleString('en-US')}</ListCell>
              <ListCell><Status kind={f.status} /></ListCell>
            </ListRow>
          )}
        </ListBody>
      </ListView>
      <Dialog role="alertdialog" title={selected.length > 1 ? 'Delete files' : 'Delete file'} isOpen={dialogOpen} onOpenChange={setDialogOpen}>
        {({ close }) => (
          <>
            <p style={{ margin: 0 }}>
              Delete {selected.length === 1 ? <span className="fui-mono">{selected[0].name}</span> : `${selected.length} files`}? You can undo this from the Edit menu.
            </p>
            <DialogFooter>
              <Button variant="danger" onPress={() => { actions.confirmDelete(); close(); }}>Delete</Button>
              <Button onPress={close} autoFocus>Cancel</Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}

export function Commands() {
  return (
    <>
      <Example
        title="One definition per command"
        note="A Command holds the label, shortcut, icon, disabled state and action. The menu item, the bar button and the shortcut all read it, so they cannot disagree. Delete, Undo and Redo are disabled until they apply."
        code={COMMANDS}
        flush
      >
        <CommandsExample />
      </Example>
    </>
  );
}

const BARS = `
<CommandBar aria-label="Actions">
  <BarButton icon={newIcon} onPress={newFile}>New file</BarButton>
  <BarTextField label="Path" mono stretch value={path} onChange={setPath} />
  <BarSpacer />
  <BarSearchField aria-label="Filter files" placeholder="Filter files"
    clearIcon={closeIcon} clearLabel="Clear filter" value={filter} onChange={setFilter} />
</CommandBar>`;

export function Bars() {
  const { say } = useDemo();
  const [path, setPath] = useState('/var/lib/billing');
  const [filter, setFilter] = useState('pay');
  return (
    <>
      <Example
        title="Command bar"
        note="Buttons carry text; an icon is added only for a few universal commands. An icon-only button needs a name and a tooltip. Each control is its own Tab stop."
        code={BARS}
        flush
      >
        <CommandBar aria-label="Example bar">
          <BarButton icon={commandIcons.newFile} onPress={() => say('Created a file.')}>New file</BarButton>
          <TooltipTrigger>
            <BarButton icon={commandIcons.save} aria-label="Save" onPress={() => say('All files saved.')} />
            <Tooltip>Save</Tooltip>
          </TooltipTrigger>
          <BarSeparator />
          <ToggleButton bar defaultSelected>Word wrap</ToggleButton>
          <BarSeparator />
          <BarTextField label="Path" mono stretch value={path} onChange={setPath} />
          <BarSpacer />
          <BarSearchField aria-label="Filter files" placeholder="Filter files" clearIcon={closeIcon} clearLabel={copy.clearFilter} value={filter} onChange={setFilter} />
        </CommandBar>
        <p className="demo-readout fui-mono fui-muted">Path: {path} · Filter: {filter || 'none'}</p>
      </Example>
      <Example title="Search field" note="A filter changes what is listed, so it gets a way back: the clear button shows while the field has text, and Escape clears it too." />
    </>
  );
}
