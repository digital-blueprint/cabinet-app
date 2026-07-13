import {css, html, unsafeCSS} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {AuthMixin, LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {
    Button,
    Icon,
    Modal,
    DBPSelect,
    ScopedElementsMixin,
    sendNotification,
    getIconSVGURL,
} from '@dbp-toolkit/common';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {FileSink, FileSource} from '@dbp-toolkit/file-handling';
import {PdfViewer} from '@dbp-toolkit/pdf-viewer';
import {pascalToKebab} from '../utils';
import {classMap} from 'lit/directives/class-map.js';
import {formatDate} from '../utils.js';
import {CabinetDocumentStore} from '../document-store.js';
import {
    scopedElements as modalNotificationScopedElements,
    sendModalNotification,
} from './modal-notification.js';
import {createUUID} from '@dbp-toolkit/common/utils';
import {PdfValidationErrorList} from './pdf-validation-error-list.js';
import {ApiError} from '../api.js';
import {createInstance} from '../i18n.js';

const getFieldsetCSS = () => {
    // language=css
    return css`
        fieldset {
            border: none;
            margin: 15px 0;
            padding: 0;
        }

        fieldset label {
            font-weight: bold;
            display: block;
        }

        fieldset input,
        fieldset select,
        fieldset textarea {
            width: 95%;
        }
    `;
};

export class CabinetFile extends ScopedElementsMixin(
    LangMixin(AuthMixin(DBPLitElement), createInstance),
) {
    // Always allow creating new versions if true
    static DEV_MODE = false;

    static Modes = {
        VIEW: 'view',
        EDIT: 'edit',
        NEW_VERSION: 'new-version',
        ADD: 'add',
        CLOSED: 'closed',
    };

    static States = {
        NONE: 'none',
        LOADING_FILE: 'loading-file',
        LOADING_FILE_FAILED: 'loading-file-failed',
        FILE_LOADED: 'file-loaded',
    };

    static Status = {
        SUCCESS: 'success',
        WARNING: 'warning',
        DANGER: 'danger',
    };

    constructor() {
        super();
        this.entryPointUrl = '';
        this.objectTypes = {};
        this.documentModalRef = createRef();
        this.documentPdfViewerRef = createRef();
        this.documentPdfValidationErrorList = createRef();
        this.modalRef = createRef();
        this.fileSourceRef = createRef();
        this.fileSinkRef = createRef();
        this.formRef = createRef();
        this.uploadFailed = false;
        // Initialize the state in the beginning
        this.resetState();
    }

    _getDocumentStore() {
        return new CabinetDocumentStore(this);
    }

    /**
     * Initializes the state of the component, so less stuff can go on in the background
     * when the modal is closed
     * This is important so when the dialog is opened again, the state is clean and no
     * old data is shown by accident
     */
    resetState() {
        this.person = {};
        this.documentFile = null;
        this.objectType = null;
        this.additionalType = null;
        this.mode = CabinetFile.Modes.CLOSED;
        this.fileHitData = null;
        this.fileHitDataCache = {};
        this.isFileDirty = false;
        this.statusMessageBlocks = [];
        this.deleteAtDateTime = '';
        this.state = CabinetFile.States.NONE;
        this.versions = [];
        this.versionsLoaded = false;

        // Will be used when canceling the form in EDIT mode, when the data was changed via this.fileHitDataCache
        this.fileHitDataBackup = null;
        this.fileHitDataCache = {};
    }

    connectedCallback() {
        super.connectedCallback();
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
            nextcloudWebAppPasswordURL: {type: String, attribute: 'nextcloud-web-app-password-url'},
            nextcloudWebDavURL: {type: String, attribute: 'nextcloud-webdav-url'},
            nextcloudName: {type: String, attribute: 'nextcloud-name'},
            nextcloudFileURL: {type: String, attribute: 'nextcloud-file-url'},
            nextcloudAuthInfo: {type: String, attribute: 'nextcloud-auth-info'},
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            fileHandlingEnabledTargets: {type: String, attribute: 'file-handling-enabled-targets'},
            person: {type: Object, attribute: false},
            fileHitData: {type: Object, attribute: false},
            versions: {type: Array, attribute: false},
            documentFile: {type: File, attribute: false},
            objectType: {type: String, attribute: false},
            additionalType: {type: String, attribute: false},
            deleteAtDateTime: {type: String, attribute: false},
            state: {type: String, attribute: false},
            mode: {type: String},
            cabinetConfig: {type: Object, attribute: false},
        };
    }

    setObjectTypes(objectTypes) {
        this.objectTypes = objectTypes;
    }

    async _storeDocumentToBlob(metaData) {
        // Either a valid existing blob id or null; null means "no blob yet".
        const blobId = this.fileHitData?.file?.base?.fileId ?? null;

        // A missing blobId means there is no existing blob yet, so we are adding
        // a brand new document. Two cases produce this: a fresh "add" (where
        // fileHitData is null) and a "new version" (where fileHitData is kept so
        // the new blob reuses the existing groupId). Otherwise fileHitData holds
        // an existing blob and we are updating it in place.
        const isNewDocument = blobId === null;

        metaData['@type'] = 'DocumentFile';
        metaData['fileSource'] = 'blob-cabinetBucket';
        metaData['objectType'] = this.objectType;
        // A new document is always current; an update keeps its current flag.
        metaData['isCurrent'] = isNewDocument || (this.fileHitData?.base?.isCurrent ?? false);
        metaData['lastModifiedBy'] = this.auth['user-id'];
        // A fresh add starts a new group; a new version and updates reuse the
        // existing one.
        metaData['groupId'] = this.fileHitData?.file?.base?.groupId || createUUID();

        const type = this.objectTypes[this.objectType].getBlobType();
        // Only upload the file data again if it actually changed.
        const file = this.isFileDirty ? this.documentFile : null;
        const store = this._getDocumentStore();

        // Store the document to Blob and wait until it has propagated into the
        // Typesense search index. The store owns both the write and the polling.
        let blob, item;
        try {
            if (isNewDocument) {
                // Add: create a new blob and wait until it shows up in the index.
                ({blob, item} = await store.addDocument({type, metadata: metaData, file}));
            } else {
                // Update: patch the existing blob and wait until the index
                // reflects a newer modification timestamp than before. Captured
                // up front so the poll compares against a stable value.
                const previousModifiedTimestamp = this.fileHitData.file.base.modifiedTimestamp;
                ({blob, item} = await store.updateDocument(blobId, {
                    type,
                    metadata: metaData,
                    file,
                    previousModifiedTimestamp,
                }));
            }
        } catch (error) {
            if (error instanceof ApiError) {
                // The upload itself failed; show the specific validation UI.
                this._handleUploadApiError(error);
                throw error;
            }

            // Everything else is a failure while polling Typesense for the
            // stored document to show up in the search index.
            this.documentModalNotification(
                this._i18n.t('cabinet-file.notification-title-fetch-failed'),
                this._i18n.t('cabinet-file.notification-body-fetch-failed'),
                'danger',
            );

            // A real fetch error.
            // The save button will still be disabled and has a spinner, enabling it
            // again doesn't make a lot of sense, because the document was already
            // stored to Blob and we are in a failed state
            // TODO: Is there something else we should do here?
            this.state = CabinetFile.States.LOADING_FILE_FAILED;

            return;
        }

        // If the document is current, mark all other versions as obsolete in
        // Blob (this also waits for Typesense to sync).
        if (item.base?.isCurrent) {
            await store.markOtherVersionsObsolete(
                item.file.base.groupId,
                blob.identifier,
                this.auth['user-id'],
            );
        }

        // Bail out if the modal was closed while the upload was in flight.
        /** @type {Modal} */
        const modal = this.documentModalRef.value;
        if (!modal.isOpen()) {
            return;
        }

        this.isFileDirty = false;

        this.fileHitData = item;
        this.mode = CabinetFile.Modes.VIEW;
        await this.updateVersions();

        this.documentModalNotification(
            this._i18n.t('cabinet-file.notification-title-stored'),
            this._i18n.t('cabinet-file.notification-body-stored'),
            'success',
        );

        // Update URL, especially if a new version was created
        this.sendSetPropertyEvent(
            'routing-url',
            `/document/${encodeURIComponent(this.fileHitData.id)}`,
            true,
        );
    }

    /**
     * Show the appropriate validation UI for an {@link ApiError} raised while
     * uploading a document to Blob storage.
     * @param {ApiError} error
     */
    _handleUploadApiError(error) {
        // if document is too big
        if (error.errorId === 'verity:create-report-backend-exception') {
            this.documentPdfValidationErrorList.value.errors = [error.detail];
            this.documentPdfValidationErrorList.value.errorSummary = this._i18n.t(
                'cabinet-file.document-upload-failed-pdfa-too-big-summary',
            );
        }
        // if document is not in a valid PDF/A format
        if (error.errorId?.includes('-file-data-file-does-not-validate-against-type')) {
            this.documentPdfValidationErrorList.value.errors = error.errorDetails;
        }

        this.uploadFailed = true;
        if (this.shadowRoot.querySelector('.status-badge')) {
            this.shadowRoot.querySelector('.status-badge').classList.add('hidden');
        }
        this.requestUpdate();
    }
    async scrollDocumentModalToTop() {
        await this.updateComplete;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const modal = this.documentModalRef.value;
        if (!modal) {
            return;
        }

        const candidates = [
            modal.shadowRoot?.querySelector('.content'),
            modal.shadowRoot?.querySelector('.modal-content'),
            this.shadowRoot?.querySelector('#document-modal .content'),
            modal,
        ].filter(Boolean);

        const scrollTarget = candidates.find((el) => el.scrollHeight > el.clientHeight) || modal;
        scrollTarget.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    async handleDocumentAddSave(event) {
        const data = event.detail;

        try {
            await this._storeDocumentToBlob(data.formData);
        } finally {
            await this.scrollDocumentModalToTop();
        }
    }

    async handleDocumentFormCancel(event) {
        if (this.mode === CabinetFile.Modes.ADD) {
            this.objectType = null;
        } else {
            this.fileHitData = this.fileHitDataBackup;
            this.fileHitDataCache = {};
            this.objectType = this.fileHitData.objectType;
            this.mode = CabinetFile.Modes.VIEW;
        }

        await this.updateComplete;
        await this.scrollDocumentModalToTop();
    }

    getDocumentEditFormHtml(useFileHitDataCache = false) {
        const objectType = this.objectType;

        if (!objectType) {
            return html``;
        }

        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-edit-form-' + tagPart;

        let formComponent = this.objectTypes[objectType].getFormComponent();
        if (!this.registry.get(tagName)) {
            this.registry.define(tagName, formComponent);
        }

        let fileHitData = this.fileHitData;

        // In edit mode we want to use the fileHitDataCache to keep the data when switching between object types
        if (useFileHitDataCache && this.fileHitDataCache[objectType]) {
            fileHitData = this.fileHitDataCache[objectType];
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "fileHitData" property from a variable too!
        return staticHtml`
            <${unsafeStatic(tagName)}
             ${ref(this.formRef)}
             id="edit-form"
             subscribe="auth,lang,entry-point-url"
             .data=${fileHitData || {}}
             .person=${this.person}
             .additionalType=${this.additionalType}
             .saveButtonEnabled=${!this.uploadFailed}
             @DbpCabinetDocumentFormCancel=${(event) => {
                 void this.handleDocumentFormCancel(event);
             }}
             @DbpCabinetDocumentAddSave=${(event) => {
                 void this.handleDocumentAddSave(event);
             }}
             object-type=></${unsafeStatic(tagName)}>
        `;
    }

    getDocumentViewFormHtml() {
        const objectType = this.objectType;

        if (!objectType) {
            return html`
                <dbp-mini-spinner></dbp-mini-spinner>
            `;
        }

        const hit = this.fileHitData;
        const id = hit.id;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-view-' + tagPart;

        let viewComponent = this.objectTypes[objectType].getViewComponent();
        if (!this.registry.get(tagName)) {
            this.registry.define(tagName, viewComponent);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <h3>${this._i18n.t('Document-details-modal')}</h3>
            <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-view-${id}" subscribe="lang,auth,entry-point-url" .data=${hit}></${unsafeStatic(tagName)}>
        `;
    }

    async openDocumentAddDialogWithPersonHit(hit = null) {
        this.mode = CabinetFile.Modes.ADD;
        // We don't need to fetch the hit data from Typesense again, because the identNrObfuscated wouldn't change
        this.person = hit.person;
        await this.updateComplete;
        await this.openDocumentAddDialog();
    }

    /**
     * Since we are loading the document from typesense we don't need a hit object
     * @param id
     * @returns {Promise<void>}
     */
    async openViewDialogWithFileId(id) {
        // Hacky: otherwise vesion change triggers two loads
        if (this.mode == CabinetFile.Modes.VIEW && id === this.fileHitData?.id) {
            return;
        }
        let hit = await this._getDocumentStore().fetchItem(id);
        if (hit !== null) {
            return this.openViewDialogWithFileHit(hit);
        }
    }

    async openViewDialogWithFileHit(hit) {
        this.sendSetPropertyEvent('routing-url', `/document/${encodeURIComponent(hit.id)}`, true);
        const i18n = this._i18n;
        this.resetState();
        this.mode = CabinetFile.Modes.VIEW;
        this.fileHitData = hit;

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
        if (!modal.isOpen()) {
            modal.open();
        }

        this.state = CabinetFile.States.LOADING_FILE;

        if (!this.fileHitData) {
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
                const file = await this._getDocumentStore().downloadFile(
                    this.fileHitData.file.base.fileId,
                );
                this.state = CabinetFile.States.FILE_LOADED;

                // We need to set the documentFile, so that the PDF viewer will be rendered again
                this.documentFile = file;
                await this.updateComplete;

                // Show the PDF in the PDF viewer after it was rendered
                await this.showPdf(file);

                // We need to wait until rendering is complete after this.documentFile has changed
                await this.updateComplete;
            } catch {
                this.documentModalNotification(
                    this._i18n.t('cabinet-file.notification-title-file-load-failed'),
                    this._i18n.t('cabinet-file.notification-body-file-load-failed'),
                    'danger',
                );
                this.state = CabinetFile.States.LOADING_FILE_FAILED;
            }
        }
    }

    async editFile() {
        this.mode = CabinetFile.Modes.EDIT;
        this.fileHitDataBackup = structuredClone(this.fileHitData);
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
     * @param {string} fileId - The blob file id
     * @param {boolean} [enable]
     * @returns {Promise<void>}
     */
    async setIsCurrentVersion(fileId, enable = true) {
        const i18n = this._i18n;

        let document;
        try {
            document = await this._getDocumentStore().setVersionCurrent(
                fileId,
                enable,
                this.auth['user-id'],
            );
        } catch (error) {
            console.error('setIsCurrentVersion: Failed to update version', error);
            this.documentModalNotification(
                i18n.t('cabinet-file.notification-title-version-update-failed'),
                enable
                    ? i18n.t('cabinet-file.notification-body-version-mark-current-failed')
                    : i18n.t('cabinet-file.notification-body-version-mark-obsolete-failed'),
                'danger',
            );
            return;
        }

        // Adopt the propagated document as the current state.
        this.fileHitData = document;
        this.mode = CabinetFile.Modes.VIEW;
        await this.updateVersions();

        this.documentModalNotification(
            i18n.t('cabinet-file.notification-title-version-updated'),
            enable
                ? i18n.t('cabinet-file.notification-body-version-marked-current')
                : i18n.t('cabinet-file.notification-body-version-marked-obsolete'),
            'success',
        );
    }

    /**
     * Deletes/Undeletes a file from the blob storage
     * @param undelete Whether to undelete the file
     * @returns {Promise<void>}
     */
    async handleFileDeletion(undelete = false) {
        const i18n = this._i18n;
        const fileId = this.fileHitData.file.base.fileId;
        const data = undelete ? await this.restoreFile(fileId) : await this.softDeleteFile(fileId);
        let success = false;

        if (undelete) {
            // Check if the document was marked as undeleted in the response
            if (data.deleteAt === null) {
                this.documentModalNotification(
                    i18n.t('cabinet-file.notification-title-undeleted'),
                    i18n.t('cabinet-file.notification-body-undeleted'),
                    'success',
                );
                this.deleteAtDateTime = '';
                success = true;
            } else {
                this.documentModalNotification(
                    i18n.t('cabinet-file.notification-title-undelete-failed'),
                    i18n.t('cabinet-file.notification-body-undelete-failed'),
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
                    i18n.t('cabinet-file.notification-title-deletion-failed'),
                    i18n.t('cabinet-file.notification-body-deletion-failed'),
                    'danger',
                );
            }
        }

        // Switch delete/undelete buttons if the operation was successful
        if (success) {
            // Mark the file as deleted/undeleted in the fileHitData
            this.fileHitData.base.isScheduledForDeletion = !undelete;
            // Update status manually, because we didn't trigger a this.fileHitData change
            this.updateStatus();

            // We need to request an update to re-render the view, because we only changed a property
            await this.requestUpdate();
        }
    }

    /**
     * Soft-delete a file by ID, showing an error notification on failure
     * @param {string} fileId - The file identifier
     * @returns {Promise<object>} - The response data
     */
    async softDeleteFile(fileId) {
        return this._setFileDeletion(fileId, false);
    }

    /**
     * Restore a soft-deleted file by ID, showing an error notification on failure
     * @param {string} fileId - The file identifier
     * @returns {Promise<object>} - The response data
     */
    async restoreFile(fileId) {
        return this._setFileDeletion(fileId, true);
    }

    async _setFileDeletion(fileId, undelete = false) {
        const store = this._getDocumentStore();

        try {
            return undelete ? await store.restore(fileId) : await store.softDelete(fileId);
        } catch (error) {
            if (undelete) {
                this.documentModalNotification(
                    this._i18n.t('cabinet-file.notification-title-undelete-failed'),
                    this._i18n.t('cabinet-file.notification-body-undelete-exception'),
                    'danger',
                );
            } else {
                this.documentModalNotification(
                    this._i18n.t('cabinet-file.notification-title-deletion-failed'),
                    this._i18n.t('cabinet-file.notification-body-deletion-exception'),
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

        let files = [];

        if (selectorValue !== 'document-file-only') {
            const file = new File([JSON.stringify(this.fileHitData, null, 2)], 'metadata.json', {
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

        const fileId = this.fileHitData?.file?.base?.fileId ?? null;

        try {
            switch (action) {
                case 'add':
                    await this.addNewVersion();
                    break;
                case 'edit':
                    await this.editFile();
                    break;
                case 'mark-current':
                case 'mark-obsolete':
                    if (fileId === null) {
                        console.error('handleFileAction: No fileId set for', action);
                        break;
                    }
                    await this.setIsCurrentVersion(fileId, action === 'mark-current');
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
            if (fromSelect) {
                evOrAction.currentTarget.selectedIndex = 0;
                evOrAction.currentTarget.value = '';
                evOrAction.currentTarget.blur?.();
            }
        }
    }

    async openReplacePdfDialog() {
        // Enable the save button again in the form if upload failed previously
        if (this.uploadFailed) {
            const form = this.formRef.value;

            if (form?.enableSaveButton) {
                form.enableSaveButton();
            }

            this.uploadFailed = false;
        }

        await this.openDocumentAddDialog(false);
    }
    async openDocumentAddDialog(resetObjectType = true) {
        if (resetObjectType) {
            this.objectType = null;
            this.fileHitData = null;
        }

        this.isFileDirty = false;

        /** @type {FileSource} */
        const fileSource = this.fileSourceRef.value;

        // Wait until the file source dialog is ready
        if (!fileSource) {
            await this.updateComplete;
        }

        // Open the file source dialog on top of the document modal (native dialogs stack)
        fileSource.setAttribute('dialog-open', '');
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            commonStyles.getButtonCSS(),
            commonStyles.getRadioAndCheckboxCss(),
            getFieldsetCSS(),

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
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    gap: 10px 10px;
                    grid-auto-flow: row;
                    padding-right: 0.5em;
                }

                #document-modal .description {
                    grid-area: 1 / 1 / 2 / 2;
                }
                .modal-notification {
                    --dbp-notification-max-width: 40rem;
                }

                #document-modal .doc-title {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-start;
                }
                #document-modal h3 {
                    margin: 0;
                }
                .doc-title h2 {
                    margin: 0;
                    font-weight: bold;
                }

                #document-modal .view-modal-icon {
                    color: var(--dbp-accent);
                    width: 25px;
                    height: 25px;
                    padding-right: 0.5em;
                }

                #document-modal .student-info {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    justify-content: flex-start;
                    padding-bottom: 10px;
                }

                #document-modal .status {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-evenly;
                    align-items: flex-end;
                }
                .desc-stat,
                .form,
                .pdf-preview {
                    grid-column: 1 / -1;
                    min-width: 0;
                }

                #document-modal .description,
                #document-modal .status,
                #document-modal .fileButtons {
                    min-width: 0;
                }

                #document-modal .description {
                    overflow-wrap: anywhere;
                    word-break: break-word;
                }

                #document-modal .desc-stat {
                    display: flex;
                    flex-direction: row;
                    align-items: end;
                    justify-content: space-between;
                    padding-bottom: 15px;
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
                    text-wrap-mode: nowrap;
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
                    flex-wrap: wrap;
                }

                #document-modal .fileButtons > * {
                    max-width: 100%;
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

                .select-wrapper-doc-type select {
                    background: none;
                }

                :host(:not([multiple])) .select-wrapper-doc-type {
                    width: 100%;
                    position: relative;
                    display: inline-block;
                }

                :host(:not([multiple])) .select-wrapper-doc-type select {
                    appearance: none;
                    padding-right: 1em;
                }

                :host(:not([multiple])) .select-wrapper-doc-type::after {
                    content: '';
                    position: absolute;
                    transform: translateY(-50%);
                    top: 50%;
                    right: 0.5rem;
                    width: 1em;
                    height: 1em;
                    pointer-events: none;
                    background-color: var(--select-wrapper-icon-color, currentColor);
                    mask: url('${unsafeCSS(getIconSVGURL('chevron-down'))}') center/contain
                        no-repeat;
                    -webkit-mask: url('${unsafeCSS(getIconSVGURL('chevron-down'))}') center/contain
                        no-repeat;
                }

                #document-modal .doc-type-edit-view {
                    padding: 0.14rem 1rem 0.14rem 0.14rem;
                    width: calc(100% - 1.2em);
                    background-color: var(--dbp-background);
                }

                .grouping-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .grouping-container h3 {
                    margin: 0;
                }

                @media (max-width: 1100px) {
                    #document-modal .content {
                        grid-template-columns: 1fr;
                    }

                    #document-modal .pdf-preview {
                        grid-area: auto;
                        grid-column: 1 / -1;
                    }

                    #document-modal .form {
                        grid-area: auto;
                        grid-column: 1 / -1;
                        padding-left: 0;
                    }

                    .grouping-container {
                        flex-direction: column;
                        align-items: normal;
                    }
                }

                @media (min-width: 490px) and (max-width: 768px) {
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
                    #document-modal .form {
                        padding-left: 0;
                    }
                    #document-modal .description {
                        flex-wrap: wrap;
                    }

                    #document-modal .status {
                        align-items: flex-start;
                    }
                    #document-modal ul {
                        padding: 10px 15px;
                    }
                    #document-modal dbp-select.actions-dropdown-doc-edit {
                        --dbp-select-menu-left: 0;
                        --dbp-select-menu-right: auto;
                    }
                    #document-modal dbp-select.download-dropdown {
                        --dbp-select-menu-left: 0;
                        --dbp-select-menu-right: auto;
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
                    #document-modal .form {
                        padding-left: 0;
                    }
                    #document-modal .description {
                        flex-wrap: wrap;
                    }
                    #document-modal dbp-select.download-dropdown {
                        --dbp-select-menu-left: auto;
                        --dbp-select-menu-right: 0;
                    }
                    #document-modal dbp-select.actions-dropdown-doc-edit {
                        --dbp-select-menu-left: 0;
                        --dbp-select-menu-right: auto;
                    }
                    #document-modal .status {
                        align-items: flex-start;
                    }
                    #document-modal ul {
                        padding: 10px 15px;
                    }
                }

                @media (max-width: 290px) {
                    #document-modal dbp-select.actions-dropdown-doc-edit {
                        --dbp-select-menu-left: auto;
                        --dbp-select-menu-right: 0;
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

    async fetchCurrentVersions() {
        if (this.fileHitData === null) {
            return [];
        }
        const groupId = this.fileHitData.file.base.groupId;

        if (!groupId) {
            // If there was no groupId set, return the current hit
            return [this.fileHitData];
        }

        let versions = [];
        try {
            // Could throw an exception if there was another error than 404
            versions = [
                ...(await this._getDocumentStore().fetchVersions(groupId, {
                    sortSpec: this.cabinetConfig.getSortSpec(this.lang),
                })),
            ];
        } catch (error) {
            console.error(error);
            this.documentModalNotification(
                this._i18n.t('cabinet-file.notification-title-versions-load-failed'),
                this._i18n.t('cabinet-file.notification-body-versions-load-failed'),
                'danger',
            );
        }
        return versions;
    }

    async updateVersions() {
        this.versions = await this.fetchCurrentVersions();
        this.versionsLoaded = true;
    }

    async updateCurrent() {
        if (this.fileHitData !== null) {
            this.fileHitData = await this._getDocumentStore().fetchItem(this.fileHitData.id);
        }
    }

    renderGroupingContainer() {
        const i18n = this._i18n;
        // Only show the grouping container in view mode if there are multiple versions
        if (this.mode !== CabinetFile.Modes.VIEW || this.versions.length <= 1) {
            return html``;
        }

        return html`
            <div class="grouping-container">
                <div class="version-select-label">${i18n.t('doc-modal-select-version')} :</div>
                ${this.renderVersionsSelector()}
            </div>
        `;
    }

    renderVersionsSelector() {
        if (!Array.isArray(this.versions)) {
            return html``;
        }
        const i18n = this._i18n;
        // Show dates like this:
        // 01.05.2025 08:00:00, modified 02.05.2025 09:13:45 (current)
        // 05.04.2023 08:45:00, modified 12.11.20223 (obsolete)
        // 31.01.2022 12:35:04 (obsolete)
        const versionOptions = this.versions.map((item) => {
            const isModified = item.file.base.modifiedTimestamp !== item.file.base.createdTimestamp;
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
                ? ', ' +
                  i18n.t('cabinet-file.version-modified') +
                  ' ' +
                  new Date(item.file.base.modifiedTimestamp * 1000)
                      .toLocaleString('de-DE', modifiedDateOptions)
                      .replace(',', '')
                : '';

            const status = isCurrent
                ? i18n.t('cabinet-file.version-status-current')
                : i18n.t('cabinet-file.version-status-obsolete');

            return {
                value: item.id,
                label: html`
                    <span>
                        <strong>${createdDate}</strong>
                        <span style="font-weight: normal;">${modifiedText} (${status})</span>
                    </span>
                `,
            };
        });
        const selectedOption =
            versionOptions.find((option) => option.value === this.selectedVersionId) ||
            versionOptions.find((option) => option.value === this.fileHitData?.id) ||
            versionOptions[0];
        return html`
            <dbp-select
                id="version-select"
                .value=${selectedOption?.value ?? ''}
                .label=${selectedOption?.label ?? i18n.t('doc-modal-select-version')}
                .options=${versionOptions}
                class="select-version"
                align="left"
                wrap-label
                @change=${this.onChangeVersion}></dbp-select>
        `;
    }

    async onChangeVersion(e) {
        this.selectedVersionId = e.detail.value;
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        const hit = this.versions.find((item) => item.id === selectorValue);

        if (!hit) {
            return;
        }

        await this.openViewDialogWithFileHit(hit);
    }

    _getAdditionalTypeName(additionalTypeKey) {
        for (const objectType of Object.values(this.objectTypes)) {
            let types = objectType.getAdditionalTypes(this.lang);
            if (types[additionalTypeKey]) {
                return types[additionalTypeKey];
            }
        }
        return '';
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getDocumentModalHtml() {
        const hit = this.fileHitData;
        const person = this.person;

        // Keep in mind that this.documentFile will be null until the file is loaded by openViewDialogWithFileHit
        let file = this.documentFile;
        const i18n = this._i18n;

        let headline;
        if (this.mode === CabinetFile.Modes.ADD) {
            headline = i18n.t('doc-modal-upload-document');
        } else if (this.mode === CabinetFile.Modes.NEW_VERSION) {
            headline = i18n.t('doc-modal-upload-new-version');
        } else {
            console.assert(hit, this.mode);
            headline = this._getAdditionalTypeName(hit.file.base.additionalType.key);
        }

        this.updateStatus();
        const options = [];

        options.push({
            label: i18n.t('doc-modal-document-only'),
            value: 'document-file-only',
        });
        options.push({
            label: i18n.t('doc-modal-only-data'),
            value: 'metadata-only',
        });
        options.push({
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
                <div slot="title" class="modal-title doc-title">
                    <dbp-icon name="files" class="view-modal-icon" aria-hidden="true"></dbp-icon>
                    <h2>${headline} ${i18n.t('doc-modal-of')} ${person.fullName}</h2>
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
                                <span class="birth-date">
                                    ${i18n.t('birth-date')}: ${formatDate(person.birthDate)}
                                </span>
                                <span>
                                    ${i18n.t('selection-column-config.person.stPersonNr')}:
                                    &nbsp;(${person.studId} | ${person.stPersonNr})
                                </span>
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
                                        hidden: !(
                                            this.uploadFailed ||
                                            this.mode === CabinetFile.Modes.EDIT ||
                                            this.mode === CabinetFile.Modes.NEW_VERSION
                                        ),
                                    })}"
                                    @click="${() => this.openReplacePdfDialog()}"
                                    ?disabled="${this.uploadFailed || !hit}">
                                    ${i18n.t('buttons.replace-document')}
                                </button>
                                ${this.renderActionDropDown(hit, file)}
                                <button
                                    @click="${this.undeleteFile}"
                                    ?disabled="${!file}"
                                    class="${classMap({
                                        hidden:
                                            this.mode === CabinetFile.Modes.ADD ||
                                            (hit && !hit.base?.isScheduledForDeletion),
                                    })} button is-secondary undo-button">
                                    <dbp-icon
                                        title="${i18n.t('doc-modal-undelete-document')}"
                                        aria-label="${i18n.t('doc-modal-undelete-document')}"
                                        name="undo"></dbp-icon>
                                    ${i18n.t('doc-modal-undelete-document')}
                                    ${
                                        this.state !== CabinetFile.States.LOADING_FILE
                                            ? ''
                                            : html`
                                                  <dbp-mini-spinner></dbp-mini-spinner>
                                              `
                                    }
                                </button>
                                <dbp-select
                                    id="download-dropdown"
                                    class=" ${classMap({
                                        'download-dropdown': true,
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
        if (this.mode !== CabinetFile.Modes.VIEW || !hit || hit.base?.isScheduledForDeletion) {
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
            value: 'edit',
            label: i18n.t('doc-modal-edit'),
            iconName: 'pencil',
        });

        if (!isCurrent) {
            options.push({
                value: 'mark-current',
                label: i18n.t('doc-modal-mark-document-current'),
                iconName: 'flag',
            });
        }

        if (!hasOnlyOneVersion && isCurrent) {
            options.push({
                value: 'mark-obsolete',
                label: i18n.t('doc-modal-mark-document-obsolete'),
                iconName: 'flag',
            });
        }

        options.push({
            value: 'add',
            label: i18n.t('doc-modal-Add-new-version'),
            iconName: 'plus',
            disabled: !isCurrent && !CabinetFile.DEV_MODE,
        });

        if (showDeleteDocumentButton) {
            options.push({
                value: 'delete',
                label: i18n.t('doc-modal-delete-document'),
                iconName: 'trash',
            });
        }

        if (showDeleteVersionButton) {
            options.push({
                value: 'delete',
                label: i18n.t('doc-modal-delete-version'),
                iconName: 'trash',
            });
        }

        if (showDeleteAllVersionsButton) {
            options.push({
                value: 'delete-all',
                label: i18n.t('doc-modal-delete-all-versions'),
                iconName: 'trash',
            });
        }

        return html`
            <dbp-select
                id="action-dropdown"
                class="actions-dropdown-doc-edit"
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
        // Search refresh is handled live by CabinetDocumentStore emitting
        // DbpCabinetIndexChanged once the Typesense index has caught up, so no
        // close-based refresh dispatch is needed here anymore.

        // Reset the state of the component when the modal is closed
        this.resetState();

        // Send a close event to the parent component
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    getObjectTypeFormPartHtml() {
        switch (this.mode) {
            case CabinetFile.Modes.VIEW:
                return html`
                    ${this.getDocumentViewFormHtml()}
                `;
            case CabinetFile.Modes.ADD:
                if (!this.objectType) {
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
        const [objectType, additionalType] = documentType
            ? documentType.split('---')
            : [null, null];

        // Only try to preset data if we are editing an existing document
        if (this.objectType && this.fileHitData !== null) {
            // Save the current fileHitData to the cache to keep the data when switching between object types in edit mode
            // In the future there could also be an event on every form element change to save the data to the cache when it changes
            this.fileHitDataCache[this.objectType] = this.fileHitData;

            // Set the default data for the object type from the objectType form component
            let newFileHitData =
                this.fileHitDataCache[objectType] ??
                this.objectTypes[objectType].getFormComponent().getDefaultData();

            // If previous hit data was set, copy the file base data from it
            if (this.fileHitData.file?.base) {
                newFileHitData.file.base = this.fileHitData.file.base;
            }

            // Then take the preset data from the cache
            this.fileHitData = newFileHitData;
        } else {
            // Reset the fileHitData so that it can set with default values in the object type modules
            this.fileHitData = null;
        }

        this.objectType = objectType;
        this.additionalType = additionalType;
    }

    getDocumentTypeSelector() {
        let additionalType = this.additionalType;
        let objectType = this.objectType;
        if (this.fileHitData !== null) {
            additionalType =
                this.fileHitData.file?.base?.additionalType?.key || this.additionalType;
            objectType = this.fileHitData.objectType || this.objectType;
        }

        const fileDocumentType =
            additionalType && objectType ? objectType + '---' + additionalType : null;

        const items = [];
        for (const [name, object] of Object.entries(this.objectTypes)) {
            for (const [key, value] of Object.entries(object.getAdditionalTypes(this.lang))) {
                const compoundKey = name + '---' + key;
                items.push({
                    key: compoundKey,
                    translatedText: value,
                    selected: compoundKey === fileDocumentType,
                });
            }
        }
        items.sort((a, b) => a.translatedText.localeCompare(b.translatedText));

        const options = items.map(
            (item) => html`
                <option value="${item.key}" ?selected=${item.selected}>
                    ${item.translatedText}
                </option>
            `,
        );

        if (!fileDocumentType) {
            options.unshift(html`
                <option value="" selected>-Select document type-</option>
            `);
        }

        return html`
            <fieldset>
                <label for="document-type">
                    ${this._i18n.t('doc-modal-document-type')}
                    <span class="red-marked-asterisk">
                        ${this._i18n.t('required-files-asterisk')}
                    </span>
                </label>
                <div class="select-wrapper-doc-type">
                    <select
                        id="document-type"
                        class="doc-type-edit-view"
                        name="object-type"
                        required
                        @change="${this.onDocumentTypeSelected}">
                        ${options}
                    </select>
                </div>
            </fieldset>
        `;
    }

    render() {
        switch (this.mode) {
            case CabinetFile.Modes.EDIT:
            case CabinetFile.Modes.NEW_VERSION:
            case CabinetFile.Modes.VIEW:
            case CabinetFile.Modes.ADD:
                return this.getHtml();
            case CabinetFile.Modes.CLOSED:
                return html``;
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
                nextcloud-file-url="${this.nextcloudFileURL}"></dbp-file-sink>
        `;
    }

    /**
     * @param ev
     */
    async onDocumentFileSelected(ev) {
        this.isFileDirty = true;
        await this.showPdf(ev.detail.file);

        if (this.mode === CabinetFile.Modes.VIEW) {
            this.mode = CabinetFile.Modes.EDIT;
        }

        // Open the document modal (no-op if it is already open underneath the file source)
        this.documentModalRef.value?.open();
    }

    /**
     * @param documentFile
     */
    async showPdf(documentFile) {
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
                    break;
                case 'fileHitData':
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
        if (this.fileHitData === null) {
            return;
        }

        const isDeletionDateReached =
            this.fileHitData.file.base.recommendedDeletionTimestamp < Math.floor(Date.now() / 1000);

        let currentVersionsCount = this.versions.filter(
            (version) => version.base?.isCurrent,
        ).length;

        if (this.fileHitData.base?.isScheduledForDeletion) {
            this.addStatusMessageBlock(
                CabinetFile.Status.DANGER,
                i18n.t('status-scheduled-for-deletion'),
                this.deleteAtDateTime,
            );
        } else if (isDeletionDateReached || (currentVersionsCount !== 1 && this.versionsLoaded)) {
            if (isDeletionDateReached) {
                this.addStatusMessageBlock(
                    CabinetFile.Status.WARNING,
                    i18n.t('status-deletion-date-reached'),
                    this.deleteAtDateTime,
                );
            }

            if (currentVersionsCount === 0) {
                this.addStatusMessageBlock(CabinetFile.Status.WARNING, i18n.t('status-no-current'));
            } else if (currentVersionsCount > 1) {
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
        // Drop the existing blob id so this is stored as a brand new blob; the
        // rest of fileHitData is kept so the new version reuses the groupId.
        this.fileHitData.file.base.fileId = null;
        // this.fileHitData.file.base.isCurrent = true;
        this.mode = CabinetFile.Modes.NEW_VERSION;
        await this.openReplacePdfDialog();
    }

    async handleDeleteAllVersions() {
        try {
            // Fetch all versions
            const allVersions = await this.fetchCurrentVersions();

            await this._getDocumentStore().deleteAllVersions(allVersions);

            // Refetch and set current hit data
            await this.updateCurrent();

            // Show success notification to user
            this.documentModalNotification(
                this._i18n.t('cabinet-file.notification-title-all-versions-deleted'),
                this._i18n.t('cabinet-file.notification-body-all-versions-deleted'),
                'success',
            );
        } catch (error) {
            console.error('handleDeleteAllVersions: Error deleting versions:', error);
            this.documentModalNotification(
                this._i18n.t('cabinet-file.notification-title-all-versions-deletion-failed'),
                this._i18n.t('cabinet-file.notification-body-all-versions-deletion-failed'),
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
                                ${
                                    block.extraMessage
                                        ? html`
                                              <span class="extra-message">
                                                  | ${block.extraMessage}
                                              </span>
                                          `
                                        : ''
                                }
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }
}
