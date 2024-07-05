import {css, html} from 'lit';
import {html as staticHtml} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from "../dbp-cabinet-lit-element";
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';

export class CabinetAddDocument extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.objectTypeForms = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.documentAddModalRef = createRef();
        this.documentEditModalRef = createRef();
        this.documentViewModalRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-file-source': FileSource,
            'dbp-pdf-viewer': PdfViewer,
            'dbp-modal': Modal,
            'dbp-button': Button,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitData: { type: Object, attribute: 'hit-data' },
            documentFile: { type: File, attribute: false },
        };
    }

    setHitData(hitData) {
        this.hitData = hitData;
    }

    setFileDocumentTypeNames(fileDocumentTypeNames) {
        this.fileDocumentTypeNames = fileDocumentTypeNames;
    }

    async openDocumentAddDialog(hit) {
        this.hitData = hit;
        // Open the file source dialog to select a file
        this._('#file-source').setAttribute('dialog-open', '');
    }

    connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        // Listen to DbpCabinetDocumentEdit events, to open the file edit dialog
        document.addEventListener('DbpCabinetDocumentAdd', function(event) {
            that.openDocumentAddDialog(event.detail.hit);
        });
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}

            #document-add-modal .content {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 10px 10px;
                grid-auto-flow: row;
            }

            #document-add-modal .description { grid-area: 1 / 1 / 2 / 3; }

            #document-add-modal .pdf-preview { grid-area: 2 / 1 / 3 / 2; }

            #document-add-modal .form { grid-area: 2 / 2 / 3 / 3; }
        `;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getDocumentAddModalHtml() {
        const hit = this.hitData;
        console.log('hit', hit);

        const file = this.documentFile;
        console.log('file', file);

        if (hit.objectType !== 'person' || file === null) {
            return html`<dbp-modal ${ref(this.documentAddModalRef)} id="document-add-modal" modal-id="document-add-modal"></dbp-modal>`;
        }

        const id = hit.id;
        const i18n = this._i18n;

        // TODO: Check if PDF was uploaded

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        // TODO: The modal is far to small and doesn't resize when the window is resized
        return staticHtml`
            <dbp-modal
                ${ref(this.documentAddModalRef)}
                id="document-add-modal"
                modal-id="document-add-modal"
                width="80%"
                height="80%"
                min-width="80%"
                min-height="80%"
                title="${i18n.t('document-add-modal-title')}"
                subscribe="lang">
                <div slot="content" class="content">
                    <div class="description">
                        <h1>Document Add</h1>
                        Document ID: ${id}<br />
                        File name: ${file.name}<br />
                        File size: ${file.size}<br />
                    </div>
                    <div class="pdf-preview">
                        <dbp-pdf-viewer id="document-add-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
                    </div>
                    <div class="form">
                        <p>
                            You are about to upload the following document:<br /> 
                            ${file.name}
                        </p>
                        <p>
                            Please select a document type to continue.
                        </p>
                        <p>
                            ${this.getDocumentTypeSelector()}
                            <dbp-button @click="${this.onDocumentAddSubmit}">Select</dbp-button>
                        </p>
                    </div>
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
    }

    getDocumentTypeSelector() {
        const fileDocumentTypeNames = this.fileDocumentTypeNames;
        const options = Object.keys(fileDocumentTypeNames).map((key) => {
            return html`<option value="${key}">${fileDocumentTypeNames[key]}</option>`;
        });

        return html`
            <select id="document-type" class="select" name="document-type" required>
                ${options}
            </select>
        `;
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            ${this.getDocumentAddModalHtml()}
            <dbp-file-source
                id="file-source"
                context="${i18n.t('cabinet-search.file-picker-context')}"
                subscribe="nextcloud-store-session:nextcloud-store-session"
                allowed-mime-types="application/pdf"
                enabled-targets="${this.fileHandlingEnabledTargets}"
                nextcloud-auth-url="${this.nextcloudWebAppPasswordURL}"
                nextcloud-web-dav-url="${this.nextcloudWebDavURL}"
                nextcloud-name="${this.nextcloudName}"
                nextcloud-auth-info="${this.nextcloudAuthInfo}"
                nextcloud-file-url="${this.nextcloudFileURL}"
                decompress-zip
                max-file-size="32000"
                lang="${this.lang}"
                text="${i18n.t('cabinet-search.upload-area-text')}"
                button-label="${i18n.t('cabinet-search.upload-button-label')}"
                @dbp-file-source-file-selected="${this.onDocumentFileSelected}"></dbp-file-source>
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

        // Load the PDF in the PDF viewer
        await pdfViewer.showPDF(this.documentFile);

        // Workaround to trigger a resize after the PDF was loaded, so the PDF is shown correctly
        pdfViewer._onWindowResize();

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        this.documentAddModalRef.value.open();
    }
}
