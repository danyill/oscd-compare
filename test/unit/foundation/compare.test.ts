import { expect } from '@open-wc/testing';

import { hashNode } from '../../../foundation/compare.js';

const doc = new DOMParser().parseFromString(
  `
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B" release="4">
<DataTypeTemplates>
  <EnumType id="Example" xmlns:expl="https://example.org">
    <EnumVal ord="0">blocked</EnumVal>
    <EnumVal ord="1" expl:my="attr">on</EnumVal>
  </EnumType>
  <EnumType id="Example" xmlns:expl="https://example.org">
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
      it('incorporates the ord in the hash', () => {
        const val = doc.querySelector('EnumVal')!;
        const before = hashNode(val);
        const val2 = val.cloneNode(true) as Element;
        val2.setAttribute('ord', '2');
        const after = hashNode(val2);
        expect(before).not.to.equal(after);
      });

      it('incorporates the textContent in the hash', () => {
        const val = doc.querySelector('EnumVal')!;
        const before = hashNode(val);
        const val2 = val.cloneNode(true) as Element;
        val2.textContent = 'unblocked';
        const after = hashNode(val2);
        expect(before).not.to.equal(after);
      });
    });
  });
});
