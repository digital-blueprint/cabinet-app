import {css, html} from 'lit';
import {
    BaseFormElement,
    BaseHitElement,
    BaseObject,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getCitizenshipCertificate} from './schema.js';
import {formatDate} from '../utils.js';
import {getAllNationalityCodes, getNationalityDisplayName} from './nationalityCodes.js';
import {DbpDateElement, DbpDateView, DbpEnumElement, DbpEnumView} from '@dbp-toolkit/form-elements';

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

function getNationalityItems(lang) {
    let nationalityItems = {};
    getAllNationalityCodes().forEach((code) => {
        nationalityItems[code] = `${getNationalityDisplayName(code, lang)} (${code})`;
    });
    return nationalityItems;
}

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes = () => {
        return {
            CitizenshipCertificate: 'Citizenship Certificate',
        };
    };

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-element': DbpDateElement,
            'dbp-form-enum-element': DbpEnumElement,
        };
    }

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
                    .items=${getNationalityItems(this.lang)}
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
                        <div class="ais-doc-title">
                            ${i18n.t(
                                `typesense-schema.file.base.additionalType.key.${hit.file.base.additionalType.key}`,
                            )}
                        </div>
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

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-view': DbpDateView,
            'dbp-form-enum-view': DbpEnumView,
        };
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
                .items=${getNationalityItems(this.lang)}></dbp-form-enum-view>

            <dbp-form-date-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${citizenshipCertificate.dateCreated
                    ? new Date(citizenshipCertificate.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
