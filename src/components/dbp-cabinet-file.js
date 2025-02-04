import {css, html, unsafeCSS} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, combineURLs, Icon, Modal} from '@dbp-toolkit/common';
import {FileSource, FileSink} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {dataURLtoFile, pascalToKebab} from '../utils';
import {classMap} from 'lit/directives/class-map.js';
import * as formElements from '../objectTypes/formElements.js';
import {BaseFormElement} from '../baseObject.js';
import {send} from '@dbp-toolkit/common/notification';
import {getSelectorFixCSS} from '../styles.js';
import {getIconSVGURL} from '../utils.js';
export class CabinetFile extends ScopedElementsMixin(DBPCabinetLitElement) {
    static Modes = {
        VIEW: 'view',
        EDIT: 'edit',
        ADD: 'add',
    };

    static States = {
        NONE: 'none',
        LOADING_FILE: 'loading-file',
        LOADING_FILE_FAILED: 'loading-file-failed',
        FILE_LOADED: 'file-loaded',
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
        this.documentModalRef = createRef();
        this.documentPdfViewerRef = createRef();
        this.fileDocumentTypeNames = {};
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.modalRef = createRef();
        this.fileSourceRef = createRef();
        this.fileSinkRef = createRef();
        this.formRef = createRef();
        this.typesenseService = null;

        // Initialize the state in the beginning
        this.initializeState();
    }

    /**
     * Initializes the state of the component, so less stuff can go on in the background
     * when the modal is closed
     * This is important so when the dialog is opened again, the state is clean and not
     * old data is shown by accident
     */
    initializeState() {
        console.log('initializeState');

        this.person = {};
        this.documentFile = null;
        this.objectType = '';
        this.additionalType = '';
        this.mode = CabinetFile.Modes.VIEW;
        this.fileHitData = {};
        this.fileHitDataCache = {};
        this.isFileDirty = false;
        this.dataWasChanged = false;
        this.documentStatus = 'success';
        this.documentStatusDescription = '';
        this.deleteAtDateTime = '';
        this.allowStateReset = true;
        this.state = CabinetFile.States.NONE;
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
            'dbp-file-sink': FileSink,
            'dbp-pdf-viewer': PdfViewer,
            'dbp-modal': Modal,
            'dbp-button': Button,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            person: { type: Object, attribute: false },
            fileHitData: { type: Object, attribute: false },
            documentFile: { type: File, attribute: false },
            objectType: { type: String, attribute: false },
            additionalType: { type: String, attribute: false },
            documentStatus: { type: String, attribute: false },
            deleteAtDateTime: { type: String, attribute: false },
            state: { type: String, attribute: false },
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
            this.documentModalNotification('Document stored successfully',
                'Document stored successfully with id ' + fileData.identifier + '! ' +
                'Document will now be fetched from Typesense.', 'success');

            console.log('storeDocumentToBlob this.typesenseService', this.typesenseService);

            // Try to fetch the document from Typesense again and again until it is found
            await this.fetchFileDocumentFromTypesense(fileData.identifier);
        }
    }

    async fetchFileDocumentFromTypesense(fileId, increment = 0) {
        // Stop after 10 attempts
        if (increment >= 10) {
            // TODO: Setup some kind of error message and decide what to do
            this.documentModalNotification('Error', 'Could not fetch file document from Typesense after 10 attempts!', 'danger');

            /** @type {BaseFormElement} */
            const form = this.formRef.value;
            // Enable the save button again in the form
            form.enableSaveButton();

            return;
        }

        // We had a case that the service was not there, even if it should, we will just try again in 1 second
        if (this.typesenseService) {
            try {
                // Could throw an exception if there was another error than 404
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
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                this.documentModalNotification('Error', 'Could not load file from Blob!', 'danger');
                this.state = CabinetFile.States.LOADING_FILE_FAILED;

                // The save button will still be disabled and has a spinner, enabling it again doesn't
                // make a lot of sense, because because the document was already stored to Blob and
                // we are in a failed state
                // TODO: Is there something else we should do here?
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
     * @param extraParams
     * @returns {Promise<string>}
     */
    async createBlobUrl(blobUrlType, identifier = '', includeData = false, extraParams = {}) {
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
        let params = {
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

        params = { ...params, ...extraParams };
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
     * @param undelete Whether to undelete the file
     * @returns {Promise<string>}
     */
    async createBlobDeleteUrl(undelete = false) {
        return this.createBlobUrl(CabinetFile.BlobUrlTypes.UPLOAD, '', false, { 'deleteIn': undelete ? 'null' : 'P7D' });
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

        // Check if the documentModalRef modal is still open
        /** @type {Modal} */
        const modal = this.documentModalRef.value;
        if (!modal.isOpen()) {
            console.log('storeDocumentInBlob modal is not open any more');
            return {};
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
             .person=${this.person}
             additional-type="${this.additionalType}"
             object-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const objectType = this.objectType;
        console.log('objectType', objectType);

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return this.getMiniSpinnerHtml();
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
        this.person = hit.person;
        await this.updateComplete;
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
        const i18n = this._i18n;
        this.initializeState();
        this.mode = CabinetFile.Modes.VIEW;

        /** @type {FileSource} */
        const fileSource = this.fileSourceRef.value;
        // Make sure the file source dialog is closed
        if (fileSource) {
            fileSource.removeAttribute('dialog-open');
        }

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        /** @type {Modal} */
        const modal = this.documentModalRef.value;
        console.log('openDialogWithHit modal', modal);
        modal.open();

        this.state = CabinetFile.States.LOADING_FILE;

        // Fetch the hit data from Typesense again in case it changed
        hit = await this.typesenseService.fetchItem(hit.id);

        this.fileHitData = hit;
        console.log('openDialogWithHit hit', hit);
        // Set person from hit
        this.person = hit.person;
        this.objectType = hit.objectType;

        // Update deleteAtDateTime based on the fresh hit data
        const deleteAtTimestamp = hit?.file?.base?.deleteAtTimestamp;
        if (deleteAtTimestamp) {
            this.deleteAtDateTime = new Date(deleteAtTimestamp * 1000).toLocaleString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(',', i18n.t('cabinet-file.at-time'));
        } else {
            this.deleteAtDateTime = '';
        }

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        if (hit.file) {
            try {
                // This could throw an exception if the file was deleted in the meantime
                const file = await this.downloadFileFromBlob(this.fileHitData.file.base.fileId, true);
                console.log('openDialogWithHit file', file);
                this.state = CabinetFile.States.FILE_LOADED;

                // We need to set the documentFile, so that the PDF viewer will be rendered again
                this.documentFile = file;
                await this.updateComplete;

                // Show the PDF in the PDF viewer after it was rendered
                await this.showPdf(file);

                // We need to wait until rendering is complete after this.documentFile has changed
                await this.updateComplete;
            } catch {
                this.documentModalNotification('Error', 'Could not load file from Blob!', 'danger');
                this.state = CabinetFile.States.LOADING_FILE_FAILED;
            }
        }
    }

    async editFile() {
        this.mode = CabinetFile.Modes.EDIT;
    }

    async deleteFile() {
        await this.handleFileDeletion(false);
    }

    async undeleteFile() {
        await this.handleFileDeletion(true);
    }

    /**
     * Deletes/Undeletes a file from the blob storage
     * @param undelete Whether to undelete the file
     * @returns {Promise<void>}
     */
    async handleFileDeletion(undelete = false) {
        const i18n = this._i18n;
        const fileId = this.fileHitData.file.base.fileId;
        console.log('deleteFile fileId', fileId);

        const deleteUrl = await this.createBlobDeleteUrl(undelete);
        console.log('downloadFileFromBlob deleteUrl', deleteUrl);

        const options = {
            // We are doing soft-delete here, so we need to use PATCH
            method: 'PATCH',
            headers: {
                Authorization: 'Bearer ' + this.auth.token,
            },
            // The API demands a multipart form data, so we need to send an empty body
            body: new FormData(),
        };

        let response = await fetch(deleteUrl, options);
        if (!response.ok) {
            // TODO: Error handling
            if (undelete) {
                this.documentModalNotification('Failure', 'Document undeleting failed!', 'danger');
            } else {
                this.documentModalNotification('Failure', 'Document deleting failed!', 'danger');
            }

            throw response;
        }

        const data = await response.json();
        let success = false;

        if (undelete) {
            // Check if the document was marked as undeleted in the response
            if (data.deleteAt === null) {
                this.documentModalNotification('Document undeleted', 'Document was successfully undeleted!', 'success');
                this.deleteAtDateTime = '';
                success = true;
            } else {
                this.documentModalNotification('Error', 'Document was not marked as undeleted!', 'danger');
            }
        } else {
            // Check if the document was marked as deleted in the response
            if (data.deleteAt !== null) {
                // 31.01.2025, 09:52:54 MEZ
                this.deleteAtDateTime = new Date(data.deleteAt).toLocaleString('de-DE',{
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    // timeZoneName: 'short',
                    hour12: false
                }).replace(',', i18n.t('cabinet-file.at-time'));
                this.documentModalNotification(
                    i18n.t('cabinet-file.notification-title-set-for-deletion'),
                    i18n.t('cabinet-file.notification-body-set-for-deletion', { deleteTime: this.deleteAtDateTime}),
                    'success');
                success = true;
            } else {
                this.documentModalNotification('Error', 'Document was not marked as deleted!', 'danger');
            }
        }

        // Switch delete/undelete buttons if the operation was successful
        if (success) {
            this.dataWasChanged = true;

            // Mark the file as deleted/undeleted in the fileHitData
            this.fileHitData.base.isScheduledForDeletion = !undelete;
            // Update status manually, because we didn't trigger a this.fileHitData change
            this.updateStatus();

            // We need to request an update to re-render the view, because we only changed a property
            await this.requestUpdate();
        }
    }

    /**
     * Sends a notification to the document modal
     * See https://github.com/digital-blueprint/toolkit/blob/main/packages/common/notification.js
     * @param summary Summary of the notification
     * @param body Body of the notification
     * @param type Type can be info/success/warning/danger
     * @param timeout Timeout in seconds, 0 means no timeout
     */
    documentModalNotification(summary, body, type = 'info', timeout = null) {
        if (timeout === null) {
            switch (type) {
                case 'info':
                case 'success':
                    timeout = 5;
                    break;
                case 'warning':
                    timeout = 10;
                    break;
                case 'danger':
                    timeout = 15;
                    // delete options.timeout;
                    break;
            }
        }

        let options = {
            'summary': summary,
            'body': body,
            'type': type,
            'timeout': timeout,
            'targetNotificationId': 'document-modal-notification'
        };

        if (timeout <= 0) {
            delete options.timeout;
        }

        send(options);
    }

    async downloadFile() {
        console.log('downloadFile this.documentFile', this.documentFile);
        this.fileSinkRef.value.files = [this.documentFile];

        /** @type {Modal} */
        const documentModal = this.documentModalRef.value;

        // Make sure the document dialog is closed, so we can see the file sink dialog
        documentModal.close();
    }

    async openReplacePdfDialog() {
        // Don't allow the reset the state of the component when the document modal is closed
        this.allowStateReset = false;

        await this.openDocumentAddDialog(false);
    }

    async openDocumentAddDialog(resetObjectType = true) {
        if (resetObjectType) {
            this.objectType = '';
            this.fileHitData = {};
        }

        this.isFileDirty = false;
        this.dataWasChanged = false;

        /** @type {Modal} */
        const documentModal = this.documentModalRef.value;

        // Make sure the document dialog is closed
        documentModal.close();

        /** @type {FileSource} */
        const fileSource = this.fileSourceRef.value;

        // Wait until the file source dialog is ready
        if (!fileSource) {
            await this.updateComplete;
        }

        console.log('openDocumentAddDialog fileSource', fileSource);

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
            ${getSelectorFixCSS()}

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
                padding: 0 25px;
            }

            #document-modal .description {
                grid-area: 1 / 1 / 2 / 2;
            }

            #document-modal .doc-title{
                background-image: url("${unsafeCSS(getIconSVGURL('docs'))}");
                background-repeat: no-repeat;
                background-size: 24px 24px;
                background-position: left;
                padding-left: 2em;
            }
            #document-modal .student-info {
                display: flex;
                align-items: flex-start;
                justify-content: flex-start;
            }

            #document-modal .status {
                grid-area: 1 / 2 / 2 / 3;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                align-items: flex-end;
            }

            #document-modal .status.hidden {
                display: none;
            }

            #document-modal .status .status-badge {
                padding: 5px 10px;
                margin-top: auto;
                /*margin-right: 10px;*/
                border: 2px solid black;
                border-left: 10px solid black;
            }

            #document-modal .status .status-badge .status-text {
                text-transform: capitalize;
                font-weight: bold;
            }

            #document-modal .status .status-badge.success {
                border-color: var(--dbp-override-success);
            }

            #document-modal .status .status-badge.warning {
                border-color: var(--dbp-override-warning);
            }

            #document-modal .status .status-badge.danger {
                border-color: var(--dbp-override-danger);
            }

            #document-modal .pdf-preview { grid-area: 2 / 1 / 3 / 2; }

            #document-modal .form {
                grid-area: 2 / 2 / 3 / 3;
                padding-left:10px;
            }

            #document-modal .form h2{
                font-weight: bold;
            }

            #document-modal .fileButtons {
                display: flex;
                justify-content: right;
                gap: 5px;
            }
        `;
    }

    getPdfViewerHtml() {
        if (this.state === CabinetFile.States.LOADING_FILE_FAILED) {
            return html`No file found!`;
        }

        // If there is no document file anymore, show a spinner
        // This prevents that the PDF viewer still has an old file when the modal was closed
        // before the PDF was loaded or rendered
        if (!this.documentFile) {
            return html`<dbp-mini-spinner></dbp-mini-spinner>`;
        }

        return html`
            <dbp-pdf-viewer
                ${ref(this.documentPdfViewerRef)}
                id="document-pdf-viewer"
                lang="${this.lang}"
                style="width: 100%"
                auto-resize="cover"
            ></dbp-pdf-viewer>
        `;
    }

    getMiniSpinnerHtml($hide) {
        return $hide ? '' : html`<dbp-mini-spinner></dbp-mini-spinner>`;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getDocumentModalHtml() {
        const hit = this.fileHitData;
        console.log('getDocumentModalHtml this.fileHitData', this.fileHitData);
        const person = this.person;
        console.log('getDocumentModalHtml this.person', this.person);

        // Keep in mind that this.documentFile will be null until the file is loaded by openViewDialogWithFileHit
        let file = this.documentFile;
        console.log('getDocumentModalHtml this.documentFile', this.documentFile);
        console.log('this.mode', this.mode);

        const id = hit.id;
        const headline = this.mode === CabinetFile.Modes.ADD ? 'Upload Document' : hit?.file?.base.additionalType.text;

        const i18n = this._i18n;
        // TODO: Check if PDF was uploaded

        return html`
            <dbp-modal
                ${ref(this.documentModalRef)}
                @dbp-modal-closed="${this.onCloseDocumentModal}"
                id="document-modal"
                modal-id="document-modal"
                subscribe="lang">
                <div slot="header" class="header">
                    <div class="modal-notification">
                        <dbp-notification id="document-modal-notification" inline lang="${this.lang}"></dbp-notification>
                    </div>
                </div>
                <div slot="content" class="content">
                    <div class="description">
                        <div class="doc-title"><h1>${headline}</h1></div>
                        <div class="student-info">
                            ${person.fullName}<br />
                            ${person.birthDate}(${person.studId} | ${person.stPersonNr})<br />
                        </div>
                    </div>
                    <div class="status ${classMap({hidden: this.mode === CabinetFile.Modes.ADD})}">
                        <div class="status-badge ${this.documentStatus}">
                            <div class="status-description">
                                ${this.documentStatusDescription}
                                <div class="deletion-at-time">
                                    ${this.deleteAtDateTime}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="pdf-preview">
                        <div class="fileButtons">
                        </div>
                        ${this.getPdfViewerHtml()}
                    </div>
                    <div class="form">
                        <div class="fileButtons">
                            <button class="button ${classMap({hidden: this.mode !== CabinetFile.Modes.EDIT})}"
                                    @click="${this.openReplacePdfDialog}" ?disabled="${!id}">
                                Replace Document
                                ${this.getMiniSpinnerHtml(id)}
                            </button>
                            <button no-spinner-on-click class="button" @click="${this.downloadFile}" ?disabled="${!file}">
                                <dbp-icon  title='${i18n.t('download-document')}'
                                aria-label='${i18n.t('download-document')}'
                                name='download'>
                                </dbp-icon>
                                ${i18n.t('download-document')}
                                ${this.getMiniSpinnerHtml(this.state !== CabinetFile.States.LOADING_FILE)}
                            </button>
                            <button @click="${this.editFile}" ?disabled="${!file}" class="${classMap({
                                hidden: this.mode !== CabinetFile.Modes.VIEW,
                            })} button is-primary">
                                Edit
                                ${this.getMiniSpinnerHtml(this.state !== CabinetFile.States.LOADING_FILE)}
                            </button>
                            <button @click="${this.deleteFile}" ?disabled="${!file}" class="${classMap({
                                hidden: this.mode === CabinetFile.Modes.ADD || hit.base?.isScheduledForDeletion,
                            })} button is-primary">
                                Delete
                                ${this.getMiniSpinnerHtml(this.state !== CabinetFile.States.LOADING_FILE)}
                            </button>
                            <button @click="${this.undeleteFile}" ?disabled="${!file}" class="${classMap({
                                hidden: this.mode === CabinetFile.Modes.ADD || !hit.base?.isScheduledForDeletion,
                            })} button is-primary">
                                Undelete
                                ${this.getMiniSpinnerHtml(this.state !== CabinetFile.States.LOADING_FILE)}
                            </button>
                        </div>
                        ${this.getObjectTypeFormPartHtml()}
                    </div>
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

        // Prevent the state reset when the document modal is closed if it was closed by
        // the "Replace Document" button
        if (this.allowStateReset) {
            // Reset the state of the component when the modal is closed
            this.initializeState();
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
                <select id="document-type" name="object-type" required @change="${this.onDocumentTypeSelected}">
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
                context="${i18n.t('cabinet-file.file-picker-context')}"
                subscribe="lang,nextcloud-store-session:nextcloud-store-session"
                allowed-mime-types="application/pdf"
                enabled-targets="${this.fileHandlingEnabledTargets}"
                nextcloud-auth-url="${this.nextcloudWebAppPasswordURL}"
                nextcloud-web-dav-url="${this.nextcloudWebDavURL}"
                nextcloud-name="${this.nextcloudName}"
                nextcloud-auth-info="${this.nextcloudAuthInfo}"
                nextcloud-file-url="${this.nextcloudFileURL}"
                decompress-zip
                max-file-size="32000"
                text="${i18n.t('cabinet-file.upload-area-text')}"
                button-label="${i18n.t('cabinet-file.upload-button-label')}"
                @dbp-file-source-dialog-closed="${this.onFileSelectDialogClosed}"
                @dbp-file-source-file-selected="${this.onDocumentFileSelected}"></dbp-file-source>
        `;
    }

    getHtml() {
        return html`
            ${this.getDocumentModalHtml()}
            ${this.getFileSourceHtml()}
            <dbp-file-sink
                ${ref(this.fileSinkRef)}
                subscribe="nextcloud-store-session:nextcloud-store-session"
                lang="${this.lang}"
                enabled-targets="${this.fileHandlingEnabledTargets}"
                nextcloud-auth-url="${this.nextcloudWebAppPasswordURL}"
                nextcloud-web-dav-url="${this.nextcloudWebDavURL}"
                nextcloud-name="${this.nextcloudName}"
                nextcloud-auth-info="${this.nextcloudAuthInfo}"
                nextcloud-file-url="${this.nextcloudFileURL}"
            ></dbp-file-sink>
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
            /** @type {Modal} */
            const modal = this.documentModalRef.value;

            // Note: Modal is checking if the dialog is already open
            modal.open();
        }

        // In case we can here via the "Replace Document" button, allow the state to be reset
        // after the document dialog was closed again
        this.allowStateReset = true;
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

        /** @type {Modal} */
        const modal = this.documentModalRef.value;

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        // Note: Modal is checking if the dialog is already open, if it was opened by onFileSelectDialogClosed()
        modal.open();

        // In case we can here via the "Replace Document" button, allow the state to be reset
        // after the document dialog was closed again
        this.allowStateReset = true;
    }

    /**
     * @param documentFile
     */
    async showPdf(documentFile) {
        console.log('documentFile', documentFile);
        this.documentFile = documentFile;

        // We need to wait until rendering is complete after this.documentFile has changed
        await this.updateComplete;

        /** @type {PdfViewer} */
        const pdfViewer = this.documentPdfViewerRef.value;
        // const pdfViewer = this._('#document-pdf-viewer');

        // Load the PDF in the PDF viewer with the double reloading workaround,
        // because the page wasn't always shown
        await pdfViewer.showPDF(this.documentFile, {}, true);
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "mode":
                    console.log('this.mode changed from', oldValue, 'to', this.mode);
                    break;
                case "fileHitData":
                    console.log('this.fileHitData changed from', oldValue, 'to', this.fileHitData);
                    this.updateStatus();
                    break;
            }
        });

        super.update(changedProperties);
    }

    updateStatus() {
        if (!this.fileHitData.base) {
            return;
        }

        if (this.fileHitData.base.isScheduledForDeletion) {
            this.documentStatus = 'danger';
            this.documentStatusDescription = 'Scheduled for deletion';
        } else if (this.fileHitData.file.base.recommendedDeletionTimestamp < (Math.floor(Date.now() / 1000))) {
            this.documentStatus = 'warning';
            this.documentStatusDescription = 'Deletion date reached';

            // TODO: How to check for archival date reached?
            // this.documentStatusDescription = 'Archival date reached';
        } else {
            this.documentStatus = 'success';
            this.documentStatusDescription = 'No problems detected';
        }
    }
}
