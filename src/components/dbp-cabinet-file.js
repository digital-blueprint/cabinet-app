import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {
    Button,
    combineURLs,
    Icon,
    Modal,
    DBPSelect,
    ScopedElementsMixin,
    sendNotification,
} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {FileSink, FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {dataURLtoFile, pascalToKebab} from '../utils';
import {classMap} from 'lit/directives/class-map.js';
import * as formElements from '../objectTypes/formElements.js';
import {BaseFormElement} from '../baseObject.js';
import {getSelectorFixCSS} from '../styles.js';
import {formatDate} from '../utils.js';
import {TypesenseService} from '../services/typesense.js';
import {
    scopedElements as modalNotificationScopedElements,
    sendModalNotification,
} from '../modules/modal-notification';
import {createUUID} from '@dbp-toolkit/common/utils';
import {PdfValidationErrorList} from './pdf-validation-error-list.js';
import {BlobOperations} from '../utils/blob-operations.js';

export class CabinetFile extends ScopedElementsMixin(DBPCabinetLitElement) {
    // Always allow creating new versions if true
    static DEV_MODE = false;

    static Modes = {
        VIEW: 'view',
        EDIT: 'edit',
        NEW_VERSION: 'new-version',
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

    static Status = {
        SUCCESS: 'success',
        WARNING: 'warning',
        DANGER: 'danger',
    };

    constructor() {
        super();
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.documentModalRef = createRef();
        this.documentPdfViewerRef = createRef();
        this.documentPdfValidationErrorList = createRef();
        this.fileDocumentTypeNames = {};
        // TODO: Do we need a prefix?
        this.blobDocumentPrefix = 'document-';
        this.modalRef = createRef();
        this.fileSourceRef = createRef();
        this.fileSinkRef = createRef();
        this.formRef = createRef();
        this.uploadFailed = false;
        // Initialize the state in the beginning
        this.initializeState();
    }

    _getTypesenseService() {
        let serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this.entryPointUrl,
            this.auth.token,
        );
        return new TypesenseService(serverConfig);
    }

    /**
     * Initializes the state of the component, so less stuff can go on in the background
     * when the modal is closed
     * This is important so when the dialog is opened again, the state is clean and no
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
        this.statusMessageBlocks = [];
        this.deleteAtDateTime = '';
        this.allowStateReset = true;
        this.state = CabinetFile.States.NONE;
        this.versions = [];
        this.currentVersionsCount = 0;

        // Will be used when canceling the form in EDIT mode, when the data was changed via this.fileHitDataCache
        this.fileHitDataBackup = {};
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
                    this.fileHitData = this.fileHitDataBackup;
                    // Reset this.objectType if it was changed by the objectType selector
                    this.objectType = this.fileHitData.objectType;

                    // Switch back to view mode
                    this.mode = CabinetFile.Modes.VIEW;
                }
            });
        });
    }

    onFileSinkDialogClosed() {
        /** @type {Modal} */
        const documentModal = this.documentModalRef.value;

        // Open the document modal again, so the user can see the document
        documentModal.open();

        // Allow the state to be reset again
        this.allowStateReset = true;
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-file-source': FileSource,
            'dbp-file-sink': FileSink,
            'dbp-pdf-viewer': PdfViewer,
            'dbp-button': Button,
            'dbp-pdf-validation-error-list': PdfValidationErrorList,
            'dbp-select': DBPSelect,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            person: {type: Object, attribute: false},
            fileHitData: {type: Object, attribute: false},
            versions: {type: Array, attribute: false},
            documentFile: {type: File, attribute: false},
            objectType: {type: String, attribute: false},
            additionalType: {type: String, attribute: false},
            documentStatus: {type: String, attribute: false},
            deleteAtDateTime: {type: String, attribute: false},
            state: {type: String, attribute: false},
            mode: {type: String},
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
        console.log('storeDocumentToBlob formData', formData);
        const fileData = await this.storeDocumentInBlob(formData);
        console.log('storeDocumentToBlob fileData', fileData);
        const groupId = this.fileHitData?.file?.base?.groupId;
        const isCurrent = this.fileHitData?.base?.isCurrent ?? true;
        let obsoleteBlobIds = [];

        if (isCurrent) {
            // Mark all other versions as obsolete in Blob
            obsoleteBlobIds = await this.markOtherVersionsObsoleteInBlob(
                groupId,
                fileData.identifier,
            );
        }

        console.log('storeDocumentToBlob obsoleteBlobIds', obsoleteBlobIds);

        if (fileData.identifier) {
            this.documentModalNotification(
                'Document stored successfully',
                'Document stored successfully with id ' +
                    fileData.identifier +
                    '! ' +
                    'Document will now be fetched from Typesense.',
                'success',
            );

            // Try to fetch the document from Typesense again and again until it is found
            await this.fetchFileDocumentFromTypesense(fileData.identifier);

            if (isCurrent && obsoleteBlobIds.length > 0) {
                // Wait until all versions from obsoleteBlobIds are updated to have isCurrent set the false in Typesense
                await this.waitForVersionsUpdatedInTypesense(obsoleteBlobIds);
            }

            // Update URL, especially if a new version was created
            this.sendSetPropertyEvent('routing-url', `/document/${this.fileHitData.id}`, true);
        }
    }

    async fetchFileDocumentFromTypesense(fileId, increment = 0) {
        // Stop after 10 attempts
        if (increment >= 10) {
            // TODO: Setup some kind of error message and decide what to do
            this.documentModalNotification(
                'Error',
                'Could not fetch file document from Typesense after 10 attempts!',
                'danger',
            );

            /** @type {BaseFormElement} */
            const form = this.formRef.value;
            // Enable the save button again in the form
            form.enableSaveButton();

            return;
        }

        try {
            // Could throw an exception if there was another error than 404
            const item = await this._getTypesenseService().fetchFileDocumentByBlobId(fileId);

            // If the document was found, and we were in ADD mode or the item was already updated in Typesense
            // set the hit data and switch to view mode
            if (
                item !== null &&
                (this.mode === CabinetFile.Modes.ADD ||
                    this.fileHitData.file.base.modifiedTimestamp < item.file.base.modifiedTimestamp)
            ) {
                console.log('fetchFileDocumentFromTypesense this.fileHitData', this.fileHitData);
                console.log('fetchFileDocumentFromTypesense item', item);

                this.fileHitData = item;
                this.fileHitDataBackup = this.fileHitData;
                this.mode = CabinetFile.Modes.VIEW;
                await this.updateVersions();

                return;
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            this.documentModalNotification(
                'Error',
                'Could not load document from Typesense!',
                'danger',
            );
            this.state = CabinetFile.States.LOADING_FILE_FAILED;

            // The save button will still be disabled and has a spinner, enabling it again doesn't
            // make a lot of sense, because because the document was already stored to Blob and
            // we are in a failed state
            // TODO: Is there something else we should do here?
            return;
        }

        // First wait for a second
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Then try another attempt to load the file document from typesense
        await this.fetchFileDocumentFromTypesense(fileId, ++increment);
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
        switch (blobUrlType) {
            case CabinetFile.BlobUrlTypes.UPLOAD:
                if (!identifier) {
                    identifier = this.getFileHitDataBlobId();
                }
                method = identifier === '' ? 'POST' : 'PATCH';
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
            method: method,
        };
        if (blobUrlType === CabinetFile.BlobUrlTypes.UPLOAD) {
            params['prefix'] = this.blobDocumentPrefix;
            params['type'] = this.objectType.replace('file-cabinet-', '');
        }

        if (identifier !== '') {
            params['identifier'] = identifier;
        }

        if (includeData) {
            params['includeData'] = '1';
        }

        params = {...params, ...extraParams};
        apiUrl.search = new URLSearchParams(params).toString();

        let response = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token,
            },
            body: '{}',
        });
        if (!response.ok) {
            this.documentModalNotification(
                'Error while creating storage URL',
                response.statusText,
                'danger',
            );

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
     * @param fileId
     * @param undelete Whether to undelete the file
     * @returns {Promise<string>}
     */
    async createBlobDeleteUrl(fileId, undelete = false) {
        return BlobOperations.createBlobDeleteUrl(
            this.entryPointUrl,
            this.auth.token,
            fileId,
            this.objectType,
            undelete,
        );
    }

    async loadBlobItem(url) {
        return BlobOperations.loadBlobItem(url, this.auth.token);
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
        const groupId = this.fileHitData?.file?.base?.groupId;
        const isCurrent = this.fileHitData?.base?.isCurrent ?? false;
        console.log('storeDocumentInBlob this.fileHitData', this.fileHitData);
        // console.log('storeDocumentInBlob isCurrent', isCurrent);
        console.log('storeDocumentInBlob this.mode', this.mode);

        metaData['@type'] = 'DocumentFile';
        metaData['fileSource'] = 'blob-cabinetBucket';
        metaData['objectType'] = this.objectType;
        metaData['isCurrent'] =
            this.mode === CabinetFile.Modes.NEW_VERSION ||
            this.mode === CabinetFile.Modes.ADD ||
            isCurrent;
        metaData['groupId'] = groupId || createUUID();
        // metaData['dateCreated'] = new Date().toISOString().split('T')[0];
        console.log('storeDocumentInBlob metaData', metaData);

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
            let json = await response.json();

            // if document is too big
            if (json['relay:errorId'] === 'verity:create-report-backend-exception') {
                this.documentPdfValidationErrorList.value.errors = [json['detail']];
                this.documentPdfValidationErrorList.value.errorSummary = this._i18n.t(
                    'cabinet-file.document-upload-failed-pdfa-too-big-summary',
                );
            }
            // if document is not in a valid PDF/A format
            if (json['relay:errorId'].includes('-file-data-file-does-not-validate-against-type')) {
                this.documentPdfValidationErrorList.value.errors = json['relay:errorDetails'];
            }

            this.uploadFailed = true;
            if (this.shadowRoot.querySelector('.status-badge')) {
                this.shadowRoot.querySelector('.status-badge').classList.add('hidden');
            }
            this.requestUpdate();
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
        console.log(
            'getDocumentEditFormHtml this.objectTypeFormComponents[objectType]',
            this.objectTypeFormComponents[objectType],
        );

        if (!this.registry.get(tagName)) {
            this.registry.define(tagName, this.objectTypeFormComponents[objectType]);
        }

        let fileHitData = this.fileHitData;

        // In edit mode we want to use the fileHitDataCache to keep the data when switching between object types
        if (useFileHitDataCache && this.fileHitDataCache[objectType]) {
            fileHitData = this.fileHitDataCache[objectType];
        }

        console.log('getDocumentEditFormHtml fileHitData', fileHitData);
        console.log('getDocumentEditFormHtml this.additionalType', this.additionalType);
        console.log('getDocumentEditFormHtml this.uploadFailed', this.uploadFailed);

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
             .saveButtonEnabled=${!this.uploadFailed}
             object-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const objectType = this.objectType;
        console.log('objectType', objectType);

        if (!this.objectType || objectType === '') {
            console.log('objectType empty', objectType);
            return this.getMiniSpinnerHtml();
        }

        const hit = this.fileHitData;
        const id = hit.id;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-view-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log(
            'this.objectTypeViewComponents[objectType]',
            this.objectTypeViewComponents[objectType],
        );

        if (!this.registry.get(tagName)) {
            this.registry.define(tagName, this.objectTypeViewComponents[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <h3>${this._i18n.t('Document-details-modal')}</h3>
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
        return BlobOperations.downloadFileFromBlob(
            this.entryPointUrl,
            this.auth.token,
            fileId,
            dataURLtoFile,
            includeData,
        );
    }

    /**
     * Since we are loading the document from typesense we don't need a hit object
     * @param id
     * @returns {Promise<void>}
     */
    async openViewDialogWithFileId(id) {
        const hit = {id: id};
        console.log('openViewDialogWithFileId hit', hit);

        return this.openViewDialogWithFileHit(hit);
    }

    async openViewDialogWithFileHit(hit) {
        this.sendSetPropertyEvent('routing-url', `/document/${hit.id}`, true);
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
        if (!modal.isOpen()) {
            modal.open();
        }

        this.state = CabinetFile.States.LOADING_FILE;

        // Fetch the hit data from Typesense again in case it changed
        hit = await this._getTypesenseService().fetchItem(hit.id);

        if (!hit) {
            modal.close();

            sendNotification({
                summary: this._i18n.t('document.document-not-found-summary'),
                body: this._i18n.t('document.document-not-found-body'),
                type: 'danger',
                replaceId: 'document-not-found',
                timeout: 5,
            });

            return;
        }

        this.fileHitData = hit;
        this.fileHitDataBackup = this.fileHitData;
        console.log('openDialogWithHit hit', hit);
        // Set person from hit
        this.person = hit.person;
        this.objectType = hit.objectType;

        await this.updateVersions();

        // Update deleteAtDateTime based on the fresh hit data
        const deleteAtTimestamp = hit?.file?.base?.deleteAtTimestamp;
        if (deleteAtTimestamp) {
            this.deleteAtDateTime = new Date(deleteAtTimestamp * 1000)
                .toLocaleString('de-DE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
                .replace(',', i18n.t('cabinet-file.at-time'));
        } else {
            this.deleteAtDateTime = '';
        }

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        if (hit.file) {
            try {
                // This could throw an exception if the file was deleted in the meantime
                const file = await this.downloadFileFromBlob(
                    this.fileHitData.file.base.fileId,
                    true,
                );
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

    async deleteAllVersions() {
        await this.handleDeleteAllVersions();
    }

    async undeleteFile() {
        await this.handleFileDeletion(true);
    }

    /**
     * Sets isCurrent to true or false for this version in blob
     * @param fileId
     * @param enable
     * @returns {Promise<void>}
     */
    async setIsCurrentVersion(fileId, enable = true) {
        if (!fileId) {
            console.error('setIsCurrentVersion: No fileId set');
            return;
        }

        try {
            // Load current blob item metadata
            const downloadUrl = await this.createBlobDownloadUrl(fileId);
            let blobItem = await this.loadBlobItem(downloadUrl);
            if (!blobItem || !blobItem.metadata) {
                console.warn('setIsCurrentVersion: No metadata found for fileId', fileId);
                return;
            }

            let metadata;
            try {
                metadata = JSON.parse(blobItem.metadata);
            } catch (e) {
                console.error('setIsCurrentVersion: Failed to parse metadata JSON', e);
                return;
            }

            const i18n = this._i18n;

            if (metadata.isCurrent === enable) {
                console.log('setIsCurrentVersion: isCurrent already', enable);
                this.documentModalNotification(
                    i18n.t('info') || 'Info',
                    enable
                        ? 'Version is already marked as current.'
                        : 'Version is already marked as obsolete.',
                    'info',
                );
                return;
            }

            metadata.isCurrent = enable;

            // Prepare PATCH request to update metadata
            const patchUrl = await this.createBlobUrl(CabinetFile.BlobUrlTypes.UPLOAD, fileId);

            const formData = new FormData();
            formData.append('metadata', JSON.stringify(metadata));
            formData.append('prefix', this.blobDocumentPrefix);

            const options = {
                method: 'PATCH',
                headers: {Authorization: 'Bearer ' + this.auth.token},
                body: formData,
            };

            const response = await fetch(patchUrl, options);
            if (!response.ok) {
                console.error(
                    'setIsCurrentVersion: Failed to patch isCurrent',
                    response.status,
                    response.statusText,
                );
                this.documentModalNotification(
                    'Error',
                    enable
                        ? 'Failed to mark version as current.'
                        : 'Failed to mark version as obsolete.',
                    'danger',
                );
                return;
            }

            // // Optimistically update local state
            // if (this.fileHitData?.base) {
            //     this.fileHitData.base.isCurrent = enable;
            // }

            // Refresh from Typesense (will also wait for obsolete updates if needed)
            try {
                await this.fetchFileDocumentFromTypesense(fileId);
                // await this.updateVersions();
            } catch (e) {
                console.warn('setIsCurrentVersion: Typesense refresh issue', e);
            }

            this.documentModalNotification(
                enable ? 'Success' : 'Success',
                enable
                    ? 'Version successfully marked as current.'
                    : 'Version successfully marked as obsolete.',
                'success',
            );
        } catch (error) {
            console.error('setIsCurrentVersion: Unexpected error', error);
            this.documentModalNotification(
                'Error',
                enable
                    ? 'Unexpected error while marking version as current.'
                    : 'Unexpected error while marking version as obsolete.',
                'danger',
            );
        }
    }

    /**
     * Deletes/Undeletes a file from the blob storage
     * @param undelete Whether to undelete the file
     * @returns {Promise<void>}
     */
    async handleFileDeletion(undelete = false) {
        const i18n = this._i18n;
        const fileId = this.fileHitData.file.base.fileId;
        const data = await this.doFileDeletionForFileId(fileId, undelete);
        let success = false;

        if (undelete) {
            // Check if the document was marked as undeleted in the response
            if (data.deleteAt === null) {
                this.documentModalNotification(
                    'Document undeleted',
                    'Document was successfully undeleted!',
                    'success',
                );
                this.deleteAtDateTime = '';
                success = true;
            } else {
                this.documentModalNotification(
                    'Error',
                    'Document was not marked as undeleted!',
                    'danger',
                );
            }
        } else {
            // Check if the document was marked as deleted in the response
            if (data.deleteAt !== null) {
                // 31.01.2025, 09:52:54 MEZ
                this.deleteAtDateTime = new Date(data.deleteAt)
                    .toLocaleString('de-DE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        // timeZoneName: 'short',
                        hour12: false,
                    })
                    .replace(',', i18n.t('cabinet-file.at-time'));
                this.documentModalNotification(
                    i18n.t('cabinet-file.notification-title-set-for-deletion'),
                    i18n.t('cabinet-file.notification-body-set-for-deletion', {
                        deleteTime: this.deleteAtDateTime,
                    }),
                    'success',
                );
                success = true;
            } else {
                this.documentModalNotification(
                    'Error',
                    'Document was not marked as deleted!',
                    'danger',
                );
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

    async doFileDeletionForFileId(fileId, undelete = false) {
        console.log('doFileDeletionForFileId fileId', fileId);

        try {
            return await BlobOperations.doFileDeletionForFileId(
                this.entryPointUrl,
                this.auth.token,
                fileId,
                this.objectType,
                undelete,
            );
        } catch (error) {
            if (undelete) {
                this.documentModalNotification(
                    'Failure',
                    `Could mark document ${fileId} as undeleted in blob!`,
                    'danger',
                );
            } else {
                this.documentModalNotification(
                    'Failure',
                    `Could mark document ${fileId} as deleted in blob!`,
                    'danger',
                );
            }
            throw error;
        }
    }

    /**
     * Sends a notification to the document modal
     * @param summary Summary of the notification
     * @param body Body of the notification
     * @param type Type can be info/success/warning/danger
     * @param timeout Timeout in seconds, 0 means no timeout
     */
    documentModalNotification(summary, body, type = 'info', timeout = null) {
        sendModalNotification('document-modal-notification', summary, body, type, timeout);
    }

    async downloadFile(e) {
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        console.log('downloadFile selectorValue', selectorValue);
        let files = [];

        if (selectorValue !== 'document-file-only') {
            const file = new File([JSON.stringify(this.fileHitData)], 'metadata.json', {
                type: 'application/json',
            });

            files.push(file);
        }

        if (selectorValue !== 'metadata-only') {
            files.push(this.documentFile);
        }

        this.fileSinkRef.value.files = files;
        // Reset the selector to the default value, so there isn't a selected value after the download
        e.target.selectedIndex = 0;

        // Don't allow the reset the state of the component when the document modal is closed
        this.allowStateReset = false;

        /** @type {Modal} */
        const documentModal = this.documentModalRef.value;

        // Make sure the document dialog is closed, so we can see the file sink dialog
        documentModal.close();
    }

    async handleFileAction(evOrAction) {
        let action;
        let fromSelect = false;

        if (typeof evOrAction === 'string') {
            action = evOrAction;
        } else if (evOrAction?.currentTarget) {
            const el = evOrAction.currentTarget;
            fromSelect = el.tagName === 'SELECT';
            action = el.value || el.dataset?.action;
        }

        const fileId = this.getFileHitDataBlobId();

        try {
            switch (action) {
                case 'add':
                    await this.addNewVersion();
                    break;
                case 'edit':
                    await this.editFile();
                    break;
                case 'mark-current':
                    await this.setIsCurrentVersion(fileId);
                    break;
                case 'mark-obsolete':
                    await this.setIsCurrentVersion(fileId, false);
                    break;
                case 'delete':
                    await this.deleteFile();
                    break;
                case 'delete-all':
                    await this.deleteAllVersions();
                    break;
                default:
                    break;
            }
        } finally {
            this.dataWasChanged = true;
            if (fromSelect) {
                evOrAction.currentTarget.selectedIndex = 0;
                evOrAction.currentTarget.value = '';
                evOrAction.currentTarget.blur?.();
            }
        }
    }

    async openReplacePdfDialog() {
        // Don't allow the reset the state of the component when the document modal is closed
        this.allowStateReset = false;

        // Enable the save button again in the form if upload failed previously
        if (this.uploadFailed) {
            /** @type {BaseFormElement} */
            const form = this.formRef.value;
            form.enableSaveButton();
            this.uploadFailed = false;
        }

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
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            commonStyles.getButtonCSS(),
            commonStyles.getRadioAndCheckboxCss(),
            formElements.getFieldsetCSS(),
            getSelectorFixCSS(),
            // language=css
            css`
                h3 {
                    font-weight: 600;
                }

                .red-marked-asterisk {
                    color: var(--dbp-danger);
                    font-weight: bold;
                }

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

                #document-modal .doc-title {
                    display: flex;
                    flex-direction: row;
                    padding: 0 25px;
                    align-items: center;
                    justify-content: flex-start;
                }

                #document-modal .view-modal-icon {
                    color: var(--dbp-accent);
                    width: 25px;
                    height: 25px;
                    padding-right: 0.5em;
                }

                #document-modal .student-info {
                    display: flex;
                    align-items: flex-start;
                    justify-content: flex-start;
                }

                #document-modal .status {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    align-items: flex-end;
                }

                #document-modal .status.hidden {
                    display: none;
                }

                #document-modal .status-badge.hidden {
                    display: none;
                }

                #document-modal .status .status-badge {
                    display: flex;
                    flex-direction: row;
                }

                #document-modal .status .status-badge ul {
                    margin: 0 0 2px 0;
                }

                #document-modal .status li.success {
                    color: var(--dbp-success);
                    font-weight: bold;
                }

                #document-modal .status li.warning {
                    color: var(--dbp-warning);
                    font-weight: bold;
                }

                #document-modal .status li.danger {
                    color: var(--dbp-danger);
                    font-weight: bold;
                }

                #document-modal .status li span.extra-message {
                    color: var(--dbp-content);
                    font-weight: normal;
                }

                #document-modal .pdf-preview {
                    grid-area: 2 / 1 / 3 / 2;
                }

                #document-modal .form {
                    grid-area: 2 / 2 / 3 / 3;
                    padding-left: 10px;
                }

                #document-modal .form h2 {
                    font-weight: bold;
                }

                #document-modal .fileButtons {
                    display: flex;
                    gap: 5px;
                    justify-content: flex-end;
                }

                #document-modal .delete-button {
                    font-weight: normal;
                }

                #document-modal .undo-button {
                    font-weight: normal;
                }

                #document-modal .edit-button {
                    font-weight: normal;
                }

                #document-modal .doc-type-edit-view {
                    padding: 0.14rem 1rem 0.14rem 0.14rem;
                    width: calc(100% - 0.9em);
                }

                #document-modal .desc-stat {
                    padding: 10px 0;
                }

                .grouping-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .grouping-container h3 {
                    margin: 0;
                }

                @media (min-width: 768px) {
                    .desc-stat,
                    .form,
                    .pdf-preview {
                        grid-column: 1 / -1;
                    }
                    #document-modal .desc-stat {
                        display: flex;
                        flex-direction: row;
                        align-items: normal;
                        justify-content: space-between;
                    }
                }
                @media (min-width: 490px) and (max-width: 767px) {
                    #document-modal .content {
                        display: flex;
                        flex-direction: column;
                    }
                    #document-modal .desc-stat {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: flex-start;
                        word-spacing: inherit;
                        word-wrap: break-word;
                        word-break: break-word;
                    }
                    #document-modal .status {
                        align-items: flex-start;
                    }
                    #document-modal .form {
                        padding-left: 0;
                    }
                    #document-modal .description {
                        flex-wrap: wrap;
                    }
                }
                @media (max-width: 490px) {
                    #document-modal .content {
                        display: flex;
                        flex-direction: column;
                    }
                    #document-modal .desc-stat {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: flex-start;
                        word-spacing: inherit;
                        word-wrap: break-word;
                        word-break: break-word;
                    }
                    #document-modal .status {
                        align-items: flex-start;
                    }
                    #document-modal .form {
                        padding-left: 0;
                    }
                    #document-modal .description {
                        flex-wrap: wrap;
                    }
                }
            `,
        ];
    }

    getDocumentValidationErrorHtml() {
        return html`
            <dbp-pdf-validation-error-list
                subscribe="lang"
                ${ref(this.documentPdfValidationErrorList)}></dbp-pdf-validation-error-list>
        `;
    }

    getPdfViewerHtml() {
        if (this.state === CabinetFile.States.LOADING_FILE_FAILED) {
            return html`
                No file found!
            `;
        }

        // If there is no document file anymore, show a spinner
        // This prevents that the PDF viewer still has an old file when the modal was closed
        // before the PDF was loaded or rendered
        if (!this.documentFile) {
            return html`
                <dbp-mini-spinner></dbp-mini-spinner>
            `;
        }

        return html`
            <dbp-pdf-viewer
                ${ref(this.documentPdfViewerRef)}
                class="${classMap({
                    hidden: this.uploadFailed,
                })}"
                id="document-pdf-viewer"
                lang="${this.lang}"
                style="width: 100%"
                auto-resize="cover"></dbp-pdf-viewer>
        `;
    }

    getMiniSpinnerHtml($hide) {
        return $hide
            ? ''
            : html`
                  <dbp-mini-spinner></dbp-mini-spinner>
              `;
    }

    async fetchGroupedHits() {
        const groupId = this.fileHitData.file.base.groupId;
        console.log('fetchGroupedHits groupId', groupId);

        if (!groupId) {
            // If there was no groupId set, return the current hit
            return [this.fileHitData];
        }

        let versions = [];

        try {
            // Could throw an exception if there was another error than 404
            versions = [
                ...versions,
                ...(await this._getTypesenseService().fetchFileDocumentsByGroupId(groupId)),
            ];
        } catch (error) {
            this.documentModalNotification('Error', 'Could not load document versions!', 'danger');
            console.error(error);
        }

        console.log('fetchGroupedHits versions', versions);
        return versions;
    }

    async updateVersions() {
        this.versions = await this.fetchGroupedHits();
        this.currentVersionsCount = this.versions.filter(
            (version) => version.base?.isCurrent,
        ).length;
    }

    renderGroupingContainer() {
        // Only show the grouping container in view mode if there are multiple versions
        if (this.mode !== CabinetFile.Modes.VIEW || this.versions.length <= 1) {
            return html``;
        }

        return html`
            <div class="grouping-container">
                <h3>Selected:</h3>
                ${this.renderVersionsSelector()}
            </div>
        `;
    }

    renderVersionsSelector() {
        console.log('renderVersionsSelector this.versions', this.versions);
        if (!Array.isArray(this.versions)) {
            return html``;
        }

        // Show dates like this:
        // 01.05.2025 08:00:00, modified 02.05.2025 09:13:45 (current)
        // 05.04.2023 08:45:00, modified 12.11.20223 (obsolete)
        // 31.01.2022 12:35:04 (obsolete)
        return html`
            <select @change=${this.onChangeVersion}>
                ${Array.from(this.versions).map((item) => {
                    const isModified =
                        item.file.base.modifiedTimestamp !== item.file.base.createdTimestamp;
                    const isCurrent = item.base.isCurrent;
                    // const isCurrent = false;
                    const modifiedDateOptions = isCurrent
                        ? {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                          }
                        : {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                          };

                    // Show full date and time for creation time
                    const createdDate = new Date(item.file.base.createdTimestamp * 1000)
                        .toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        })
                        .replace(',', '');

                    // For the modified date, show only the date if the item is obsolete
                    const modifiedText = isModified
                        ? ', modified ' +
                          new Date(item.file.base.modifiedTimestamp * 1000)
                              .toLocaleString('de-DE', modifiedDateOptions)
                              .replace(',', '')
                        : '';

                    const status = isCurrent ? 'current' : 'obsolete';

                    return html`
                        <option value="${item.id}" ?selected=${item.id === this.fileHitData.id}>
                            ${createdDate}${modifiedText} (${status})
                        </option>
                    `;
                })}
            </select>
        `;
    }

    async onChangeVersion(e) {
        console.log('onUpdateVersion e', e);
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        console.log('onUpdateVersion selectorValue', selectorValue);

        const hit = this.versions.find((item) => item.id === selectorValue);
        console.log('onUpdateVersion hit', hit);

        if (!hit) {
            return;
        }

        await this.openViewDialogWithFileHit(hit);
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
        const i18n = this._i18n;
        const id = hit.id;
        let additionalType = this.additionalType || hit?.file?.base.additionalType.key;
        const headline =
            this.mode === CabinetFile.Modes.ADD
                ? 'Upload Document'
                : i18n.t(`typesense-schema.file.base.additionalType.key.${additionalType}`);
        console.log('additionalType', additionalType);
        this.updateStatus();
        const options = [];

        options.push({
            name: 'document-file-only',
            label: i18n.t('doc-modal-document-only'),
            value: 'document-file-only',
        });
        options.push({
            name: 'metadata-only',
            label: i18n.t('doc-modal-only-data'),
            value: 'metadata-only',
        });
        options.push({
            name: 'all',
            label: i18n.t('doc-modal-all'),
            value: 'all',
        });
        // TODO: Check if PDF was uploaded
        return html`
            <dbp-modal
                ${ref(this.documentModalRef)}
                @dbp-modal-closed="${this.onCloseDocumentModal}"
                id="document-modal"
                modal-id="document-modal"
                subscribe="lang">
                <div slot="header" class="modal-title doc-title">
                    <dbp-icon name="files" class="view-modal-icon" aria-hidden="true"></dbp-icon>
                    <h2>${headline}</h2>
                </div>
                <div slot="header" class="header">
                    <div class="modal-notification">
                        <dbp-notification
                            id="document-modal-notification"
                            inline
                            lang="${this.lang}"></dbp-notification>
                    </div>
                </div>
                <div slot="content" class="content">
                    <div class="desc-stat">
                        <div class="description">
                            <div class="student-info">
                                <h3>
                                    ${person.fullName} ${formatDate(person.birthDate)}
                                    <span style="font-weight:300">
                                        &nbsp;(${person.studId} | ${person.stPersonNr})
                                    </span>
                                </h3>
                                <br />
                            </div>
                            ${this.renderGroupingContainer()}
                        </div>
                        <div
                            class="status ${classMap({
                                hidden: this.mode === CabinetFile.Modes.ADD && !this.uploadFailed,
                            })}">
                            ${this.renderStatusBadge()}
                            <div class="fileButtons">
                                <button
                                    class="button ${classMap({
                                        hidden: this.uploadFailed
                                            ? false
                                            : this.mode !== CabinetFile.Modes.EDIT &&
                                              this.mode !== CabinetFile.Modes.NEW_VERSION,
                                    })}"
                                    @click="${this.openReplacePdfDialog}"
                                    ?disabled="${this.uploadFailed ? false : !id}">
                                    ${i18n.t('buttons.replace-document')}
                                    ${this.getMiniSpinnerHtml(id)}
                                </button>
                                ${this.renderActionDropDown(hit, file)}
                                <button
                                    @click="${this.undeleteFile}"
                                    ?disabled="${!file}"
                                    class="${classMap({
                                        hidden:
                                            this.mode === CabinetFile.Modes.ADD ||
                                            !hit.base?.isScheduledForDeletion,
                                    })} button is-secondary undo-button">
                                    <dbp-icon
                                        title="${i18n.t('doc-modal-undelete-document')}"
                                        aria-label="${i18n.t('doc-modal-undelete-document')}"
                                        name="undo"></dbp-icon>
                                    ${i18n.t('doc-modal-undelete-document')}
                                    ${this.getMiniSpinnerHtml(
                                        this.state !== CabinetFile.States.LOADING_FILE,
                                    )}
                                </button>
                                <dbp-select
                                    id="download-dropdown"
                                    class=" ${classMap({
                                        hidden: this.mode !== CabinetFile.Modes.VIEW,
                                    })}"
                                    ?disabled=${!file}
                                    label="${i18n.t('download-button')}"
                                    .options=${options}
                                    @change="${this.downloadFile}"></dbp-select>
                            </div>
                        </div>
                    </div>

                    <div class="pdf-preview">
                        ${this.getPdfViewerHtml()} ${this.getDocumentValidationErrorHtml()}
                    </div>
                    <div class="form">${this.getObjectTypeFormPartHtml()}</div>
                </div>
            </dbp-modal>
        `;
    }

    renderActionDropDown(hit, file) {
        if (this.mode !== CabinetFile.Modes.VIEW || hit.base?.isScheduledForDeletion) {
            return null;
        }

        const i18n = this._i18n;
        const isCurrent = hit?.base?.isCurrent ?? true;
        const hasOnlyOneVersion = this.versions.length <= 1;
        const showDeleteDocumentButton = hasOnlyOneVersion;
        const showDeleteVersionButton = !hasOnlyOneVersion;
        const showDeleteAllVersionsButton = !hasOnlyOneVersion;

        const options = [];

        options.push({
            name: 'edit',
            label: i18n.t('doc-modal-edit'),
            iconName: 'pencil',
        });

        if (!isCurrent) {
            options.push({
                name: 'mark-current',
                label: i18n.t('doc-modal-mark-document-current'),
                iconName: 'flag',
            });
        }

        if (!hasOnlyOneVersion && isCurrent) {
            options.push({
                name: 'mark-obsolete',
                label: i18n.t('doc-modal-mark-document-obsolete'),
                iconName: 'flag',
            });
        }

        options.push({
            name: 'add',
            label: i18n.t('doc-modal-Add-new-version'),
            iconName: 'plus',
            disabled: !isCurrent && !CabinetFile.DEV_MODE,
        });

        if (showDeleteDocumentButton) {
            options.push({
                name: 'delete',
                label: i18n.t('doc-modal-delete-document'),
                iconName: 'trash',
            });
        }

        if (showDeleteVersionButton) {
            options.push({
                name: 'delete',
                label: i18n.t('doc-modal-delete-version'),
                iconName: 'trash',
            });
        }

        if (showDeleteAllVersionsButton) {
            options.push({
                name: 'delete-all',
                label: i18n.t('doc-modal-delete-all-versions'),
                iconName: 'trash',
            });
        }

        return html`
            <dbp-select
                id="action-dropdown"
                ?disabled=${!file}
                label="${i18n.t('doc-modal-Actions')}"
                .options=${options}
                @change="${(e) => this.handleFileAction(e.detail.value)}"></dbp-select>
        `;
    }

    close() {
        /** @type {FileSource} */
        const fileSource = this.fileSourceRef.value;

        if (fileSource) {
            fileSource.removeAttribute('dialog-open');
        }

        /** @type {Modal} */
        const documentModal = this.documentModalRef.value;

        if (documentModal) {
            documentModal.close();
        }
    }

    onCloseDocumentModal() {
        this.documentPdfValidationErrorList.value.errors = []; // reset error list
        this.documentPdfValidationErrorList.value.errorSummary = null; // reset error summary
        this.uploadFailed = false;
        // If the file was created, updated or deleted, we need to inform the parent component to refresh the search results
        if (this.dataWasChanged) {
            this.dispatchEvent(
                new CustomEvent('DbpCabinetDocumentChanged', {
                    detail: {hit: this.fileHitData},
                    bubbles: true,
                    composed: true,
                }),
            );
        }

        // Prevent the state reset when the document modal is closed if it was closed by
        // the "Replace Document" button
        if (this.allowStateReset) {
            // Reset the state of the component when the modal is closed
            this.initializeState();
        }

        // Send a close event to the parent component
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
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
                        <h3>${this._i18n.t('Document-details-modal')}</h3>
                        <p>
                            <span class="red-marked-asterisk">
                                ${this._i18n.t('required-files-asterisk')}
                            </span>
                            ${this._i18n.t('required-files-text')}
                        </p>
                        ${this.getDocumentTypeSelector()}
                    `;
                } else {
                    return html`
                        <h3>${this._i18n.t('Document-details-modal')}</h3>
                        <p>
                            <span class="red-marked-asterisk">
                                ${this._i18n.t('required-files-asterisk')}
                            </span>
                            ${this._i18n.t('required-files-text')}
                        </p>
                        ${this.getDocumentTypeSelector()} ${this.getDocumentEditFormHtml()}
                    `;
                }
            case CabinetFile.Modes.EDIT:
            case CabinetFile.Modes.NEW_VERSION:
                return html`
                    <h3>${this._i18n.t('Document-details-modal')}</h3>
                    <p>
                        <span class="red-marked-asterisk">
                            ${this._i18n.t('required-files-asterisk')}
                        </span>
                        ${this._i18n.t('required-files-text')}
                    </p>
                    ${this.getDocumentTypeSelector()} ${this.getDocumentEditFormHtml(true)}
                `;
        }
    }

    onDocumentTypeSelected(event) {
        // Split document type into object type and additional type
        const documentType = this._('#document-type').value;
        console.log('onDocumentTypeSelected documentType', documentType);
        const [objectType, additionalType] = documentType.split('---');
        console.log('onDocumentTypeSelected objectType', objectType);
        console.log('onDocumentTypeSelected additionalType', additionalType);

        // Check if the fileHitData is empty, which means we created a new document
        const isFileHitDataEmpty = Object.keys(this.fileHitData).length === 0;

        // Only try to preset data if we are editing an existing document
        if (this.objectType && !isFileHitDataEmpty) {
            // Save the current fileHitData to the cache to keep the data when switching between object types in edit mode
            // In the future there could also be an event on every form element change to save the data to the cache when it changes
            this.fileHitDataCache[this.objectType] = this.fileHitData;

            // Now also reset the fileHitData
            this.fileHitData = {};

            // Preset the hit data for the new object type if possible
            this.presetHitData(objectType);
        } else {
            // Reset the fileHitData so that it can set with default values in the object type modules
            this.fileHitData = {};
        }

        this.objectType = objectType;
        this.additionalType = additionalType;
    }

    /**
     * Presets the hit data for the given object type with data from the previously selected object type if no data is present.
     * @param objectType
     */
    presetHitData(objectType) {
        // Check if the hit data cache is empty for the given object type
        const isHitDataCacheEmpty =
            !this.fileHitDataCache[objectType] || !this.fileHitDataCache[objectType]['@type'];

        console.log('presetHitData isHitDataCacheEmpty', isHitDataCacheEmpty);
        console.log('presetHitData this.fileHitData', this.fileHitData);

        // Return if the hit data cache is not empty for the given object type
        if (!isHitDataCacheEmpty) {
            return;
        }

        // Set the default data for the object type from the objectTypeFormComponents
        this.fileHitDataCache[objectType] =
            this.objectTypeFormComponents[objectType].getDefaultData();
        console.log('presetHitData this.fileHitDataCache before', this.fileHitDataCache);

        // If previous hit data was set, copy the file base data from it
        if (this.fileHitDataCache[this.objectType]?.file?.base) {
            this.fileHitDataCache[objectType].file.base =
                this.fileHitDataCache[this.objectType].file.base;
        }

        console.log('presetHitData this.fileHitDataCache after', this.fileHitDataCache);

        // Then take the preset data from the cache
        this.fileHitData = this.fileHitDataCache[objectType];
    }

    getDocumentTypeSelector() {
        const fileDocumentTypeNames = this.fileDocumentTypeNames;
        const additionalType =
            this.fileHitData?.file?.base?.additionalType?.key || this.additionalType || '';
        const objectType = this.fileHitData.objectType || this.objectType || '';
        const fileDocumentType =
            additionalType !== '' && objectType !== '' ? objectType + '---' + additionalType : '';
        const options = Object.keys(fileDocumentTypeNames).map((key) => {
            return html`
                <option value="${key}" ?selected=${key === fileDocumentType}>
                    ${this._i18n.t(fileDocumentTypeNames[key])}
                </option>
            `;
        });

        if (fileDocumentType === '') {
            options.unshift(html`
                <option value="" selected>-Select document type-</option>
            `);
        }

        return html`
            <fieldset>
                <label>
                    ${this._i18n.t('doc-modal-document-type')}
                    <span class="red-marked-asterisk">
                        ${this._i18n.t('required-files-asterisk')}
                    </span>
                </label>
                <select
                    id="document-type"
                    class="doc-type-edit-view"
                    name="object-type"
                    required
                    @change="${this.onDocumentTypeSelected}">
                    ${options}
                </select>
            </fieldset>
        `;
    }

    render() {
        console.log('-- Render --');

        switch (this.mode) {
            case CabinetFile.Modes.EDIT:
            case CabinetFile.Modes.NEW_VERSION:
            case CabinetFile.Modes.VIEW:
            case CabinetFile.Modes.ADD:
                return this.getHtml();
            default:
                console.error('mode not found', this.mode);
                return html`
                    <dbp-modal ${ref(this.modalRef)} modal-id="view-modal"></dbp-modal>
                `;
        }
    }

    getFileSourceHtml() {
        // Beside in add mode, we need the file source in view mode (for creating new versions)
        // and also in edit mode (for uploading a new file)
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
            ${this.getDocumentModalHtml()} ${this.getFileSourceHtml()}
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
                @dbp-file-sink-dialog-closed="${this.onFileSinkDialogClosed}"></dbp-file-sink>
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
        if (this.mode === CabinetFile.Modes.EDIT || this.mode === CabinetFile.Modes.NEW_VERSION) {
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
                case 'mode':
                    console.log('this.mode changed from', oldValue, 'to', this.mode);
                    break;
                case 'fileHitData':
                    console.log('this.fileHitData changed from', oldValue, 'to', this.fileHitData);
                    this.updateStatus();
                    break;
            }
        });

        super.update(changedProperties);
    }

    addStatusMessageBlock(status, message, extraMessage = '') {
        this.statusMessageBlocks.push({
            status: status,
            message: message,
            extraMessage: extraMessage,
        });
    }

    updateStatus() {
        const i18n = this._i18n;
        this.statusMessageBlocks = [];
        if (!this.fileHitData.base) {
            return;
        }

        const isDeletionDateReached =
            this.fileHitData.file.base.recommendedDeletionTimestamp < Math.floor(Date.now() / 1000);

        // this.addStatusMessageBlock(CabinetFile.Status.WARNING, 'Another message');

        if (this.fileHitData.base.isScheduledForDeletion) {
            this.addStatusMessageBlock(
                CabinetFile.Status.DANGER,
                i18n.t('status-scheduled-for-deletion'),
                this.deleteAtDateTime,
            );
        } else if (isDeletionDateReached || this.currentVersionsCount !== 1) {
            if (isDeletionDateReached) {
                this.addStatusMessageBlock(
                    CabinetFile.Status.WARNING,
                    i18n.t('status-deletion-date-reached'),
                    this.deleteAtDateTime,
                );
            }

            if (this.currentVersionsCount === 0) {
                this.addStatusMessageBlock(CabinetFile.Status.WARNING, i18n.t('status-no-current'));
            } else if (this.currentVersionsCount > 1) {
                this.addStatusMessageBlock(
                    CabinetFile.Status.WARNING,
                    i18n.t('status-too-many-current'),
                );
            }
        } else {
            this.addStatusMessageBlock(CabinetFile.Status.SUCCESS, i18n.t('status-no-problems'));
        }
    }

    async addNewVersion() {
        console.log('addNewVersion');
        this.fileHitData.file.base.fileId = '';
        // this.fileHitData.file.base.isCurrent = true;
        this.mode = CabinetFile.Modes.NEW_VERSION;
        await this.openReplacePdfDialog();
    }

    async markOtherVersionsObsoleteInBlob(groupId, currentIdentifier) {
        if (!groupId) {
            console.warn('markOtherVersionsObsoleteInBlob: No groupId provided');
            return [];
        }

        try {
            // Fetch all current versions in the group from Typesense
            const versions = await this._getTypesenseService().fetchFileDocumentsByGroupId(
                groupId,
                true,
            );

            // Filter out the current version that was just stored
            const otherVersions = versions.filter(
                (version) => version.file?.base?.fileId !== currentIdentifier,
            );

            if (otherVersions.length === 0) {
                console.log(
                    'markOtherVersionsObsoleteInBlob: No other versions to mark as obsolete',
                );
                return [];
            }

            console.log(
                `markOtherVersionsObsoleteInBlob: Marking ${otherVersions.length} versions as obsolete for group ${groupId}`,
            );

            let updatedBlobIds = [];

            // Mark each other version as obsolete
            const updatePromises = otherVersions.map(async (version) => {
                console.log('markOtherVersionsObsoleteInBlob: version', version);
                const versionFileId = version.file?.base?.fileId;
                if (!versionFileId) {
                    console.warn('markOtherVersionsObsoleteInBlob: Version has no fileId', version);
                    return;
                }

                console.log('markOtherVersionsObsoleteInBlob: versionFileId', versionFileId);

                const url = await this.createBlobDownloadUrl(versionFileId);
                console.log('markOtherVersionsObsoleteInBlob url', url);
                let blobItem = await this.loadBlobItem(url);
                console.log('markOtherVersionsObsoleteInBlob blobItem', blobItem);

                if (!blobItem) {
                    console.warn(
                        'markOtherVersionsObsoleteInBlob: No blob item found for fileId',
                        versionFileId,
                    );
                    return;
                }

                console.log('markOtherVersionsObsoleteInBlob: blobItem', blobItem);

                try {
                    // Create a PATCH URL for this specific version
                    const patchUrl = await this.createBlobUrl(
                        CabinetFile.BlobUrlTypes.UPLOAD,
                        versionFileId,
                    );
                    // const patchUrl = await this.createBlobUploadUrl();

                    // Prepare metadata to mark as obsolete
                    // const obsoleteMetadata = {
                    //     isCurrent: false
                    // };
                    let obsoleteMetadata = JSON.parse(blobItem.metadata);
                    obsoleteMetadata.isCurrent = false;

                    console.log(
                        'markOtherVersionsObsoleteInBlob: obsoleteMetadata',
                        obsoleteMetadata,
                    );

                    const formData = new FormData();
                    formData.append('metadata', JSON.stringify(obsoleteMetadata));
                    formData.append('prefix', this.blobDocumentPrefix);

                    const options = {
                        method: 'PATCH',
                        headers: {
                            Authorization: 'Bearer ' + this.auth.token,
                        },
                        body: formData,
                    };

                    const response = await fetch(patchUrl, options);
                    if (!response.ok) {
                        console.error(
                            `markOtherVersionsObsoleteInBlob: Failed to mark version ${versionFileId} as obsolete:`,
                            response.status,
                            response.statusText,
                        );
                        return;
                    }

                    updatedBlobIds.push(versionFileId);

                    console.log(
                        `markOtherVersionsObsoleteInBlob: Successfully marked version ${versionFileId} as obsolete`,
                    );
                } catch (error) {
                    console.error(
                        `markOtherVersionsObsoleteInBlob: Error marking version ${versionFileId} as obsolete:`,
                        error,
                    );
                }
            });

            // Wait for all updates to complete
            await Promise.allSettled(updatePromises);

            return updatedBlobIds;
        } catch (error) {
            console.error(
                'markOtherVersionsObsoleteInBlob: Error fetching versions from Typesense:',
                error,
            );
            // Don't throw the error as this is not critical for the main flow
        }
    }

    /**
     * Waits until versions from updatedBlobIds are updated in Typesense with isCurrent set to false
     * @param {Array<string>} updatedBlobIds - Array of blob IDs that were marked as obsolete
     * @param {number} increment - Current attempt counter (used for recursion)
     * @returns {Promise<void>}
     */
    async waitForVersionsUpdatedInTypesense(updatedBlobIds, increment = 0) {
        // Stop after 10 attempts
        if (increment >= 10) {
            console.warn(
                'waitForVersionsUpdatedInTypesense: Could not verify all versions were updated in Typesense after 10 attempts',
            );
            this.documentModalNotification(
                'Warning',
                'Some document versions may not be immediately updated. Please refresh if needed.',
                'warning',
            );
            return;
        }

        if (!updatedBlobIds || updatedBlobIds.length === 0) {
            return;
        }

        console.log(
            `waitForVersionsUpdatedInTypesense: Checking ${updatedBlobIds.length} versions (attempt ${increment + 1})`,
        );

        try {
            // Check each updated blob ID to see if it's been updated in Typesense
            const checkPromises = updatedBlobIds.map(async (blobId) => {
                try {
                    const item =
                        await this._getTypesenseService().fetchFileDocumentByBlobId(blobId);

                    // If the item exists and isCurrent is false, it has been updated
                    if (item && item.base?.isCurrent === false) {
                        return {blobId, updated: true};
                    }

                    return {blobId, updated: false};
                } catch (error) {
                    // If we can't fetch the item, assume it's not updated yet
                    console.log(
                        `waitForVersionsUpdatedInTypesense: Could not fetch ${blobId}:`,
                        error,
                    );
                    return {blobId, updated: false};
                }
            });

            const results = await Promise.all(checkPromises);
            const notUpdatedYet = results.filter((result) => !result.updated);

            // If all versions have been updated, we're done
            if (notUpdatedYet.length === 0) {
                console.log(
                    'waitForVersionsUpdatedInTypesense: All versions have been updated in Typesense',
                );
                return;
            }

            console.log(
                `waitForVersionsUpdatedInTypesense: ${notUpdatedYet.length} versions still not updated, waiting...`,
            );
        } catch (error) {
            console.error('waitForVersionsUpdatedInTypesense: Error checking versions:', error);
        }

        // Wait for a second before trying again
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try again with incremented counter
        await this.waitForVersionsUpdatedInTypesense(updatedBlobIds, increment + 1);
    }

    /**
     * Waits until versions from deletedFileIds are updated in Typesense with isScheduledForDeletion set to true
     * @param {Array<string>} deletedFileIds - Array of file IDs that were marked for deletion
     * @param {number} increment - Current attempt counter (used for recursion)
     * @returns {Promise<void>}
     */
    async waitForVersionsDeletionUpdatedInTypesense(deletedFileIds, increment = 0) {
        // Stop after 10 attempts
        if (increment >= 10) {
            console.warn(
                'waitForVersionsDeletionUpdatedInTypesense: Could not verify all versions were updated in Typesense after 10 attempts',
            );
            this.documentModalNotification(
                'Warning',
                'Some document versions may not be immediately updated. Please refresh if needed.',
                'warning',
            );
            return;
        }

        if (!deletedFileIds || deletedFileIds.length === 0) {
            return;
        }

        console.log(
            `waitForVersionsDeletionUpdatedInTypesense: Checking ${deletedFileIds.length} deleted versions (attempt ${increment + 1})`,
        );

        try {
            // Check each deleted file ID to see if it's been updated in Typesense
            const checkPromises = deletedFileIds.map(async (fileId) => {
                try {
                    const item =
                        await this._getTypesenseService().fetchFileDocumentByBlobId(fileId);

                    // If the item exists and isScheduledForDeletion is true, it has been updated
                    if (item && item.base?.isScheduledForDeletion === true) {
                        return {fileId, updated: true};
                    }

                    return {fileId, updated: false};
                } catch (error) {
                    // If we can't fetch the item, assume it's not updated yet
                    console.log(
                        `waitForVersionsDeletionUpdatedInTypesense: Could not fetch ${fileId}:`,
                        error,
                    );
                    return {fileId, updated: false};
                }
            });

            const results = await Promise.all(checkPromises);
            const notUpdatedYet = results.filter((result) => !result.updated);

            // If all versions have been updated, we're done
            if (notUpdatedYet.length === 0) {
                console.log(
                    'waitForVersionsDeletionUpdatedInTypesense: All deleted versions have been updated in Typesense',
                );
                return;
            }

            console.log(
                `waitForVersionsDeletionUpdatedInTypesense: ${notUpdatedYet.length} versions still not updated, waiting...`,
            );
        } catch (error) {
            console.error(
                'waitForVersionsDeletionUpdatedInTypesense: Error checking versions:',
                error,
            );
        }

        // Wait for a second before trying again
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Try again with incremented counter
        await this.waitForVersionsDeletionUpdatedInTypesense(deletedFileIds, increment + 1);
    }

    async handleDeleteAllVersions() {
        try {
            // Fetch all versions
            const allVersions = await this.fetchGroupedHits();

            // Filter out versions that are already marked for deletion
            const versionsToDelete = allVersions.filter(
                (version) => !version.base?.isScheduledForDeletion,
            );

            console.log(
                `handleDeleteAllVersions: Found ${versionsToDelete.length} versions to delete`,
            );

            if (versionsToDelete.length === 0) {
                this.documentModalNotification(
                    'Info',
                    'All versions are already scheduled for deletion.',
                    'info',
                );
                return;
            }

            // Collect fileIds for tracking
            const deletedFileIds = [];

            // Delete them with doFileDeletionForFileId
            for (const version of versionsToDelete) {
                const fileId = version.file?.base?.fileId;
                if (fileId) {
                    console.log(`handleDeleteAllVersions: Deleting version with fileId: ${fileId}`);
                    await this.doFileDeletionForFileId(fileId);
                    deletedFileIds.push(fileId);
                } else {
                    console.warn(
                        'handleDeleteAllVersions: Version has no fileId, skipping:',
                        version,
                    );
                }
            }

            console.log('handleDeleteAllVersions: All versions have been marked for deletion');

            // Wait until all deleted versions are properly updated in Typesense
            if (deletedFileIds.length > 0) {
                await this.waitForVersionsDeletionUpdatedInTypesense(deletedFileIds);
            }

            // Refetch and set current hit data
            const currentHitId = this.fileHitData?.id;
            if (currentHitId) {
                console.log('handleDeleteAllVersions: Refetching current hit data to update UI');
                try {
                    const updatedHit = await this._getTypesenseService().fetchItem(currentHitId);
                    if (updatedHit) {
                        this.fileHitData = updatedHit;
                    }
                } catch (error) {
                    console.warn(
                        'handleDeleteAllVersions: Could not refetch current hit data:',
                        error,
                    );
                    // Don't fail the entire operation if we can't refetch - the deletion was successful
                }
            }

            // Show success notification to user
            this.documentModalNotification(
                'Success',
                `Successfully deleted ${versionsToDelete.length} version${versionsToDelete.length === 1 ? '' : 's'}. All versions have been scheduled for deletion.`,
                'success',
            );
        } catch (error) {
            console.error('handleDeleteAllVersions: Error deleting versions:', error);
            this.documentModalNotification(
                'Error',
                'Failed to delete all versions. Please try again.',
                'danger',
            );
        }
    }

    renderStatusBadge() {
        if (this.statusMessageBlocks.length === 0) {
            return null;
        }

        return html`
            <div class="status-badge">
                <ul>
                    ${this.statusMessageBlocks.map(
                        (block) => html`
                            <li class="${block.status}">
                                <span class="message">${block.message}</span>
                                ${block.extraMessage
                                    ? html`
                                          <span class="extra-message">| ${block.extraMessage}</span>
                                      `
                                    : ''}
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }
}
