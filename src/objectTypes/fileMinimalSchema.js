import {css, html} from 'lit';
import {
    BaseObject,
    BaseFormElement,
    BaseHitElement,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getMinimalSchema} from './schema.js';
import {renderFieldWithHighlight} from '../utils.js';
import {DbpDateElement, DbpDateView} from '@dbp-toolkit/form-elements';

export default class extends BaseObject {
    name = 'file-cabinet-minimalSchema';

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

const DEFAULT_MINIMAL_SCHEMA = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-minimalSchema',
    file: {
        'file-cabinet-minimalSchema': {
            dateCreated: null,
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            BirthCertificate: 'typesense-schema.file.base.additionalType.key.BirthCertificate',
            MaritalStatusCertificate:
                'typesense-schema.file.base.additionalType.key.MaritalStatusCertificate',
            SupervisionAcceptance:
                'typesense-schema.file.base.additionalType.key.SupervisionAcceptance',
        };
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-element': DbpDateElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);
        let hit = getDocumentHit(this._getData() ?? DEFAULT_MINIMAL_SCHEMA);
        let minimalSchema = getMinimalSchema(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/minimalSchema.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/minimalSchema_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${minimalSchema.dateCreated || ''}
                    required></dbp-form-date-element>

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
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);
        const i18n = this._i18n;

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const issueDate = minimalSchema.dateCreated;
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              }).format(new Date(issueDate))
            : '';

        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
                        <dbp-icon class="icon-container" name="files"></dbp-icon>
                        <div class="ais-doc-title">
                            ${renderFieldWithHighlight(hit, 'file.base.additionalType.text')}
                        </div>
                    </div>
                    <div class="text-container">
                        <div class="ais-doc-Hits-header-items header-item1">
                            ${renderFieldWithHighlight(hit, 'person.familyName')},
                            ${renderFieldWithHighlight(hit, 'person.givenName')}
                            ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
                        </div>
                        &nbsp
                        <div class="ais-doc-Hits-header-items header-item2">
                            ${renderFieldWithHighlight(hit, 'person.studId')} |
                            ${renderFieldWithHighlight(hit, 'person.stPersonNr')}
                        </div>
                    </div>
                </header>
                <main class="ais-doc-Hits-content">
                    <div class="hit-content-item">
                        ${issueDate
                            ? html`
                                  ${i18n.t('document-issue-date')}: ${formattedDate}
                              `
                            : ''}
                        <br />
                        <span>${i18n.t('Added')}: ${dateCreated}</span>
                        <br />
                        <span>${i18n.t('last-modified')}: ${lastModified}</span>
                        <br />
                    </div>
                    ${this.renderViewButton(hit)}
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

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-view': DbpDateView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let minimalSchema = getMinimalSchema(hit);

        return html`
            <dbp-form-date-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-issue-date')}
                .value=${minimalSchema.dateCreated
                    ? new Date(minimalSchema.dateCreated)
                    : ''}></dbp-form-date-view>
        `;
    }
}
