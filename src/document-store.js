import {CabinetApi, ApiError} from './api.js';
import {TypesenseService} from './typesense.js';

/**
 * Error thrown when polling Typesense for a propagated change exhausts all
 * attempts without the expected update showing up in the search index.
 */
export class PollTimeoutError extends Error {
    constructor(message = 'Timed out waiting for the search index to update') {
        super(message);
        this.name = 'PollTimeoutError';
    }
}

/**
 * High-level document operations that orchestrate the two data layers used by
 * the cabinet: the Blob storage (via {@link CabinetApi}) and the Typesense
 * search index (via {@link TypesenseService}).
 *
 * The recurring pattern in the cabinet is "mutate blob storage, then poll
 * Typesense until the change has propagated into the search index". This class
 * owns that write-then-poll orchestration so components only have to deal with
 * UI concerns (notifications, modal state, rendering).
 *
 * It is constructed from the host element (like {@link CabinetApi}) so it stays
 * in sync with `entryPointUrl`, `auth` and `objectTypes` without extra wiring.
 */
export class CabinetDocumentStore {
    /**
     * @param {object} element - The host element, providing `entryPointUrl`,
     *   `auth` and `objectTypes`.
     */
    constructor(element) {
        this._element = element;
        this._api = new CabinetApi(element);
    }

    /**
     * @returns {CabinetApi}
     */
    getApi() {
        return this._api;
    }

    /**
     * @returns {TypesenseService}
     */
    _getTypesense() {
        const serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this._element.entryPointUrl,
            this._element.auth.token,
        );
        return new TypesenseService(serverConfig);
    }

    // -- Read passthroughs ----------------------------------------------------

    /**
     * Fetch a Typesense document by its Typesense ID.
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async fetchItem(id) {
        return this._getTypesense().fetchItem(id);
    }

    /**
     * Fetch a Typesense document by its Blob fileId.
     * @param {string} fileId
     * @returns {Promise<object|null>}
     */
    async fetchByBlobId(fileId) {
        return this._getTypesense().fetchFileDocumentByBlobId(fileId);
    }

    /**
     * Fetch all versions of a document (by groupId) from Typesense.
     * @param {string} groupId
     * @param {object} [options]
     * @param {boolean} [options.currentOnly] - Only return current versions
     * @param {string} [options.sortSpec] - Optional Typesense sort_by string
     * @returns {Promise<Array<object>>}
     */
    async fetchVersions(groupId, {currentOnly = false, sortSpec = undefined} = {}) {
        return this._getTypesense().fetchFileDocumentsByGroupId(groupId, currentOnly, sortSpec);
    }

    /**
     * Download a file from blob storage.
     * @param {string} fileId
     * @returns {Promise<File>}
     */
    async downloadFile(fileId) {
        return this._api.downloadFileFromBlob(fileId);
    }

    /**
     * Soft-delete a file (schedule for deletion) in blob storage.
     * @param {string} fileId
     * @returns {Promise<object>}
     */
    async softDelete(fileId) {
        return this._api.softDeleteFile(fileId);
    }

    /**
     * Restore a soft-deleted file in blob storage.
     * @param {string} fileId
     * @returns {Promise<object>}
     */
    async restore(fileId) {
        return this._api.restoreFile(fileId);
    }

    // -- Polling primitive ----------------------------------------------------

    /**
     * Sentinel returned by a poll probe to signal "not ready yet, try again".
     */
    static NOT_READY = Symbol('NOT_READY');

    // Polling curve, tweak if needed. The delay before retry `n` (0-based) is
    // POLL_BASE_MS * 2 ** n, capped at POLL_MAX_MS: 500, 1000, 2000, 4000, 5000...
    static POLL_ATTEMPTS = 10;
    static POLL_BASE_MS = 500;
    static POLL_MAX_MS = 5000;

    /**
     * Generic write-then-poll helper.
     *
     * Runs the probe up to {@link CabinetDocumentStore.POLL_ATTEMPTS} times,
     * returning as soon as it yields anything other than
     * {@link CabinetDocumentStore.NOT_READY}. Between attempts it waits using an
     * exponential backoff (see the `POLL_*` constants). If the probe never
     * becomes ready, a {@link PollTimeoutError} is thrown.
     * @template T
     * @param {() => Promise<T|symbol>} probe - Async probe; return the resolved
     *   value, or `CabinetDocumentStore.NOT_READY` to retry
     * @returns {Promise<T>} - The first ready probe result
     * @throws {PollTimeoutError} If the probe never becomes ready in time
     */
    async _poll(probe) {
        for (let attempt = 0; attempt < CabinetDocumentStore.POLL_ATTEMPTS; attempt++) {
            const result = await probe();
            if (result !== CabinetDocumentStore.NOT_READY) {
                return result;
            }

            const ms = Math.min(
                CabinetDocumentStore.POLL_BASE_MS * 2 ** attempt,
                CabinetDocumentStore.POLL_MAX_MS,
            );
            await new Promise((resolve) => setTimeout(resolve, ms));
        }

        throw new PollTimeoutError();
    }

    // -- Write-then-poll orchestration ----------------------------------------

    /**
     * Poll Typesense by Blob fileId until the given predicate is satisfied.
     *
     * Fetches the document by blob id, resolving it as soon as `predicate(doc)`
     * returns true. If the predicate is never satisfied, a
     * {@link PollTimeoutError} is thrown. Errors from the underlying fetch
     * (other than "not found") are propagated.
     * @param {string} fileId - The Blob fileId to look up
     * @param {(doc: object) => boolean} predicate - Returns true when the
     *   fetched document reflects the expected state
     * @returns {Promise<object>} - The matching Typesense document
     * @throws {PollTimeoutError} If the predicate is never satisfied in time
     */
    async pollForDocumentByBlobId(fileId, predicate) {
        return this._poll(async () => {
            // Could throw for errors other than "not found" (which returns null)
            const item = await this._getTypesense().fetchFileDocumentByBlobId(fileId);
            return item !== null && predicate(item) === true
                ? item
                : CabinetDocumentStore.NOT_READY;
        });
    }

    /**
     * Internal helper: poll Typesense until every file in `fileIds` satisfies
     * the predicate.
     *
     * Like {@link pollForDocumentByBlobId}, this throws {@link PollTimeoutError}
     * when the index does not catch up in time. Used by the write-then-poll
     * operations ({@link markOtherVersionsObsolete}, {@link deleteAllVersions})
     * which propagate the timeout to their callers. Fetch errors for individual
     * ids are treated as "not updated yet".
     * @param {Array<string>} fileIds - Blob fileIds to check
     * @param {(doc: object) => boolean} predicate - Returns true when a
     *   document reflects the expected state
     * @returns {Promise<void>}
     * @throws {PollTimeoutError} If the index did not catch up in time
     */
    async _waitUntilUpdated(fileIds, predicate) {
        const typesense = this._getTypesense();

        await this._poll(async () => {
            const checks = fileIds.map(async (fileId) => {
                try {
                    const item = await typesense.fetchFileDocumentByBlobId(fileId);
                    return !!item && predicate(item) === true;
                } catch {
                    return false;
                }
            });

            const results = await Promise.all(checks);
            return results.every((updated) => updated) ? true : CabinetDocumentStore.NOT_READY;
        });
    }

    /**
     * Create or update a document in blob storage.
     *
     * When `blobId` is empty a new blob is created, otherwise the existing blob
     * is updated. Any {@link ApiError} from the upload is propagated unchanged
     * so callers can react to specific validation errors.
     * @param {object} options
     * @param {string} options.blobId - Existing blob id, or '' to create
     * @param {?string} options.type - The blob type (objectType.getBlobType())
     * @param {object} options.metadata - The metadata to store
     * @param {?File} [options.file] - The file to upload (null for metadata-only)
     * @returns {Promise<object>} - The parsed blob file resource
     */
    async saveDocument({blobId, type, metadata, file = null}) {
        return blobId === ''
            ? this._api.createFile({type, metadata, file})
            : this._api.updateFile(blobId, {type, metadata, file});
    }

    /**
     * Set a single version's `isCurrent` flag in blob storage, then poll
     * Typesense until the change has propagated.
     *
     * Downloads the current metadata, patches `isCurrent` (recording
     * `lastModifiedBy`), and polls the search index until the document reflects
     * the new value.
     *
     * This is the same write-then-poll pattern as the other operations: any
     * error from the download or patch is propagated so the caller can surface a
     * single failure notification, and a {@link PollTimeoutError} is thrown if
     * the index never catches up.
     * @param {string} fileId - The Blob fileId of the version to update
     * @param {boolean} enable - The desired `isCurrent` value
     * @param {string} userId - The user id to record as `lastModifiedBy`
     * @returns {Promise<object>} - The propagated Typesense document
     * @throws {PollTimeoutError} If the index did not catch up in time
     */
    async setVersionCurrent(fileId, enable, userId) {
        const metadata = await this._api.downloadFileMetadata(fileId);

        metadata.isCurrent = enable;
        metadata.lastModifiedBy = userId;
        await this._api.updateFileMetadata(fileId, metadata);

        // Poll Typesense until the version reflects the new isCurrent value.
        return this.pollForDocumentByBlobId(fileId, (item) => item.base?.isCurrent === enable);
    }

    /**
     * Mark every version of a document group (except the given one) as obsolete
     * in blob storage.
     *
     * Fetches the current versions from Typesense, then patches each other
     * version's metadata to set `isCurrent = false`. Failures for individual
     * versions are logged and skipped rather than aborting the whole operation,
     * since this is not critical to the main save flow.
     * After patching, this polls Typesense until every affected version reflects
     * `isCurrent === false`, so the search index has caught up before returning.
     * The poll is non-fatal by nature (the patches already succeeded); on
     * timeout it throws {@link PollTimeoutError} which the caller is expected to
     * catch and surface as a warning while continuing.
     * @param {string} groupId - The group id linking the versions
     * @param {string} currentFileId - The fileId to keep as current (skipped)
     * @param {string} userId - The user id to record as `lastModifiedBy`
     * @returns {Promise<Array<string>>} - The fileIds successfully marked obsolete
     * @throws {PollTimeoutError} If the index did not catch up in time
     */
    async markOtherVersionsObsolete(groupId, currentFileId, userId) {
        let versions;
        try {
            versions = await this._getTypesense().fetchFileDocumentsByGroupId(groupId, true);
        } catch (error) {
            console.error(
                'markOtherVersionsObsolete: Error fetching versions from Typesense:',
                error,
            );
            // Don't throw; this is not critical for the main flow
            return [];
        }

        const otherVersions = versions.filter(
            (version) => version.file?.base?.fileId !== currentFileId,
        );

        if (otherVersions.length === 0) {
            return [];
        }

        const updatedFileIds = [];

        const updates = otherVersions.map(async (version) => {
            const versionFileId = version.file?.base?.fileId;
            if (!versionFileId) {
                console.warn('markOtherVersionsObsolete: Version has no fileId', version);
                return;
            }

            let metadata;
            try {
                metadata = await this._api.downloadFileMetadata(versionFileId);
            } catch (e) {
                console.warn(
                    'markOtherVersionsObsolete: No metadata found for fileId',
                    versionFileId,
                    e,
                );
                return;
            }

            try {
                metadata.isCurrent = false;
                metadata.lastModifiedBy = userId;
                await this._api.updateFileMetadata(versionFileId, metadata);
                updatedFileIds.push(versionFileId);
            } catch (error) {
                console.error(
                    `markOtherVersionsObsolete: Failed to mark version ${versionFileId} as obsolete:`,
                    error,
                );
            }
        });

        await Promise.allSettled(updates);

        // Poll Typesense until every patched version reflects isCurrent === false.
        // Throws PollTimeoutError on timeout (non-fatal; caller warns).
        await this._waitUntilUpdated(updatedFileIds, (item) => item.base?.isCurrent === false);

        return updatedFileIds;
    }

    /**
     * Soft-delete every version in `versions` that is not already scheduled for
     * deletion.
     *
     * The caller passes in the versions (rather than a groupId) so it stays in
     * control of how they are fetched (sort order, error notifications, ...).
     *
     * After the soft-deletes, this polls Typesense until every deleted version
     * reflects `isScheduledForDeletion === true`. The poll is non-fatal by
     * nature (the deletes already succeeded); on timeout it throws
     * {@link PollTimeoutError} which the caller is expected to catch and surface
     * as a warning while continuing. When nothing needed deleting no poll runs,
     * so no `PollTimeoutError` can be thrown.
     * @param {Array<object>} versions - The versions to consider for deletion
     * @returns {Promise<void>}
     * @throws {PollTimeoutError} If the index did not catch up in time
     */
    async deleteAllVersions(versions) {
        const versionsToDelete = versions.filter(
            (version) => !version.base?.isScheduledForDeletion,
        );

        const deletedFileIds = [];
        for (const version of versionsToDelete) {
            const fileId = version.file?.base?.fileId;
            if (fileId) {
                await this._api.softDeleteFile(fileId);
                deletedFileIds.push(fileId);
            } else {
                console.warn('deleteAllVersions: Version has no fileId, skipping:', version);
            }
        }

        // Poll Typesense until every deleted version reflects the scheduled
        // deletion. Skip when there was nothing to delete. Throws
        // PollTimeoutError on timeout (non-fatal; caller warns).
        if (deletedFileIds.length > 0) {
            await this._waitUntilUpdated(
                deletedFileIds,
                (item) => item.base?.isScheduledForDeletion === true,
            );
        }
    }

    /**
     * Trigger a person sync on the backend and poll Typesense until the synced
     * document shows up with a new `syncTimestamp`.
     *
     * This is the same write-then-poll pattern as the file operations: a
     * backend mutation followed by polling the search index until the change
     * has propagated.
     * @param {object} hit - The person document to sync
     * @param {object} hit.person - The person object being synchronized
     * @param {number} hit.person.syncTimestamp - The current sync timestamp
     * @param {string} hit.id - The Typesense document id
     * @returns {Promise<object>} - The updated Typesense document
     * @throws {PollTimeoutError} If the sync did not propagate in time
     */
    async syncPersonDocument(hit) {
        const previousSyncTimestamp = hit.person.syncTimestamp;
        const documentId = hit.id;

        await this._api.triggerPersonSync(documentId);

        const typesense = this._getTypesense();

        return this._poll(async () => {
            const document = await typesense.fetchItem(documentId);
            return document.person.syncTimestamp !== previousSyncTimestamp
                ? document
                : CabinetDocumentStore.NOT_READY;
        });
    }
}
