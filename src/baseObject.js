import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import {css, html, unsafeCSS} from 'lit';
import '@dbp-toolkit/form-elements';
import {createInstance} from './i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import * as formElements from './objectTypes/formElements';
import {classMap} from 'lit/directives/class-map.js';
import {getIconSVGURL} from './utils.js';
import {gatherFormDataFromElement, validateRequiredFields} from '@dbp-toolkit/form-elements/src/utils.js';

export class BaseObject {
    name = 'baseObject';

    constructor() {
    }

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
        padding: 0 5px;
        border-bottom: 1px solid var(--dbp-override-content);
        margin-bottom: calc(7px + 1vh);
    }

    .text-container {
        display: flex;
        flex-direction: column;
        color: var(--dbp-override-content);
    }

    .icon-container {
        display: flex;
        align-items: right;
        justify-content: right;
        background-image: url("${unsafeCSS(getIconSVGURL('docs'))}");
        background-repeat: no-repeat;
        background-size: 30px;
        background-position-x: right;
        background-position-y: center;
        width: 50px;
        height: 50px;
    }

    .ais-doc-Hits-content {
        display: grid;
        grid-template-rows: repeat(3, 1fr);
    }

    .hit-content-item1 {
        grid-row: 1 / 3;
        color: var(--dbp-override-content);
        font-weight: bold;
        font-size: 24px;
    }

    .hit-content-item2 {
        grid-row: 2 / 3;
        color: var(--dbp-override-content);
    }

    .hit-content-item3 {
        grid-row: 3 / 4;
        padding-top: 30px;
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

    enableSaveButton() {
        this.saveButtonEnabled = true;
    }

    static getAdditionalTypes() {
        return {};
    }

    getSemesters = () => {
        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        currentYear = currentYear % 100;
        let nextYear = currentYear + 1;
        let previousYear = currentYear - 1;
        let currentMonth = currentDate.getMonth();
        let currentSeason;
        if (currentMonth >= 2 && currentMonth <= 8) {
            currentSeason = 'S';
        } else {
            currentSeason = 'W';
        }

        let currentSemester = currentYear.toString() + currentSeason;

        let nextSemester;

        const semesters = {};

        if (currentSeason === 'S') {
            nextSemester = currentYear.toString() + 'W';
            semesters[nextSemester] = nextSemester;
            semesters[currentSemester] = currentSemester;
        } else {
            nextSemester = nextYear.toString() + 'S';
            semesters[nextSemester] = nextSemester;
            semesters[currentSemester] = currentSemester;
            let previousSemester = currentYear.toString() + 'S';
            semesters[previousSemester] = previousSemester;
        }

        for (let year = previousYear; year >= 20; year--) {
            let winterSemester = year + 'W';
            semesters[winterSemester] = winterSemester;
            let summerSemester = year + 'S';
            semesters[summerSemester] = summerSemester;
        }

        return semesters;
    };

    getCommonFormElements = () => {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};
        const defaultSemester = this.getDefaultSemester(baseData);
        const additionalType = this.additionalType || baseData.additionalType?.key || '';

        return html`
            <dbp-form-string-element
                subscribe="lang"
                name="subjectOf"
                label="Subject of"
                .value=${baseData.subjectOf || ''}>
            </dbp-form-string-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="studyField"
                label="Study field"
                .items=${this.getStudyFields()}
                .value=${baseData.studyField || ''}
                required>
            </dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="semester"
                label="Semester"
                .items=${this.getSemesters()}
                .value=${defaultSemester}
                required>
            </dbp-form-enum-element>

            <dbp-form-enum-element
                subscribe="lang"
                name="isPartOf"
                label="Speicherzweck-Löschfristen"
                .items=${BaseFormElement.getIsPartOfItems(this._i18n)}
                .value=${baseData.isPartOf || ''}
                multiple
                required>
            </dbp-form-enum-element>

            <dbp-form-string-element
                subscribe="lang"
                name="comment"
                label="Comment"
                rows="5"
                .value=${baseData.comment || ''}>
            </dbp-form-string-element>

            <input type="hidden" name="additionalType" value="${additionalType}">
            ${this.getButtonRowHtml()}
        `;
    };

    getDefaultSemester(baseData) {
        if (baseData.semester) {
            return baseData.semester;
        } else {
            let currentDate = new Date();
            let currentYear = currentDate.getFullYear();
            currentYear = currentYear % 100;
            let currentMonth = currentDate.getMonth();
            let currentSeason;
            if (currentMonth >= 2 && currentMonth <= 8) {
                currentSeason = 'S';
            } else {
                currentSeason = 'W';
            }
            return currentYear.toString() + currentSeason;
        }
    }

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
        if (!await this.validateForm()) {
            return;
        }

        this.saveButtonEnabled = false;
        const formElement = this.shadowRoot.querySelector('form');
        const data = {
            formData: {
                "about": {
                    "@type": "Person",
                    "persId": this.person.identNrObfuscated,
                },
                ...gatherFormDataFromElement(formElement),
            },
        };

        console.log('storeBlobItem data', data);
        const customEvent = new CustomEvent("DbpCabinetDocumentAddSave",
            {"detail": data, bubbles: true, composed: true});
        this.dispatchEvent(customEvent);
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            person: {type: Object},
            additionalType: {type: String, attribute: 'additional-type'},
            data: {type: Object},
            auth: { type: Object },
            entryPointUrl: { type: String, attribute: 'entry-point-url' },
            saveButtonEnabled: { type: Boolean, attribute: false },
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

        const customEvent = new CustomEvent("DbpCabinetDocumentFormCancel",
            {bubbles: true, composed: true});
        this.dispatchEvent(customEvent);
    }

    getButtonRowHtml() {
        return html`
            <div class="button-row">
                <button class="button is-secondary" type="button" @click=${this.cancelForm}>Cancel</button>
                <button class="button is-primary" type="submit" ?disabled=${!this.saveButtonEnabled} @click=${this.storeBlobItem}>
                    Save
                    <dbp-mini-spinner class="${classMap({hidden: this.saveButtonEnabled})}"></dbp-mini-spinner>
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
        let studyFields = {'none' : 'Unspecified'};

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
            'study-archive-80'
        ];

        return items.reduce((acc, item) => ({
            ...acc,
            [item]: i18n.t(`typesense-schema.file.base.isPartOf.${item}`)
        }), {});
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
        return {
        };
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
                lang: ${this.lang}<br />
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

export class BaseViewElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.data = {};
        this.additionalTypes = {};
    }

    static get scopedElements() {
        return {
        };
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

    getCommonViewElements = () => {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};

        return html`
            <dbp-form-date-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-document-issue-date')}
                .value=${baseData.createdTimestamp === 0 ? '' : new Date(baseData.createdTimestamp * 1000)}>
            </dbp-form-date-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-subject-of')}
                .value=${baseData.subjectOf || ''}>
            </dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-study-field')}
                .value=${this.getStudyFieldNameForKey(baseData.studyField)}>
            </dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-semester')}
                .value=${baseData.semester || ''}>
            </dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-comment')}
                .value=${baseData.comment || ''}>
            </dbp-form-string-view>

             <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-storage-purpose-deletion')}
                .value=${baseData.isPartOf}
                .items=${BaseFormElement.getIsPartOfItems(this._i18n)}>
            </dbp-form-enum-view>

            <dbp-form-date-view
                .hidden=${baseData.deleteAtTimestamp === 0}
                subscribe="lang"
                label=${this._i18n.t('doc-modal-recommended-deletion')}
                .value=${baseData.recommendedDeletionTimestamp === 0 ? '' : new Date(baseData.recommendedDeletionTimestamp * 1000)}>
            </dbp-form-date-view>

             <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-modified')}
                .value=${baseData.modifiedTimestamp === 0 ? '' : new Date(baseData.modifiedTimestamp * 1000)}>
            </dbp-form-datetime-view>

            <dbp-form-string-view
                subscribe="lang"
                label="Mime type"
                .value=${baseData.mimeType}>
            </dbp-form-string-view>
        `;
    };

    getStudyFieldNameForKey = (key) => {
        const personData = this.data?.person || {};
        const studies = [
            { key: 'none', name: 'Unspecified' },
            ...personData.studies || []
        ];

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
                .items=${this.additionalTypes}>
            </dbp-form-enum-view>
            ${this.getCustomViewElements()}
            ${this.getCommonViewElements()}
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
