import {TypesenseService} from './typesense.js';
import {BLOB_PREFIX} from './utils.js';

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
     * @param {string} method - 'POST' or 'PATCH'
     * @param {string} uploadUrl - The blob upload URL
     * @param {object} metadata - The metadata object to store
     * @param {?File} [file] - The file to upload (omitted for metadata-only updates)
     * @returns {Promise<Response>} - The raw fetch response
     */
    async _sendBlobUpload(method, uploadUrl, metadata, file = null) {
        const formData = new FormData();
        formData.append('metadata', JSON.stringify(metadata));
        if (file !== null) {
            formData.append('file', file);
            formData.append('fileName', file.name);
        }
        formData.append('prefix', BLOB_PREFIX);

        return fetch(uploadUrl, {
            method,
            headers: {
                Authorization: 'Bearer ' + this._element.auth.token,
            },
            body: formData,
        });
    }

    /**
     * Create a new file in blob storage.
     *
     * The raw fetch Response is returned so callers can implement their own
     * success/error handling.
     * @param {object} options
     * @param {?string} [options.type] - The blob type (e.g. objectType.getBlobType())
     * @param {object} [options.metadata] - The metadata object to store
     * @param {?File} [options.file] - The file to upload
     * @returns {Promise<Response>} - The raw fetch response
     */
    async createFile({type = null, metadata = {}, file = null} = {}) {
        const uploadUrl = await this._createBlobUrl('POST', {type});
        return this._sendBlobUpload('POST', uploadUrl, metadata, file);
    }

    /**
     * Update an existing file and/or its metadata in blob storage.
     *
     * The raw fetch Response is returned so callers can implement their own
     * success/error handling.
     * @param {string} fileId - The file identifier
     * @param {object} options
     * @param {?string} [options.type] - The blob type (e.g. objectType.getBlobType())
     * @param {object} [options.metadata] - The metadata object to store
     * @param {?File} [options.file] - The file to upload (omitted for metadata-only updates)
     * @returns {Promise<Response>} - The raw fetch response
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
     * @returns {Promise<Response>} - The raw fetch response
     */
    async updateFileMetadata(fileId, metadata) {
        return this.updateFile(fileId, {metadata});
    }

    /**
     * Trigger a person sync
     * @param {string} documentId - The ID of the typesense document.
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
     * Delete or undelete a file by ID (schedule for deletion)
     * @param {string} fileId - The file identifier
     * @param {boolean} undelete - Whether to undelete the file
     * @returns {Promise<object>} - The response data
     */
    async doFileDeletionForFileId(fileId, undelete = false) {
        console.log('doFileDeletionForFileId fileId', fileId);

        const deleteUrl = await this._createBlobUrl('PATCH', {
            identifier: fileId,
            extraParams: {deleteIn: undelete ? 'null' : 'P7D'},
        });
        console.log('doFileDeletionForFileId deleteUrl', deleteUrl);

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
     * @returns {Promise<object>} - The blob item data
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
     * @returns {Promise<object>} - The parsed metadata object
     */
    async downloadFileMetadata(fileId) {
        const url = await this._createBlobUrl('GET', {identifier: fileId});
        const blobItem = await this._loadBlobItem(url);
        if (!blobItem || !blobItem.metadata) {
            throw new Error(`No metadata in blob response for ${fileId}`);
        }
        return JSON.parse(blobItem.metadata);
    }
}
