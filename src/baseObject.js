import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import {css, html, unsafeCSS} from 'lit';
import {
    DbpCheckboxElement,
    DbpDateElement,
    DbpDateTimeElement,
    DbpEnumElement,
    DbpStringElement
} from '@dbp-toolkit/form-elements';
import {createInstance} from './i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import * as formElements from './objectTypes/formElements';
import * as viewElements from './objectTypes/viewElements';
import {classMap} from 'lit/directives/class-map.js';
import {getSelectorFixCSS} from './styles.js';
import {getIconSVGURL} from './utils.js';
import {gatherFormDataFromElement, validateRequiredFields} from '@dbp-toolkit/form-elements/src/utils.js';
import {createRef, ref} from 'lit/directives/ref.js';

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
        this.studyFieldRef = createRef();
        this.semesterRef = createRef();
        this.isPartOfRef = createRef();
    }

    enableSaveButton() {
        this.saveButtonEnabled = true;
    }

    static getAdditionalTypes() {
        return {};
    }

    static get scopedElements() {
        return {
            'dbp-form-string-element': DbpStringElement,
            'dbp-form-date-element': DbpDateElement,
            'dbp-form-datetime-element': DbpDateTimeElement,
            'dbp-form-enum-element': DbpEnumElement,
            'dbp-form-checkbox-element': DbpCheckboxElement,
        };
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateComplete.then(() => {
            // Set the items for the enum components
            this.studyFieldRef.value.setItems(this.getStudyFields());
            this.semesterRef.value.setItems(this.getSemesters());
            this.isPartOfRef.value.setItems(BaseFormElement.getIsPartOfItems());
        });
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
                ${ref(this.studyFieldRef)}
                subscribe="lang"
                name="studyField"
                label="Study field"
                .value=${baseData.studyField || ''}
                required>
            </dbp-form-enum-element>

            <dbp-form-enum-element
                ${ref(this.semesterRef)}
                subscribe="lang"
                name="semester"
                label="Semester"
                .value=${defaultSemester}
                required>
            </dbp-form-enum-element>

            <dbp-form-enum-element
                ${ref(this.isPartOfRef)}
                subscribe="lang"
                name="isPartOf"
                label="Speicherzweck-Löschfristen"
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
            ${getSelectorFixCSS()}

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
                ${formElements.stringElement('objectType', data.objectType)}
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

    static getIsPartOfItems() {
        return {
            'financial-archive-7': 'Finanzielles (Archivierung nach 7 Jahren)',
            'vacation-archive-3': 'Beurlaubung (Archivierung nach 3 Jahren)',
            'subordination-delete-3': 'Unterstellung (Löschung nach 3 Jahren)',
            'admission-archive-80': 'Ansuchen um Zulassung (Archivierung nach 80 Jahren)',
            'generalApplications-archive-3': 'Allgemeine Anträge (Archivierung nach 3 Jahren)',
            'communication-archive-10': 'Kommunikation (Archivierung nach 10 Jahren)',
            'other-delete-3': 'Sonstige Dokumente (Löschung nach 3 Jahren)',
            'other-archive-3': 'Sonstige Dokumente (Archivierung nach 3 Jahren)',
            'study-archive-80': 'Student-Life-Cycle-Dokumente (Archivierung nach 80 Jahren)'
        };
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

    getCommonViewElements = (additionalTypes = {}) => {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};

        return html`
            ${viewElements.enumElement(this._i18n.t('doc-modal-document-type'), baseData.additionalType?.key || '', additionalTypes)}
            ${viewElements.stringElement('Mime type', baseData.mimeType)}
            ${viewElements.dateTimeElement(this._i18n.t('doc-modal-document-issue-date'), baseData.createdTimestamp === 0 ? '' : new Date(baseData.createdTimestamp * 1000))}
            ${viewElements.dateTimeElement(this._i18n.t('doc-modal-modified'), baseData.modifiedTimestamp === 0 ? '' : new Date(baseData.modifiedTimestamp * 1000))}
            ${viewElements.stringElement(this._i18n.t('doc-modal-subject-of'), baseData.subjectOf || '')}
            ${viewElements.stringElement(this._i18n.t('doc-modal-study-field'), this.getStudyFieldNameForKey(baseData.studyField))}
            ${viewElements.stringElement(this._i18n.t('doc-modal-semester'), baseData.semester || '')}
            ${viewElements.enumElement(this._i18n.t('doc-modal-storage-purpose-deletion'), baseData.isPartOf, BaseFormElement.getIsPartOfItems())}
            ${viewElements.stringElement(this._i18n.t('doc-modal-comment'), baseData.comment || '')}
            ${baseData.deleteAtTimestamp ? '' :
                viewElements.dateElement(this._i18n.t('doc-modal-recommended-deletion'), baseData.recommendedDeletionTimestamp === 0 ? '' : new Date(baseData.recommendedDeletionTimestamp * 1000))}
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
        return html`
            <form>
                <h2>BaseView</h2>
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
