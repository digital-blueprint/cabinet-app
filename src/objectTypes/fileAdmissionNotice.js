import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';
import {renderFieldWithHighlight} from '../utils';
import * as viewElements from './viewElements.js';

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
}

class CabinetFormElement extends BaseFormElement {
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
                <h2>admissionNotice Form</h2>
                ${formElements.dateElement('dateCreated', 'Date created', data.dateCreated || '', true)}
                ${formElements.stringElement('previousStudy', 'Previous study', data.previousStudy || '')}
                ${formElements.enumElement('decision', 'Decision', data.decision || '', CabinetFormElement.getDecisions(), false)}
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

            
            .ais-admission-Hits-header{
                border-bottom: 1px solid rgb(34, 33, 32);
                margin-bottom: calc(7px + 1vh);
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 5px;
            }
            .ais-admission-Hits-header-items{
                display: flex;
            }
            .ais-admission-Hits-content {
                display: grid;
                grid-template-rows: repeat(3, 1fr);
                gap: 10px;
            }
            .hit-content-item1 {
                grid-row: 1/2; 
            }     
            .hit-content-item2 {
                grid-row: 2/3; 
            }     
            .hit-content-item3 {
                grid-row: 3/3;
                padding-top: 30px;  
            }
            .admission-item1 {
                grid-column: 1 / 2;
                color:#2baff5;
            }
            .admission-item2 {
                grid-column: 3 / 4;
                justify-self: end; 
            }
            .admission-item3 {
                grid-column: 1 / 2;
                 
            }
            .admission-item4 {
                grid-column: 2 / 3;
                
            }
            .admission-item5 {
                grid-column: 3 / 4;
                
            }     
        `;
    }

    render() {
        return html`
            <form>
                <header class="ais-admission-Hits-header">
                <div class="ais-admission-Hits-header-items admission-item1">admissionNotice(Family name,given name)</div>
                <div class="ais-admission-Hits-header-items admission-item2">
                <svg width="1.4em" xmlns="http://www.w3.org/2000/svg" height="1.4em" viewBox="1714.544 1153.736 30.853 30.496" fill="none"><path d="M1744.208 1153.736h-15.296a1.25 1.25 0 0 0-1.248 1.248v5.792h-11.872a1.25 1.25 0 0 0-1.248 1.248v14.24c0 .096.032.16.096.224l7.68 7.648a.29.29 0 0 0 .224.096h8.448a1.25 1.25 0 0 0 1.248-1.248v-9.056l3.2 3.168a.29.29 0 0 0 .224.096h8.512c.672 0 1.216-.544 1.216-1.216v-20.992c.064-.672-.512-1.248-1.184-1.248Zm-22.272 27.52-4.352-4.352h4.352v4.352Zm8.544 1.248h-6.784v-6.112c0-.672-.576-1.216-1.248-1.216h-6.112v-12.64h14.176l-.032 19.968Zm1.76-12.608h2.784v4.288l-2.784-2.72v-1.568Zm11.456 5.504h-6.88v-6.016c0-.672-.544-1.248-1.216-1.248h-3.36v-6.112c0-.672-.576-1.248-1.216-1.248h-1.6v-5.28h14.24l.032 19.904Z" style="fill: rgb(158, 30, 77); fill-opacity: 1;" class="fills" data-testadmission="svg-path"/></svg>
                </div>
                <div class="ais-admission-Hits-header-items admission-item3">birthDate</div>
                <div class="ais-admission-Hits-header-items admission-item4">studId</div>
                <div class="ais-admission-Hits-header-items admission-item5">stPersonNr</div>
                </header>
                <main class="ais-admission-Hits-content">
                <header class="ais-admission-Hits-content-items hit-content-item1">documentType: ${this.data.additionalType}</header>
                lang: ${this.lang}<br />
                <!-- filename: ${this.data.file.base.fileName}<br /> -->
                <div class="ais-admission-Hits-content-items hit-content-item2">filename: ${renderFieldWithHighlight(this.data, 'file.base.fileName')}</div>
                <div class="ais-admission-Hits-content-items hit-content-item3">
                dateCreated: <br/>
                lastModified: 
                </div>
                </main>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        const fileData = this.data?.file || {};
        const baseData = fileData.base || {};
        const data = fileData["file-cabinet-admissionNotice"] || {};

        return html`
            <h2>admissionNotice</h2>
            lang: ${this.lang}<br />
            filename: ${baseData.fileName}<br />
            ${viewElements.dateElement('Date created', data.dateCreated || '')}
            ${viewElements.stringElement('Previous study', data.previousStudy || '')}
            ${viewElements.enumElement('Decision', data.decision || '', CabinetFormElement.getDecisions())}
            ${this.getCommonViewElements(CabinetFormElement.getAdditionalTypes())}
        `;
    }
}
