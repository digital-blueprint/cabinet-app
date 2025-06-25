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
        };
    }

    async open() {
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

            #filter-modal .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 10px;
                grid-auto-flow: row;
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
                ${ref(this.modalRef)}
                id="filter-modal"
                modal-id="filter-modal"
                width="80%"
                height="80%"
                min-width="80%"
                min-height="80%"
                subscribe="lang"
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="header" class="modal-header">
                    pre-header-text
                    <dbp-icon-button
                        title="${i18n.t('filter-settings.modal-close')}"
                        aria-label="${i18n.t('filter-settings.modal-close')}"
                        class="modal-close"
                        icon-name="close"
                        @click="${() => {
                            this.close();
                        }}"></dbp-icon-button>
                    <p id="submission-modal-title">
                        ${i18n.t('filter-settings.header-settings')} text
                    </p>
                    <dbp-icon name="user" class="person-modal-icon"></dbp-icon>
                    <h3 class="person-modal-title">Filter Settings</h3>
                    post-header-text
                </div>
                <div slot="content">Content for filter settings goes here.</div>
                <div slot="footer" class="modal-footer">
                    footer-text
                    <div class="modal-footer-btn">
                        <div>
                            <button
                                title="${i18n.t('filter-settings.abort')}"
                                class="check-btn button is-secondary"
                                @click="${() => {
                                    this.closeColumnOptionsModal();
                                }}">
                                ${i18n.t('filter-settings.abort')}
                            </button>
                        </div>
                        <div>
                            <button
                                title="${i18n.t('filter-settings.reset-filter')}"
                                class="check-btn button is-secondary"
                                @click="${() => {
                                    this.resetSettings();
                                }}">
                                ${i18n.t('filter-settings.reset-filter')}
                            </button>
                            <button
                                title="${i18n.t('filter-settings.all-filters-hide')}"
                                class="check-btn button is-secondary"
                                @click="${() => {
                                    this.toggleAllColumns('hide');
                                }}">
                                ${i18n.t('filter-settings.all-filters-hide')}
                            </button>
                            <button
                                title="${i18n.t('filter-settings.all-filters-show')}"
                                class="check-btn button is-secondary"
                                @click="${() => {
                                    this.toggleAllColumns('show');
                                }}">
                                ${i18n.t('filter-settings.all-filters-show')}
                            </button>
                        </div>
                        <button
                            class="check-btn button is-primary"
                            id="check"
                            @click="${() => {
                                this.updateSubmissionTable();
                                this.closeColumnOptionsModal();
                                this.setSubmissionTableSettings();
                            }}">
                            ${i18n.t('filter-settings.save-columns')}
                        </button>
                    </div>
                </div>
            </dbp-modal>
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
