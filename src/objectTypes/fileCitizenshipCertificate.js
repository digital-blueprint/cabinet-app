import {css, html} from 'lit';
import {BaseFormElement, BaseHitElement, BaseObject, BaseViewElement, getCommonStyles} from '../baseObject.js';
import * as formElements from './formElements.js';
import * as viewElements from './viewElements.js';
import { PersonHit } from './person.js';

export default class extends BaseObject {
    name = 'file-cabinet-citizenshipCertificate';

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
    static getAdditionalTypes = () => {
        return {
            'CitizenshipCertificate': 'Citizenship Certificate',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');

        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-citizenshipCertificate"] || {};

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/citizenshipCertificate.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/citizenshipCertificate_example.json
        return html`
            <form>
                ${formElements.enumElement('nationality', 'Nationality', data.nationality || '', formElements.getNationalityItems(), false)}
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
        const lastModified = new Date(this.data.file.base.modifiedTimestamp * 1000).toLocaleString();
        const i18n = this._i18n;
        let hit = /** @type {PersonHit} */(this.data);
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                <div class="text-container">
                <div class="ais-doc-Hits-header-items header-item1">${hit.person.fullName}</div>
                <div class="ais-doc-Hits-header-items header-item2">${hit.person.birthDate}(${hit.person.studId}|${hit.person.stPersonNr})</div>
                </div>
                <div class="icon-container">
                </div>
                </header>
                <main class="ais-doc-Hits-content">
                <header class="hit-content-item1">${i18n.t('document-type')}:&nbsp;${this.data.file.base.additionalType.text}</header>
                <div class="hit-content-item2"></div><br />
                <div class="hit-content-item3">
                ${i18n.t('document-issue-date')}: ${this.data.file['file-cabinet-citizenshipCertificate'].dateCreated}<br />
                ${i18n.t('Added')}: <br />
                ${i18n.t('last-modified')}: ${lastModified}<br />
                </div>
                </main>
            </form>
        `;
    }
}
class CabinetViewElement extends BaseViewElement {
    render() {
        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-citizenshipCertificate"] || {};

        return html`
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
            ${viewElements.enumElement('Nationality', data.nationality || '', formElements.getNationalityItems())}
            ${viewElements.dateElement('Date created', data.dateCreated ? new Date(data.dateCreated) : '')}
        `;
    }
}
