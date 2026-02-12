import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from '../baseObject.js';
import {getDocumentHit, getEntranceQualificationApplication} from './schema.js';
import {DbpStringElement, DbpStringView} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-entranceQualificationApplication';

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

const DEFAULT_ENTRANCE_QUALIFICATION_APPLICATION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-entranceQualificationApplication',
    file: {
        'file-cabinet-entranceQualificationApplication': {
            previousEducation: '',
            electiveSubject: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EntranceQualificationApplication:
                'typesense-schema.file.base.additionalType.key.EntranceQualificationApplication',
        };
    }

    static getDefaultData() {
        return DEFAULT_ENTRANCE_QUALIFICATION_APPLICATION;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this._getData());

        let hit = getDocumentHit(this._getData() ?? DEFAULT_ENTRANCE_QUALIFICATION_APPLICATION);
        let application = getEntranceQualificationApplication(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/englMasterApplication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/englMasterApplication_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="previousEducation"
                    label=${this._i18n.t('doc-modal-previous-education')}
                    .value=${application.previousEducation}
                    required></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="electiveSubject"
                    label=${this._i18n.t('doc-modal-elective-subject')}
                    .state=${application.electiveSubject}></dbp-form-string-element>

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
        let application = getEntranceQualificationApplication(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-education')}
                .value=${application.previousEducation || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-elective-subject')}
                .value=${application.electiveSubject || ''}></dbp-form-string-view>
        `;
    }
}
