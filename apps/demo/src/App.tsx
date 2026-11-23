import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Key } from 'react-aria-components';
import {
  AppFrame, BarButton, BarMenu, BarSearchField, BarSpacer, Breadcrumbs, Button, CommandBar, Dialog, DialogFooter, MenuBar,
  MenuItem, MenuSeparator, Pane, SplitView, StatusBar, StatusCell, ToastRegion, TreeView, useCommands, type Command,
  type TreeNode,
} from '@andreasfreund/fenster-ui';
import { AppearanceDialog } from './AppearanceDialog';
import { copy } from './copy';
import { DemoContext, PageLink } from './demo';
import { closeIcon, commandIcons } from './icons';
import { GROUPS, ORDER, PAGES, type Group } from './pages';

/** A group's own page: its pages as links. */
function GroupIndex({ group }: { group: Group }) {
  return (
    <div className="demo-rules">
      {group.pages.map((p) => (
        <p key={p.id}><PageLink to={p.id}>{p.title}</PageLink>: {p.lead}</p>
      ))}
    </div>
  );
}

/** The page a link to the demo names in its hash, such as #list. */
const pageInHash = () => { const id = decodeURIComponent(location.hash.slice(1)); return ORDER.includes(id) ? id : undefined; };

export function App() {
  const [currentId, setCurrentId] = useState(() => pageInHash() ?? 'overview');
  // How many links were followed to get here; Back is possible while it is above zero.
  const [depth, setDepth] = useState(0);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<Key>>(() => new Set(GROUPS.map((g) => g.id)));
  const [message, setMessage] = useState('Ready');
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const filterRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const group = GROUPS.find((g) => g.id === currentId || g.pages.some((p) => p.id === currentId)) ?? GROUPS[0];
  const page = PAGES.find((p) => p.id === currentId);
  const position = ORDER.indexOf(currentId);

  // Choosing a page in the list browses. Following a link navigates: it adds a history entry, so Back returns.
  const go = (id: string) => {
    if (id === currentId) return;
    history.pushState({ page: id, depth: depth + 1 }, '', `#${id}`);
    setCurrentId(id);
    setDepth(depth + 1);
  };
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      // Without a state the address was edited by hand.
      const state = e.state as { page?: string; depth?: number } | null;
      const id = state?.page && ORDER.includes(state.page) ? state.page : pageInHash();
      if (!id) return;
      setCurrentId(id);
      setDepth(state?.depth ?? 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // The address always names the page shown, so it can be copied as a link.
  useEffect(() => { history.replaceState({ page: currentId, depth }, '', `#${currentId}`); }, [currentId, depth]);

  // A new page starts at its top.
  useLayoutEffect(() => { contentRef.current?.scrollTo(0, 0); }, [currentId]);

  // Routine feedback fades back to Ready.
  useEffect(() => {
    if (message === 'Ready') return;
    const timer = setTimeout(() => setMessage('Ready'), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  const query = filter.trim().toLowerCase();
  const nodes = GROUPS
    .map((g) => ({ id: g.id, label: g.title, children: g.pages.filter((p) => p.title.toLowerCase().includes(query)).map((p) => ({ id: p.id, label: p.title })) }))
    .filter((n) => n.children.length);
  const shown = nodes.reduce((n, g) => n + g.children.length, 0);

  const commands: Record<string, Command> = {
    previous: { id: 'previous', label: 'Previous page', run: () => setCurrentId(ORDER[position - 1]), isDisabled: position <= 0 },
    next: { id: 'next', label: 'Next page', run: () => setCurrentId(ORDER[position + 1]), isDisabled: position >= ORDER.length - 1 },
    back: { id: 'back', label: 'Back', run: () => history.back(), isDisabled: depth === 0 },
    find: { id: 'find', label: 'Find page', shortcut: 'Mod+F', icon: commandIcons.find, run: () => { filterRef.current?.focus(); filterRef.current?.select(); } },
    appearance: { id: 'appearance', label: 'Appearance...', run: () => setAppearanceOpen(true) },
    about: { id: 'about', label: 'About', run: () => setAboutOpen(true) },
  };
  // oxlint-disable-next-line react/refs -- the commands read refs when they run, not during render
  useCommands(Object.values(commands), { enabled: !appearanceOpen && !aboutOpen });

  const Body = page?.Body;
  const crumbs = [{ id: group.id, label: group.title }, ...(page ? [{ id: page.id, label: page.title }] : [])];

  return (
    <DemoContext.Provider value={{ say: setMessage, go, contentRef }}>
      <AppFrame>
        <MenuBar aria-label="Menu bar">
          <BarMenu label="View">
            <MenuItem command={commands.appearance} />
          </BarMenu>
          <BarMenu label="Go">
            <MenuItem command={commands.previous} />
            <MenuItem command={commands.next} />
            <MenuSeparator />
            <MenuItem command={commands.back} />
            <MenuSeparator />
            <MenuItem command={commands.find} />
          </BarMenu>
          <BarMenu label="Help">
            <MenuItem command={commands.about} />
          </BarMenu>
        </MenuBar>
        <CommandBar aria-label="Actions">
          <BarButton isDisabled={commands.previous.isDisabled} onPress={commands.previous.run}>Previous</BarButton>
          <BarButton isDisabled={commands.next.isDisabled} onPress={commands.next.run}>Next</BarButton>
          <BarSpacer />
          <BarSearchField aria-label="Filter pages" placeholder="Filter pages" clearIcon={closeIcon} clearLabel={copy.clearFilter} value={filter} onChange={setFilter} inputRef={filterRef} />
        </CommandBar>

        <SplitView resizable collapsible splitterLabel={copy.resizePagesPane} expandLabel={copy.showPages}>
          <Pane aria-label="Pages">
            <TreeView
              aria-label="Pages"
              items={nodes as TreeNode[]}
              selectedKeys={[currentId]}
              onSelectionChange={(keys) => { const k = keys === 'all' ? undefined : [...keys][0]; if (k !== undefined) setCurrentId(String(k)); }}
              // While a filter is on, every group that still has pages is open.
              expandedKeys={query ? GROUPS.map((g) => g.id) : expanded}
              onExpandedChange={(keys) => { if (!query) setExpanded(keys); }}
              renderEmptyState={() => 'No pages match the filter.'}
            />
          </Pane>
          <Pane ref={contentRef}>
            <Breadcrumbs items={crumbs} onAction={go} />
            <article className="fui-pane-body demo-page">
              <header className="demo-head">
                <h1 className="fui-display">{page ? page.title : group.title}</h1>
                <p>{page ? page.lead : group.lead}</p>
              </header>
              {Body ? <Body key={currentId} /> : <GroupIndex group={group} />}
            </article>
          </Pane>
        </SplitView>

        <StatusBar>
          <StatusCell live>{message}</StatusCell>
          <StatusCell>{page ? page.title : group.title}</StatusCell>
          <StatusCell mono>{shown === PAGES.length ? `${PAGES.length} pages` : `${shown} of ${PAGES.length} pages`}</StatusCell>
        </StatusBar>

        <Dialog title="About fenster-ui" isOpen={aboutOpen} onOpenChange={setAboutOpen}>
          {({ close }) => (
            <>
              <p style={{ margin: 0, maxWidth: 360 }}>A compact desktop-style component framework on React Aria Components. Released under the MIT licence.</p>
              <DialogFooter>
                <Button variant="primary" onPress={close} autoFocus>Close</Button>
              </DialogFooter>
            </>
          )}
        </Dialog>
        <ToastRegion closeLabel={copy.close} closeIcon={closeIcon} waitingLabel={copy.moreNotifications} />
        <AppearanceDialog isOpen={appearanceOpen} onOpenChange={setAppearanceOpen} onSave={() => setMessage('Appearance saved.')} />
      </AppFrame>
    </DemoContext.Provider>
  );
}
