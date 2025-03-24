import {css, html} from 'lit';
import {
    BaseObject,
    BaseFormElement,
    BaseHitElement,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getAdmissionNotice} from './schema.js';

export default class extends BaseObject {
    name = 'file-cabinet-admissionNotice';

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
    static getAdditionalTypes = () => {
        return {
            AdmissionNotice: 'Admission Notice',
        };
    };

    static getDecisions = () => {
        return {
            rejected: 'Rejected',
            refused: 'Refused',
            granted: 'Granted',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this.data);

        let hit = getDocumentHit(this.data);
        let admissionNotice = getAdmissionNotice(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/admissionNotice.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/admissionNotice_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${admissionNotice.dateCreated || ''}
                    required></dbp-form-date-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousStudy"
                    label=${this._i18n.t('doc-modal-previousStudy')}
                    .value=${admissionNotice.previousStudy || ''}></dbp-form-string-element>

                <dbp-form-enum-element
                    subscribe="lang"
                    name="decision"
                    label=${this._i18n.t('doc-modal-decision')}
                    .items=${CabinetFormElement.getDecisions()}
                    .value=${admissionNotice.decision || ''}></dbp-form-enum-element>

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
        let hit = getDocumentHit(this.data);
        let admissionNotice = getAdmissionNotice(hit);

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );
        const i18n = this._i18n;

        const issueDate = admissionNotice.dateCreated;
        const dateObject = new Date(issueDate);
        let formattedDate = issueDate ? new Intl.DateTimeFormat('de').format(dateObject) : '';
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
                        class="button-view"
                        type="is-primary"
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
        let admissionNotice = getAdmissionNotice(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-datetime-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${admissionNotice.dateCreated
                    ? new Date(admissionNotice.dateCreated)
                    : ''}></dbp-form-datetime-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previousStudy')}
                .value=${admissionNotice.previousStudy || ''}></dbp-form-string-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${i18n.t('doc-modal-decision')}
                .value=${admissionNotice.decision || ''}
                .items=${CabinetFormElement.getDecisions()}></dbp-form-enum-view>
        `;
    }
}
