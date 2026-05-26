import {TypesenseService} from './typesense.js';

export class CabinetApi {
    constructor(element) {
        this._element = element;
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
     * Create a blob URL through the blob-urls API endpoint
     * @param {string} identifier - The file identifier
     * @param {string} method - HTTP method for the blob operation (e.g., 'PATCH', 'GET')
     * @param {boolean} includeData - Whether to include data
     * @param {object} extraParams - Additional parameters
     * @returns {Promise<string>} - The blob URL
     */
    async _createBlobUrl(identifier, method = 'PATCH', includeData = false, extraParams = {}) {
        const baseUrl = `${this._element.entryPointUrl}/cabinet/blob-urls`;
        const apiUrl = new URL(baseUrl);

        let params = {
            method: method,
            prefix: 'document-',
            identifier: identifier,
        };

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

        const result = await response.json();
        console.log('createBlobUrl result', result);

        return result['blobUrl'];
    }

    /**
     * Create a blob delete URL
     * @param {string} fileId - The file identifier
     * @param {boolean} undelete - Whether to undelete the file
     * @returns {Promise<string>} - The blob URL for deletion
     */
    async createBlobDeleteUrl(fileId, undelete = false) {
        return this._createBlobUrl(fileId, 'PATCH', false, {
            deleteIn: undelete ? 'null' : 'P7D',
        });
    }

    /**
     * Delete or undelete a file by ID (schedule for deletion)
     * @param {string} fileId - The file identifier
     * @param {boolean} undelete - Whether to undelete the file
     * @returns {Promise<object>} - The response data
     */
    async doFileDeletionForFileId(fileId, undelete = false) {
        console.log('doFileDeletionForFileId fileId', fileId);

        const deleteUrl = await this.createBlobDeleteUrl(fileId, undelete);
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
    async loadBlobItem(url) {
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
     * Create a blob GET URL for a file
     * @param {string} identifier - The file identifier
     * @param {boolean} includeData - Whether to include file data in the response
     * @returns {Promise<string>} - The blob download URL
     */
    async createBlobGetUrl(identifier, includeData = false) {
        const baseUrl = `${this._element.entryPointUrl}/cabinet/blob-urls`;
        const apiUrl = new URL(baseUrl);
        const params = {
            method: 'GET',
            identifier: identifier,
        };

        if (includeData) {
            params['includeData'] = '1';
        }

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
            throw new Error(`Failed to create download URL: ${response.statusText}`);
        }

        const url = await response.json();
        return url['blobUrl'];
    }

    /**
     * Download a file from blob storage
     * @param {string} fileId - The file identifier
     * @returns {Promise<File>} - The downloaded file
     */
    async downloadFileFromBlob(fileId) {
        const url = await this.createBlobGetUrl(fileId, true);
        let blobItem = await this.loadBlobItem(url);

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
        const baseUrl = `${this._element.entryPointUrl}/cabinet/blob-urls`;
        const apiUrl = new URL(baseUrl);
        const params = {
            method: 'DOWNLOAD',
            identifier: identifier,
        };

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
            throw new Error(`Failed to create download URL: ${response.statusText}`);
        }

        const url = await response.json();
        return url['blobUrl'];
    }
}
