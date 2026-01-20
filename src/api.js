import {TypesenseService} from './services/typesense.js';

export class CabinetApi {
    constructor(entryPointUrl, token) {
        this._entryPointUrl = entryPointUrl;
        this._token = token;
    }

    /**
     * Trigger a person sync
     * @param {string} documentId - The ID of the typesense document.
     */
    async triggerPersonSync(documentId) {
        const url = `${this._entryPointUrl}/cabinet/sync-person-actions?documentId=${encodeURIComponent(documentId)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this._token,
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
        const url = `${this._entryPointUrl}/base/people/${encodeURIComponent(userId)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this._token,
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
            this._entryPointUrl,
            this._token,
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
}
