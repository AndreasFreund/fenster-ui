import type { LucideIcon } from 'lucide-react';
import { Database, File, FileCode, FileJson, FilePlus, Folder, FolderOpen, RotateCw, Save, Search, X } from 'lucide-react';
import type { TreeNode } from '@andreasfreund/fenster-ui';

/** Lucide icons, sized by --icon-size; index.html keeps their stroke at 1px. */
const i = (I: LucideIcon) => <I size={16} strokeWidth={1} aria-hidden="true" focusable="false" />;

/** Close button of toasts and dialogs. */
export const closeIcon = i(X);

/** Icons for the four most frequent commands. */
export const commandIcons = { newFile: i(FilePlus), open: i(FolderOpen), save: i(Save), find: i(Search) };

/** The action bar's icon-only Refresh button. */
export const refreshIcon = i(RotateCw);

/** An icon for a file name, by extension. */
export function fileIcon(name: string) {
  if (/\.(ts|tsx|js)$/.test(name)) return i(FileCode);
  if (name.endsWith('.json')) return i(FileJson);
  if (name.endsWith('.sql')) return i(Database);
  return i(File);
}

/** What a file's icon stands for, shown as its hint. */
export function fileKind(name: string) {
  if (/\.(ts|tsx|js)$/.test(name)) return 'Source file';
  if (name.endsWith('.json')) return 'JSON file';
  if (name.endsWith('.sql')) return 'SQL script';
  return 'File';
}

/** Tree rows: open or closed folders, files by extension. */
export const treeIcon = (node: TreeNode, { isExpanded, hasChildItems }: { isExpanded: boolean; hasChildItems: boolean }) =>
  hasChildItems ? (isExpanded ? i(FolderOpen) : i(Folder)) : fileIcon(node.label);
