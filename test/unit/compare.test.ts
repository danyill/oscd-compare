import { expect } from '@open-wc/testing';

import { linearHash } from '../../foundation/compare.js';

function xmlHash(str: string, nses: string[] = []): string {
  const xmlDoc = new DOMParser().parseFromString(str, 'application/xml');
  return linearHash(Array.from(xmlDoc.documentElement.children), nses);
}

describe('Hashing of XML Nodes', () => {
  describe('It correctly compares XML nodes', () => {
    it('will produce the same hash for the same nodes', () => {
      const first = '<root><node1 test="hi"/><node2/></root>';
      const second = '<root><node1 test="hi"/><node2/></root>';
      expect(xmlHash(first)).to.be.equal(xmlHash(second));
    });

    it('will produce a different hash for different xml element tag names', () => {
      const first = '<root><node1/><node2/></root>';
      const second = '<root><node9><node2/></root>';
      expect(xmlHash(first)).to.not.be.equal(xmlHash(second));
    });

    it('will produce a different hash for different xml attribute names', () => {
      const first = '<root><node1 first="hey"/><node2/></root>';
      const second = '<root><node1 firsT="hey"/><node2/></root>';
      expect(xmlHash(first)).to.not.be.equal(xmlHash(second));
    });

    it('will produce a different hash for different xml attribute values', () => {
      const first = '<root><node1 first="hey"/><node2/></root>';
      const second = '<root><node1 first="jude"/><node2/></root>';
      expect(xmlHash(first)).to.not.be.equal(xmlHash(second));
    });

    it('will not consider children', () => {
      const first = '<root><node1 first="hey"><test1/></node1><node2/></root>';
      const second = '<root><node1 first="hey"></node1><node2/></root>';
      expect(xmlHash(first)).to.be.equal(xmlHash(second));
    });

    it('Will not include comment nodes', () => {
      const comment =
        '<root><node1/><node2/><!-- This is a comment --><node3/></root>';
      const noComment = '<root><node1/><node2/><node3/></root>';

      expect(xmlHash(comment)).to.be.equal(xmlHash(noComment));
    });

    it('Will not include namespaces by default', () => {
      const withNs =
        '<root xmlns:wl="http://www.welearn.com"><node1/><node2/><wl:node2a/><node3/></root>';
      const without = '<root><node1/><node2/><node3/></root>';

      expect(xmlHash(withNs)).to.be.equal(xmlHash(without));
    });

    it('Will include the IEC 61850 namespace by default', () => {
      const first =
        '<root xmlns="http://www.iec.ch/61850/2003/SCL"><node1/><node2/><node3/></root>';
      const second =
        '<root xmlns="http://www.iec.ch/61850/2003/SCL"><nodex/><node2/><node3/></root>';
      expect(xmlHash(first)).to.not.be.equal(xmlHash(second));
    });

    it('Will include namespaces when required', () => {
      const withNs =
        '<root xmlns:wl="http://www.welearn.com"><node1/><node2/><wl:node2/><node3/></root>';
      const without = '<root><node1/><node2/><node3/></root>';

      expect(xmlHash(withNs, ['http://www.welearn.com'])).to.not.be.equal(
        xmlHash(without, ['http://www.welearn.com'])
      );
    });

    it('Will distinguish namespaces when comparing nodes', () => {
      const withNs =
        '<root xmlns:wl="http://www.welearn.com" xmlns:wl2="http://www.welearn2.com"><node1/><node2/><wl:node2a/><node3/></root>';
      const withNs2 =
        '<root xmlns:wl="http://www.welearn.com" xmlns:wl2="http://www.welearn2.com"><node1/><node2/><wl2:node2/><node3/></root>';

      expect(
        xmlHash(withNs, ['http://www.welearn.com', 'http://www.welearn2.com'])
      ).to.not.be.equal(
        xmlHash(withNs2, ['http://www.welearn.com', 'http://www.welearn2.com'])
      );
    });

    it('Will distinguish namespaces when comparing attributes', () => {
      const withNs =
        '<root xmlns:wl="http://www.welearn.com" xmlns:wl2="http://www.welearn2.com"><node1 wl:test="great"/><node2/><node3/></root>';
      const withNs2 =
        '<root xmlns:wl="http://www.welearn.com" xmlns:wl2="http://www.welearn2.com"><node1 wl2:test="great"/><node2/><node3/></root>';

      expect(
        xmlHash(withNs, ['http://www.welearn.com', 'http://www.welearn2.com'])
      ).to.not.be.equal(
        xmlHash(withNs2, ['http://www.welearn.com', 'http://www.welearn2.com'])
      );
    });
  });
});
