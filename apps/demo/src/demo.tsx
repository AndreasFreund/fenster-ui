import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import { Link } from '@andreasfreund/fenster-ui';

/** What a page can ask of the window around it. */
export interface Demo {
  /** Routine feedback: shows in the status bar, then fades. */
  say: (message: string) => void;
  /** Follows a link to another page; Back returns. */
  go: (id: string) => void;
  /** The content pane, for dialogs that float over it. */
  contentRef: RefObject<HTMLElement | null>;
}

export const DemoContext = createContext<Demo | null>(null);

export function useDemo(): Demo {
  const demo = useContext(DemoContext);
  if (!demo) throw new Error('useDemo needs the demo window');
  return demo;
}

/** A link to another page of the demo. */
export function PageLink({ to, children }: { to: string; children: ReactNode }) {
  const { go } = useDemo();
  return <Link onPress={() => go(to)}>{children}</Link>;
}

export interface ExampleProps {
  title: string;
  /** One or two sentences on when to use it. */
  note?: ReactNode;
  /** The live example. */
  children?: ReactNode;
  /** The code that produces it. */
  code?: string;
  /** No padding around the live example, for bars and lists. */
  flush?: boolean;
}

/** One section of a page: a heading, a note, the live example and its code. */
export function Example({ title, note, children, code, flush }: ExampleProps) {
  return (
    <section className="demo-example">
      <h2 className="fui-heading">{title}</h2>
      {note != null && <p>{note}</p>}
      {children != null && <div className={flush ? 'demo-live demo-live--flush' : 'demo-live'}>{children}</div>}
      {code != null && <pre className="demo-code fui-mono"><code>{code.trim()}</code></pre>}
    </section>
  );
}
