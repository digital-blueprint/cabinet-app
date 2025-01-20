import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement, getCommonStyles} from '../baseObject.js';
import * as formElements from './formElements.js';
import * as viewElements from './viewElements.js';
import { PersonHit } from './person.js';
export default class extends BaseObject {
    name = 'file-cabinet-identityDocument';

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
    static getAdditionalTypes() {
        return {
            'DriversLicence': 'Drivers Licence',
            'Passport': 'Passport',
            'PersonalLicence': 'Personal Licence',
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);

        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-identityDocument"] || {};

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/identityDocument.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/identityDocument_example.json
        return html`
            <form>
                ${formElements.stringElement('identifier', 'Identifier', data.identifier || '', true)}
                ${formElements.enumElement('nationality', 'Nationality', data.nationality || '', formElements.getNationalityItems(), true)}
                ${formElements.dateElement('dateCreated', 'Date created', data.dateCreated || '', true)}
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
        const issueDate = this.data.file['file-cabinet-identityDocument'].dateCreated;
        const dateObject = new Date(issueDate);
        const formattedDate = new Intl.DateTimeFormat('de').format(dateObject);
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                <div class="text-container">
                <div class="ais-doc-Hits-header-items header-item1">${hit.person.fullName}</div>
                <div class="ais-doc-Hits-header-items header-item2">${hit.person.birthDate}&nbsp(${hit.person.studId}&nbsp|&nbsp${hit.person.stPersonNr})</div>
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
        const data = fileData["file-cabinet-identityDocument"] || {};

        return html`
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
            ${viewElements.stringElement('Identifier', data.identifier || '')}
            ${viewElements.enumElement('Nationality', data.nationality || '', formElements.getNationalityItems())}
            ${viewElements.dateElement('Date created', data.dateCreated ? new Date(data.dateCreated) : '')}
        `;
    }
}
