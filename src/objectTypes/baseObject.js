import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import {createInstance} from '../i18n';
import * as commonStyles from '@dbp-toolkit/common/styles';
import * as formElements from './formElements';

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

    getInstantSearchConfig() {
        return {
            "data": "Generic settings for instantsearch"
        };
    }
}

export class BaseFormElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
        this.data = {};
        this.personId = '';
        this.entryPointUrl = '';
        this.auth = {};
        this.saveButtonEnabled = true;
    }

    static get scopedElements() {
        return {
        };
    }

    getCommonFormElements = (additionalTypes = {}) => {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};

        return html`
            ${formElements.stringElement('subjectOf', 'Subject of', baseData.subjectOf || '')}
            ${formElements.stringElement('studyField', 'Study field', baseData.studyField || '', true)}
            ${formElements.stringElement('semester', 'Semester', baseData.semester || '', true)}
            ${formElements.enumElement('additionalType', 'Additional type', baseData.additionalType?.key || '', additionalTypes, false)}
            ${formElements.stringElement('comment', 'Comment', baseData.comment || '', false, 5)}
            ${this.getButtonRowHtml()}
        `;
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
                "persId": this.personId,
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
            userId: {type: String, attribute: 'user-id'},
            personId: {type: String, attribute: 'person-id'},
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
                <button class="button is-secondary" type="submit" @click=${this.cancelForm}>Cancel</button>
                <button class="button is-primary" type="submit" ?disabled=${!this.saveButtonEnabled} @click=${this.storeBlobItem}>Save</button>
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
}

export class BaseHitElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
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
            userId: {type: String, attribute: 'user-id'},
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
}

export class BaseViewElement extends ScopedElementsMixin(DBPLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.userId = '';
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
            userId: {type: String, attribute: 'user-id'},
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
                <h2>BaseView</h2>
                lang: ${this.lang}<br />
        `;
    }
}
