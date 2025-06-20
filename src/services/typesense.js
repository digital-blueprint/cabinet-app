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
     * Fetch an item by its Typesense ID.
     * @param {string} itemId - The unique identifier of the item to fetch.
     * @returns {Promise<null|object>}
     */
    async fetchItem(itemId) {
        return await this.fetchItemByFilter('id:=[`' + itemId + '`]');
    }

    /**
     * Fetches a single item from the collection using the provided filter.
     * Throws an error if more than one result is found.
     * @param {string} filter_by - The filter string to apply to the search query.
     * @returns {Promise<object|null>} The found document object, or null if no result is found.
     * @throws {Error} If more than one result is found for the given filter.
     */
    async fetchItemByFilter(filter_by) {
        let searchRequests = {
            searches: [
                {
                    collection: this.collectionName,
                    q: '*',
                    filter_by: filter_by,
                    page: 1,
                    per_page: 1,
                },
            ],
        };

        let response = await this.client.multiSearch.perform(searchRequests);
        let result = response.results[0];
        if (result.found > 1) {
            throw new Error('More than one result found for filter: ' + filter_by);
        } else if (result.found === 0) {
            return null;
        } else {
            return result.hits[0].document;
        }
    }

    /**
     * Fetch a file document by Blob fileId
     * @param {string} fileId
     * @returns {Promise<null|object>}
     */
    async fetchFileDocumentByBlobId(fileId) {
        if (!fileId) {
            throw new Error('fileId is required');
        }

        return await this.fetchItemByFilter('file.base.fileId:=[`' + fileId + '`]');
    }
}
