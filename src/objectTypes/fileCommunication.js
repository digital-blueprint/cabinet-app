import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';
import * as viewElements from './viewElements.js';

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
                <h2>Communication Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('agent[givenName]', 'Given name', agent.givenName || '')}
                ${formElements.stringElement('agent[familyName]', 'Family name', agent.familyName || '')}
                ${formElements.stringElement('abstract', 'Abstract', data.abstract || '', false, 10)}
                ${formElements.dateTimeElement('dateCreated', 'Date created', data.dateCreated || '', true)}
                ${this.getCommonFormElements(CabinetFormElement.getAdditionalTypes())}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            .ais-com-Hits-header{
                border-bottom: 1px solid rgb(34, 33, 32);
                margin-bottom: calc(7px + 1vh);
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 5px;
            }
            .ais-com-Hits-header-items{
                display: flex;
            }
            .ais-com-Hits-content {
                gap: 10px;
                display: grid;
                grid-template-rows: repeat(3, 1fr);
            }
            .hit-content-item1 {
                grid-row: 1/2; 
            }     
            .hit-content-item2 {
                grid-row: 2/3; 
            }     
            .hit-content-item3 {
                grid-row: 3/3;
                padding-top:30px; 
            }    
            .com-item1 {
                grid-column: 1 / 2;
                color:#1ace38;
            }
            .com-item2 {
                grid-column: 3 / 4;
                justify-self: end; 
            }
            .com-item3 {
                grid-column: 1 / 2;
                 
            }
            .com-item4 {
                grid-column: 2 / 3;
                
            }
            .com-item5 {
                grid-column: 3 / 4;
                
            }   
        `;
    }

    render() {
        console.log('data from Communication: ', this.data);
        const lastModified = new Date(this.data.file.base.modifiedTimestamp * 1000).toLocaleString();
        return html`
            <form>
                <header class="ais-com-Hits-header">
                <div class="ais-com-Hits-header-items com-item1">Communication(Family name,given name)</div>
                <div class="ais-com-Hits-header-items com-item2">
                <svg width="1.4em" xmlns="http://www.w3.org/2000/svg" height="1.4em" viewBox="1714.544 1153.736 30.853 30.496" fill="none"><path d="M1744.208 1153.736h-15.296a1.25 1.25 0 0 0-1.248 1.248v5.792h-11.872a1.25 1.25 0 0 0-1.248 1.248v14.24c0 .096.032.16.096.224l7.68 7.648a.29.29 0 0 0 .224.096h8.448a1.25 1.25 0 0 0 1.248-1.248v-9.056l3.2 3.168a.29.29 0 0 0 .224.096h8.512c.672 0 1.216-.544 1.216-1.216v-20.992c.064-.672-.512-1.248-1.184-1.248Zm-22.272 27.52-4.352-4.352h4.352v4.352Zm8.544 1.248h-6.784v-6.112c0-.672-.576-1.216-1.248-1.216h-6.112v-12.64h14.176l-.032 19.968Zm1.76-12.608h2.784v4.288l-2.784-2.72v-1.568Zm11.456 5.504h-6.88v-6.016c0-.672-.544-1.248-1.216-1.248h-3.36v-6.112c0-.672-.576-1.248-1.216-1.248h-1.6v-5.28h14.24l.032 19.904Z" style="fill: rgb(158, 30, 77); fill-opacity: 1;" class="fills" data-testid="svg-path"/></svg>
                </div>
                <div class="ais-com-Hits-header-items com-item3">birthDate</div>
                <div class="ais-com-Hits-header-items com-item4">studId</div>
                <div class="ais-com-Hits-header-items com-item5">stPersonNr</div>
                </header>
                <main class="ais-com-Hits-content">
                lang: ${this.lang}<br />
                <div class="ais-com-Hits-content-items hit-content-item1">document Type</div>
                <div class="ais-com-Hits-content-items hit-content-item2">filename: ${this.data.file.base.fileName}</div>
                <div class="ais-com-Hits-content-items hit-content-item3">
                dateCreated: ${this.data.file['file-cabinet-communication'].dateCreated}<br />
                lastModified: ${lastModified}<br />
                </div>
                </main>
            </form>    
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};
        const data = fileData["file-cabinet-communication"] || {};
        const agent = data.agent || {};

        return html`
            <h2>Communication</h2>
            lang: ${this.lang}<br />
            filename: ${baseData.fileName}<br />
            ${viewElements.stringElement('Given name', agent.givenName || '')}
            ${viewElements.stringElement('Family name', agent.familyName || '')}
            ${viewElements.stringElement('Abstract', data.abstract || '')}
            ${viewElements.dateTimeElement('Date created', data.dateCreated || '')}
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
        `;
    }
}
