import {html, css} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';

/**
 * A list showing all PDF validation errors returned by the API
 */
export class PdfValidationErrorList extends LangMixin(DBPLitElement, createInstance) {
    static styles = [
        commonStyles.getThemeCSS(),
        commonStyles.getGeneralCSS(false),
        commonStyles.getButtonCSS(),
        css`
            .red-text-bold {
                color: var(--dbp-danger);
                font-weight: bold;
            }

            .red-text {
                color: var(--dbp-danger);
            }
        `,
    ];

    static properties = {
        errors: {type: Array, attribute: false},
    };

    constructor() {
        super();
        this.errors = [];
    }

    updated(changedProperties) {
        if (changedProperties.has('errors')) {
            this.requestUpdate();
        }
    }

    render() {
        return this.errors.length > 0
            ? html`
                  <div id="dbp-cabinet-document-upload-failed">
                      <h3 class="red-text-bold">
                          ${this._i18n.t('cabinet-file.document-upload-failed-pdfa-title')}
                      </h3>
                      <h4 class="red-text-bold">
                          ${this._i18n.t('cabinet-file.document-upload-failed-pdfa-summary')}
                      </h4>
                      <h4 class="red-text-bold">
                          ${this._i18n.t('cabinet-file.document-upload-failed-pdfa-details')}
                      </h4>
                      <ul>
                          ${this.errors.map(
                              (error) => html`
                                  <li class="red-text">${error}</li>
                              `,
                          )}
                      </ul>
                  </div>
              `
            : html``;
    }
}

customElements.define('pdf-validation-error-list', PdfValidationErrorList);
