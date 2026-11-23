import { useState } from 'react';
import {
  BarButton, Button, Callout, Checkbox, CheckboxGroup, CommandBar, Dialog, DialogFooter, DialogTrigger, Disclosure,
  DisclosureGroup, DropZone, FileTrigger, Form, Popover, Radio, RadioGroup, Select, SelectItem, TextField, Tooltip,
  TooltipTrigger,
} from '@andreasfreund/fenster-ui';
import { copy } from '../copy';
import { Example, PageLink, useDemo } from '../demo';
import { closeIcon, commandIcons, refreshIcon } from '../icons';
import { kinds, notify, Status, type Kind } from '../status';

const STATUS = `
// status.tsx: the app's states, each with a tone and a word.
export const kinds = {
  ok: { tone: 'positive', word: 'OK' },
  warning: { tone: 'caution', word: 'WARN' },
  failed: { tone: 'critical', word: 'FAIL' },
};

export function Status({ kind }) {
  return <StatusMarker tone={kinds[kind].tone}>{kinds[kind].word}</StatusMarker>;
}`;

export function StatusPage() {
  const [noteShown, setNoteShown] = useState(true);
  return (
    <>
      <Example
        title="Status markers"
        note="A coloured square and a word. The framework has tones, not meanings — map your app's states to tones in one place."
        code={STATUS}
      >
        <div className="fui-row-gap">
          {(Object.keys(kinds) as Kind[]).map((k) => <Status key={k} kind={k} />)}
        </div>
      </Example>
      <Example title="Callouts" note="An inline message tinted by tone. onDismiss adds a close button.">
        {noteShown
          ? <Callout tone="info" marker={<Status kind="note" />} title="Index rebuilt." onDismiss={() => setNoteShown(false)} closeIcon={closeIcon} closeLabel={copy.close}>The search index now covers 1,284 files.</Callout>
          : <div><Button onPress={() => setNoteShown(true)}>Show again</Button></div>}
        <Callout tone="positive" marker={<Status kind="ok" />} title="All tests passed.">42 tests ran in 3.1 seconds.</Callout>
        <Callout tone="caution" marker={<Status kind="warning" />} title="payments.ts has unsaved changes.">Save the file before you run the migration.</Callout>
        <Callout tone="critical" marker={<Status kind="failed" />} title="Cannot delete schema.sql.">The file is open in another program. Close it there, then try again.</Callout>
      </Example>
    </>
  );
}

export function Notifications() {
  const { say } = useDemo();
  return (
    <>
      <Example title="Status bar" note="Routine feedback goes to the status bar at the bottom of the window and fades after a few seconds.">
        <div className="fui-row-gap">
          <Button onPress={() => say('All files saved.')}>Status message</Button>
        </div>
      </Example>
      <Example
        title="Notifications"
        note="A notification is for news that arrives on its own, such as a finished background job. It stays until closed. The newest three show; the rest are counted."
        code={`toasts.add({ title, description, marker: <Status kind="ok" /> });`}
      >
        <div className="fui-row-gap">
          <Button onPress={() => notify('failed', 'Cannot reach db.internal.', 'Check the connection and try again.')}>Error notification</Button>
          <Button onPress={() => { for (let n = 1; n <= 5; n++) notify('ok', `Build ${n} of 5 finished.`); }}>Five notifications</Button>
        </div>
      </Example>
    </>
  );
}

const TOOLTIP = `
<TooltipTrigger>
  <BarButton icon={refreshIcon} aria-label="Refresh" onPress={refresh} />
  <Tooltip>Refresh</Tooltip>
</TooltipTrigger>`;

export function Tooltips() {
  const { say } = useDemo();
  return (
    <>
      <Example
        title="Tooltip"
        note="A tooltip names an icon-only control. Opens on hover and keyboard focus — wrap only focusable elements."
        code={TOOLTIP}
        flush
      >
        <CommandBar aria-label="Example bar">
          <TooltipTrigger>
            <BarButton icon={refreshIcon} aria-label="Refresh" onPress={() => say('Refreshed.')} />
            <Tooltip>Refresh</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <BarButton icon={commandIcons.save} aria-label="Save" onPress={() => say('All files saved.')} />
            <Tooltip>Save</Tooltip>
          </TooltipTrigger>
        </CommandBar>
      </Example>
      <Example title="See also">
        <p><PageLink to="list">List view</PageLink>: a column that says what each file icon stands for.</p>
      </Example>
    </>
  );
}

type Where = 'center' | 'pane' | 'window';

const FLOATING = `
<Dialog title="Find" isModal={false} placement="center" over={paneRef}
  isOpen={open} onOpenChange={setOpen}>
  …
</Dialog>`;

export function Dialogs() {
  const { say, contentRef } = useDemo();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [where, setWhere] = useState<Where>('center');
  return (
    <>
      <Example title="Modal dialogs" note="A modal dialog blocks the window until answered. Forms in a dialog size to their widest control.">
        <div className="fui-row-gap">
          <Button onPress={() => setConfirmOpen(true)}>Confirm dialog</Button>
          <Button onPress={() => setErrorOpen(true)}>Error dialog</Button>
          <Button onPress={() => setFormOpen(true)}>Form dialog</Button>
        </div>
      </Example>
      <Example
        title="Floating dialog"
        note="A non-modal dialog floats without blocking; Escape closes it. Place it at the window's top end, or inside an element — it follows that element on resize."
        code={FLOATING}
      >
        <RadioGroup label="Position" value={where} onChange={(v) => setWhere(v as Where)}>
          <Radio value="center">Centre of this pane</Radio>
          <Radio value="pane">Top end of this pane</Radio>
          <Radio value="window">Top end of the window</Radio>
        </RadioGroup>
        <div><Button isDisabled={findOpen} onPress={() => setFindOpen(true)}>Find panel</Button></div>
      </Example>
      <Example title="Popover" note="A small dialog anchored to its trigger. Escape or outside click closes it.">
        <div>
          <DialogTrigger>
            <Button>Retry policy</Button>
            <Popover title="Retry policy">
              <Checkbox defaultSelected>Retry on timeout</Checkbox>
              <Checkbox>Retry on refusal</Checkbox>
            </Popover>
          </DialogTrigger>
        </div>
      </Example>

      <Dialog role="alertdialog" title="Delete file" isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
        {({ close }) => (
          <>
            <p style={{ margin: 0 }}>Delete <span className="fui-mono">payments.ts</span>? This cannot be undone.</p>
            <DialogFooter>
              <Button variant="danger" onPress={() => { say('Nothing was deleted.'); close(); }}>Delete</Button>
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
      <Dialog title="Connection" isOpen={formOpen} onOpenChange={setFormOpen}>
        {({ close }) => (
          <Form onSubmit={(e) => { e.preventDefault(); say('Connection saved.'); close(); }}>
            <TextField label="Host" defaultValue="db.internal" autoFocus />
            <Select label="Driver" defaultSelectedKey="pg">
              <SelectItem id="pg">PostgreSQL</SelectItem>
              <SelectItem id="mysql">MySQL</SelectItem>
            </Select>
            <CheckboxGroup label="Options" defaultValue={['reconnect']}>
              <Checkbox value="reconnect">Reconnect automatically when the connection drops</Checkbox>
              <Checkbox value="tls">Require an encrypted connection</Checkbox>
            </CheckboxGroup>
            <DialogFooter className="fui-form-full">
              <Button variant="primary" type="submit">OK</Button>
              <Button onPress={close}>Cancel</Button>
            </DialogFooter>
          </Form>
        )}
      </Dialog>
      <Dialog
        title="Find"
        isModal={false}
        placement={where === 'center' ? 'center' : 'top end'}
        over={where === 'window' ? undefined : contentRef}
        isOpen={findOpen}
        onOpenChange={setFindOpen}
      >
        <Form onSubmit={(e) => { e.preventDefault(); say('No more matches.'); }}>
          <TextField label="Find" defaultValue="invoice" />
          <Checkbox className="fui-form-full">Match case</Checkbox>
          <DialogFooter className="fui-form-full">
            <Button variant="primary" type="submit">Find next</Button>
            <Button onPress={() => setFindOpen(false)}>Close</Button>
          </DialogFooter>
        </Form>
      </Dialog>
    </>
  );
}

export function Sections() {
  const [dropped, setDropped] = useState<string[]>([]);
  return (
    <>
      <Example title="Disclosure" note="Sections that open and close in place.">
        <DisclosureGroup defaultExpandedKeys={['general']}>
          <Disclosure id="general" title="General">
            <p>Name, owner and description of the service.</p>
          </Disclosure>
          <Disclosure id="advanced" title="Advanced">
            <p>Timeouts, retries and connection pooling.</p>
          </Disclosure>
        </DisclosureGroup>
      </Example>
      <Example title="Drop zone" note="Drop target for external files, with a button fallback.">
        <DropZone onDrop={async (e) => setDropped(e.items.filter((i) => i.kind === 'file').map((i) => (i as { name: string }).name))}>
          <span className="fui-muted">{dropped.length ? `Received: ${dropped.join(', ')}` : copy.dropFilesHere}</span>
          <FileTrigger allowsMultiple onSelect={(list) => setDropped(list ? [...list].map((f) => f.name) : [])}>
            <Button>Choose files</Button>
          </FileTrigger>
        </DropZone>
      </Example>
    </>
  );
}
