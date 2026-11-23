import { type ReactNode } from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosureGroup as RACDisclosureGroup,
  DisclosurePanel,
  Heading,
  type DisclosureGroupProps,
  type DisclosureProps as RACDisclosureProps,
} from 'react-aria-components';
import { withClass } from './utils';

export interface DisclosureProps extends Omit<RACDisclosureProps, 'children'> {
  title: ReactNode;
  children: ReactNode;
}

/** A titled section that expands and collapses. */
export function Disclosure({ title, children, className, ...props }: DisclosureProps) {
  return (
    <RACDisclosure {...props} className={withClass('fui-disclosure', className)}>
      <Heading className="fui-disclosure-heading">
        <RACButton slot="trigger" className="fui-disclosure-trigger">
          <span className="fui-twist" aria-hidden="true" />
          {title}
        </RACButton>
      </Heading>
      <DisclosurePanel className="fui-disclosure-panel">{children}</DisclosurePanel>
    </RACDisclosure>
  );
}

/** Disclosures stacked with dividers. */
export function DisclosureGroup({ className, ...props }: DisclosureGroupProps) {
  return <RACDisclosureGroup {...props} className={withClass('fui-disclosure-group', className)} />;
}
