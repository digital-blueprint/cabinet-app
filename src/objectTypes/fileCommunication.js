import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement,getCommonStyles} from '../baseObject.js';
import * as formElements from './formElements.js';
import * as viewElements from './viewElements.js';
import { PersonHit } from './person.js';

export default class extends BaseObject {
    name = 'file-cabinet-communication';

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
            'Communication': 'Communication',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);

        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-communication"] || {};
        const agent = data.agent || {};

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/communication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/communication_example.json
        return html`
            <form>
                ${formElements.stringElement('agent[givenName]', 'Given name', agent.givenName || '')}
                ${formElements.stringElement('agent[familyName]', 'Family name', agent.familyName || '')}
                ${formElements.stringElement('abstract', 'Abstract', data.abstract || '', false, 10)}
                ${formElements.dateTimeElement('dateCreated', 'Date created', data.dateCreated || '', true)}
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
        console.log('data from Communication: ', this.data);
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
                <div class="hit-content-item1">${i18n.t('document-type')}:&nbsp;${this.data.file.base.additionalType.text}</div>
                <div class="hit-content-item2"></div>
                <div class="hit-content-item3">
                ${i18n.t('document-issue-date')}: ${this.data.file['file-cabinet-communication'].dateCreated}<br />
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
        const data = fileData["file-cabinet-communication"] || {};
        const agent = data.agent || {};

        return html`
            ${viewElements.stringElement('Given name', agent.givenName || '')}
            ${viewElements.stringElement('Family name', agent.familyName || '')}
            ${viewElements.stringElement('Abstract', data.abstract || '')}
            ${viewElements.dateTimeElement('Date created', data.dateCreated ? new Date(data.dateCreated) : '')}
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
        `;
    }
}
