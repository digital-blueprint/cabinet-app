import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getDocumentHit, getEntranceQualificationRecognition} from './schema.js';
import {createInstance} from '../i18n.js';
import {DEFAULT_FILE_BASE} from './fileCommon.js';
import {DbpStringElement, DbpStringView} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-entranceQualificationRecognition';

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
        return 'entranceQualificationRecognition';
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

const DEFAULT_ENTRANCE_QUALIFICATION_RECOGNITION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-entranceQualificationRecognition',
    file: {
        'file-cabinet-entranceQualificationRecognition': {
            signedBy: '',
        },
        ...DEFAULT_FILE_BASE,
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EntranceQualificationRecognition:
                'custom:typesense-schema.file.base.additionalType.key.EntranceQualificationRecognition',
        };
    }

    static getDefaultData() {
        return DEFAULT_ENTRANCE_QUALIFICATION_RECOGNITION;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
        };
    }

    render() {
        let hit = getDocumentHit(this._getData());
        let recognition = getEntranceQualificationRecognition(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/EntranceQualificationRecognition.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/EntranceQualificationRecognition_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="signedBy"
                    label=${this._i18nCustom.t('custom:doc-modal-signed-by')}
                    .value=${recognition.signedBy}
                    required
                    ?disabled=${this.disabled}></dbp-form-string-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseDocumentHitElement {
    _renderContent() {
        return html``;
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
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let recognition = getEntranceQualificationRecognition(hit);

        const i18n = this._i18nCustom;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('custom:doc-modal-signed-by')}
                .value=${recognition.signedBy || ''}
                required></dbp-form-string-view>
        `;
    }
}
