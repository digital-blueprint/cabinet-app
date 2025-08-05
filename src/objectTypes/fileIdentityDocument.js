import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from '../baseObject.js';
import {getDocumentHit, getIdentityDocument} from './schema.js';
import {getNationalityDisplayName} from './nationalityCodes.js';
import {
    DbpDateElement,
    DbpDateView,
    DbpStringElement,
    DbpStringView,
} from '@dbp-toolkit/form-elements';
import {NationalityInput} from './nationalityInput.js';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-identityDocument';

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

const DEFAULT_IDENTITY_DOCUMENT = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-identityDocument',
    file: {
        'file-cabinet-identityDocument': {
            nationality: '',
            identifier: '',
            dateCreated: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            DriversLicence: 'typesense-schema.file.base.additionalType.key.DriversLicence',
            Passport: 'typesense-schema.file.base.additionalType.key.Passport',
            PersonalLicence: 'typesense-schema.file.base.additionalType.key.PersonalLicence',
        };
    }

    static getDefaultData() {
        return DEFAULT_IDENTITY_DOCUMENT;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
            'dbp-cabinet-form-nationality-element': NationalityInput,
            'dbp-form-date-element': DbpDateElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);

        let hit = getDocumentHit(this._getData() ?? DEFAULT_IDENTITY_DOCUMENT);
        let identityDocument = getIdentityDocument(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/identityDocument.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/identityDocument_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="identifier"
                    label=${this._i18n.t('doc-modal-Identifier')}
                    .value=${identityDocument.identifier}
                    required></dbp-form-string-element>

                <dbp-cabinet-form-nationality-element
                    subscribe="lang"
                    name="nationality"
                    label=${this._i18n.t('doc-modal-nationality')}
                    .value=${identityDocument.nationality}
                    required></dbp-cabinet-form-nationality-element>

                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${identityDocument.dateCreated}
                    required></dbp-form-date-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseDocumentHitElement {
    _renderContent() {
        let hit = getDocumentHit(this.data);
        let identityDocument = getIdentityDocument(hit);
        const i18n = this._i18n;
        const issueDate = identityDocument.dateCreated;
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              }).format(new Date(issueDate))
            : '';
        return html`
            ${issueDate
                ? html`
                      ${i18n.t('document-issue-date')}: ${formattedDate}
                  `
                : ''}
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
            'dbp-form-string-view': DbpStringView,
            'dbp-form-date-view': DbpDateView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let identityDocument = getIdentityDocument(hit);
        let nationalityCode = identityDocument.nationality;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-Identifier')}
                .value=${identityDocument.identifier || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-nationality')}
                .value=${html`
                    ${getNationalityDisplayName(nationalityCode, this.lang)} (${nationalityCode})
                `}></dbp-form-string-view>

            <dbp-form-date-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-issue-date')}
                .value=${identityDocument.dateCreated
                    ? new Date(identityDocument.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
