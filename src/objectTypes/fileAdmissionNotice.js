import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement, getCommonStyles} from '../baseObject.js';
import * as viewElements from './viewElements.js';
import { PersonHit } from './person.js';
import {createRef, ref} from 'lit/directives/ref.js';
export default class extends BaseObject {
    name = 'file-cabinet-admissionNotice';

    /**
     * @returns {string}
     */
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

class CabinetFormElement extends BaseFormElement {
    constructor() {
        super();
        this.decisionRef = createRef();
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateComplete.then(() => {
            // Set the items for the enum component
            this.decisionRef.value.setItems(CabinetFormElement.getDecisions());
        });
    }

    static getAdditionalTypes = () => {
        return {
            'AdmissionNotice': 'Admission Notice',
        };
    };

    static getDecisions = () => {
        return {
            'rejected': 'Rejected',
            'refused': 'Refused',
            'granted': 'Granted',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this.data);

        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-admissionNotice"] || {};

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/admissionNotice.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/admissionNotice_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label="Date created"
                    .value=${data.dateCreated || ''}
                    required>
                </dbp-form-date-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousStudy"
                    label="Previous study"
                    .value=${data.previousStudy || ''}>
                </dbp-form-string-element>

                <dbp-form-enum-element
                    ${ref(this.decisionRef)}
                    subscribe="lang"
                    name="decision"
                    label="Decision"
                    .value=${data.decision || ''}>
                </dbp-form-enum-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
        ${super.styles}
        ${getCommonStyles()}

        `;
    }

    render() {
        const lastModified = new Date(this.data.file.base.modifiedTimestamp * 1000).toLocaleString('de-DE',{ dateStyle: 'short'});
        const dateCreated = new Date(this.data.file.base.createdTimestamp * 1000).toLocaleString('de-DE',{ dateStyle: 'short'});
        const i18n = this._i18n;
        let hit = /** @type {PersonHit} */(this.data);
        const issueDate = this.data.file['file-cabinet-admissionNotice'].dateCreated;
        const dateObject = new Date(issueDate);
        const formattedDate = new Intl.DateTimeFormat('de').format(dateObject);
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                <div class="text-container">
                <div class="ais-doc-Hits-header-items header-item1">${hit.person.fullName}</div>
                <div class="ais-doc-Hits-header-items header-item2">${hit.person.birthDate} &nbsp (${hit.person.studId}&nbsp|&nbsp${hit.person.stPersonNr})</div>
                </div>
                <div class="icon-container">
                </div>
                </header>
                <main class="ais-doc-Hits-content">
                <header class="hit-content-item1">${this.data.file.base.additionalType.text}</header>
                <div class="hit-content-item2"></div>
                <div class="hit-content-item3">
                ${i18n.t('document-issue-date')}: ${formattedDate}<br/>
                ${i18n.t('Added')}: ${dateCreated}<br />
                ${i18n.t('last-modified')}: ${lastModified}<br />
                </div>
                </main>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-admissionNotice"] || {};
        const baseData = fileData["base"];
        baseData["createdTimestamp"];
        baseData["modifiedTimestamp"];

        return html`
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
            ${viewElements.dateElement('Date created', data.dateCreated ? new Date(data.dateCreated) : '')}
            ${viewElements.stringElement('Previous study', data.previousStudy || '')}
            ${viewElements.enumElement('Decision', data.decision || '', CabinetFormElement.getDecisions())}
        `;
    }
}
