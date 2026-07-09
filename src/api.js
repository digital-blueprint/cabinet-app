import {TypesenseService} from './typesense.js';
import {BLOB_PREFIX} from './utils.js';

/**
 * A blob file resource as returned by the Blob storage API.
 *
 * This is a documentation-only ("dummy") class describing the shape of the
 * JSON object returned by the blob endpoints; it is never instantiated.
 * @property {string} identifier - The file identifier
 * @property {string} fileName - The file name
 * @property {string} prefix - The blob prefix
 * @property {?string} type - The blob type
 * @property {?string} metadata - The stored metadata (JSON-encoded string)
 * @property {?string} deleteAt - When the file is scheduled for deletion (ISO
 *   date string), or null if it is not scheduled for deletion
 * @property {?string} dateCreated - When the file was created (ISO date string)
 * @property {?string} dateModified - When the file was last modified (ISO date string)
 * @property {?string} contentUrl - A URL to download the file content (only
 *   present when includeData was requested)
 */
class BlobFile {}

/**
 * The result of a person sync operation, as returned by the
 * `/cabinet/sync-person-actions` endpoint (API resource
 * `CabinetSyncPersonAction`, serialized with the `Cabinet:output` group).
 *
 * This is a documentation-only ("dummy") class describing the shape of the
 * JSON object returned by the endpoint; it is never instantiated.
 * @property {string} identifier - The identifier of the sync action
 * @property {string} documentId - The document ID the person data was synced for
 */
class CabinetSyncPersonAction {}

/**
 * Error thrown when an API request fails.
 *
 * Carries the HTTP status and the parsed RFC 7807 Problem Details body,
 * unpacking the standard (`title`, `detail`) and Relay-specific
 * (`relay:errorId`, `relay:errorDetails`) fields into named members so callers
 * can react to specific error conditions without having to re-read the
 * response.
 */
export class ApiError extends Error {
    /**
     * @param {number} status
     * @param {string} statusText
     * @param {object} body
     */
    constructor(status, statusText, body) {
        super(`[${status}] ${body.title ?? statusText} - ${body.detail}`);

        // Generic
        this.name = 'ApiError';
        /** @member {number} */
        this.status = status;
        /** @member {string} */
        this.statusText = statusText;

        // Problem Details
        /** @member {string} */
        this.detail = body.detail;
        /** @member {string} */
        this.title = body.title ?? null;

        // Relay-specific
        /** @member {string|null} */
        this.errorId = body['relay:errorId'] ?? null;
        /** @member {object} */
        this.errorDetails = body['relay:errorDetails'] ?? {};
    }

    /**
     * @param {Response} response
     * @returns {Promise<ApiError>}
     */
    static async fromResponse(response) {
        const body = await response.json();
        return new ApiError(response.status, response.statusText, body);
    }
}

/**
 * The metadata stored alongside a document file in blob storage.
 *
 * This is a documentation-only ("dummy") class describing the base set of
 * fields that the application writes on every save (see
 * `storeDocumentInBlob`) and relies on when reading metadata back. The object
 * is technically free-form and may contain additional object-type-specific
 * fields, but these base fields are always expected to be present. It is never
 * instantiated.
 *
 * The object also carries an `@type` field (always `'DocumentFile'`), which is
 * omitted from the `@property` list below because `@`-prefixed keys are not
 * valid JSDoc namepaths.
 * @property {string} fileSource - The file source, e.g. 'blob-cabinetBucket'
 * @property {string} objectType - The object type (e.g. 'file-cabinet-minimalSchema')
 * @property {boolean} isCurrent - Whether this is the current version of the document
 * @property {string} lastModifiedBy - The user ID of the last person to modify the file
 * @property {string} groupId - The group ID linking versions of the same document
 */
class DocumentFileMetadata {}

export class CabinetApi {
    constructor(element) {
        this._element = element;
    }

    /**
     * Create a blob URL through the blob-urls API endpoint.
     * @param {string} method - HTTP method for the blob operation (e.g. 'POST', 'PATCH', 'GET', 'DELETE', 'DOWNLOAD')
     * @param {object} [options]
     * @param {?string} [options.identifier] - The file identifier (omitted when null)
     * @param {boolean} [options.includeData] - Whether to include file data in the response
     * @param {?string} [options.type] - The blob type (e.g. objectType.getBlobType())
     * @param {object} [options.extraParams] - Additional query parameters
     * @returns {Promise<string>} - The blob URL
     */
    async _createBlobUrl(
        method,
        {identifier = null, includeData = false, type = null, extraParams = {}} = {},
    ) {
        // POST creates a new blob and must not carry an identifier, every other
        // method operates on an existing blob and therefore requires one.
        if (method === 'POST' && identifier !== null) {
            throw new Error(`Blob method "${method}" must not be given an identifier`);
        }
        if (method !== 'POST' && identifier === null) {
            throw new Error(`Blob method "${method}" requires an identifier`);
        }

        const baseUrl = `${this._element.entryPointUrl}/cabinet/blob-urls`;
        const apiUrl = new URL(baseUrl);
        let params = {
            method: method,
        };
        // The prefix is only relevant when creating or updating a blob.
        if (method === 'POST' || method === 'PATCH') {
            params['prefix'] = BLOB_PREFIX;
        }
        if (type !== null) {
            params['type'] = type;
        }
        if (identifier !== null) {
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
                Authorization: 'Bearer ' + this._element.auth.token,
            },
            body: '{}',
        });
        if (!response.ok) {
            throw new Error(`Error while creating storage URL: ${response.statusText}`);
        }
        const url = await response.json();

        return url['blobUrl'];
    }

    /**
     * Send a blob upload request (POST to create, PATCH to update).
     *
     * On a non-ok response an {@link ApiError} carrying the status and parsed
     * Problem Details body is thrown. On success the parsed JSON response is
     * returned.
     * @param {string} method - 'POST' or 'PATCH'
     * @param {string} uploadUrl - The blob upload URL
     * @param {object} metadata - The metadata object to store
     * @param {?File} [file] - The file to upload (omitted for metadata-only updates)
     * @returns {Promise<BlobFile>} - The parsed blob file resource
     * @throws {ApiError} If the upload request fails
     */
    async _sendBlobUpload(method, uploadUrl, metadata, file = null) {
        const formData = new FormData();
        formData.append('metadata', JSON.stringify(metadata));
        if (file !== null) {
            formData.append('file', file);
            formData.append('fileName', file.name);
        }
        formData.append('prefix', BLOB_PREFIX);

        const response = await fetch(uploadUrl, {
            method,
            headers: {
                Authorization: 'Bearer ' + this._element.auth.token,
            },
            body: formData,
        });

        if (!response.ok) {
            throw await ApiError.fromResponse(response);
        }

        return response.json();
    }

    /**
     * Create a new file in blob storage.
     *
     * On success the parsed blob file resource is returned; on failure a
     * {@link ApiError} is thrown.
     * @param {object} options
     * @param {?string} [options.type] - The blob type (e.g. objectType.getBlobType())
     * @param {object} [options.metadata] - The metadata object to store
     * @param {?File} [options.file] - The file to upload
     * @returns {Promise<BlobFile>} - The parsed blob file resource
     * @throws {ApiError} If the upload request fails
     */
    async createFile({type = null, metadata = {}, file = null} = {}) {
        const uploadUrl = await this._createBlobUrl('POST', {type});
        return this._sendBlobUpload('POST', uploadUrl, metadata, file);
    }

    /**
     * Update an existing file and/or its metadata in blob storage.
     *
     * On success the parsed blob file resource is returned; on failure a
     * {@link ApiError} is thrown.
     * @param {string} fileId - The file identifier
     * @param {object} options
     * @param {?string} [options.type] - The blob type (e.g. objectType.getBlobType())
     * @param {object} [options.metadata] - The metadata object to store
     * @param {?File} [options.file] - The file to upload (omitted for metadata-only updates)
     * @returns {Promise<BlobFile>} - The parsed blob file resource
     * @throws {ApiError} If the upload request fails
     */
    async updateFile(fileId, {type = null, metadata = {}, file = null} = {}) {
        const uploadUrl = await this._createBlobUrl('PATCH', {
            identifier: fileId,
            type,
        });
        return this._sendBlobUpload('PATCH', uploadUrl, metadata, file);
    }

    /**
     * Update the metadata of an existing file in blob storage.
     * @param {string} fileId - The file identifier
     * @param {object} metadata - The metadata object to store
     * @returns {Promise<BlobFile>} - The parsed blob file resource
     * @throws {ApiError} If the upload request fails
     */
    async updateFileMetadata(fileId, metadata) {
        return this.updateFile(fileId, {metadata});
    }

    /**
     * Trigger a person sync
     * @param {string} documentId - The ID of the typesense document.
     * @returns {Promise<CabinetSyncPersonAction>} - The parsed sync action response
     */
    async triggerPersonSync(documentId) {
        const url = `${this._element.entryPointUrl}/cabinet/sync-person-actions?documentId=${encodeURIComponent(documentId)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this._element.auth.token,
            },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            throw new Error(`Error syncing person: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * @param {string} userId
     * @returns {Promise<string>}
     */
    async getUserFullName(userId) {
        const url = `${this._element.entryPointUrl}/base/people/${encodeURIComponent(userId)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this._element.auth.token,
            },
        });
        if (!response.ok) {
            throw new Error(`Error fetching user: ${response.statusText}`);
        }
        const data = await response.json();
        return `${data.givenName} ${data.familyName}`;
    }

    /**
     * Synchronizes a person's data by triggering a sync operation and polling for updates.
     * @param {object} hit - The object containing person information.
     * @param {object} hit.person - The person object to be synchronized.
     * @param {number} hit.person.syncTimestamp - The current synchronization timestamp of the person.
     * @param {string} hit.id - The ID of the document associated with the person.
     * @throws {Error} Throws an error if synchronization fails after the maximum number of retries.
     * @returns {Promise<object>} A promise that resolves to the updated document after synchronization.
     */
    async syncTypesenseDocument(hit) {
        let syncTimestamp = hit.person.syncTimestamp;
        let documentId = hit.id;

        await this.triggerPersonSync(documentId);

        let serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this._element.entryPointUrl,
            this._element.auth.token,
        );
        let typesense = new TypesenseService(serverConfig);

        let maxRetries = 5;
        let retryCount = 0;
        let document;
        do {
            document = await typesense.fetchItem(documentId);
            if (document.person.syncTimestamp !== syncTimestamp) {
                break;
            }
            let delay = 1 + retryCount * 0.5;
            await new Promise((resolve) => setTimeout(resolve, delay));
            retryCount++;
        } while (retryCount < maxRetries);

        if (retryCount === maxRetries) {
            throw new Error(`Failed to sync person after ${maxRetries} attempts`);
        }

        return document;
    }

    /**
     * Soft-delete a file by ID (schedule for deletion)
     * @param {string} fileId - The file identifier
     * @returns {Promise<BlobFile>} - The updated blob file resource
     */
    async softDeleteFile(fileId) {
        return this._setFileDeletion(fileId, false);
    }

    /**
     * Restore a previously soft-deleted file by ID (cancel scheduled deletion)
     * @param {string} fileId - The file identifier
     * @returns {Promise<BlobFile>} - The updated blob file resource
     */
    async restoreFile(fileId) {
        return this._setFileDeletion(fileId, true);
    }

    /**
     * Set the deletion state of a file by ID (schedule for deletion or restore)
     * @param {string} fileId - The file identifier
     * @param {boolean} undelete - Whether to restore (undelete) the file
     * @returns {Promise<BlobFile>} - The updated blob file resource
     */
    async _setFileDeletion(fileId, undelete = false) {
        const deleteUrl = await this._createBlobUrl('PATCH', {
            identifier: fileId,
            extraParams: {deleteIn: undelete ? 'null' : 'P7D'},
        });

        const options = {
            // We are doing soft-delete here, so we need to use PATCH
            method: 'PATCH',
            headers: {
                Authorization: 'Bearer ' + this._element.auth.token,
            },
            // The API demands a multipart form data, so we need to send an empty body
            body: new FormData(),
        };

        let response = await fetch(deleteUrl, options);
        if (!response.ok) {
            if (undelete) {
                throw new Error(`Could not mark document ${fileId} as undeleted in blob!`);
            } else {
                throw new Error(`Could not mark document ${fileId} as deleted in blob!`);
            }
        }

        return await response.json();
    }

    /**
     * Load blob item from URL
     * @param {string} url - The blob URL
     * @returns {Promise<BlobFile>} - The blob item data
     */
    async _loadBlobItem(url) {
        const response = await fetch(url, {
            headers: {
                Authorization: 'Bearer ' + this._element.auth.token,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to load blob: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Download a file from blob storage
     * @param {string} fileId - The file identifier
     * @returns {Promise<File>} - The downloaded file
     */
    async downloadFileFromBlob(fileId) {
        const url = await this._createBlobUrl('GET', {identifier: fileId, includeData: true});
        let blobItem = await this._loadBlobItem(url);

        if (!blobItem.contentUrl) {
            throw new Error('No contentUrl in blob response');
        }

        const res = await fetch(blobItem.contentUrl);
        if (!res.ok) {
            throw new Error(`Failed to download file from blob: ${res.statusText}`);
        }
        const blob = await res.blob();
        return new File([blob], blobItem.fileName, {type: blob.type});
    }

    /**
     * Create a blob download URL for a file
     * @param {string} identifier - The file identifier
     * @returns {Promise<string>} - The blob download URL
     */
    async createBlobDownloadUrl(identifier) {
        return this._createBlobUrl('DOWNLOAD', {identifier});
    }

    /**
     * Download and parse the metadata of a file from blob storage.
     * @param {string} fileId - The file identifier
     * @returns {Promise<DocumentFileMetadata>} - The parsed metadata object
     */
    async downloadFileMetadata(fileId) {
        const url = await this._createBlobUrl('GET', {identifier: fileId});
        const blobItem = await this._loadBlobItem(url);
        if (!blobItem.metadata) {
            throw new Error(`No metadata in blob response for ${fileId}`);
        }
        return JSON.parse(blobItem.metadata);
    }
}
