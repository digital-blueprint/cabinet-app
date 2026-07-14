import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getDocumentHit, getEnglMasterApplication} from './schema.js';
import {createInstance} from '../i18n.js';
import {DEFAULT_FILE_BASE} from './fileCommon.js';
import {DbpEnumElement, DbpStringElement, DbpStringView} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-englMasterApplication';

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
        return 'englMasterApplication';
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

const DEFAULT_ENGL_MASTER_APPLICATION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-englMasterApplication',
    file: {
        'file-cabinet-englMasterApplication': {
            nativeLanguage: '',
            previousEnrolmentInAustria: false,
        },
        ...DEFAULT_FILE_BASE,
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EnglMasterApplication:
                'custom:typesense-schema.file.base.additionalType.key.EnglMasterApplication',
        };
    }

    static getDefaultData() {
        return DEFAULT_ENGL_MASTER_APPLICATION;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
            'dbp-form-enum-element': DbpEnumElement,
        };
    }

    getEnrolmentOptions() {
        return {
            false: this._i18nCustom.t('custom:doc-modal-no'),
            true: this._i18nCustom.t('custom:doc-modal-yes'),
        };
    }

    render() {
        let hit = getDocumentHit(this._getData());
        let application = getEnglMasterApplication(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/englMasterApplication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/englMasterApplication_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="nativeLanguage"
                    label=${this._i18nCustom.t('custom:doc-modal-native-language')}
                    .value=${application.nativeLanguage}></dbp-form-string-element>

                <dbp-form-enum-element
                    subscribe="lang"
                    name="previousEnrolmentInAustria"
                    label=${this._i18nCustom.t('custom:doc-modal-previous-enrolment-in-austria')}
                    .items=${this.getEnrolmentOptions()}
                    .value="${application.previousEnrolmentInAustria.toString()}"
                    required></dbp-form-enum-element>

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
        let application = getEnglMasterApplication(hit);

        const i18n = this._i18nCustom;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('custom:doc-modal-native-language')}
                .value=${application.nativeLanguage || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('custom:doc-modal-previous-enrolment-in-austria')}
                .value=${
                    application.previousEnrolmentInAustria
                        ? i18n.t('custom:doc-modal-yes')
                        : i18n.t('custom:doc-modal-no')
                }></dbp-form-string-view>
        `;
    }
}
