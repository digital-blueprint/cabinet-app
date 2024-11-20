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
                <svg width="1.4em" xmlns="http://www.w3.org/2000/svg" height="1.4em" viewBox="1714.544 1153.736 30.853 30.496" fill="none"><path d="M1744.208 1153.736h-15.296a1.25 1.25 0 0 0-1.248 1.248v5.792h-11.872a1.25 1.25 0 0 0-1.248 1.248v14.24c0 .096.032.16.096.224l7.68 7.648a.29.29 0 0 0 .224.096h8.448a1.25 1.25 0 0 0 1.248-1.248v-9.056l3.2 3.168a.29.29 0 0 0 .224.096h8.512c.672 0 1.216-.544 1.216-1.216v-20.992c.064-.672-.512-1.248-1.184-1.248Zm-22.272 27.52-4.352-4.352h4.352v4.352Zm8.544 1.248h-6.784v-6.112c0-.672-.576-1.216-1.248-1.216h-6.112v-12.64h14.176l-.032 19.968Zm1.76-12.608h2.784v4.288l-2.784-2.72v-1.568Zm11.456 5.504h-6.88v-6.016c0-.672-.544-1.248-1.216-1.248h-3.36v-6.112c0-.672-.576-1.248-1.216-1.248h-1.6v-5.28h14.24l.032 19.904Z" style="fill: rgb(158, 30, 77); fill-opacity: 1;" class="fills" data-testid="svg-path"/></svg>
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
            ${viewElements.dateTimeElement('Date created', data.dateCreated || '')}
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
        `;
    }
}
