import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement, getCommonStyles} from '../baseObject.js';
import * as formElements from './formElements.js';
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
                <dbp-form-string-element
                    subscribe="lang"
                    name="identifier"
                    label=${this._i18n.t('doc-modal-Identifier')}
                    .value=${data.identifier || ''}
                    required>
                </dbp-form-string-element>

                <dbp-form-enum-element
                    subscribe="lang"
                    name="nationality"
                    label=${this._i18n.t('doc-modal-nationality')}
                    .items=${formElements.getNationalityItems()}
                    .value=${data.nationality || ''}
                    required>
                </dbp-form-enum-element>

                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${data.dateCreated || ''}
                    required>
                </dbp-form-date-element>

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
        let formattedDate = issueDate ? new Intl.DateTimeFormat('de').format(new Date(issueDate)): '';
        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
                        <div class="icon-container">
                        </div>
                        <div class="ais-doc-title">${this.data.file.base.additionalType.text}
                        </div>
                    </div>
                    <div class="text-container">
                        <div class="ais-doc-Hits-header-items header-item1">${hit.person.fullName}</div> &nbsp
                        <div class="ais-doc-Hits-header-items header-item2">${hit.person.birthDate}&nbsp(${hit.person.studId}&nbsp|&nbsp${hit.person.stPersonNr})</div>
                    </div>
                </header>
                <main class="ais-doc-Hits-content">
                    <div class="hit-content-item">
                        ${issueDate ? html`${i18n.t('document-issue-date')}: ${formattedDate}` : ''}<br/>
                        ${i18n.t('Added')}: ${dateCreated}<br />
                        ${i18n.t('last-modified')}: ${lastModified}<br />
                    </div>
                </main>
            </form>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    constructor() {
        super();
        this.setAdditionalTypes(CabinetFormElement.getAdditionalTypes());
    }

    getCustomViewElements() {
        const fileData = this.data?.file || {};
        const data = fileData["file-cabinet-identityDocument"] || {};

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-Identifier')}
                .value=${data.identifier || ''}>
            </dbp-form-string-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-nationality')}
                .value=${data.nationality || ''}
                .items=${formElements.getNationalityItems()}>
            </dbp-form-enum-view>

            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-issue-date')}
                .value=${data.dateCreated ? new Date(data.dateCreated) : ''}>
            </dbp-form-datetime-view>
        `;
    }
}
