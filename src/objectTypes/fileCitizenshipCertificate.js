import {css, html} from 'lit';
import {
    BaseFormElement,
    BaseHitElement,
    BaseObject,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import * as formElements from './formElements.js';
import {getDocumentHit, getCitizenshipCertificate} from './schema.js';

export default class extends BaseObject {
    name = 'file-cabinet-citizenshipCertificate';

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
            CitizenshipCertificate: 'Citizenship Certificate',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');

        let hit = getDocumentHit(this.data);
        let citizenshipCertificate = getCitizenshipCertificate(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/citizenshipCertificate.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/citizenshipCertificate_example.json
        return html`
            <form>
                <dbp-form-enum-element
                    subscribe="lang"
                    name="nationality"
                    label=${this._i18n.t('doc-modal-nationality')}
                    .items=${formElements.getNationalityItems()}
                    .value=${citizenshipCertificate.nationality || ''}></dbp-form-enum-element>

                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${citizenshipCertificate.dateCreated || ''}
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
        `;
    }

    render() {
        let hit = getDocumentHit(this.data);
        let citizenshipCertificate = getCitizenshipCertificate(hit);

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'short'},
        );
        const i18n = this._i18n;

        const issueDate = citizenshipCertificate.dateCreated;
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
                    <dbp-button
                        type="is-primary"
                        @click=${() => {
                            documentViewButtonClick(hit);
                        }}>
                        ${i18n.t('buttons.view')}
                    </dbp-button>
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
        let citizenshipCertificate = getCitizenshipCertificate(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-enum-view
                subscribe="lang"
                label=${i18n.t('doc-modal-nationality')}
                .value=${citizenshipCertificate.nationality || ''}
                .items=${formElements.getNationalityItems()}></dbp-form-enum-view>

            <dbp-form-datetime-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${citizenshipCertificate.dateCreated
                    ? new Date(citizenshipCertificate.dateCreated)
                    : ''}></dbp-form-datetime-view>
        `;
    }
}
