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
     * Fetches multiple items from the collection using the provided filter.
     * @param {string} filter_by - The filter string to apply to the search query.
     * @param {number} [per_page] - Number of results per page (default: 10).
     * @param {number} [page] - Page number to fetch (default: 1).
     * @returns {Promise<Array>} Array of found document objects, or empty array if no results are found.
     */
    async fetchItemsByFilter(filter_by, per_page = 10, page = 1) {
        let searchRequests = {
            searches: [
                {
                    collection: this.collectionName,
                    q: '*',
                    filter_by: filter_by,
                    page: page,
                    per_page: per_page,
                },
            ],
        };

        let response = await this.client.multiSearch.perform(searchRequests);
        let result = response.results[0];

        if (result.found === 0) {
            return [];
        } else {
            return result.hits.map((hit) => hit.document);
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

    /**
     * Fetch file documents by a groupId.
     * When isCurrentOnly is true, only current versions are returned.
     * When false (default), all versions are returned.
     * @param {string} groupId
     * @param {boolean} [isCurrentOnly]
     * @returns {Promise<Array<object>>}
     */
    async fetchFileDocumentsByGroupId(groupId, isCurrentOnly = false) {
        if (!groupId) {
            throw new Error('groupId is required');
        }

        // Base filter: match the group
        let filter = 'file.base.groupId:=[`' + groupId + '`]';

        // If requested, restrict to current versions only
        if (isCurrentOnly === true) {
            filter += ' && base.isCurrent:=true';
        }

        return await this.fetchItemsByFilter(filter);
    }
}
