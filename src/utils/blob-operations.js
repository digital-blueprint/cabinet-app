/**
 * Utility class for blob operations shared across components
 */
export class BlobOperations {
    /**
     * Create a blob URL through the blob-urls API endpoint
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} identifier - The file identifier
     * @param {string} objectType - The object type (e.g., 'file-cabinet-document')
     * @param {string} method - HTTP method for the blob operation (e.g., 'PATCH', 'GET')
     * @param {boolean} includeData - Whether to include data
     * @param {object} extraParams - Additional parameters
     * @returns {Promise<string>} - The blob URL
     */
    static async createBlobUrl(
        entryPointUrl,
        authToken,
        identifier,
        objectType,
        method = 'PATCH',
        includeData = false,
        extraParams = {},
    ) {
        if (!entryPointUrl) {
            throw new Error('Entry point URL is not set');
        }

        const baseUrl = `${entryPointUrl}/cabinet/blob-urls`;
        const apiUrl = new URL(baseUrl);

        let params = {
            method: method,
            prefix: 'document-',
            type: objectType.replace('file-cabinet-', ''),
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
                Authorization: 'Bearer ' + authToken,
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
     * Create a blob GET URL for a file
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} identifier - The file identifier
     * @param {boolean} includeData - Whether to include file data in the response
     * @returns {Promise<string>} - The blob download URL
     */
    static async createBlobGetUrl(entryPointUrl, authToken, identifier, includeData = false) {
        if (!entryPointUrl) {
            return '';
        }

        const baseUrl = `${entryPointUrl}/cabinet/blob-urls`;
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
                Authorization: 'Bearer ' + authToken,
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
     * Create a blob download URL for a file
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} identifier - The file identifier
     * @returns {Promise<string>} - The blob download URL
     */
    static async createBlobDownloadUrl(entryPointUrl, authToken, identifier) {
        if (!entryPointUrl) {
            return '';
        }

        const baseUrl = `${entryPointUrl}/cabinet/blob-urls`;
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
                Authorization: 'Bearer ' + authToken,
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
     * Load blob item from URL
     * @param {string} url - The blob URL
     * @param {string} authToken - The authentication token
     * @returns {Promise<object>} - The blob item data
     */
    static async loadBlobItem(url, authToken) {
        const response = await fetch(url, {
            headers: {
                Authorization: 'Bearer ' + authToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to load blob: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Download a file from blob storage
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} fileId - The file identifier
     * @param {Function} dataURLtoFile - Function to convert data URL to File object
     * @param {boolean} includeData - Whether to include data in the response
     * @returns {Promise<File>} - The downloaded file
     */
    static async downloadFileFromBlob(
        entryPointUrl,
        authToken,
        fileId,
        dataURLtoFile,
        includeData = true,
    ) {
        const url = await this.createBlobGetUrl(entryPointUrl, authToken, fileId, includeData);
        let blobItem = await this.loadBlobItem(url, authToken);

        if (!blobItem.contentUrl) {
            throw new Error('No contentUrl in blob response');
        }

        return dataURLtoFile(blobItem.contentUrl, blobItem.fileName);
    }

    /**
     * Create a blob delete URL
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} fileId - The file identifier
     * @param {string} objectType - The object type (e.g., 'file-cabinet-document')
     * @param {boolean} undelete - Whether to undelete the file
     * @returns {Promise<string>} - The blob URL for deletion
     */
    static async createBlobDeleteUrl(
        entryPointUrl,
        authToken,
        fileId,
        objectType,
        undelete = false,
    ) {
        return this.createBlobUrl(entryPointUrl, authToken, fileId, objectType, 'PATCH', false, {
            deleteIn: undelete ? 'null' : 'P7D',
        });
    }

    /**
     * Delete or undelete a file by ID (schedule for deletion)
     * @param {string} entryPointUrl - The API entry point URL
     * @param {string} authToken - The authentication token
     * @param {string} fileId - The file identifier
     * @param {string} objectType - The object type (e.g., 'file-cabinet-document')
     * @param {boolean} undelete - Whether to undelete the file
     * @returns {Promise<object>} - The response data
     */
    static async doFileDeletionForFileId(
        entryPointUrl,
        authToken,
        fileId,
        objectType,
        undelete = false,
    ) {
        console.log('doFileDeletionForFileId fileId', fileId, 'objectType', objectType);

        const deleteUrl = await this.createBlobDeleteUrl(
            entryPointUrl,
            authToken,
            fileId,
            objectType,
            undelete,
        );
        console.log('doFileDeletionForFileId deleteUrl', deleteUrl);

        const options = {
            // We are doing soft-delete here, so we need to use PATCH
            method: 'PATCH',
            headers: {
                Authorization: 'Bearer ' + authToken,
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
}
