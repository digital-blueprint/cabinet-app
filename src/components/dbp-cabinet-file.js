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
import {classMap} from 'lit/directives/class-map.js';
import * as formElements from '../objectTypes/formElements.js';

export class CabinetFile extends ScopedElementsMixin(DBPCabinetLitElement) {
    static Modes = {
        VIEW: 'view',
        EDIT: 'edit',
        ADD: 'add',
    };

    static BlobUrlTypes = {
        UPLOAD: 'upload',
        DOWNLOAD: 'download',
        DELETE: 'delete',
    };

    constructor() {
        super();
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.personId = '';
        this.documentModalRef = createRef();
        this.documentPdfViewerRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        this.objectType = '';
        this.additionalType = '';
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.mode = CabinetFile.Modes.VIEW;
        this.modalRef = createRef();
        this.fileSourceRef = createRef();
        this.formRef = createRef();
        this.typesenseService = null;
        this.fileHitData = {};
        this.fileHitDataCache = {};
        this.isFileDirty = false;
        this.dataWasChanged = false;
    }

    connectedCallback() {
        super.connectedCallback();

        this.updateComplete.then(() => {
            this.addEventListener('DbpCabinetDocumentAddSave', async (event) => {
                console.log('JSON.stringify(event.detail)', JSON.stringify(event.detail));
                const data = event.detail;
                await this.storeDocumentToBlob(data.formData);
            });

            this.addEventListener('DbpCabinetDocumentFormCancel', async (event) => {
                if (this.mode === CabinetFile.Modes.ADD) {
                    this.objectType = '';
                } else {
                    // Reset this.objectType if it was changed by the objectType selector
                    this.objectType = this.fileHitData.objectType;

                    // Switch back to view mode
                    this.mode = CabinetFile.Modes.VIEW;
                }
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
            personId: { type: String, attribute: false },
            fileHitData: { type: Object, attribute: false },
            documentFile: { type: File, attribute: false },
            objectType: { type: String, attribute: false },
            additionalType: { type: String, attribute: false },
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

    setTypesenseService(typesenseService) {
        this.typesenseService = typesenseService;
    }

    async storeDocumentToBlob(formData) {
        const fileData = await this.storeDocumentInBlob(formData);
        console.log('storeDocumentToBlob fileData', fileData);

        if (fileData.identifier) {
            alert('Document stored successfully with id ' + fileData.identifier + '! ' +
                'Document will now be fetched from Typesense.');

            console.log('storeDocumentToBlob this.typesenseService', this.typesenseService);

            // Try to fetch the document from Typesense again and again until it is found
            // TODO: Setup some kind of spinner or loading indicator
            await this.fetchFileDocumentFromTypesense(fileData.identifier);
        }
    }

    async fetchFileDocumentFromTypesense(fileId, increment = 0) {
        // Stop after 10 attempts
        if (increment >= 10) {
            // TODO: Setup some kind of error message and decide what to do
            alert('Could not fetch file document from Typesense after 10 attempts!');

            /**
             * @type {CabinetFormElement}
             */
            const form = this.formRef.value;
            // Enable the save button again in the form
            form.enableSaveButton();

            return;
        }

        // We had a case that the service was not there, even if it should, we will just try again in 1 second
        if (this.typesenseService) {
            const item = await this.typesenseService.fetchFileDocumentByBlobId(fileId);

            // If the document was found, and we were in ADD mode or the item was already updated in Typesense
            // set the hit data and switch to view mode
            if (item !== null &&
                (this.mode === CabinetFile.Modes.ADD ||
                    this.fileHitData.file.base.modifiedTimestamp < item.file.base.modifiedTimestamp)) {
                console.log('fetchFileDocumentFromTypesense this.fileHitData', this.fileHitData);
                console.log('fetchFileDocumentFromTypesense item', item);

                this.fileHitData = item;
                this.mode = CabinetFile.Modes.VIEW;
                return;
            }
        }

        // Try again in 1 second
        setTimeout(() => { this.fetchFileDocumentFromTypesense(fileId, ++increment); }, 1000);
    }

    /**
     * Creates a Blob POST or PATCH URL for uploading a document
     * @returns {Promise<string>}
     */
    async createBlobUploadUrl() {
        return this.createBlobUrl(CabinetFile.BlobUrlTypes.UPLOAD);
    }

    /**
     * @param blobUrlType
     * @param identifier
     * @param includeData Whether to include file data in the response
     * @returns {Promise<string>}
     */
    async createBlobUrl(blobUrlType, identifier = '', includeData = false) {
        if (this.entryPointUrl === '') {
            return '';
        }

        let method;
        let fileName = '';
        switch (blobUrlType) {
            case CabinetFile.BlobUrlTypes.UPLOAD:
                identifier = this.getFileHitDataBlobId();
                method = identifier === '' ? 'POST' : 'PATCH';
                fileName = this.documentFile.name;
                break;
            case CabinetFile.BlobUrlTypes.DOWNLOAD:
                method = 'GET';
                break;
            case CabinetFile.BlobUrlTypes.DELETE:
                method = 'DELETE';
                break;
        }

        const baseUrl = combineURLs(this.entryPointUrl, `/cabinet/blob-urls`);
        const apiUrl = new URL(baseUrl);
        const params = {
            'method': method,
            'prefix': this.blobDocumentPrefix,
            // TODO: Does this replacing always work?
            'type': this.objectType.replace('file-cabinet-', '')
        };

        if (identifier !== '') {
            params['identifier'] = identifier;
        }

        if (fileName !== '') {
            params['fileName'] = fileName;
        }

        if (includeData) {
            params['includeData'] = '1';
        }

        apiUrl.search = new URLSearchParams(params).toString();

        let response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token
            },
            body: '{}',
        });
        if (!response.ok) {
            throw response;
        }
        const url = await response.json();
        console.log(blobUrlType, 'url', url['blobUrl']);

        return url['blobUrl'];
    }

    getFileHitDataBlobId() {
        return this.fileHitData?.file?.base?.fileId || '';
    }

    /**
     * @param identifier
     * @param includeData Whether to include file data in the response
     * @returns {Promise<string>}
     */
    async createBlobDownloadUrl(identifier, includeData = false) {
        return this.createBlobUrl(CabinetFile.BlobUrlTypes.DOWNLOAD, identifier, includeData);
    }

    /**
     * @param identifier
     * @returns {Promise<string>}
     */
    async createBlobDeleteUrl(identifier) {
        return this.createBlobUrl(CabinetFile.BlobUrlTypes.DELETE, identifier);
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

    /**
     * Creates or updates a document in the blob storage
     * @param metaData
     * @returns {Promise<any>}
     */
    async storeDocumentInBlob(metaData) {
        const blobId = this.getFileHitDataBlobId();
        console.log('storeDocumentInBlob', 'blobId', blobId);
        const uploadUrl = await this.createBlobUploadUrl();

        metaData['@type'] = 'DocumentFile';
        metaData['fileSource'] = 'blob-cabinetBucket';
        metaData['objectType'] = this.objectType;
        // metaData['dateCreated'] = new Date().toISOString().split('T')[0];
        console.log('metaData to upload', metaData);

        let formData = new FormData();
        formData.append('metadata', JSON.stringify(metaData));
        // Check if we really need to upload the file again
        if (this.isFileDirty) {
            formData.append('file', this.documentFile);
            formData.append('fileName', this.documentFile.name);
        }
        formData.append('prefix', this.blobDocumentPrefix);

        const options = {
            method: blobId === '' ? 'POST' : 'PATCH',
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
        this.isFileDirty = false;
        this.dataWasChanged = true;

        return data;
    }

    getDocumentEditFormHtml(useFileHitDataCache = false) {
        const objectType = this.objectType;

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html``;
        }

        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-edit-form-' + tagPart;

        console.log('getDocumentEditFormHtml objectType', objectType);
        console.log('getDocumentEditFormHtml tagName', tagName);
        console.log('getDocumentEditFormHtml this.objectTypeFormComponents[objectType]', this.objectTypeFormComponents[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeFormComponents[objectType]);
        }

        let fileHitData = this.fileHitData;

        // In edit mode we want to use the fileHitDataCache to keep the data when switching between object types
        if (useFileHitDataCache && this.fileHitDataCache[objectType]) {
            fileHitData = this.fileHitDataCache[objectType];
        }

        console.log('getDocumentEditFormHtml fileHitData', fileHitData);
        console.log('getDocumentEditFormHtml this.additionalType', this.additionalType);

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "fileHitData" property from a variable too!
        return staticHtml`
            <${unsafeStatic(tagName)}
             ${ref(this.formRef)}
             id="edit-form"
             subscribe="auth,lang,entry-point-url"
             .data=${fileHitData}
             person-id="${this.personId}"
             additional-type="${this.additionalType}"
             object-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const objectType = this.objectType;
        console.log('objectType', objectType);

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html``;
        }

        const hit = this.fileHitData;
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
            <h2>Document details</h2>
            <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-view-${id}" subscribe="lang" .data=${hit}></${unsafeStatic(tagName)}>
        `;
    }

    async openDocumentAddDialogWithPersonHit(hit = null) {
        this.mode = CabinetFile.Modes.ADD;
        // We don't need to fetch the hit data from Typesense again, because the identNrObfuscated wouldn't change
        this.personId = hit.person.identNrObfuscated;
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

    async openViewDialogWithFileHit(hit) {
        this.isFileDirty = false;
        this.dataWasChanged = false;
        this.mode = CabinetFile.Modes.VIEW;

        /**
         * @type {FileSource}
         */
        const fileSource = this.fileSourceRef.value;
        // Make sure the file source dialog is closed
        if (fileSource) {
            fileSource.removeAttribute('dialog-open');
        }

        // Fetch the hit data from Typesense again in case it changed
        hit = await this.typesenseService.fetchItem(hit.id);

        this.fileHitDataCache = {};
        this.fileHitData = hit;
        console.log('openDialogWithHit hit', hit);
        // Set personId from hit
        this.personId = hit.person.identNrObfuscated;
        this.objectType = hit.objectType;

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        if (this.fileHitData.file) {
            const file = await this.downloadFileFromBlob(this.fileHitData.file.base.fileId, true);
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

    async editFile() {
        this.mode = CabinetFile.Modes.EDIT;
    }

    async deleteFile() {
        // Ask for confirmation
        if (!confirm('Delete document?')) {
            return;
        }

        const fileId = this.fileHitData.file.base.fileId;
        console.log('deleteFile fileId', fileId);

        const deleteUrl = await this.createBlobDeleteUrl(fileId);
        console.log('downloadFileFromBlob deleteUrl', deleteUrl);

        const options = {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + this.auth.token,
            },
        };

        let response = await fetch(deleteUrl, options);
        if (!response.ok) {
            // TODO: Error handling
            alert('Document deleting failed!');

            throw response;
        }

        this.dataWasChanged = true;
        alert('Document was successfully deleted!');

        /**
         * @type {Modal}
         */
        const documentModal = this.documentModalRef.value;
        // Close the dialog, because the document was deleted
        documentModal.close();
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

    async openReplacePdfDialog() {
        this.mode = CabinetFile.Modes.EDIT;
        await this.updateComplete;

        await this.openDocumentAddDialog(false);
    }

    async openDocumentAddDialog(resetObjectType = true) {
        if (resetObjectType) {
            this.objectType = '';
            this.fileHitData = {};
        }

        this.isFileDirty = false;
        this.dataWasChanged = false;

        /**
         * @type {Modal}
         */
        const documentModal = this.documentModalRef.value;
        // Make sure the document dialog is closed
        documentModal.close();

        /**
         * @type {FileSource}
         */
        const fileSource = this.fileSourceRef.value;

        // Wait until the file source dialog is ready
        if (!fileSource) {
            await this.updateComplete;
        }

        // Open the file source dialog to select a file
        fileSource.setAttribute('dialog-open', '');
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}
            ${formElements.getFieldsetCSS()}

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
        const hit = this.fileHitData;
        console.log('getDocumentModalHtml this.fileHitData', this.fileHitData);

        let file = this.documentFile;
        console.log('getDocumentModalHtml this.documentFile', this.documentFile);

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
                @dbp-modal-closed="${this.onCloseDocumentModal}"
                id="document-modal"
                modal-id="document-modal"
                subscribe="lang">
                <div slot="content" class="content">
                    <div class="description">
                        <h1>Document ${this.mode}</h1>
                        Document ID: ${id}<br />
                        File name: ${file.name}<br />
                        File size: ${file.size}<br />
                    </div>
                    <div class="pdf-preview">
                        <div class="fileButtons">
                            <button class="button" @click="${this.downloadFile}">Download</button>
                            <button class="button" @click="${this.openReplacePdfDialog}">Replace PDF</button>
                        </div>
                        <dbp-pdf-viewer ${ref(this.documentPdfViewerRef)} id="document-pdf-viewer" lang="${this.lang}" style="width: 100%" auto-resize="cover"></dbp-pdf-viewer>
                    </div>
                    <div class="form">
                        <div class="fileButtons">
                            <button @click="${this.editFile}" class="${classMap({
                                hidden: this.mode !== CabinetFile.Modes.VIEW,
                            })} button is-primary">Edit</button>
                            <button @click="${this.deleteFile}" class="${classMap({
                                hidden: this.mode === CabinetFile.Modes.ADD,
                            })} button is-primary">Delete</button>
                        </div>
                        ${this.getObjectTypeFormPartHtml()}
                    </div>
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
    }

    onCloseDocumentModal() {
        // If the file was created, updated or deleted, we need to inform the parent component to refresh the search results
        if (this.dataWasChanged) {
            this.dispatchEvent(new CustomEvent('DbpCabinetDocumentChanged', {
                detail: {hit: this.fileHitData},
                bubbles: true,
                composed: true
            }));
        }
    }

    getObjectTypeFormPartHtml() {
        console.log('getObjectTypeFormPartHtml this.mode', this.mode);
        switch (this.mode) {
            case CabinetFile.Modes.VIEW:
                return html`
                    ${this.getDocumentViewFormHtml()}
                `;
            case CabinetFile.Modes.ADD:
                if (this.objectType === '') {
                    return html`
                        <h2>Document details</h2>
                        ${this.getDocumentTypeSelector()}
                    `;
                } else {
                    return html`
                        <h2>Document details</h2>
                        ${this.getDocumentTypeSelector()}
                        ${this.getDocumentEditFormHtml()}
                    `;
                }
            case CabinetFile.Modes.EDIT:
                return html`
                    <h2>Document details</h2>
                    ${this.getDocumentTypeSelector()}
                    ${this.getDocumentEditFormHtml(true)}
                `;
        }
    }

    onDocumentTypeSelected(event) {
        // Save the current fileHitData to the cache to keep the data when switching between object types in edit mode
        // In the future there could also be an event on every form element change to save the data to the cache when it changes
        this.fileHitDataCache[this.objectType] = this.fileHitData;

        // Split document type into object type and additional type
        const documentType = this._('#document-type').value;
        console.log('onDocumentTypeSelected documentType', documentType);
        const [objectType, additionalType] = documentType.split("---");
        console.log('onDocumentTypeSelected objectType', objectType);
        console.log('onDocumentTypeSelected additionalType', additionalType);
        this.objectType = objectType;
        this.additionalType = additionalType;
    }

    getDocumentTypeSelector() {
        const fileDocumentTypeNames = this.fileDocumentTypeNames;
        const additionalType = this.fileHitData?.file?.base?.additionalType?.key || this.additionalType || '';
        const objectType = this.fileHitData.objectType || this.objectType || '';
        const fileDocumentType = additionalType !== '' && objectType !== '' ? objectType + '---' + additionalType : '';
        const options = Object.keys(fileDocumentTypeNames).map((key) => {
            return html`<option value="${key}" ?selected=${key === fileDocumentType}>${fileDocumentTypeNames[key]}</option>`;
        });

        if (fileDocumentType === '') {
            options.unshift(html`<option value="" selected> -Select document type- </option>`);
        }

        return html`
            <fieldset>
                <label>Document type</label>
                <select id="document-type" class="select" name="object-type" required @change="${this.onDocumentTypeSelected}">
                    ${options}
                </select>
            </fieldset>
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

    getFileSourceHtml() {
        if (this.mode === CabinetFile.Modes.VIEW) {
            return html``;
        }

        const i18n = this._i18n;

        return html`
            <dbp-file-source
                ${ref(this.fileSourceRef)}
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
                @dbp-file-source-dialog-closed="${this.onFileSelectDialogClosed}"
                @dbp-file-source-file-selected="${this.onDocumentFileSelected}"></dbp-file-source>
        `;
    }

    getHtml() {
        return html`
            ${this.getDocumentModalHtml()}
            ${this.getFileSourceHtml()}
        `;
    }

    /**
     * Note: It seems like that the dbp-file-source-dialog-closed event is fired multiple times
     *       when the file-source dialog is closed!
     * @returns {Promise<void>}
     */
    async onFileSelectDialogClosed() {
        console.log('file-source onFileSelectDialogClosed');

        // Open the document modal dialog after the file source dialog was closed if we were in edit mode
        // Unfortunately, if Escape was pressed, all dialogs will be closed, so this only works with the "X" button
        if (this.mode === CabinetFile.Modes.EDIT) {
            /**
             * @type {Modal}
             */
            const modal = this.documentModalRef.value;

            // Note: Modal is checking if the dialog is already open
            modal.open();
        }
    }

    /**
     * @param ev
     */
    async onDocumentFileSelected(ev) {
        console.log('file-source onDocumentFileSelected ev.detail.file', ev.detail.file);
        this.isFileDirty = true;
        await this.showPdf(ev.detail.file);

        if (this.mode === CabinetFile.Modes.VIEW) {
            this.mode = CabinetFile.Modes.EDIT;
        }

        /**
         * @type {Modal}
         */
        const modal = this.documentModalRef.value;

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        // Note: Modal is checking if the dialog is already open, if it was opened by onFileSelectDialogClosed()
        modal.open();
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

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "mode":
                    console.log('this.mode changed from', oldValue, 'to', this.mode);
                    break;
                case "fileHitData":
                    console.log('this.fileHitData changed from', oldValue, 'to', this.fileHitData);
                    break;
            }
        });

        super.update(changedProperties);
    }
}
