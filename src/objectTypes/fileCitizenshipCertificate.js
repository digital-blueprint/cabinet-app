import {css, html} from 'lit';
import {BaseFormElement, BaseHitElement, BaseObject, BaseViewElement} from './baseObject';
import * as formElements from './formElements.js';

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
}

class CabinetFormElement extends BaseFormElement {
    getAdditionalTypes = () => {
        return {
            'CitizenshipCertificate': 'Citizenship Certificate',
        };
    };

    render() {
        console.log('-- Render CabinetFormElement --');

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/citizenshipCertificate.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/citizenshipCertificate_example.json
        return html`
            <form>
                <h2>fileCitizenshipCertificate Form</h2>
                lang: ${this.lang}<br />
                ${formElements.stringElement('studyField', 'Study field', '', true)}
                ${formElements.stringElement('semester', 'Semester', '', true)}
                ${formElements.enumElement('additionalType', 'Additional types', '', this.getAdditionalTypes(), false)}
                ${formElements.enumElement('nationality', 'Nationality', '', formElements.getNationalityItems(), false)}
                ${formElements.dateElement('dateCreated', 'Date created', '', true)}
                ${formElements.stringElement('comment', 'Comment', '', false, 5)}
                ${this.getButtonRowHtml()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            
            .ais-cit-Hits-header{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 5px;
                border-bottom: 1px solid rgb(34, 33, 32);
                margin-bottom: calc(7px + 1vh);
            }
            .ais-cit-Hits-header-items{
                display: grid;
            } 
            .ais-cit-Hits-content {
                margin-bottom:calc(150px + 5vh);
            }
            .cit-item1 {
                grid-column: 1 / 2;
                color:#d55e6b;
            }
            .cit-item2 {
                grid-column: 3 / 4;
                justify-self: end; 
            }
            .cit-item3 {
                grid-column: 1 / 2;
                 
            }
            .cit-item4 {
                grid-column: 2 / 3;
                
            }
            .cit-item5 {
                grid-column: 3 / 4;
                
            }
        `;
    }
    render() {
        return html`
            <form>
               <header class="ais-cit-Hits-header">
                    <div class="ais-cit-Hits-header-items cit-item1">CitizenshipCertificate(Family name, given name)</div>
                    <div class="ais-cit-Hits-header-items cit-item2">
                    <svg width="1.4em" xmlns="http://www.w3.org/2000/svg" height="1.4em" viewBox="1714.544 1153.736 30.853 30.496" fill="none"><path d="M1744.208 1153.736h-15.296a1.25 1.25 0 0 0-1.248 1.248v5.792h-11.872a1.25 1.25 0 0 0-1.248 1.248v14.24c0 .096.032.16.096.224l7.68 7.648a.29.29 0 0 0 .224.096h8.448a1.25 1.25 0 0 0 1.248-1.248v-9.056l3.2 3.168a.29.29 0 0 0 .224.096h8.512c.672 0 1.216-.544 1.216-1.216v-20.992c.064-.672-.512-1.248-1.184-1.248Zm-22.272 27.52-4.352-4.352h4.352v4.352Zm8.544 1.248h-6.784v-6.112c0-.672-.576-1.216-1.248-1.216h-6.112v-12.64h14.176l-.032 19.968Zm1.76-12.608h2.784v4.288l-2.784-2.72v-1.568Zm11.456 5.504h-6.88v-6.016c0-.672-.544-1.248-1.216-1.248h-3.36v-6.112c0-.672-.576-1.248-1.216-1.248h-1.6v-5.28h14.24l.032 19.904Z" style="fill: rgb(158, 30, 77); fill-opacity: 1;" class="fills" data-testid="svg-path"/></svg>
                    </div>
                    <div class="ais-cit-Hits-header-items cit-item3">birthDate</div>
                    <div class="ais-cit-Hits-header-items cit-item4">studId</div>
                    <div class="ais-cit-Hits-header-items cit-item5">stPersonNr</div>
                </header>
                <main class="ais-cit-Hits-content">
                    lang: ${this.lang}<br />
                    filename: ${this.data.file.base.fileName}<br />
                    dateCreated: 
               </main>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        return html`
            <h2>Citizenship Certificate</h2>
            lang: ${this.lang}<br />
            filename: ${this.data.file.base.fileName}<br />
        `;
    }
}
