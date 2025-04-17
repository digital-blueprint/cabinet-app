import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import {css, html} from 'lit';
import '@dbp-toolkit/form-elements';
import {createInstance} from './i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import * as formElements from './objectTypes/formElements';
import {getDocumentHit} from './objectTypes/schema.js';
import {getSemesters, DEFAULT_FILE_COMMON} from './objectTypes/fileCommon.js';
import {classMap} from 'lit/directives/class-map.js';
import {
    gatherFormDataFromElement,
    validateRequiredFields,
} from '@dbp-toolkit/form-elements/src/utils.js';

export class BaseObject {
    name = 'baseObject';

    constructor() {}

    getFormComponent() {
        return BaseFormElement;
    }

    getHitComponent() {
        return BaseHitElement;
    }

    getViewComponent() {
        return BaseViewElement;
    }

    getAdditionalTypes() {
        return BaseFormElement.getAdditionalTypes();
    }
}

export const getCommonStyles = () => css`
    .ais-doc-Hits-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 5px;
        border-bottom: 0.15em solid var(--dbp-override-content);
        margin-bottom: calc(7px + 1vh);
        flex-wrap: wrap;
    }

    .text-container {
        display: flex;
        color: var(--dbp-override-content);
        flex-shrink: 1;
    }

    .ais-doc-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--dbp-override-accent);
        background-repeat: no-repeat;
        background-size: 50px;
        background-position: center;
        width: 25px;
        height: 25px;
        flex-shrink: 0;
    }

    .ais-doc-title {
        color: var(--dbp-override-content);
        font-size: 24px;
        display: inline-block;
        white-space: nowrap;
    }

    .ais-doc-Hits-content {
        display: flex;
        align-items: end;
        justify-content: space-between;
    }

    .hit-content-item {
        color: var(--dbp-override-content);
    }
`;

export class BaseFormElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.data = {};
        this.person = {};
        this.additionalType = '';
        this.entryPointUrl = '';
        this.auth = {};
        this.saveButtonEnabled = true;
    }

    _getData() {
        // Return the hit if set, otherwise null
        // FIXME: make this.data nullable
        if (Object.keys(this.data).length === 0) {
            return null;
        }
        return this.data;
    }

    enableSaveButton() {
        this.saveButtonEnabled = true;
    }

    static getAdditionalTypes() {
        return {};
    }

    getCommonFormElements = () => {
        let hit = getDocumentHit(this._getData() ?? DEFAULT_FILE_COMMON);
        let fileCommon = hit.file.base;

        return html`
            <dbp-form-string-element
                subscribe="lang"
                name="subjectOf"
                label=${this._i18n.t('doc-modal-subject-of')}
                .value=${fileCommon.subjectOf || ''}></dbp-form-string-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="studyField"
                label=${this._i18n.t('doc-modal-study-field')}
                .items=${this.getStudyFields()}
                .value=${fileCommon.studyField}
                required></dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="semester"
                label=${this._i18n.t('doc-modal-semester')}
                .items=${getSemesters()}
                .value=${fileCommon.semester}
                required></dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="isPartOf"
                label=${this._i18n.t('doc-modal-purpose-storage')}
                .items=${BaseFormElement.getIsPartOfItems(this._i18n)}
                .value=${fileCommon.isPartOf}
                multiple
                required></dbp-form-enum-element>

            <dbp-form-string-element
                subscribe="lang"
                name="comment"
                label=${this._i18n.t('doc-modal-comment')}
                rows="5"
                .value=${fileCommon.comment || ''}></dbp-form-string-element>

            <input type="hidden" name="additionalType" value="${fileCommon.additionalType.key}" />
            ${this.getButtonRowHtml()}
        `;
    };

    async validateForm() {
        const formElement = this.shadowRoot.querySelector('form');

        // Validate the form before proceeding
        const validationResult = await validateRequiredFields(formElement);

        console.log('validateAndSendSubmission validationResult', validationResult);
        if (!validationResult) {
            return false;
        }

        // If all required fields are filled, return true to allow form submission
        return true;
    }

    async storeBlobItem(event) {
        event.preventDefault();

        // Validate the form before proceeding
        if (!(await this.validateForm())) {
            return;
        }

        this.saveButtonEnabled = false;
        const formElement = this.shadowRoot.querySelector('form');
        const data = {
            formData: {
                about: {
                    '@type': 'Person',
                    persId: this.person.identNrObfuscated,
                },
                ...gatherFormDataFromElement(formElement),
            },
        };

        console.log('storeBlobItem data', data);
        const customEvent = new CustomEvent('DbpCabinetDocumentAddSave', {
            detail: data,
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(customEvent);
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            person: {type: Object},
            additionalType: {type: String, attribute: 'additional-type'},
            data: {type: Object},
            auth: {type: Object},
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            saveButtonEnabled: {type: Boolean, attribute: false},
        };
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
            ${formElements.getFieldsetCSS()}

            .button-row {
                margin-top: 1em;
                text-align: right;
            }
        `;
    }

    cancelForm(event) {
        event.preventDefault();

        const customEvent = new CustomEvent('DbpCabinetDocumentFormCancel', {
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(customEvent);
    }

    getButtonRowHtml() {
        return html`
            <div class="button-row">
                <button class="button is-secondary" type="button" @click=${this.cancelForm}>
                    Cancel
                </button>
                <button
                    class="button is-primary"
                    type="submit"
                    ?disabled=${!this.saveButtonEnabled}
                    @click=${this.storeBlobItem}>
                    Save
                    <dbp-mini-spinner
                        class="${classMap({hidden: this.saveButtonEnabled})}"></dbp-mini-spinner>
                </button>
            </div>
        `;
    }

    render() {
        console.log('-- Render BaseFormElement --');
        const data = this.data;

        return html`
            <form>
                <h2>${data.objectType}</h2>
                ${this.getButtonRowHtml()}
            </form>
        `;
    }

    getStudyFields() {
        const personData = this.data?.person || this.person || {};
        const studies = personData.studies;
        let studyFields = {none: 'Unspecified'};

        if (studies) {
            for (const study of studies) {
                studyFields[study.key] = study.key + ' ' + study.name;
            }
        }

        return studyFields;
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    break;
            }
        });

        super.update(changedProperties);
    }

    static getIsPartOfItems(i18n) {
        const items = [
            'financial-archive-7',
            'vacation-archive-3',
            'subordination-delete-3',
            'admission-archive-80',
            'generalApplications-archive-3',
            'communication-archive-10',
            'other-delete-3',
            'other-archive-3',
            'study-archive-80',
        ];

        return items.reduce(
            (acc, item) => ({
                ...acc,
                [item]: i18n.t(`typesense-schema.file.base.isPartOf.${item}`),
            }),
            {},
        );
    }
}

export class BaseHitElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.data = {};
    }

    static get scopedElements() {
        return {};
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            data: {type: Object},
        };
    }

    static get styles() {
        // language=css
        return css`
            h2 {
                margin: 0;
                font-size: 1.2em;
            }

            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
        `;
    }

    render() {
        return html`
            <form>
                <h2>BaseHit</h2>
                lang: ${this.lang}
                <br />
            </form>
        `;
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    break;
            }
        });

        super.update(changedProperties);
    }

    documentViewButtonClick(hit, e) {
        e.preventDefault();

        this.dispatchEvent(
            new CustomEvent('DbpCabinetDocumentView', {
                detail: {hit: hit},
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderViewButton(hit) {
        const i18n = this._i18n;

        return html`
            <button
                class="button-view"
                type="is-primary"
                @click=${(e) => {
                    this.documentViewButtonClick(hit, e);
                }}>
                ${i18n.t('buttons.view')}
            </button>
        `;
    }
}

export class BaseViewElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.data = {};
        this.additionalTypes = {};
    }

    static get scopedElements() {
        return {};
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            data: {type: Object},
        };
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}

            fieldset {
                border: none;
                margin: 15px 0;
                padding: 0;
            }

            fieldset label {
                font-weight: bold;
                display: block;
            }

            h2 {
                margin: 0;
                font-size: 1.2em;
            }

            h3 {
                margin: 1em 0;
                font-size: 1.1em;
            }
        `;
    }

    // Needs to be implemented in the derived class
    // For some reason, this method is not called in the derived class if it is implemented here
    // getCustomViewElements = () => {
    //     return html`Please implement getCustomViewElements() in your view element`;
    // };

    setAdditionalTypes = (types) => {
        this.additionalTypes = types;
    };

    getCommonViewElements = (data) => {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-subject-of')}
                .value=${baseData.subjectOf || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-study-field')}
                .value=${this.getStudyFieldNameForKey(baseData.studyField)}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-semester')}
                .value=${baseData.semester || ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-comment')}
                .value=${baseData.comment || ''}></dbp-form-string-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-storage-purpose-deletion')}
                .value=${baseData.isPartOf}
                .items=${BaseFormElement.getIsPartOfItems(this._i18n)}></dbp-form-enum-view>

            <dbp-form-date-view
                .hidden=${baseData.deleteAtTimestamp === 0}
                subscribe="lang"
                label=${this._i18n.t('doc-modal-recommended-deletion')}
                .value=${baseData.recommendedDeletionTimestamp === 0
                    ? ''
                    : new Date(baseData.recommendedDeletionTimestamp * 1000)}></dbp-form-date-view>

            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-added')}
                .value=${baseData.createdTimestamp === 0
                    ? ''
                    : new Date(baseData.createdTimestamp * 1000)}></dbp-form-datetime-view>

            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-modified')}
                .value=${baseData.modifiedTimestamp === 0
                    ? ''
                    : new Date(baseData.modifiedTimestamp * 1000)}></dbp-form-datetime-view>
        `;
    };

    getStudyFieldNameForKey = (key) => {
        const personData = this.data?.person || {};
        const studies = [{key: 'none', name: 'Unspecified'}, ...(personData.studies || [])];

        for (const study of studies) {
            if (study.key === key) {
                return key === 'none' ? study.name : study.key + ' ' + study.name;
            }
        }

        return `Unknown study field (${key})`;
    };

    render() {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};

        return html`
            <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-document-type')}
                .value=${baseData.additionalType?.key || ''}
                .items=${this.additionalTypes}></dbp-form-enum-view>
            ${this.getCustomViewElements()} ${this.getCommonViewElements()}
        `;
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    break;
            }
        });

        super.update(changedProperties);
    }
}
