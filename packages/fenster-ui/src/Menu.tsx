import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  Button as RACButton,
  Header,
  Keyboard,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuSection,
  MenuTrigger,
  Popover,
  Separator,
  SubmenuTrigger,
  Toolbar,
  useLocale,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps,
  type MenuProps as RACMenuProps,
  type ToolbarProps,
} from 'react-aria-components';
import { useLabels } from './labels';
import { ariaShortcut, formatShortcut, useShortcuts } from './shortcuts';
import { withClass } from './utils';

interface MenuBarState {
  open: string | null;
  focusFirst: boolean;
  setOpen: (id: string | null, focusFirst?: boolean) => void;
  neighbour: (id: string, dir: 1 | -1) => string | null;
}

const MenuBarContext = createContext<MenuBarState | null>(null);

/**
 * A menu bar of BarMenus. While a menu is open, hovering another title opens it and Left/Right move
 * to the neighbouring menu.
 */
export function MenuBar({ className, ...props }: ToolbarProps) {
  const [open, setOpenState] = useState<string | null>(null);
  const [focusFirst, setFocusFirst] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { direction } = useLocale();
  // Bar menus are non-modal so other titles receive hover, so outside presses are handled here.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      const target = e.target as Element;
      if (target.closest('.fui-popover')) return;
      const title = target.closest<HTMLElement>('[data-fui-menu]');
      if (title && ref.current?.contains(title)) {
        if (title.dataset.fuiMenu !== open) return; // another title: React Aria opens it
        e.stopPropagation(); // the open title: close, and don't let the press reopen it
      }
      setOpenState(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);
  const state: MenuBarState = {
    open,
    focusFirst,
    setOpen: (id, first = false) => { setFocusFirst(first); setOpenState(id); },
    neighbour: (id, dir) => {
      const ids = [...(ref.current?.querySelectorAll<HTMLElement>('[data-fui-menu]') ?? [])].map((el) => el.dataset.fuiMenu!);
      if (!ids.length) return null;
      const step = direction === 'rtl' ? -dir : dir;
      return ids[(ids.indexOf(id) + step + ids.length) % ids.length];
    },
  };
  return (
    <MenuBarContext.Provider value={state}>
      <Toolbar {...props} ref={ref} className={withClass('fui-bar', className)} />
    </MenuBarContext.Provider>
  );
}

export interface BarMenuProps<T extends object> extends Omit<RACMenuProps<T>, 'className' | 'style'> {
  label: ReactNode;
  /** Controlled open state. Inside a MenuBar, the bar manages it. */
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

/** A titled menu in a MenuBar. Takes React Aria's Menu props. */
export function BarMenu<T extends object>({ label, isOpen, defaultOpen, onOpenChange, autoFocus, ...menuProps }: BarMenuProps<T>) {
  const bar = useContext(MenuBarContext);
  const id = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const { direction } = useLocale();
  const open = bar ? bar.open === id : isOpen;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!bar || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const target = e.target as HTMLElement;
    // Ignore events bubbling up from a submenu.
    if (target.closest('.fui-menu') !== menuRef.current) return;
    const forward = (e.key === 'ArrowRight') !== (direction === 'rtl');
    if (forward && target.getAttribute('aria-haspopup')) return;
    e.preventDefault();
    e.stopPropagation();
    const next = bar.neighbour(id, forward ? 1 : -1);
    if (next) bar.setOpen(next, true);
  };

  return (
    <MenuTrigger
      isOpen={open}
      defaultOpen={bar ? undefined : defaultOpen}
      onOpenChange={(o) => { if (bar) bar.setOpen(o ? id : bar.open === id ? null : bar.open); onOpenChange?.(o); }}
    >
      <RACButton
        className="fui-bar-item"
        data-fui-menu={id}
        onHoverStart={() => { if (bar && bar.open && bar.open !== id) bar.setOpen(id); }}
      >
        {label}
      </RACButton>
      {/* Non-modal, so the other titles still receive the pointer while a menu is open. */}
      <Popover className="fui-popover" placement="bottom start" offset={0} isNonModal={!!bar}>
        <div onKeyDown={onKeyDown}>
          <RACMenu {...menuProps} ref={menuRef} autoFocus={autoFocus ?? (bar?.focusFirst ? 'first' : undefined)} className="fui-menu" />
        </div>
      </Popover>
    </MenuTrigger>
  );
}

/** A command shared by a menu item and a keyboard shortcut. */
export interface Command {
  id: string;
  label: string;
  /** In useShortcuts notation: "Mod+S", "Alt+N", "Delete". */
  shortcut?: string;
  isDisabled?: boolean;

  icon?: ReactNode;
  run: () => void;
}

/** Binds the commands' shortcuts. */
export function useCommands(commands: Command[], options?: { enabled?: boolean }) {
  useShortcuts(Object.fromEntries(commands.filter((c) => c.shortcut).map((c) => [c.shortcut!, !c.isDisabled && c.run])), options);
}

export interface MenuItemProps<T> extends Omit<RACMenuItemProps<T>, 'children'> {
  children?: ReactNode;
  /** Displayed only; bind it with useShortcuts, or use `command`. */
  shortcut?: string;
  /** Takes label, shortcut, disabled state, icon and action from a Command. */
  command?: Command;

  icon?: ReactNode;
}

export function MenuItem<T extends object>({ children, shortcut, command, icon, className, ...props }: MenuItemProps<T>) {
  const keyNames = useLabels()?.keyNames;
  const label = children ?? command?.label;
  const keys = shortcut ?? command?.shortcut;
  const textValue = props.textValue ?? (typeof label === 'string' ? label : undefined);
  return (
    <RACMenuItem
      id={command?.id}
      isDisabled={command?.isDisabled}
      onAction={command?.run}
      {...props}
      textValue={textValue}
      aria-keyshortcuts={keys && ariaShortcut(keys)}
      className={withClass('fui-menu-item', className)}
    >
      {(s) => (
        <>
          <span className="fui-menu-gutter" aria-hidden="true">{icon ?? command?.icon}</span>
          <span className="fui-menu-item-label">{label}</span>
          {keys && <Keyboard className="fui-menu-item-kbd">{formatShortcut(keys, keyNames)}</Keyboard>}
          {s.hasSubmenu && <span className="fui-submenu-arrow" aria-hidden="true" />}
        </>
      )}
    </RACMenuItem>
  );
}

export function MenuSeparator() {
  return <Separator className="fui-menu-sep" />;
}

export function MenuGroup({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <MenuSection>
      {title && <Header className="fui-menu-section-header">{title}</Header>}
      {children}
    </MenuSection>
  );
}

export interface SubmenuProps<T extends object> extends Omit<MenuProps<T>, 'className' | 'style'> {
  label: ReactNode;
  textValue?: string;
  isDisabled?: boolean;

  icon?: ReactNode;
}

/** A submenu. */
export function Submenu<T extends object>({ label, textValue, isDisabled, icon, ...menuProps }: SubmenuProps<T>) {
  return (
    <SubmenuTrigger>
      <MenuItem textValue={textValue} isDisabled={isDisabled} icon={icon}>{label}</MenuItem>
      <Popover className="fui-popover" offset={-3} crossOffset={-3}>
        <RACMenu {...menuProps} className="fui-menu" />
      </Popover>
    </SubmenuTrigger>
  );
}
