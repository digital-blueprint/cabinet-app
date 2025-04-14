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
import {formatDate} from '../utils.js';

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

const DEFAULT_CITIZENSHIP_CERTIFICATE = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-citizenshipCertificate',
    file: {
        'file-cabinet-citizenshipCertificate': {
            nationality: '',
            dateCreated: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes = () => {
        return {
            CitizenshipCertificate: 'Citizenship Certificate',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');

        let hit = getDocumentHit(this._getData() ?? DEFAULT_CITIZENSHIP_CERTIFICATE);
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
                    .value=${citizenshipCertificate.nationality}></dbp-form-enum-element>

                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${citizenshipCertificate.dateCreated}
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
        let hit = getDocumentHit(this.data);
        let citizenshipCertificate = getCitizenshipCertificate(hit);
        const i18n = this._i18n;

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const issueDate = citizenshipCertificate.dateCreated;
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              }).format(new Date(issueDate))
            : '';
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
                        <dbp-icon class="icon-container" name="files"></dbp-icon>
                        <div class="ais-doc-title">${hit.file.base.additionalType.text}</div>
                    </div>
                    <div class="text-container">
                        <div class="ais-doc-Hits-header-items header-item1">
                            ${hit.person.fullName}
                        </div>
                        &nbsp
                        <div class="ais-doc-Hits-header-items header-item2">
                            ${formatDate(hit.person.birthDate)}&nbsp(${hit.person
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
                        <span>${i18n.t('Added')}: ${dateCreated}</span>
                        <br />
                        <span>${i18n.t('last-modified')}: ${lastModified}</span>
                        <br />
                    </div>
                    ${this.renderViewButton(hit)}
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

            <dbp-form-date-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${citizenshipCertificate.dateCreated
                    ? new Date(citizenshipCertificate.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
