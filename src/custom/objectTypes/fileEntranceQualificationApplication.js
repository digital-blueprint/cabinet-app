import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getDocumentHit, getEntranceQualificationApplication} from './schema.js';
import {createInstance} from '../i18n.js';
import {DbpStringElement, DbpStringView} from '@dbp-toolkit/form-elements';
import {DEFAULT_FILE_BASE} from './fileCommon.js';
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

    getBlobType() {
        return 'entranceQualificationApplication';
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

const DEFAULT_ENTRANCE_QUALIFICATION_APPLICATION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-entranceQualificationApplication',
    file: {
        'file-cabinet-entranceQualificationApplication': {
            previousEducation: '',
            electiveSubject: '',
        },
        ...DEFAULT_FILE_BASE,
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EntranceQualificationApplication:
                'custom:typesense-schema.file.base.additionalType.key.EntranceQualificationApplication',
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
        let hit = getDocumentHit(this._getData());
        let application = getEntranceQualificationApplication(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/englMasterApplication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/englMasterApplication_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="previousEducation"
                    label=${this._i18nCustom.t('custom:doc-modal-previous-education')}
                    .value=${application.previousEducation}
                    required
                    ?disabled=${this.disabled}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="electiveSubject"
                    label=${this._i18nCustom.t('custom:doc-modal-elective-subject')}
                    .state=${application.electiveSubject}
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
        let application = getEntranceQualificationApplication(hit);

        const i18n = this._i18nCustom;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('custom:doc-modal-previous-education')}
                .value=${application.previousEducation || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('custom:doc-modal-elective-subject')}
                .value=${application.electiveSubject || ''}></dbp-form-string-view>
        `;
    }
}
