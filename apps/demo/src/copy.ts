import type { FrameworkLabels } from '@andreasfreund/fenster-ui';

/** The demo's wording passed to the framework. */
export const frameworkLabels: FrameworkLabels = {
  invalid: 'FAIL',
};

export const copy = {
  repository: 'https://github.com/AndreasFreund/fenster-ui',
  resizePagesPane: 'Resize page list',
  resizeExamplePane: 'Resize example navigation',
  showPages: 'Show page list',
  moreNotifications: (n: number) => `${n} more ${n === 1 ? 'notification' : 'notifications'}`,
  loadingMore: 'Loading more...',
  close: 'Close',
  clearFilter: 'Clear filter',
  hue: 'Hue',
  hex: 'Hex',
  dropFilesHere: 'Drop files here',
  appearance: {
    title: 'Appearance',
    theme: 'Theme',
    sameAsSystem: 'Same as system',
    light: 'Light',
    dark: 'Dark',
    accent: 'Accent',
    size: 'Size',
    compact: 'Compact',
    comfortable: 'Comfortable',
    custom: 'Custom',
    customColour: 'Custom accent colour',
    preview: 'Preview',
    primary: 'Primary',
    checked: 'Checked',
    link: 'Link',
    ok: 'OK',
    cancel: 'Cancel',
    adjustedTo: (c: string) => `Adjusted to ${c} so text stays readable.`,
    presetNames: { teal: 'Teal', blue: 'Blue', indigo: 'Indigo', plum: 'Plum', slate: 'Slate' } as Record<string, string>,
  },
};
