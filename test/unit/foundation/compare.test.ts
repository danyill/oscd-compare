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
      it('changes with the ord attribute', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('ord', '2');
          },
        }).to.satisfy(changesHash);
      });

      it('changes if there is textContent', () =>
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).textContent = 'unblocked';
          },
        }).to.satisfy(changesHash));

      it('does not change if there are disallowed SCL attributes ', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('randomthing', '2');
          },
        }).to.not.satisfy(changesHash);
      });

      it('changes if the desc field is considered', () =>
        expect({
          node,
          opts: { considerDescs: true },
          mutate: (n: Node) => {
            (<Element>n).setAttribute('desc', 'unblocked');
          },
        }).to.satisfy(changesHash));

      it('does not change if the desc field if not considered', () =>
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('desc', 'unblocked');
          },
        }).to.not.satisfy(changesHash));

      it('does not change with added attributes from other namespaces', () =>
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttributeNS(
              'http://green.com/trees/for/future',
              'tree',
              'kauri'
            );
          },
        }).to.not.satisfy(changesHash));

      it('does change with added attributes from other namespaces if considered', () =>
        expect({
          node,
          opts: { namespaces: ['http://green.com/trees/for/future'] },
          mutate: (n: Node) => {
            (<Element>n).setAttributeNS(
              'http://green.com/trees/for/future',
              'tree',
              'kauri'
            );
          },
        }).to.satisfy(changesHash));
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
            // ensure roughly schema compliant
            child.setAttribute('ord', '3');
            n.appendChild(child);
          },
        }).to.satisfy(changesHash);
      });

      it('does not change when an Private element is added', () => {
        expect({
          node,
          opts: { considerPrivates: false },
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.iec.ch/61850/2003/SCL',
              'Private'
            );
            child.setAttribute('type', 'VeryPrivateDoNotLook');
            n.appendChild(child);
          },
        }).to.not.satisfy(changesHash);
      });

      it('does change when a Private element exists and is considered', () => {
        expect({
          node,
          opts: { considerPrivates: true },
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.iec.ch/61850/2003/SCL',
              'Private'
            );
            child.setAttribute('type', 'VeryPrivateDoNotLook');
            n.appendChild(child);
          },
        }).to.satisfy(changesHash);
      });

      it('does not change when a comment node exists', () => {
        expect({
          node,
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createComment(
              'You will never see this comment!'
            );
            n.appendChild(child);
          },
        }).to.not.satisfy(changesHash);
      });

      it('does not change when a non-SCL namespace element node exists', () => {
        expect({
          node,
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.dreaming.com/a/better/world',
              'Dream'
            );
            child.setAttribute('dreamId', '001');
            n.appendChild(child);
          },
        }).to.not.satisfy(changesHash);
      });

      it('does change when a non-SCL namespace element node exists and is considered', () => {
        expect({
          node,
          opts: { namespaces: ['http://www.dreaming.com/a/better/world'] },
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.dreaming.com/a/better/world',
              'Dream'
            );
            child.setAttribute('dreamId', '001');
            n.appendChild(child);
          },
        }).to.satisfy(changesHash);
      });

      it('does not change if the namespaced element has a different namespace to the added element', () => {
        expect({
          node,
          opts: {
            namespaces: ['http://www.dreaming.com/a/better/worldNotReally'],
          },
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.dreaming.com/a/better/world',
              'Dream'
            );
            child.setAttribute('dreamId', '001');
            n.appendChild(child);
          },
        }).to.not.satisfy(changesHash);
      });

      it('changes with the desc field if considered', () =>
        expect({
          node,
          opts: { considerDescs: true },
          mutate: (n: Node) => {
            (<Element>n).setAttribute('desc', 'unblocked');
          },
        }).to.satisfy(changesHash));

      // it('does not change when an incorrect SCL attribute is added', () => {
      //   expect({
      //     node,
      //     mutate: (n: Node): void => {
      //       (<Element>n).setAttribute('someRandomAttribute', 'hey');
      //     },
      //   }).to.not.satisfy(changesHash);
      // });

      // it('does not change when an incorrect SCL attribute is added', () => {
      //   expect({
      //     node,
      //     mutate: (n: Node): void => {
      //       (<Element>n).setAttribute('someRandomAttribute', 'hey');
      //     },
      //   }).to.not.satisfy(changesHash);
      // });

      // it('does change when a child of a Private element', () => {
      //   expect({
      //     node,
      //     mutate: (n: Node): void => {
      //       const child = (<Element>n).querySelector('EnumVal')!;
      //       child.setAttribute('ord', '73');
      //     },
      //   }).to.satisfy(changesHash);
      // });

      // it('does change when a child EnumVal changes', () => {
      //   expect({
      //     node,
      //     mutate: (n: Node): void => {
      //       const child = (<Element>n).querySelector('EnumVal')!;
      //       child.setAttribute('ord', '73');
      //     },
      //   }).to.satisfy(changesHash);
      // });
    });
  });
});
