import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from './i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import * as formElements from './objectTypes/formElements';
import * as viewElements from './objectTypes/viewElements';
import {classMap} from 'lit/directives/class-map.js';
import {getSelectorFixCSS} from './styles.js';

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
        border-bottom: 1px solid rgb(34, 33, 32);
        margin-bottom: calc(7px + 1vh);
    }
    .text-container {
        display: flex;
        flex-direction: column;
        color:var(--dbp-override-content);
    }
    .icon-container {
        display: flex;
        align-items: right;
        justify-content: right;
        background-image: url('/assets/icon/docs.svg');
        background-repeat: no-repeat;
        background-size:30px;
        background-position-x: right;
        width: 50px;
        height: 50px;
    }
    .ais-doc-Hits-content {
        display: grid;
        grid-template-rows: repeat(3, 1fr);
        gap: 10px;
    }
    .hit-content-item1 {
        grid-row: 1 / 2;
        color:var(--dbp-override-content);
    }
    .hit-content-item2 {
        grid-row: 2 / 3;
        color:var(--dbp-override-content);
    }
    .hit-content-item3 {
        grid-row: 3 / 4;
        padding-top: 30px;
        color:var(--dbp-override-content);
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

    static get scopedElements() {
        return {
        };
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
            ${formElements.stringElement('subjectOf', 'Subject of', baseData.subjectOf || '')}
            ${formElements.enumElement('studyField', 'Study field', baseData.studyField || '', this.getStudyFields(), true)}
            ${formElements.enumElement('semester', 'Semester', defaultSemester, this.getSemesters(), true)}
            ${formElements.hiddenElement('additionalType', additionalType)}
            ${formElements.stringElement('comment', 'Comment', baseData.comment || '', false, 5)}
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

    validateForm() {
        // Select all input elements with the 'required' attribute
        const formElement = this.shadowRoot.querySelector('form');
        const requiredFields = formElement.querySelectorAll('input[required], select[required], textarea[required]');

        // Loop through each required field
        for (let field of requiredFields) {
            // Check if the field is empty
            if (!field.value.trim()) {
                // If empty, alert the user and return false to prevent form submission
                // TODO: We will need to put those results into a div or something instead of using an alert for each single of them!
                alert(`Please fill out the ${field.name || 'required'} field.`);

                return false;
            }
        }

        // If all required fields are filled, return true to allow form submission
        return true;
    }

    storeBlobItem(event) {
        event.preventDefault();

        // Validate the form before proceeding
        if (!this.validateForm()) {
            return;
        }

        this.saveButtonEnabled = false;
        const formElement = this.shadowRoot.querySelector('form');
        const data = {
            'formData': this.gatherFormDataFromElement(formElement),
        };
        console.log('data', data);

        // alert('TODO: Store item!\n' + JSON.stringify(data));

        const customEvent = new CustomEvent("DbpCabinetDocumentAddSave",
            {"detail": data, bubbles: true, composed: true});
        this.dispatchEvent(customEvent);
    }

    setNestedValue(obj, path, value) {
        const keys = path.replace(/\]/g, '').split('[');
        let current = obj;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i === keys.length - 1) {
                // Last key, set the value
                current[key] = value;
            } else {
                // Not the last key, create nested object if it doesn't exist
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {};
                }
                current = current[key];
            }
        }
    }

    gatherFormDataFromElement(formElement) {
        const formData = new FormData(formElement);

        // Check if any elements have a "data-value" attribute, because we want to use that value instead of the form value
        const elementsWithDataValue = formElement.querySelectorAll('[data-value]');
        let dataValues = {};
        elementsWithDataValue.forEach(element => {
            const name = element.getAttribute('name') || element.id;
            dataValues[name] = element.getAttribute('data-value');
        });

        console.log('this.data', this.data);

        const data = {
            "about": {
                "@type": "Person",
                "persId": this.person.identNrObfuscated,
            },
        };

        for (let [key, value] of formData.entries()) {
            // Check if we have a "data-value" attribute for this element
            if (dataValues[key]) {
                value = dataValues[key];
            }

            this.setNestedValue(data, key, value);
        }

        return data;
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
            ${viewElements.enumElement('Document type', baseData.additionalType?.key || '', additionalTypes)}
            ${viewElements.stringElement('Mime type', baseData.mimeType)}
            ${viewElements.dateTimeElement('Date created (metadata)', baseData.createdTimestamp === 0 ? '' : new Date(baseData.createdTimestamp * 1000))}
            ${viewElements.dateTimeElement('Date modified (metadata)', baseData.modifiedTimestamp === 0 ? '' : new Date(baseData.modifiedTimestamp * 1000))}
            ${viewElements.stringElement('Subject of', baseData.subjectOf || '')}
            ${viewElements.stringElement('Study field', this.getStudyFieldNameForKey(baseData.studyField))}
            ${viewElements.stringElement('Semester', baseData.semester || '')}
            ${viewElements.stringElement('Comment', baseData.comment || '')}
            ${viewElements.dateElement('Recommended deletion', baseData.recommendedDeletionTimestamp === 0 ? '' : new Date(baseData.recommendedDeletionTimestamp * 1000))}
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
