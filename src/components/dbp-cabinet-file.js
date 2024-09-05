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
        this.documentModalRef = createRef();
        this.documentFile = null;
        this.fileObjectTypeNames = {};
        this.objectType = '';
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.mode = 'view';
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

    async createBlobDownloadUrl( includeData = false) {
        if (this.entryPointUrl === '') {
            return '';
        }

        const baseUrl = combineURLs(this.entryPointUrl, `/cabinet/signature`);
        const apiUrl = new URL(baseUrl);
        const params = {
            'method': 'GET',
            'identifier': this.hitData.file.base.fileId,
            'prefix': this.blobDocumentPrefix,
            'fileName': this.documentFile.name,
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

    async openDialogWithHit(hit = null) {
        this.hitData = hit;
        console.log('openDialogWithHit hit', hit);
        this.objectType = hit.objectType;

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        const url = await this.createBlobDownloadUrl(true);
        let blobFile = await this.loadBlobItem(url);
        console.log('blobFile', blobFile);
        // TODO: Doesn't work yet, it needs to be converted to a File object!
        await this.showPdf(blobFile.contentUrl);

        /**
         * @type {Modal}
         */
        const modal = this.documentModalRef.value;
        console.log('modal', modal);
        modal.open();
    }

    async downloadFile() {
        // console.log('hitData', this.hitData);
        console.log('fileId', this.hitData.file.base.fileId);

        // TODO: We need to do this as soon the "view" dialog is opened to be able to show the preview
        let url = await this.createBlobDownloadUrl();
        console.log('url', url);

        // TODO: Implement PDF download
        await this.loadBlobItem(url);
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
        console.log('hit', hit);

        let file = this.documentFile;
        console.log('file', file);

        // if (hit.objectType !== 'person' || file === null) {
        //     return html`<dbp-modal ${ref(this.documentModalRef)} id="document-modal" modal-id="document-modal"></dbp-modal>`;
        // }
        if (file === null) {
            return html`<dbp-modal ${ref(this.documentModalRef)} id="document-modal" modal-id="document-modal"></dbp-modal>`;
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
                        <dbp-pdf-viewer id="document-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
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
            case 'view':
                return html`
                    ${this.getDocumentViewFormHtml()}
                `;
            case 'add':
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
            case 'view':
                // TODO: Load the PDF from blob
                this.documentFile = new File(["foo"], 'test.pdf', {type: 'application/pdf'});

                return this.getHtml();
            case 'add':
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

        // TODO: We can use a reference here instead of a querySelector
        const pdfViewer = this._('#document-pdf-viewer');

        // Load the PDF in the PDF viewer
        await pdfViewer.showPDF(this.documentFile);

        // Workaround to trigger a resize after the PDF was loaded, so the PDF is shown correctly
        pdfViewer._onWindowResize();
    }
}
