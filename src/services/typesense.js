import Typesense from 'typesense';

export const TYPESENSE_COLLECTION = 'cabinet';

export class TypesenseService {
    constructor(serverConfig) {
        this.client = new Typesense.Client(serverConfig);
        this.collectionName = TYPESENSE_COLLECTION;
    }

    static getServerConfigForEntryPointUrl(entryPointUrl, token) {
        let typesenseUrl = new URL(entryPointUrl + '/cabinet/typesense');
        let serverConfig = {
            apiKey: '', // unused
            nodes: [
                {
                    host: typesenseUrl.hostname,
                    port:
                        typesenseUrl.port ||
                        (typesenseUrl.protocol === 'https:'
                            ? '443'
                            : typesenseUrl.protocol === 'http:'
                              ? '80'
                              : ''),
                    path: typesenseUrl.pathname,
                    protocol: typesenseUrl.protocol.replace(':', ''),
                },
            ],
            useServerSideSearchCache: true,
            cacheSearchResultsForSeconds: 0,
            additionalHeaders: {Authorization: 'Bearer ' + token},
            sendApiKeyAsQueryParam: true,
        };
        return serverConfig;
    }

    /**
     * Fetch an item by its Typesense ID
     * @param itemId
     * @returns {Promise<object>}
     */
    async fetchItem(itemId) {
        try {
            return await this.client.collections(this.collectionName).documents(itemId).retrieve();
        } catch (error) {
            console.error('Error fetching item:', error);
        }
    }

    /**
     * Fetch a file document by Blob fileId
     * @param fileId
     * @returns {Promise<null|*>}
     */
    async fetchFileDocumentByBlobId(fileId) {
        if (!fileId) {
            throw new Error('fileId is required');
        }

        try {
            return await this.client
                .collections(this.collectionName)
                .documents('file.' + fileId)
                .retrieve();
        } catch (error) {
            console.log('fetchFileDocumentByBlobId error.name', error.name);
            console.log('fetchFileDocumentByBlobId error.httpStatus', error.httpStatus);
            console.log('fetchFileDocumentByBlobId error prototype', Object.getPrototypeOf(error));

            // Check httpStatus of TypesenseError
            // If the document is not found, return null, because we want to try to fetch it again later
            if (error.httpStatus === 404) {
                return null;
            }

            // We escalate other errors
            console.error('Error fetching file document:', error);
            throw error;
        }
    }
}
