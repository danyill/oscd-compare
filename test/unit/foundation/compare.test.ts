/* eslint-disable no-param-reassign */
import { expect } from '@open-wc/testing';

import { hashNode, Options } from '../../../foundation/compare.js';

type TestOptions = { node: Node; opts?: Options; mutate: (n: Node) => void };

function changesHash({ node, opts, mutate }: TestOptions): boolean {
  const mutatedNode = node.cloneNode(true);
  mutate(mutatedNode);
  return hashNode(node, opts) !== hashNode(mutatedNode, opts);
}

const doc = new DOMParser().parseFromString(
  `
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
<DataTypeTemplates>
  <EnumType id="Example" xmlns:expl="https://example.org">
    <EnumVal ord="0">blocked</EnumVal>
    <EnumVal ord="1" expl:my="attr">on</EnumVal>
  </EnumType>
  <EnumType id="Example2" xmlns:expl="https://example.org">
    <EnumVal ord="0">blocked</EnumVal>
    <EnumVal ord="1">on</EnumVal>
  </EnumType>
</DataTypeTemplates>
</SCL>
`,
  'application/xml'
);

describe('hashNode', () => {
  describe('given an SCL Element', () => {
    describe('with tagName EnumVal', () => {
      const node = doc.querySelector('EnumVal');
      it('incorporates the ord in the hash', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('ord', '2');
          },
        }).to.satisfy(changesHash);
      });

      it('incorporates the textContent in the hash', () =>
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).textContent = 'unblocked';
          },
        }).to.satisfy(changesHash));

      it('incorporates the desc field if specified', () =>
        expect({
          node,
          opts: { considerDescs: true },
          mutate: (n: Node) => {
            (<Element>n).setAttribute('desc', 'unblocked');
          },
        }).to.satisfy(changesHash));

      it('does not incorporate the desc field if not specified', () =>
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('desc', 'unblocked');
          },
        }).to.not.satisfy(changesHash));
    });

    describe('with tagName EnumType', () => {
      const node = doc.querySelector('EnumType');
      it('changes when an EnumVal is added', () => {
        expect({
          node,
          mutate: (n: Node) => {
            const child = (<Element>n)
              .querySelector('EnumVal')!
              .cloneNode(true) as Element;
            child.setAttribute('ord', '3');
            n.appendChild(child);
          },
        }).to.satisfy(changesHash);
      });
    });
  });
});
