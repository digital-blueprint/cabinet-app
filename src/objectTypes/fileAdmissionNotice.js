import {css, html} from 'lit';
import {
    BaseObject,
    BaseFormElement,
    BaseHitElement,
    BaseViewElement,
    getCommonStyles,
} from '../baseObject.js';
import {getDocumentHit, getAdmissionNotice} from './schema.js';
import {renderFieldWithHighlight, renderFieldWithHighlightOrTranslated} from '../utils.js';
import {
    DbpDateElement,
    DbpDateView,
    DbpEnumElement,
    DbpEnumView,
    DbpStringElement,
    DbpStringView,
} from '@dbp-toolkit/form-elements';

export default class extends BaseObject {
    name = 'file-cabinet-admissionNotice';

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

const DEFAULT_ADMISSION_NOTICE = {
    '@type': 'DocumentFile',
    objectType: 'file-cabinet-admissionNotice',
    file: {
        'file-cabinet-admissionNotice': {
            dateCreated: '',
            previousStudy: '',
            decision: '',
        },
    },
};

class CabinetFormElement extends BaseFormElement {
    static getAdditionalTypes() {
        return {
            AdmissionNotice: 'typesense-schema.file.base.additionalType.key.AdmissionNotice',
        };
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-form-date-element': DbpDateElement,
            'dbp-form-string-element': DbpStringElement,
            'dbp-form-enum-element': DbpEnumElement,
        };
    }

    getDecisions() {
        return {
            rejected: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.rejected',
            ),
            refused: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.refused',
            ),
            granted: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.granted',
            ),
        };
    }

    render() {
        console.log('-- Render CabinetFormElement --');
        console.log('this.data', this._getData());

        let hit = getDocumentHit(this._getData() ?? DEFAULT_ADMISSION_NOTICE);
        let admissionNotice = getAdmissionNotice(hit);

        // Schema:  https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/admissionNotice.schema.json
        // Example: https://gitlab.tugraz.at/dbp/middleware/api/-/blob/main/config/packages/schemas/relay-blob-bundle/cabinet-bucket/examples/admissionNotice_example.json
        return html`
            <form>
                <dbp-form-date-element
                    subscribe="lang"
                    name="dateCreated"
                    label=${this._i18n.t('doc-modal-issue-date')}
                    .value=${admissionNotice.dateCreated}
                    required></dbp-form-date-element>

                <dbp-form-string-element
                    subscribe="lang"
                    name="previousStudy"
                    label=${this._i18n.t('doc-modal-previousStudy')}
                    .value=${admissionNotice.previousStudy}></dbp-form-string-element>

                <dbp-form-enum-element
                    subscribe="lang"
                    name="decision"
                    label=${this._i18n.t('doc-modal-decision')}
                    .items=${this.getDecisions()}
                    .value=${admissionNotice.decision}></dbp-form-enum-element>

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
        let admissionNotice = getAdmissionNotice(hit);
        const i18n = this._i18n;
        const lastModified = new Date(hit.file.base.modifiedTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const dateCreated = new Date(hit.file.base.createdTimestamp * 1000).toLocaleString(
            'de-DE',
            {dateStyle: 'medium', timeStyle: 'medium'},
        );
        const issueDate = admissionNotice.dateCreated;
        const dateObject = new Date(issueDate);
        let formattedDate = issueDate
            ? new Intl.DateTimeFormat('de', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              }).format(dateObject)
            : '';
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
            'dbp-form-date-view': DbpDateView,
            'dbp-form-string-view': DbpStringView,
            'dbp-form-enum-view': DbpEnumView,
        };
    }

    getDecisions() {
        return {
            rejected: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.rejected',
            ),
            refused: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.refused',
            ),
            granted: this._i18n.t(
                'typesense-schema.file.file-cabinet-admissionNotice.decision.granted',
            ),
        };
    }

    _getCustomViewElements() {
        let hit = getDocumentHit(this.data);
        let admissionNotice = getAdmissionNotice(hit);

        const i18n = this._i18n;

        return html`
            <dbp-form-date-view
                subscribe="lang"
                label=${i18n.t('doc-modal-issue-date')}
                .value=${admissionNotice.dateCreated
                    ? new Date(admissionNotice.dateCreated)
                    : ''}></dbp-form-date-view>

            <dbp-form-string-view
                subscribe="lang"
                label=${i18n.t('doc-modal-previousStudy')}
                .value=${admissionNotice.previousStudy || ''}></dbp-form-string-view>

            <dbp-form-enum-view
                subscribe="lang"
                label=${i18n.t('doc-modal-decision')}
                .value=${admissionNotice.decision || ''}
                .items=${this.getDecisions()}></dbp-form-enum-view>
        `;
    }
}
