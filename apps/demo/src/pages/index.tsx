import type { ComponentType } from 'react';
import { Lists, Smaller, Trees } from './collections';
import { Buttons, Choices, DatesAndColours, Fields, Ranges } from './controls';
import { Dialogs, Notifications, Sections, StatusPage, Tooltips } from './feedback';
import { Bars, Commands, Frame } from './layout';
import { Guidelines, Overview } from './start';

export interface Page {
  id: string;
  title: string;
  /** One sentence under the title. */
  lead: string;
  Body: ComponentType;
}

export interface Group { id: string; title: string; lead: string; pages: Page[] }

export const GROUPS: Group[] = [
  {
    id: 'start', title: 'Getting started', lead: 'What the framework is and the rules it follows.', pages: [
      { id: 'overview', title: 'Overview', lead: 'A compact desktop-style component framework on React Aria Components.', Body: Overview },
      { id: 'guidelines', title: 'Design guidelines', lead: 'Nine short rules. The components follow them, and so does this demo.', Body: Guidelines },
    ],
  },
  {
    id: 'layout', title: 'Layout', lead: 'The parts of the window.', pages: [
      { id: 'frame', title: 'App frame', lead: 'Bars on top, status bar at the bottom, navigation left, content right.', Body: Frame },
      { id: 'commands', title: 'Menus and commands', lead: 'A menu bar, and commands shared by menus, buttons and shortcuts.', Body: Commands },
      { id: 'bars', title: 'Bars', lead: 'A row of controls that stays in view.', Body: Bars },
    ],
  },
  {
    id: 'controls', title: 'Controls', lead: 'Buttons and form fields.', pages: [
      { id: 'buttons', title: 'Buttons', lead: 'Buttons, links and toggle buttons.', Body: Buttons },
      { id: 'fields', title: 'Fields', lead: 'Text, number and choice fields in a form.', Body: Fields },
      { id: 'choices', title: 'Choices', lead: 'Checkboxes, radio buttons and switches.', Body: Choices },
      { id: 'dates', title: 'Dates and colours', lead: 'Fields and pickers for dates, times and colours.', Body: DatesAndColours },
      { id: 'ranges', title: 'Sliders and progress', lead: 'A value on a scale: set it, or watch it.', Body: Ranges },
    ],
  },
  {
    id: 'collections', title: 'Collections', lead: 'Lists, trees and other sets of items.', pages: [
      { id: 'list', title: 'List view', lead: 'A table with column headers that selects like a desktop list.', Body: Lists },
      { id: 'tree', title: 'Tree view', lead: 'A hierarchy with connector lines.', Body: Trees },
      { id: 'smaller', title: 'List box, tabs and tags', lead: 'Smaller collections.', Body: Smaller },
    ],
  },
  {
    id: 'feedback', title: 'Feedback', lead: 'Telling people what happened, and asking them.', pages: [
      { id: 'status', title: 'Status and callouts', lead: 'A tone always comes with a word.', Body: StatusPage },
      { id: 'notifications', title: 'Notifications', lead: 'The status bar for routine feedback, notifications for news.', Body: Notifications },
      { id: 'tooltips', title: 'Tooltips', lead: 'A name for a control that shows only an icon.', Body: Tooltips },
      { id: 'dialogs', title: 'Dialogs and popovers', lead: 'Modal, floating and attached.', Body: Dialogs },
      { id: 'sections', title: 'Disclosure and drop zone', lead: 'Sections that fold, and a place to drop files.', Body: Sections },
    ],
  },
];

export const PAGES: Page[] = GROUPS.flatMap((g) => g.pages);

/** Reading order: each group, then its pages. */
export const ORDER: string[] = GROUPS.flatMap((g) => [g.id, ...g.pages.map((p) => p.id)]);
