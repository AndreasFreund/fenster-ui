import type { Key } from 'react-aria-components';
import type { TreeNode } from '@andreasfreund/fenster-ui';
import { Status, type Kind } from './status';

/** The sample project the examples work on. */
export const tree: TreeNode[] = [
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

export const FOLDERS = new Set<Key>(['proj', 'src', 'api', 'db', 'tests', 'shared']);

/** Each tree node's path, such as "billing-service/src/api". */
export const pathOf = new Map<Key, string>();
(function index(nodes: TreeNode[], parents: string[]) {
  for (const n of nodes) {
    pathOf.set(n.id, [...parents, n.label].join('/'));
    if (n.children) index(n.children, [...parents, n.label]);
  }
})(tree, []);

export interface FileRow { id: string; name: string; size: number; modified: string; status: Kind }

export const initialFiles: FileRow[] = [
  { id: 'invoices.ts', name: 'invoices.ts', size: 14_208, modified: '2026-11-12 09:41', status: 'ok' },
  { id: 'payments.ts', name: 'payments.ts', size: 9_870, modified: '2026-11-14 16:05', status: 'warning' },
  { id: 'schema.sql', name: 'schema.sql', size: 3_412, modified: '2026-10-30 11:22', status: 'note' },
  { id: 'migrate.ts', name: 'migrate.ts', size: 6_154, modified: '2026-11-15 08:17', status: 'failed' },
  { id: 'index.ts', name: 'index.ts', size: 812, modified: '2026-09-02 14:50', status: 'ok' },
];

const LEVELS: Kind[] = ['note', 'note', 'note', 'ok', 'warning', 'failed'];

export const makeLog = (from: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const id = from + i;
    const d = new Date(Date.UTC(2026, 10, 15, 8, 0, 0) + id * 7000);
    return { id, time: d.toISOString().slice(11, 19), status: LEVELS[(id * 7) % LEVELS.length], text: `Request ${1000 + id} handled by worker ${(id % 8) + 1}` };
  });

export function now() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
