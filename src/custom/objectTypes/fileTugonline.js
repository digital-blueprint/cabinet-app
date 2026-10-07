import {html} from 'lit';
import {BaseObject, BaseFormElement, BaseViewElement} from './baseObject.js';
import {getDocumentHit, getTugonline} from './schema.js';
import {createInstance} from '../i18n.js';
import {DbpDateTimeElement, DbpDateTimeView} from '@dbp-toolkit/form-elements';
import {DEFAULT_FILE_BASE} from './fileCommon.js';
import {BaseDocumentHitElement} from './document.js';

export default class extends BaseObject {
    name = 'file-cabinet-tugonline';

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
        return 'tugonline';
    }

    canCreate() {
        return false;
    }

    canReplaceFile() {
        return false;
    }

    canModifyVersionStatus() {
        return false;
    }

    getAdditionalTypes(lang) {
        let i18n = createInstance();
        let translatedTypes = {};
        void i18n.changeLanguage(lang);
        for (let [key, translationKey] of Object.entries(ADDITIONAL_TYPES)) {
            translatedTypes[key] = i18n.t(translationKey);
        }
        return translatedTypes;
    }
}

const ADDITIONAL_TYPES = {
    CO_BESCHEID: 'custom:typesense-schema.file.base.additionalType.key.CO_BESCHEID',
    CO_CERTIFICATE: 'custom:typesense-schema.file.base.additionalType.key.CO_CERTIFICATE',
    CO_DIPLOMA_SUPPLEMENT_APV:
        'custom:typesense-schema.file.base.additionalType.key.CO_DIPLOMA_SUPPLEMENT_APV',
    CO_GRADUATION_CERTIFICATE:
        'custom:typesense-schema.file.base.additionalType.key.CO_GRADUATION_CERTIFICATE',
};

const DEFAULT_TUGONLINE = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-tugonline',
    file: {
        'file-cabinet-tugonline': {
            dateCreated: null,
        },
        ...DEFAULT_FILE_BASE,
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return ADDITIONAL_TYPES;
    }

    static getDefaultData() {
        return DEFAULT_TUGONLINE;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-datetime-element': DbpDateTimeElement,
        };
    }

    render() {
        let hit = getDocumentHit(this._getData());
        let tugonline = getTugonline(hit);
        let fileCommon = hit.file.base;
        if (typeof hit.file.base.studyField === 'string') {
            const key = hit.file.base.studyField;
            hit.file.base.studyField = {key, text: key, textEn: key};
        }

        return html`
            <form>
                <dbp-form-datetime-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18nCustom.t('custom:doc-modal-issue-date')}
                    .value=${tugonline.dateCreated || ''}
                    required
                    ?disabled=${this.disabled}></dbp-form-datetime-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="subjectOf"
                    label=${this._i18nCustom.t('custom:doc-modal-subject-of')}
                    placeholder=${this._i18nCustom.t('custom:doc-modal-subject-of-placeholder', {
                        id: '987654-AB/2023',
                    })}
                    .value=${fileCommon.subjectOf || ''}
                    ?disabled=${this.disabled}
                    @change=${(e) => {
                        fileCommon.subjectOf = e.detail?.value ?? e.target?.value;
                    }}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="comment"
                    label=${this._i18nCustom.t('custom:doc-modal-comment')}
                    placeholder=${this._i18nCustom.t('custom:doc-modal-comment')}
                    rows="5"
                    .value=${fileCommon.comment || ''}
                    ?disabled=${this.disabled}
                    @change=${(e) => {
                        fileCommon.comment = e.detail?.value ?? e.target?.value;
                    }}></dbp-form-string-element>

                <input
                    type="hidden"
                    name="fileSourceId"
                    .value=${hit.file.base.fileSourceId || ''} />

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseDocumentHitElement {
    _renderContent() {
        let tugonline = getTugonline(getDocumentHit(this.data));
        const issueDate = tugonline.dateCreated;
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              }).format(new Date(issueDate))
            : '';
        return html`
            ${
                issueDate
                    ? html`
                          ${this._i18nCustom.t('custom:document-issue-date')}: ${formattedDate}
                      `
                    : ''
            }
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    constructor() {
        super();
        this.setAdditionalTypes(ADDITIONAL_TYPES);
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-datetime-view': DbpDateTimeView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let tugonline = getTugonline(hit);
        let fileCommon = hit.file.base;

        return html`
            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-issue-date')}
                .value=${tugonline.dateCreated ? new Date(tugonline.dateCreated) : ''}></dbp-form-datetime-view>
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-subject-of')}
                .value=${fileCommon.subjectOf || '–'}></dbp-form-string-view>
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18nCustom.t('custom:doc-modal-comment')}
                .value=${fileCommon.comment || '–'}></dbp-form-string-view>
        `;
    }
}
