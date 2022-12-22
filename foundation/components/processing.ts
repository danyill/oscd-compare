import { html, LitElement, TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { Dialog } from '@material/mwc-dialog';

@customElement('procesing-dialog')
export class ProcessingDialog extends LitElement {
  isProcessing: boolean;

  @query('processing-dialog')
  dialog!: Dialog;

  constructor() {
    super();
    this.isProcessing = false;
  }

  set processing(isProcessing: boolean) {
    this.isProcessing = isProcessing;
    if (this.isProcessing) this.dialog.show();
    // if (this.isProcessing) this.dialog.close();
  }

  render(): TemplateResult {
    // if (this.isProcessing) {
    return html`
      <dialog class="processing-dialog">
        <h1>Processing...</h1>
      </dialog>
    `;
  }
  // return html``;
}
