/* eslint-disable no-console */
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
// import { classMap } from 'lit/directives/class-map.js';

import {
  compareMaps,
  hashNode,
} from './foundation/compare.js';

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

  private _onClick() {
    // if (this.xmlDoc!.length === 2) {
    console.log('Now we compare');

    const startTime = performance.now();

    const firstDocHashes = hashNode(this.xmlDoc![0].documentElement)

    const endTime = performance.now();
    // Calculate the duration of the function
    const duration = endTime - startTime;
    console.log(duration, 'ms');
    console.log(firstDocHashes);
    // , secondDocHashes);

    // compareMaps(firstDocHashes, secondDocHashes);
    // }
  }

  private async getFile(evt: Event): Promise<void> {
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
      <h1>
        <p>Is comparison the thief of joy?</p>
        <p>Or the dance of diversity?</p>
        <p>Or the smell of sameness?</p>
      </h1>
      <input
        id="compare-file-1"
        accept=".sed,.scd,.ssd,.isd,.iid,.cid,.icd,.xml"
        type="file"
        required
        @change=${(evt: Event) => this.getFile(evt)}
      />
      <input
        id="compare-file-2"
        accept=".sed,.scd,.ssd,.isd,.iid,.cid,.icd,.xml"
        type="file"
        required
        @change=${(evt: Event) => this.getFile(evt)}
      />
      <button @click=${this._onClick} part="button">Let's do stuff!</button>
      <slot></slot>
    `;
  }

  static styles = css``;
}
