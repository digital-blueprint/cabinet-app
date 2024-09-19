// import Typesense from 'typesense';

export class TypesenseService {
    constructor(serverConfig, collectionsName) {
        // delete serverConfig.cacheSearchResultsForSeconds;
        // delete serverConfig.randomizeNodes;
        // delete serverConfig.sendApiKeyAsQueryParam;

        console.log('constructor serverConfig', serverConfig);

        // TODO: This breaks search
        // this.client = new Typesense.Client(serverConfig);
        this.collectionName = collectionsName;
    }

    async fetchItem(itemId) {
        try {
            return await this.client.collections(this.collectionName).documents(itemId).retrieve();
        } catch (error) {
            console.error('Error fetching item:', error);
        }
    }
}
