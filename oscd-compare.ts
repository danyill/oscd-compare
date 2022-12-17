/* eslint-disable no-console */
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
// import { classMap } from 'lit/directives/class-map.js';

import { compareMaps, getHash, nodeHash } from './foundation/compare.js';

// QUESTION: we don't declare as a custom element anymore ???

/** An editor [[`plugin`]] to configure `Report`, `GOOSE`, `SampledValue` control blocks and its `DataSet` */
export default class comparePlugin extends LitElement {
  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc!: XMLDocument;

  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  count = 0;

  @property()
  xmlDoc: Document[] = [];

  @property({ attribute: false })
  reHash: string[] = [];

  @property({ attribute: false })
  previousDepth = 0;

  @property({ attribute: false })
  qtyAtDepth = 0;

  @property({ attribute: false })
  hashTable = new Map();

  @property({ attribute: false })
  depthTracker = new Map();

  private postOrderTraversal(node: Element, currentDepth = 0) {
    // Traverse the tree leaves first
    for (const child of Array.from(node.children)) {
      this.postOrderTraversal(child, currentDepth + 1);
    }

    // calculate hash for current node, excluding children
    let hash = nodeHash(node);

    // check how many are at the current depth
    // if (currentDepth === this.previousDepth)
    this.depthTracker.set(currentDepth, (this.qtyAtDepth += 1));

    // add hash to list of hashes to hash together for higher level nodes
    this.reHash = this.reHash.concat(hash);

    // we are now traversing upwards, we must hash the children and this node and store the result
    if (this.previousDepth > currentDepth && this.reHash.length !== 0) {
      // console.log(this.reHash, 'HASHING THE HECK');
      const combinedHash = getHash(
        this.reHash
          .slice(this.depthTracker.get(currentDepth))
          .join('')
          .concat(hash)
      );

      this.reHash = [combinedHash];
      hash = combinedHash;

      // reset tracking metadata
      this.qtyAtDepth = 0;
    }

    // add to index
    if (this.hashTable.has(hash)) {
      const existingValues = this.hashTable.get(hash);
      this.hashTable.set(hash, [existingValues].concat(node));
    } else {
      this.hashTable.set(hash, node);
    }

    // Log the node name and depth of this element
    // console.log(
    //   `${node.nodeName} (depth ${currentDepth}) (qtyAtDepth ${
    //     this.qtyAtDepth
    //   }) ${this.reHash.map((h) => h.slice(0, 8))} depthTracker`
    // );
    // this.depthTracker.forEach((k, v) => {
    //   console.log(`key: ${k} value: ${v}`);
    // });

    this.previousDepth = currentDepth;
  }

  hashInit() {
    this.reHash = [];
    this.previousDepth = 0;
    this.qtyAtDepth = 0;
    this.hashTable = new Map();
    this.depthTracker = new Map();
  }

  private _onClick() {
    if (this.xmlDoc!.length === 2) {
      console.log('Now we compare');

      const startTime = performance.now();

      const firstDocEl = this.xmlDoc![0].documentElement;
      this.hashInit();
      this.postOrderTraversal(firstDocEl);
      const firstDocHashes = new Map(this.hashTable);

      this.hashInit();
      const secondDocEl = this.xmlDoc![1].documentElement;
      this.postOrderTraversal(secondDocEl);
      // this.hashTable.forEach((v, k) =>
      //   console.log(`${k.slice(0, 8)}: ${v.tagName}`)
      // );
      const secondDocHashes = new Map(this.hashTable);

      const endTime = performance.now();
      // Calculate the duration of the function
      const duration = endTime - startTime;
      console.log(duration, 'ms');
      console.log(firstDocHashes, secondDocHashes);

      // compareMaps(firstDocHashes, secondDocHashes);
    }
  }

  private async getCompareFile(evt: Event): Promise<void> {
    const file = (<HTMLInputElement | null>evt.target)?.files?.item(0) ?? false;
    if (!file) return;

    const templateText = await file.text();
    const compareDoc = new DOMParser().parseFromString(
      templateText,
      'application/xml'
    );

    this.xmlDoc?.push(compareDoc);
  }

  render() {
    return html`
      <h1>We hash our rehashing quite slowly</h1>
      <input
        id="compare-file-1"
        accept=".sed,.scd,.ssd,.isd,.iid,.cid,.icd,.xml"
        type="file"
        required
        @change=${(evt: Event) => this.getCompareFile(evt)}
      />
      <input
        id="compare-file-2"
        accept=".sed,.scd,.ssd,.isd,.iid,.cid,.icd,.xml"
        type="file"
        required
        @change=${(evt: Event) => this.getCompareFile(evt)}
      />
      <button @click=${this._onClick} part="button">Let's do stuff!</button>
      <slot></slot>
    `;
  }

  static styles = css`
  `;
}
