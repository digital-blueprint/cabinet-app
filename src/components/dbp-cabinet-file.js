import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, combineURLs, Icon, Modal} from '@dbp-toolkit/common';
import {FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {dataURLtoFile, pascalToKebab} from '../utils';

export class CabinetFile extends ScopedElementsMixin(DBPCabinetLitElement) {
    static Modes = {
        VIEW: 'view',
        EDIT: 'edit',
        ADD: 'add',
    };

    constructor() {
        super();
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.documentModalRef = createRef();
        this.documentPdfViewerRef = createRef();
        this.documentFile = null;
        this.fileObjectTypeNames = {};
        this.objectType = '';
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.mode = CabinetFile.Modes.VIEW;
        this.modalRef = createRef();
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
            objectType: { type: String, attribute: false },
            mode: { type: String },
        };
    }

    setFileObjectTypeNames(fileObjectTypeNames) {
        this.fileObjectTypeNames = fileObjectTypeNames;
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
        if (this.entryPointUrl === '') {
            return '';
        }

        const baseUrl = combineURLs(this.entryPointUrl, `/cabinet/signature`);
        const apiUrl = new URL(baseUrl);
        const params = {
            'method': 'POST',
            'prefix': this.blobDocumentPrefix,
            'fileName': this.documentFile.name,
            // TODO: Does this replacing always work?
            'type': this.objectType.replace('file-cabinet-', '')
        };

        apiUrl.search = new URLSearchParams(params).toString();

        let response = await fetch(apiUrl.toString(), {
            // TODO: Will be GET in the future
            method: 'GET',
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

    /**
     * @param identifier
     * @param includeData Whether to include file data in the response
     * @returns {Promise<string>}
     */
    async createBlobDownloadUrl(identifier, includeData = false) {
        if (this.entryPointUrl === '') {
            return '';
        }

        const baseUrl = combineURLs(this.entryPointUrl, `/cabinet/signature`);
        const apiUrl = new URL(baseUrl);
        const params = {
            'method': 'GET',
            'identifier': identifier,
            'prefix': this.blobDocumentPrefix,
            // TODO: Does this replacing always work?
            'type': this.objectType.replace('file-cabinet-', '')
        };

        if (includeData) {
            params['includeData'] = '1';
        }

        apiUrl.search = new URLSearchParams(params).toString();

        let response = await fetch(apiUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token
            }
        });
        if (!response.ok) {
            throw response;
        }
        const url = await response.text();
        console.log('Download url', url);

        return url;
    }

    async loadBlobItem(url) {
        let response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token
            }
        });
        if (!response.ok) {
            throw response;
        }
        const json = await response.json();
        console.log('json', json);

        return json;
    }

    async uploadDocumentToBlob(uploadUrl, metaData) {
        metaData['@type'] = 'DocumentFile';
        metaData['fileSource'] = 'blob-cabinetBucket';
        metaData['objectType'] = this.objectType;
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
        const objectType = this.objectType;

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html``;
        }

        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-edit-form-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log('this.objectTypeFormComponents[objectType]', this.objectTypeFormComponents[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeFormComponents[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <${unsafeStatic(tagName)} id="edit-form" subscribe="auth,lang,entry-point-url" .data=${this.hitData} object-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const objectType = this.objectType;
        console.log('objectType', objectType);

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html``;
        }


        const hit = this.hitData;
        const id = hit.id;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-view-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log('this.objectTypeViewComponents[objectType]', this.objectTypeViewComponents[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeViewComponents[objectType]);
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

    async downloadFileFromBlob(fileId, includeData = false) {
        const url = await this.createBlobDownloadUrl(fileId, includeData);
        console.log('downloadFileFromBlob url', url);
        let blobFile = await this.loadBlobItem(url);
        console.log('downloadFileFromBlob blobFile', blobFile);

        // TODO: Test if this really works
        return dataURLtoFile(blobFile.contentUrl, blobFile.fileName);
    }

    async openDialogWithHit(hit = null) {
        this.hitData = hit;
        console.log('openDialogWithHit hit', hit);
        this.objectType = hit.objectType;

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        if (this.hitData.file) {
            const file = await this.downloadFileFromBlob(this.hitData.file.base.fileId, true);
            console.log('openDialogWithHit file', file);
            await this.showPdf(file);

            this.documentFile = file;

            // We need to wait until rendering is complete after this.documentFile has changed
            await this.updateComplete;
        }

        /**
         * @type {Modal}
         */
        const modal = this.documentModalRef.value;
        console.log('openDialogWithHit modal', modal);
        modal.open();
    }

    async downloadFile() {
        console.log('downloadFile this.documentFile', this.documentFile);
        const fileUrl = URL.createObjectURL(this.documentFile);

        // Open a new tab/window with the file URL
        const newWindow = window.open(fileUrl, '_blank');

        // Check if the new window was successfully opened
        if (newWindow) {
            // If opened successfully, focus on the new window
            newWindow.focus();
        } else {
            // If the pop-up was blocked, inform the user
            alert('Please allow pop-ups to download the file.');
        }

        // Set up cleanup after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(fileUrl);
        }, 1000);
    }

    async openDocumentAddDialog() {
        this.objectType = '';

        /**
         * @type {Modal}
         */
        const documentAddModal = this.documentModalRef.value;
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

            #document-modal {
                --dbp-modal-min-width: 85vw;
                --dbp-modal-max-width: 85vw;
                --dbp-modal-min-height: 90vh;
                --dbp-modal-max-height: 90vh;
            }

            #document-modal .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px 10px;
                grid-auto-flow: row;
            }

            #document-modal .description { grid-area: 1 / 1 / 2 / 3; }

            #document-modal .pdf-preview { grid-area: 2 / 1 / 3 / 2; }

            #document-modal .form { grid-area: 2 / 2 / 3 / 3; }

            #document-modal .fileButtons {
                display: flex;
                justify-content: right;
                margin-bottom: 10px;
                gap: 5px;
            }
        `;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getDocumentModalHtml() {
        console.log('getDocumentAddModalHtml');
        const hit = this.hitData;
        console.log('getDocumentModalHtml hit', hit);

        let file = this.documentFile;
        console.log('getDocumentModalHtml file', file);

        // if (hit.objectType !== 'person' || file === null) {
        //     return html`<dbp-modal ${ref(this.documentModalRef)} id="document-modal" modal-id="document-modal"></dbp-modal>`;
        // }
        if (file === null) {
            return html`
                <dbp-modal ${ref(this.documentModalRef)} id="document-modal" modal-id="document-modal"></dbp-modal>
                <dbp-pdf-viewer ${ref(this.documentPdfViewerRef)} id="document-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
            `;
        }

        console.log('this.mode', this.mode);

        const id = hit.id;

        // TODO: Check if PDF was uploaded

        return html`
            <dbp-modal
                ${ref(this.documentModalRef)}
                id="document-modal"
                modal-id="document-modal"
                subscribe="lang">
                <div slot="content" class="content">
                    <div class="description">
                        ${this.getBackLink()}
                        <h1>Document Add/View/Edit</h1>
                        Document ID: ${id}<br />
                        File name: ${file.name}<br />
                        File size: ${file.size}<br />
                    </div>
                    <div class="pdf-preview">
                        <div class="fileButtons">
                            <button @click="${this.downloadFile}">Download</button>
                            <button @click="${this.openDocumentAddDialog}">Replace PDF</button>
                        </div>
                        <dbp-pdf-viewer ${ref(this.documentPdfViewerRef)} id="document-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
                    </div>
                    <div class="form">
                        ${this.getObjectTypeFormPartHtml()}
                    </div>
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
    }

    getBackLink() {
        if (this.objectType === '') {
            return html`<a href="#" @click=${this.openDocumentAddDialog}>&lt;&lt; Back to document upload</a>`;
        } else {
            return html`<a href="#" @click=${this.resetObjectType}>&lt;&lt; Back to document type selection</a>`;
        }
    }

    resetObjectType() {
        this.objectType = '';
    }

    getObjectTypeFormPartHtml() {
        switch (this.mode) {
            case CabinetFile.Modes.VIEW:
                return html`
                    ${this.getDocumentViewFormHtml()}
                `;
            case CabinetFile.Modes.ADD:
                if (this.objectType === '') {
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
                            ${this.getObjectTypeSelector()}
                            <dbp-button @click="${this.onObjectTypeSelected}">Select</dbp-button>
                        </p>
                    `;
                } else {
                    return html`
                        ${this.getDocumentEditFormHtml()}
                    `;
                }
        }
    }

    onObjectTypeSelected() {
        const objectType = this._('#object-type').value;
        console.log('objectType', objectType);
        this.objectType = objectType;
    }

    getObjectTypeSelector() {
        const fileObjectTypeNames = this.fileObjectTypeNames;
        const options = Object.keys(fileObjectTypeNames).map((key) => {
            return html`<option value="${key}">${fileObjectTypeNames[key]}</option>`;
        });

        return html`
            <select id="object-type" class="select" name="object-type" required>
                ${options}
            </select>
        `;
    }

    render() {
        console.log('-- Render --');

        switch (this.mode) {
            case CabinetFile.Modes.EDIT:
            case CabinetFile.Modes.VIEW:
            case CabinetFile.Modes.ADD:
                return this.getHtml();
            default:
                console.error('mode not found', this.mode);
                return html`<dbp-modal ${ref(this.modalRef)} modal-id="view-modal"></dbp-modal>`;
        }
    }

    getHtml() {
        const i18n = this._i18n;

        return html`
            ${this.getDocumentModalHtml()}
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
        await this.showPdf(ev.detail.file);

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        this.documentModalRef.value.open();
    }

    /**
     * @param documentFile
     */
    async showPdf(documentFile) {
        console.log('documentFile', documentFile);
        this.documentFile = documentFile;

        // We need to wait until rendering is complete after this.documentFile has changed
        await this.updateComplete;

        /**
         * @type {PdfViewer}
         */
        const pdfViewer = this.documentPdfViewerRef.value;
        // const pdfViewer = this._('#document-pdf-viewer');

        // Load the PDF in the PDF viewer
        await pdfViewer.showPDF(this.documentFile);
    }
}
