import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from "../dbp-cabinet-lit-element";
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal, combineURLs} from '@dbp-toolkit/common';
import {FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {pascalToKebab} from '../utils';

export class CabinetFile extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.documentAddModalRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        this.documentType = '';
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.mode = 'view';
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateComplete.then(() => {
            this.addEventListener('DbpCabinetDocumentAddSave', async (event) => {
                alert('DbpCabinetDocumentAddSave result:\n' + JSON.stringify(event.detail));
                const data = event.detail;
                await this.storeDocumentToBlob(data.formData);
            });
        } );
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
            hitData: { type: Object, attribute: false },
            documentFile: { type: File, attribute: false },
            documentType: { type: String, attribute: false },
            mode: { type: String },
        };
    }

    setFileDocumentTypeNames(fileDocumentTypeNames) {
        this.fileDocumentTypeNames = fileDocumentTypeNames;
    }

    setFileDocumentFormComponents(fileDocumentFormComponents) {
        this.objectTypeFormComponents = fileDocumentFormComponents;
    }

    setObjectTypeViewComponents(objectTypeViewComponents) {
        this.objectTypeViewComponents = objectTypeViewComponents;
    }

    async storeDocumentToBlob(formData) {
        const uploadUrl = await this.createBlobUploadUrl();
        alert('uploadUrl:\n' + uploadUrl);

        const fileData = await this.uploadDocumentToBlob(uploadUrl, formData);
        alert('fileData:\n' + JSON.stringify(fileData));
    }

    async createBlobUploadUrl() {
        const baseUrl = combineURLs(this.entryPointUrl, `/cabinet/signature`);
        const apiUrl = new URL(baseUrl);
        const params = {
            'prefix': this.blobDocumentPrefix,
            'fileName': this.documentFile.name,
            // TODO: Does this replacing always work?
            'type': this.documentType.replace('file-cabinet-', '')
        };
        apiUrl.search = new URLSearchParams(params).toString();

        let response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token
            }
        });
        if (!response.ok) {
            throw response;
        }
        const url = await response.text();
        console.log('Upload url', url);

        return url;
    }

    async uploadDocumentToBlob(uploadUrl, metaData) {
        metaData['@type'] = 'DocumentFile';
        metaData['fileSource'] = 'blob-cabinetBucket';
        metaData['objectType'] = this.documentType;
        // metaData['dateCreated'] = new Date().toISOString().split('T')[0];
        console.log('metaData to upload', metaData);

        let formData = new FormData();
        formData.append('metadata', JSON.stringify(metaData));
        formData.append('file', this.documentFile);
        formData.append('fileName', this.documentFile.name);
        formData.append('prefix', this.blobDocumentPrefix);

        const options = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + this.auth.token,
            },
            body: formData,
        };

        let response = await fetch(uploadUrl, options);
        if (!response.ok) {
            throw response;
        }
        const data = await response.json();
        console.log('File data', JSON.stringify(data));

        return data;
    }

    getDocumentEditFormHtml() {
        const documentType = this.documentType;

        if (documentType === '') {
            console.log('documentType empty', documentType);
            return html``;
        }

        const tagPart = pascalToKebab(documentType);
        const tagName = 'dbp-cabinet-object-type-edit-form-' + tagPart;

        console.log('objectType', documentType);
        console.log('tagName', tagName);
        console.log('this.objectTypeFormComponents[documentType]', this.objectTypeFormComponents[documentType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeFormComponents[documentType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <${unsafeStatic(tagName)} id="edit-form" subscribe="auth,lang,entry-point-url" .data=${this.hitData} document-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const documentType = this.documentType;

        if (documentType === '') {
            console.log('documentType empty', documentType);
            return html``;
        }


        const hit = this.hitData;
        const id = hit.id;
        const tagPart = pascalToKebab(documentType);
        const tagName = 'dbp-cabinet-object-type-view-' + tagPart;

        console.log('documentType', documentType);
        console.log('tagName', tagName);
        console.log('this.objectTypeViewComponents[objectType]', this.objectTypeViewComponents[documentType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeViewComponents[documentType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-view-${id}" subscribe="lang" user-id="123" .data=${hit}></${unsafeStatic(tagName)}>
        `;
    }

    async openDocumentAddDialogWithHit(hit = null) {
        this.hitData = hit;
        await this.openDocumentAddDialog();
    }

    async openDocumentAddDialog() {
        this.documentType = '';

        /**
         * @type {Modal}
         */
        const documentAddModal = this.documentAddModalRef.value;
        // Make sure the document-add dialog is closed
        documentAddModal.close();

        // Open the file source dialog to select a file
        this._('#file-source').setAttribute('dialog-open', '');
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}

            #document-add-modal {
                --dbp-modal-min-width: 85vw;
                --dbp-modal-max-width: 85vw;
                --dbp-modal-min-height: 90vh;
                --dbp-modal-max-height: 90vh;
            }

            #document-add-modal .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
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

        // TODO: Check if PDF was uploaded

        return html`
            <dbp-modal
                ${ref(this.documentAddModalRef)}
                id="document-add-modal"
                modal-id="document-add-modal"
                subscribe="lang">
                <div slot="content" class="content">
                    <div class="description">
                        ${this.getBackLink()}
                        <h1>Document Add</h1>
                        Document ID: ${id}<br />
                        File name: ${file.name}<br />
                        File size: ${file.size}<br />
                    </div>
                    <div class="pdf-preview">
                        <dbp-pdf-viewer id="document-add-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
                    </div>
                    <div class="form">
                        ${this.getDocumentTypeFormPartHtml()}
                    </div>
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
    }

    getBackLink() {
        if (this.documentType === '') {
            return html`<a href="#" @click=${this.openDocumentAddDialog}>&lt;&lt; Back to document upload</a>`;
        } else {
            return html`<a href="#" @click=${this.resetDocumentType}>&lt;&lt; Back to document type selection</a>`;
        }
    }

    resetDocumentType() {
        this.documentType = '';
    }

    getDocumentTypeFormPartHtml() {
        switch (this.mode) {
            case 'view':
                return html`
                        ${this.getDocumentViewFormHtml()}
                    `;
            case 'add':
                if (this.documentType === '') {
                    const file = this.documentFile;

                    return html`
                        <p>
                            You are about to upload the following document:<br />
                            ${file.name}
                        </p>
                        <p>
                            Please select a document type to continue.
                        </p>
                        <p>
                            ${this.getDocumentTypeSelector()}
                            <dbp-button @click="${this.onDocumentTypeSelected}">Select</dbp-button>
                        </p>
                    `;
                } else {
                    return html`
                        ${this.getDocumentEditFormHtml()}
                    `;
                }
        }
    }

    onDocumentTypeSelected() {
        const documentType = this._('#document-type').value;
        console.log('documentType', documentType);
        this.documentType = documentType;
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
        console.log('-- Render --');

        switch (this.mode) {
            case 'view':
                return this.getViewHtml();
            case 'add':
                return this.getAddHtml();
        }
    }

    getAddHtml() {
        const i18n = this._i18n;

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
