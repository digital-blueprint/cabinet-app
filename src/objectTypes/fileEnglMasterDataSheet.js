import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from '../baseObject.js';
import {getDocumentHit, getEnglMasterDataSheet} from './schema.js';
import {DbpStringElement, DbpStringView} from '@dbp-toolkit/form-elements';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-englMasterDataSheet';

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

const DEFAULT_ENGL_MASTER_DATA_SHEET = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-englMasterDataSheet',
    file: {
        'file-cabinet-englMasterDataSheet': {
            previousHigherEducationInstitution: '',
            previousHigherEducationPlace: '',
            previousHigherEducationField: '',
            previousHigherEducationCurriculum: '',
            previousHigherEducationGrading: '',
            previousHigherEducationCPGA: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            EnglMasterDataSheet:
                'typesense-schema.file.base.additionalType.key.EnglMasterDataSheet',
        };
    }

    static getDefaultData() {
        return DEFAULT_ENGL_MASTER_DATA_SHEET;
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

        let hit = getDocumentHit(this._getData() ?? DEFAULT_ENGL_MASTER_DATA_SHEET);
        let datasheet = getEnglMasterDataSheet(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/englMasterApplication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/englMasterApplication_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationInstitution"
                    label=${this._i18n.t('doc-modal-previous-higher-education-institution')}
                    .value=${datasheet.previousHigherEducationInstitution}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationPlace"
                    label=${this._i18n.t('doc-modal-previous-higher-education-place')}
                    .value=${datasheet.previousHigherEducationPlace}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationField"
                    label=${this._i18n.t('doc-modal-previous-higher-education-field')}
                    .value=${datasheet.previousHigherEducationField}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationCurriculum"
                    label=${this._i18n.t('doc-modal-previous-higher-education-curriculum')}
                    .value=${datasheet.previousHigherEducationCurriculum}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationGrading"
                    label=${this._i18n.t('doc-modal-previous-higher-education-grading')}
                    .value=${datasheet.previousHigherEducationGrading}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousHigherEducationCPGA"
                    label=${this._i18n.t('doc-modal-previous-higher-education-cpga')}
                    .value=${datasheet.previousHigherEducationCPGA}></dbp-form-string-element>

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
        let datasheet = getEnglMasterDataSheet(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-institution')}
                .value=${datasheet.previousHigherEducationInstitution || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-place')}
                .value=${datasheet.previousHigherEducationPlace || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-field')}
                .value=${datasheet.previousHigherEducationField || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-curriculum')}
                .value=${datasheet.previousHigherEducationCurriculum || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-grading')}
                .value=${datasheet.previousHigherEducationGrading || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previous-higher-education-cpga')}
                .value=${datasheet.previousHigherEducationCPGA || ''}></dbp-form-string-view>
        `;
    }
}
