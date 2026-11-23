import { useEffect, useMemo, useRef, useState } from 'react';
import type { Key, Selection, SortDescriptor } from 'react-aria-components';
import {
  BarButton, BarMenu, BarSearchField, BarSeparator, BarSpacer, Breadcrumbs, Callout, CommandBar, Form, IconLabel,
  ListBody, ListCell, ListColumn, ListHeader, ListRow, ListView, MenuBar, MenuItem, MenuSeparator, Pane, Select,
  SelectItem, SplitView, StatusBar, StatusCell, Submenu, Tab, TabList, TabPanel, Tabs, TextField, Tooltip,
  TooltipTrigger, TreeView, useCommands, type Command,
} from '@andreasfreund/fenster-ui';
import { copy } from './copy';
import { initialFiles, now, pathOf, tree, type FileRow } from './data';
import { closeIcon, commandIcons, fileIcon, refreshIcon, treeIcon } from './icons';
import { Status } from './status';

/**
 * The components together as a small file browser: the parts of an app frame, without the frame itself, so it
 * fits in a page as well as in a window.
 */
export function ExampleApp() {
  const [files, setFiles] = useState(initialFiles);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('Ready');
  const [working, setWorking] = useState(false);
  const [treeSel, setTreeSel] = useState<Selection>(new Set(['api']));
  const [expanded, setExpanded] = useState<Set<Key>>(new Set(['proj', 'src', 'api', 'db']));
  const [rowSel, setRowSel] = useState<Selection>(new Set(['payments.ts']));
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);
  const filterRef = useRef<HTMLInputElement>(null);
  const untitled = useRef(1);

  const treeKey = treeSel === 'all' ? undefined : [...treeSel][0];
  const path = (treeKey !== undefined && pathOf.get(treeKey)) || 'billing-service';
  const visible = useMemo(() => files.filter((f) => f.name.toLowerCase().includes(filter.trim().toLowerCase())), [files, filter]);
  const sorted = useMemo(() => {
    if (!sort) return visible;
    const k = sort.column as keyof FileRow;
    const out = [...visible].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0));
    return sort.direction === 'descending' ? out.reverse() : out;
  }, [visible, sort]);
  const selected = rowSel === 'all' ? visible : files.filter((f) => rowSel.has(f.id));

  // Routine feedback fades back to Ready.
  useEffect(() => {
    if (message === 'Ready' || working) return;
    const timer = setTimeout(() => setMessage('Ready'), 6000);
    return () => clearTimeout(timer);
  }, [message, working]);

  const commands: Record<string, Command> = {
    newFile: {
      id: 'new', label: 'New file', icon: commandIcons.newFile,
      run: () => {
        const name = `untitled-${untitled.current++}.ts`;
        setFiles((fs) => [...fs, { id: name, name, size: 0, modified: now(), status: 'draft' }]);
        setRowSel(new Set([name]));
        setMessage(`Created ${name}.`);
      },
    },
    save: { id: 'save', label: 'Save', icon: commandIcons.save, run: () => setMessage('All files saved.') },
    refresh: {
      id: 'refresh', label: 'Refresh', isDisabled: working,
      run: () => {
        setWorking(true);
        setMessage('Refreshing...');
        setTimeout(() => { setWorking(false); setMessage('Refreshed.'); }, 1500);
      },
    },
  };
  // oxlint-disable-next-line react/refs -- the commands read refs when they run, not during render
  useCommands(Object.values(commands));

  return (
    <>
      <MenuBar aria-label="Example menu bar">
        <BarMenu label="File">
          <MenuItem command={commands.newFile} />
          <MenuItem command={commands.save} />
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
        </BarMenu>
      </MenuBar>
      <CommandBar aria-label="Example actions" className={working ? 'fui-working' : undefined}>
        <BarButton icon={commandIcons.newFile} onPress={commands.newFile.run}>New file</BarButton>
        <BarButton icon={commandIcons.save} onPress={commands.save.run}>Save</BarButton>
        <BarSeparator />
        <TooltipTrigger>
          <BarButton icon={refreshIcon} aria-label="Refresh" isDisabled={commands.refresh.isDisabled} onPress={commands.refresh.run} />
          <Tooltip>Refresh</Tooltip>
        </TooltipTrigger>
        <BarSpacer />
        <BarSearchField aria-label="Filter files" placeholder="Filter files" clearIcon={closeIcon} clearLabel={copy.clearFilter} value={filter} onChange={setFilter} inputRef={filterRef} />
      </CommandBar>

      <SplitView resizable defaultNavWidth={210} splitterLabel={copy.resizeExamplePane}>
        <Pane aria-label="Folders">
          <TreeView aria-label="Folders" itemIcon={treeIcon} items={tree} selectedKeys={treeSel} onSelectionChange={setTreeSel} expandedKeys={expanded} onExpandedChange={setExpanded} />
        </Pane>
        <Pane>
          <Breadcrumbs
            items={path.split('/').map((label, i, all) => ({ id: all.slice(0, i + 1).join('/'), label }))}
            onAction={(p) => { for (const [key, value] of pathOf) if (value === p) setTreeSel(new Set([key])); }}
          />
          <div className="fui-pane-body fui-stack">
            <h1 className="fui-display">billing-service</h1>
            <Tabs defaultSelectedKey="files">
              <TabList aria-label="Views">
                <Tab id="files">Files</Tab>
                <Tab id="connection">Connection</Tab>
                <Tab id="history" isDisabled>History</Tab>
              </TabList>
              <TabPanel id="files" style={{ padding: 0 }}>
                <ListView aria-label="Files" selectionMode="multiple" selectedKeys={rowSel} onSelectionChange={setRowSel} sortDescriptor={sort} onSortChange={setSort} resizableColumns onRowAction={(k) => setMessage(`Opened ${k}.`)}>
                  <ListHeader>
                    <ListColumn id="name" isRowHeader allowsSorting allowsResizing defaultWidth="2fr" minWidth={100}>Name</ListColumn>
                    <ListColumn id="size" numeric allowsSorting allowsResizing defaultWidth="1fr" minWidth={60}>Size</ListColumn>
                    <ListColumn id="modified" numeric allowsSorting allowsResizing defaultWidth="1.5fr" minWidth={120}>Modified</ListColumn>
                    <ListColumn id="status" allowsResizing defaultWidth={90} minWidth={70}>State</ListColumn>
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
              </TabPanel>
              <TabPanel id="connection">
                <Form onSubmit={(e) => e.preventDefault()}>
                  <TextField label="Host" defaultValue="db.internal" />
                  <TextField label="Data folder" mono defaultValue="/var/lib/billing" />
                  <Select label="Driver" defaultSelectedKey="pg">
                    <SelectItem id="pg">PostgreSQL</SelectItem>
                    <SelectItem id="mysql">MySQL</SelectItem>
                  </Select>
                </Form>
              </TabPanel>
              <TabPanel id="history">Past changes.</TabPanel>
            </Tabs>
            <Callout tone="caution" marker={<Status kind="warning" />} title="payments.ts has unsaved changes.">Save the file before you run the migration.</Callout>
          </div>
        </Pane>
      </SplitView>

      <StatusBar>
        <StatusCell live>{message}</StatusCell>
        <StatusCell>{selected.length === 0 ? 'No selection' : selected.length === 1 ? selected[0].name : `${selected.length} files selected`}</StatusCell>
        <StatusCell mono>{visible.length === files.length ? `${files.length} files` : `${visible.length} of ${files.length} files`}</StatusCell>
      </StatusBar>
    </>
  );
}
