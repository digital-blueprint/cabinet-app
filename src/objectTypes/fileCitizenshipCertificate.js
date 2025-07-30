import {css, html} from 'lit';
import {
    BaseFormElement,
    BaseHitElement,
    BaseObject,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getCitizenshipCertificate} from './schema.js';
import {renderFieldWithHighlight, renderFieldWithHighlightOrTranslated} from '../utils.js';
import {getNationalityDisplayName} from './nationalityCodes.js';
import {
    DbpDateElement,
    DbpDateView,
    DbpEnumElement,
    DbpStringView,
} from '@dbp-toolkit/form-elements';
import {NationalityInput} from './nationalityInput.js';

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
    static getAdditionalTypes() {
        return {
            CitizenshipCertificate:
                'typesense-schema.file.base.additionalType.key.CitizenshipCertificate',
        };
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-element': DbpDateElement,
            'dbp-form-enum-element': DbpEnumElement,
            'dbp-cabinet-form-nationality-element': NationalityInput,
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
                <dbp-cabinet-form-nationality-element
                    subscribe="lang"
                    name="nationality"
                    label=${this._i18n.t('doc-modal-nationality')}
                    .value=${citizenshipCertificate.nationality}
                    required></dbp-cabinet-form-nationality-element>

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
                            ${renderFieldWithHighlightOrTranslated(
                                this._i18n,
                                'typesense-schema.file.base.additionalType.key.',
                                hit,
                                'file.base.additionalType.key',
                                'file.base.additionalType.text',
                            )}
                        </div>
                    </div>
                    <div class="text-container">
                        <div class="ais-doc-Hits-header-items header-item1">
                            ${renderFieldWithHighlight(hit, 'person.familyName')},
                            ${renderFieldWithHighlight(hit, 'person.givenName')}
                            ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
                        </div>
                        &nbsp
                        <div class="ais-doc-Hits-header-items header-item2">
                            ${renderFieldWithHighlight(hit, 'person.studId')} |
                            ${renderFieldWithHighlight(hit, 'person.stPersonNr')}
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
            'dbp-form-string-view': DbpStringView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let citizenshipCertificate = getCitizenshipCertificate(hit);

        const i18n = this._i18n;
        let nationalityCode = citizenshipCertificate.nationality;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-nationality')}
                .value=${html`
                    ${getNationalityDisplayName(nationalityCode, this.lang)} (${nationalityCode})
                `}></dbp-form-string-view>

            <dbp-form-date-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${citizenshipCertificate.dateCreated
                    ? new Date(citizenshipCertificate.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
