import {css, html} from 'lit';
import {
    BaseObject,
    BaseFormElement,
    BaseHitElement,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getMinimalSchema} from './schema.js';

export default class extends BaseObject {
    name = 'file-cabinet-minimalSchema';

    getFormComponent() {
        return CabinetFormElement;
    }

    getHitComponent() {
        return CabinetHitElement;
    }

    getViewComponent() {
        return CabinetViewElement;
    }

    getAdditionalTypes() {
        return CabinetFormElement.getAdditionalTypes();
    }
}

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            BirthCertificate: 'Birth Certificate',
            MaritalStatusCertificate: 'Marital Status Certificate',
            SupervisionAcceptance: 'Supervision Acceptance',
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/minimalSchema.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/minimalSchema_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${minimalSchema.dateCreated || ''}
                    required></dbp-form-date-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}
            ${getCommonStyles()}

            .button-view {
                padding: 0.3em 0.8em;
                font-size: 18px;
                background-color: var(--dbp-primary-surface);
                color: var(--dbp-on-primary-surface);
                text-align: center;
                white-space: nowrap;
                font-size: inherit;
                font-weight: bolder;
                font-family: inherit;
                transition:
                    0.15s,
                    color 0.15s;
                border: none;
            }
        `;
    }

    render() {
        const i18n = this._i18n;
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );

        const issueDate = minimalSchema.dateCreated;
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de').format(new Date(issueDate))
            : '';
        const documentViewButtonClick = (hit) => {
            this.dispatchEvent(
                new CustomEvent('DbpCabinetDocumentView', {
                    detail: {hit: hit},
                    bubbles: true,
                    composed: true,
                }),
            );
        };
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
                        <div class="icon-container"></div>
                        <div class="ais-doc-title">${hit.file.base.additionalType.text}</div>
                    </div>
                    <div class="text-container">
                        <div class="ais-doc-Hits-header-items header-item1">
                            ${hit.person.fullName}
                        </div>
                        &nbsp
                        <div class="ais-doc-Hits-header-items header-item2">
                            ${Intl.DateTimeFormat('de', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            }).format(new Date(hit.person.birthDate))}&nbsp(${hit.person
                                .studId}&nbsp|&nbsp${hit.person.stPersonNr})
                        </div>
                    </div>
                </header>
                <main class="ais-doc-Hits-content">
                    <div class="hit-content-item">
                        ${issueDate
                            ? html`
                                  ${i18n.t('document-issue-date')}: ${formattedDate}
                              `
                            : ''}
                        <br />
                        ${i18n.t('Added')}: ${dateCreated}
                        <br />
                        ${i18n.t('last-modified')}: ${lastModified}
                        <br />
                    </div>
                    <button
                        class="button-view" type="is-primary"
                        @click=${() => {
                            documentViewButtonClick(hit);
                        }}>
                        ${i18n.t('buttons.view')}
                    </button>
                </main>
            </form>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    constructor() {
        super();
        this.setAdditionalTypes(CabinetFormElement.getAdditionalTypes());
    }

    getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);

        return html`
            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-issue-date')}
                .value=${minimalSchema.dateCreated
                    ? new Date(minimalSchema.dateCreated)
                    : ''}></dbp-form-datetime-view>
        `;
    }
}
