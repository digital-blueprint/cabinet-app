import {html} from 'lit';
import {
    BaseObject,
    BaseFormElement,
    BaseHitElement,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getCommunication} from './schema.js';
import {renderFieldWithHighlight, renderFieldWithHighlightOrTranslated} from '../utils.js';
import {
    DbpDateTimeElement,
    DbpDateTimeView,
    DbpStringElement,
    DbpStringView,
} from '@dbp-toolkit/form-elements';

export default class extends BaseObject {
    name = 'file-cabinet-communication';

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

const DEFAULT_COMMUNICATION = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-communication',
    file: {
        'file-cabinet-communication': {
            abstract: '',
            agent: {
                givenName: '',
                familyName: '',
            },
            dateCreated: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            Communication: 'typesense-schema.file.base.additionalType.key.Communication',
        };
    }

    static getDefaultData() {
        return DEFAULT_COMMUNICATION;
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-string-element': DbpStringElement,
            'dbp-form-datetime-element': DbpDateTimeElement,
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('render this.data', this.data);

        let hit = getDocumentHit(this._getData() ?? DEFAULT_COMMUNICATION);
        let communication = getCommunication(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/communication.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/communication_example.json
        return html`
            <form>
                <dbp-form-string-element
                    subscribe="lang"
                    name="agent[givenName]"
                    label=${this._i18n.t('given-name')}
                    placeholder=${this._i18n.t('given-name')}
                    .value=${communication.agent.givenName}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="agent[familyName]"
                    label=${this._i18n.t('family-name')}
                    placeholder=${this._i18n.t('family-name')}
                    .value=${communication.agent.familyName}></dbp-form-string-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="abstract"
                    label=${this._i18n.t('communication-abstract')}
                    placeholder=${this._i18n.t('communication-abstract')}
                    rows="10"
                    .value=${communication.abstract}></dbp-form-string-element>

                <dbp-form-datetime-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    value=${communication.dateCreated}
                    required></dbp-form-datetime-element>

                ${this.getCommonFormElements()}
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        return [...super.styles, getCommonStyles()];
    }

    render() {
        console.log('data from Communication: ', this.data);

        let hit = getDocumentHit(this.data);
        let communication = getCommunication(hit);
        const i18n = this._i18n;

        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const issueDate = communication.dateCreated;
        let formattedDate = new Intl.DateTimeFormat('de', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(issueDate));

        return html`
            <form>
                <header class="ais-doc-Hits-header">
                    <div class="ais-doc-title-wrapper">
                        <dbp-icon class="icon-container" name="files"></dbp-icon>
                        <div class="ais-doc-title">
                            ${renderFieldWithHighlightOrTranslated(
                                this._i18n,
                                'typesense-schema.file.base.additionalType.key.',
                                hit,
                                'file.base.additionalType.key',
                                'file.base.additionalType.text',
                            )}
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
            'dbp-form-string-view': DbpStringView,
            'dbp-form-datetime-view': DbpDateTimeView,
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let communication = getCommunication(hit);

        return html`
            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('given-name')}
                .value=${communication.agent
                    ? communication.agent.givenName
                    : ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('family-name')}
                .value=${communication.agent
                    ? communication.agent.familyName
                    : ''}></dbp-form-string-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${this._i18n.t('communication-abstract')}
                .value=${communication.abstract || ''}></dbp-form-string-view>

            <dbp-form-datetime-view
                subscribe="lang"
                label=${this._i18n.t('doc-modal-issue-date')}
                .value=${communication.dateCreated
                    ? new Date(communication.dateCreated)
                    : ''}></dbp-form-datetime-view>
        `;
    }
}
