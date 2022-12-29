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
<SCL xmlns:sxy="http://www.iec.ch/61850/2003/SCLcoordinates"
  xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:expl="https://example.org" version="2007" revision="B" release="4">
  <Header id="Compare test"></Header>
  <DataTypeTemplates>
    <EnumType id="Example">
      <EnumVal ord="0">blocked</EnumVal>
      <EnumVal ord="1" expl:my="attr">on</EnumVal>
      <Private type="star" src="./cosmos"></Private>
      <Private type="dream" expl:probes="brain">
        <expl:MyElement myAttr="myVal" expl:AnotherAttr="ImportantStuff">
          <expl:AnotherElement myAttr="myVal" expl:AnotherAttr="ImportantStuff"></expl:AnotherElement>
        </expl:MyElement>
      </Private>
      <Text>Just saying you know, these can go in many places</Text>
    </EnumType>
    <EnumType id="Example2">
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
            (<Element>n).setAttributeNS(
              'http://www.iec.ch/61850/2003/SCL',
              'randomthing',
              '2'
            );
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

    describe('with tagName Private', () => {
      const node = doc.querySelector('Private');
      it('changes when the type is changed', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('type', 'NotVeryTypical');
          },
        }).to.satisfy(changesHash);
      });

      it('changes when the source is changed', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('source', './galaxyB');
          },
        }).to.satisfy(changesHash);
      });

      it('changes when the text content is changed)', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).textContent = 'unblocked';
          },
        }).to.satisfy(changesHash);
      });

      it('changes with a considered non-SCL namespace element', () => {
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

      it('changes with a considered non-SCL namespace attribute name', () => {
        expect({
          node,
          opts: { namespaces: ['http://www.dreaming.com/a/better/world'] },
          mutate: (n: Node): void => {
            (<Element>n).setAttributeNS(
              'http://www.dreaming.com/a/better/world',
              'Dream',
              'TimesGoneBy'
            );
          },
        }).to.satisfy(changesHash);
      });

      it('changes with a considered non-SCL namespace attribute value', () => {
        expect({
          node,
          opts: { namespaces: ['https://example.org'] },
          mutate: (n: Node): void => {
            (<Element>n).setAttributeNS(
              'https://example.org',
              'expl:probes',
              'ears'
            );
          },
        }).to.satisfy(changesHash);
      });
    });

    describe('with tagName Text', () => {
      const node = doc.querySelector('Text');
      it('changes when the type is changed', () => {
        expect({
          node,
          mutate: (n: Node) => {
            (<Element>n).setAttribute('source', 'https://truth.com');
          },
        }).to.satisfy(changesHash);
      });
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
              'You will never see this comment in a comparison!'
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

      // QUESTION: Should these be one of the overall arguments to consider Text elements?
      it('changes when a Text element is added', () => {
        expect({
          node,
          mutate: (n: Node): void => {
            const child = n.ownerDocument!.createElementNS(
              'http://www.iec.ch/61850/2003/SCL',
              'Text'
            );
            n.appendChild(child);
          },
        }).to.satisfy(changesHash);
      });

      describe('when a child changes', () => {
        it('does change when a child EnumVal changes', () => {
          expect({
            node,
            mutate: (n: Node): void => {
              const child = (<Element>n).querySelector('EnumVal')!;
              child.setAttribute('ord', '73');
            },
          }).to.satisfy(changesHash);
        });

        it('does not change for a Private change', () => {
          expect({
            node,
            mutate: (n: Node): void => {
              const child = (<Element>n).querySelector('Private')!;
              child.setAttribute('type', 'ANewType');
            },
          }).to.not.satisfy(changesHash);
        });

        it('does change for a Private change when considered', () => {
          expect({
            node,
            opts: { considerPrivates: true },
            mutate: (n: Node): void => {
              const child = (<Element>n).querySelector('Private')!;
              child.setAttribute('type', 'ANewType');
            },
          }).to.satisfy(changesHash);
        });

        it('does change when a Text element changes', () => {
          expect({
            node,
            opts: { considerPrivates: true },
            mutate: (n: Node): void => {
              const child = (<Element>n).querySelector('Text')!;
              child.textContent = 'Merry Christmas, my friends!';
            },
          }).to.satisfy(changesHash);
        });
      });
    });
  });

  describe('given an XML Element', () => {
    const node = doc.querySelector('Private[type="dream"]')?.firstElementChild;
    const ns = 'https://example.org';
    it('changes with an attribute name addition', () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          (<Element>n).setAttributeNS(ns, 'new-attribute', '2');
        },
      }).to.satisfy(changesHash);
    });

    it('changes with an attribute value change', () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          (<Element>n).setAttribute('myAttr', '3');
        },
      }).to.satisfy(changesHash);
    });

    it('changes with an attribute without a declared namespace', () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          (<Element>n).setAttribute('myAttrNonNamespace', '3');
        },
      }).to.satisfy(changesHash);
    });

    it('changes when there is text content', () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          n.textContent = 'Hello World';
        },
      }).to.satisfy(changesHash);
    });

    it("changes when there a change in its children's attributes", () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          (<Element>n).firstElementChild!.textContent = 'Hi Earthling';
        },
      }).to.satisfy(changesHash);
    });

    it('changes when there is a CDATA node', () => {
      expect({
        node,
        opts: { namespaces: [ns] },
        mutate: (n: Node) => {
          const cdata = n.ownerDocument!.createCDATASection(
            'A CDATA section with a tricksy &'
          );
          (<Element>n).firstElementChild!.appendChild(cdata);
        },
      }).to.satisfy(changesHash);
    });
  });
});
