import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from '../baseObject.js';
import {getDocumentHit, getEntranceQualificationRecognition} from './schema.js';
import {DbpStringElement} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';
import {DbpPersonSelectElement} from '@dbp-toolkit/form-elements/src/elements/person-select.js';
import {DbpPersonSelectView} from '@dbp-toolkit/form-elements/src/views/person-select.js';

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

    getAdditionalTypes() {
        return CabinetFormElement.getAdditionalTypes();
    }
}

const DEFAULT_ENTRANCE_QUALIFICATION_RECOGNITION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-entranceQualificationRecognition',
    file: {
        'file-cabinet-entranceQualificationRecognition': {
            signedBy: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EntranceQualificationRecognition:
                'typesense-schema.file.base.additionalType.key.EntranceQualificationRecognition',
        };
    }

    static getDefaultData() {
        return DEFAULT_ENTRANCE_QUALIFICATION_RECOGNITION;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
            'dbp-form-person-select-element': DbpPersonSelectElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this._getData());

        let hit = getDocumentHit(this._getData() ?? DEFAULT_ENTRANCE_QUALIFICATION_RECOGNITION);
        let recognition = getEntranceQualificationRecognition(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/EntranceQualificationRecognition.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/EntranceQualificationRecognition_example.json
        return html`
            <form>
                <dbp-form-person-select-element
                    subscribe="lang,auth"
                    name="signedBy"
                    label=${this._i18n.t('doc-modal-signed-by')}
                    entry-point-url="${this.entryPointUrl}"
                    .value=${recognition.signedBy}
                    required></dbp-form-person-select-element>

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
            'dbp-form-person-select-view': DbpPersonSelectView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let recognition = getEntranceQualificationRecognition(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-person-select-view
                subscribe="lang,auth"
                label=${i18n.t('doc-modal-signed-by')}
                entry-point-url="${this.entryPointUrl}"
                .value=${recognition.signedBy || ''}
                required></dbp-form-person-select-view>
        `;
    }
}
