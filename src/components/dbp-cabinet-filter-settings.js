import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {IconButton, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';

export class CabinetFilterSettings extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.facetConfigs = [];
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-modal': Modal,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            facetConfigs: {type: Array, attribute: false},
        };
    }

    async open(facetConfigs) {
        console.log('open facetConfigs', facetConfigs);
        // Filter facetConfigs to only include items with groupId 'person' or 'file', don't include 'person.person'
        this.facetConfigs = (facetConfigs || []).filter(
            (item) =>
                (item.groupId === 'person' || item.groupId === 'file') &&
                item.schemaField !== 'person.person',
        );

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        console.log('modal', modal);
        modal.open();
    }

    close() {
        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        modal.close();
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}

            #filter-modal .modal-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            #filter-modal .modal-title h3 {
                color: var(--dbp-override-accent);
                padding-top: 0.5rem;
                font-weight: 300;
                font-size: 1.5em;
                margin: 0;
            }

            #filter-modal .modal-header h3 {
                font-size: 1.5em;
            }

            #filter-modal .modal-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 10px;
                grid-auto-flow: row;
            }

            #filter-modal .modal-footer {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
            }

            .facet-filter-icon {
                color: var(--dbp-override-accent);
                font-size: 2em;
            }

            .headers {
                max-width: 100%;
                margin: 0;
                list-style-type: none;
                padding: 0;
                display: grid;
                width: 100%;
            }

            .header-field {
                align-items: center;
                height: 50px;
                border: 1px solid var(--dbp-muted);
                display: flex;
                margin-bottom: 5px;
                width: 100%;
            }

            .header-button {
                justify-content: center;
                display: flex;
                align-items: center;
                height: 50px;
                width: 50px;
                min-width: 50px;
                flex-grow: 0;
                cursor: pointer;
            }

            .header-button dbp-icon {
                font-size: 1.3em;
                top: 0;
            }

            .header-button.hidden,
            .extended-menu.hidden {
                display: none !important;
            }

            .header-title {
                flex-grow: 2;
                text-overflow: ellipsis;
                overflow: hidden;
                padding-left: 5px;
                text-align: left;
            }

            .header-order {
                background-color: var(--dbp-muted-surface);
                color: var(--dbp-on-muted-surface);
                font-weight: bold;
            }
        `;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getModalHtml() {
        const i18n = this._i18n;

        // TODO: Work in progress
        return html`
            <dbp-modal
                style="--dbp-modal-width: 600px;"
                ${ref(this.modalRef)}
                id="filter-modal"
                modal-id="filter-modal"
                width="600px"
                height="80%"
                min-width="300px"
                min-height="80%"
                subscribe="lang"
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="title" class="modal-title">
                    <dbp-icon
                        class="facet-filter-icon"
                        title="${i18n.t('cabinet-search.facet-settings')}"
                        aria-label="${i18n.t('cabinet-search.facet-settings')}"
                        name="cog"></dbp-icon>
                    <h3>Filter configuration</h3>
                </div>
                <div slot="header" class="modal-header">
                    <h3>Person properties</h3>
                </div>
                <div slot="content" class="modal-content">${this.renderFacetList()}</div>
                <div slot="footer" class="modal-footer">
                    <div>
                        <dbp-button
                            title="${i18n.t('filter-settings.abort')}"
                            class="check-btn button is-secondary"
                            @click="${() => {
                                this.closeColumnOptionsModal();
                            }}">
                            ${i18n.t('filter-settings.abort')}
                        </dbp-button>
                    </div>
                    <div>
                        <dbp-button
                            title="${i18n.t('filter-settings.reset-filter')}"
                            class="check-btn button is-secondary"
                            @click="${() => {
                                this.resetSettings();
                            }}">
                            ${i18n.t('filter-settings.reset-filter')}
                        </dbp-button>
                        <dbp-button
                            title="${i18n.t('filter-settings.all-filters-hide')}"
                            class="check-btn button is-secondary"
                            @click="${() => {
                                this.toggleAllColumns('hide');
                            }}">
                            ${i18n.t('filter-settings.all-filters-hide')}
                        </dbp-button>
                        <dbp-button
                            title="${i18n.t('filter-settings.all-filters-show')}"
                            class="check-btn button is-secondary"
                            @click="${() => {
                                this.toggleAllColumns('show');
                            }}">
                            ${i18n.t('filter-settings.all-filters-show')}
                        </dbp-button>
                    </div>
                    <dbp-button
                        class="check-btn button is-primary"
                        id="check"
                        @click="${() => {
                            this.updateSubmissionTable();
                            this.closeColumnOptionsModal();
                            this.setSubmissionTableSettings();
                        }}">
                        ${i18n.t('filter-settings.save')}
                    </dbp-button>
                </div>
            </dbp-modal>
        `;
    }

    renderFacetListItem(item, key) {
        console.log('renderFacetListItem key', key);
        console.log('renderFacetListItem item', item);
        return html`
            <li class="header-fields ${item.schemaField}" data-index="${key}">
                <div class="header-field">
                    <span class="header-button header-order">${key + 1}</span>
                    <span class="header-title"><strong>${item.schemaField}</strong></span>
                    <dbp-icon-button
                        icon-name="source_icons_eye-empty"
                        class="header-visibility-icon"
                        @click="${() => {
                            // TODO: Set icon to source_icons_eye-off
                            this.changeVisibility(key);
                        }}"></dbp-icon-button>
                </div>
            </li>
        `;
    }

    renderFacetList() {
        if (!this.facetConfigs || this.facetConfigs.length === 0) {
            return html`
                <p>No facets configured.</p>
            `;
        }

        return html`
            <ul class="headers">
                ${this.facetConfigs.map(this.renderFacetListItem)}
            </ul>
        `;
    }

    onCloseModal() {
        // Send a close event to the parent component
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        // const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            ${this.getModalHtml()}
        `;
    }

    /**
     * @param ev
     */
    async onDocumentFileSelected(ev) {
        console.log('ev.detail.file', ev.detail.file);
        this.documentFile = ev.detail.file;

        // We need to wait until rendering is complete after this.documentFile has changed
        await this.updateComplete;

        const pdfViewer = this._('#document-add-pdf-viewer');

        // Load the PDF in the PDF viewer with the double reloading workaround,
        // because the page wasn't always shown
        await pdfViewer.showPDF(this.documentFile, {}, true);

        // Workaround to trigger a resize after the PDF was loaded, so the PDF is shown correctly
        pdfViewer._onWindowResize();

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        this.modalRef.value.open();
    }
}
