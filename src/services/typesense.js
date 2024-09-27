import Typesense from 'typesense';

export class TypesenseService {
    constructor(serverConfig, collectionsName) {
        console.log('constructor serverConfig', serverConfig);

        this.client = new Typesense.Client(serverConfig);
        this.collectionName = collectionsName;
    }

    async fetchItem(itemId) {
        try {
            return await this.client.collections(this.collectionName).documents(itemId).retrieve();
        } catch (error) {
            console.error('Error fetching item:', error);
        }
    }

    // Fetch a file document by fileId
    async fetchFileDocument(fileId) {
        if (!fileId) {
            throw new Error('fileId is required');
        }

        try {
            return await this.client.collections(this.collectionName).documents('file.' + fileId).retrieve();
        } catch (error) {
            // If the document is not found, return null
            if (error.name === 'ObjectNotFound') {
                return null;
            }

            // We escalate other errors
            console.error('Error fetching file document:', error);
            throw error;
        }
    }
}
