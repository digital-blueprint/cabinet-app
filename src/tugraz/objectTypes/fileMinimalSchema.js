import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getDocumentHit, getMinimalSchema} from './schema.js';
import {createInstance} from '../i18n.js';
import {DbpDateElement, DbpDateView} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';

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

    getBlobType() {
        return 'minimalSchema';
    }

    getAdditionalTypes(lang) {
        let i18n = createInstance();
        let translatedTypes = {};
        i18n.changeLanguage(lang);
        for (let [key, translationKey] of Object.entries(CabinetFormElement.getAdditionalTypes())) {
            let value = i18n.t(translationKey);
            translatedTypes[key] = value;
        }
        return translatedTypes;
    }
}

const DEFAULT_MINIMAL_SCHEMA = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-minimalSchema',
    file: {
        'file-cabinet-minimalSchema': {
            dateCreated: null,
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            BirthCertificate:
                'tugraz:typesense-schema.file.base.additionalType.key.BirthCertificate',
            MaritalStatusCertificate:
                'tugraz:typesense-schema.file.base.additionalType.key.MaritalStatusCertificate',
            SupervisionAcceptance:
                'tugraz:typesense-schema.file.base.additionalType.key.SupervisionAcceptance',
            Recognition: 'tugraz:typesense-schema.file.base.additionalType.key.Recognition',
            Graduation: 'tugraz:typesense-schema.file.base.additionalType.key.Graduation',
        };
    }

    static getDefaultData() {
        return DEFAULT_MINIMAL_SCHEMA;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-element': DbpDateElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);
        let hit = getDocumentHit(this._getData() ?? DEFAULT_MINIMAL_SCHEMA);
        let minimalSchema = getMinimalSchema(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/minimalSchema.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/minimalSchema_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18nCustom.t('tugraz:doc-modal-issue-date')}
                    .value=${minimalSchema.dateCreated || ''}
                    required></dbp-form-date-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseDocumentHitElement {
    _renderContent() {
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);
        const i18n = this._i18nCustom;
        const issueDate = minimalSchema.dateCreated;
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
                      ${i18n.t('tugraz:document-issue-date')}: ${formattedDate}
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
            'dbp-form-date-view': DbpDateView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);

        return html`
            <dbp-form-date-view
                subscribe="lang"
                label=${this._i18nCustom.t('tugraz:doc-modal-issue-date')}
                .value=${minimalSchema.dateCreated
                    ? new Date(minimalSchema.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
