import { useState } from 'react';
import { Callout } from '@andreasfreund/fenster-ui';
import { copy } from '../copy';
import { Example, PageLink } from '../demo';
import { ExampleApp } from '../ExampleApp';
import { closeIcon } from '../icons';
import { Status } from '../status';

const START = `
import '@andreasfreund/fenster-ui/style.css';
import '@andreasfreund/fenster-ui/fonts.css';
import { AppFrame, LabelsProvider, initAppearance } from '@andreasfreund/fenster-ui';

initAppearance(); // before the first render

root.render(
  <LabelsProvider labels={{ invalid: 'FAIL' }}>
    <AppFrame>…</AppFrame>
  </LabelsProvider>
);`;

export function ExamplePage() {
  return (
    <Example title="File browser" note="Menus, a command bar, a tree, a sortable list, tabs, a callout and a status bar, working together. Everything in it is live." flush>
      <div className="demo-frame demo-frame--app"><ExampleApp /></div>
    </Example>
  );
}

export function Overview() {
  const [noteShown, setNoteShown] = useState(true);
  return (
    <>
      {noteShown && (
        <Callout tone="info" marker={<Status kind="note" />} title="This window is the demo." onDismiss={() => setNoteShown(false)} closeIcon={closeIcon} closeLabel={copy.close}>
          Its menu bar, command bar, panes and status bar are the framework's own components.
        </Callout>
      )}
      <Example
        title="Install"
        note="React Aria provides behaviour, keyboard handling and accessibility. The framework adds layout, look and a few app-level helpers."
        code="npm install @andreasfreund/fenster-ui react-aria-components react-aria"
      />
      <Example title="Start" note="Load the styles and fonts once, apply the saved appearance, then render inside an AppFrame." code={START} />
      <Example title="Where next">
        <p><PageLink to="example">Example app</PageLink>: the components together, as an app would use them.</p>
        <p><PageLink to="guidelines">Design guidelines</PageLink>: the rules the components and this demo follow.</p>
        <p><PageLink to="frame">App frame</PageLink>: bars, panes and the status bar.</p>
        <p><PageLink to="list">List view</PageLink>: sorting, resizing and selection.</p>
      </Example>
    </>
  );
}

const RULES: [string, string][] = [
  ['Layout', 'Bars on top, status bar at the bottom, navigation left, content right; panes divided by single lines. Borders are 1px, there are no shadows, and corners are square except on buttons, tab tops and radios.'],
  ['Type', 'One size for the page, one for a section, one for a group or dialog, one for everything else, and a monospaced one for code, paths and status words. Emphasise with weight, not size.'],
  ['Colour', 'The pale accent is the one highlight: selected, hovered, open, toggled. Solid accent means on or primary. Tones are for status only and always come with a word.'],
  ['Status and feedback', 'State goes in a status column, not a row tint. Routine feedback goes to the status bar and may fade. Errors stay until dismissed and say what happened, then what to do.'],
  ['Controls', 'Text first: icons only for kinds of objects and a few universal commands. Labels are one or two words in sentence case. One primary button per dialog.'],
  ['Emphasis and state', 'Make the action most users came for the prominent one. Give each setting one place, disable what does not apply right now, and leave out what never will. Show any state that changes what is listed.'],
  ['Navigation', 'Selecting browses; following a link navigates, and navigation is what Back undoes. Changes to a view\'s layout preview live and can be cancelled.'],
  ['Touch', 'Built for mouse and keyboard, usable on a phone: a tap selects, only panes scroll, bars scroll sideways.'],
  ['Motion', 'None, except indeterminate progress and the newest notification sliding in.'],
];

export function Guidelines() {
  return (
    <>
      <div className="demo-rules">
        {RULES.map(([name, text]) => (
          <p key={name}><strong className="fui-strong">{name}.</strong> {text}</p>
        ))}
      </div>
      <Example title="In this demo">
        <p>Choosing a page in the list on the left browses. A link such as <PageLink to="status">Status and callouts</PageLink> navigates, so Back in the Go menu returns here.</p>
        <p>The page filter in the command bar changes what the list shows, so it stays visible and has a clear button. The status bar counts the pages it leaves.</p>
      </Example>
    </>
  );
}
