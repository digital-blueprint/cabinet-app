import {assert} from 'chai';

import '../src/dbp-cabinet-search';
import '../src/dbp-cabinet.js';
import {ApiError, CabinetApi} from '../src/api.js';
import {CabinetFile} from '../src/components/file.js';

suite('dbp-cabinet-activity basics', () => {
    let node;

    suiteSetup(async () => {
        node = document.createElement('dbp-cabinet-activity');
        document.body.appendChild(node);
        await node.updateComplete;
    });

    suiteTeardown(() => {
        node.remove();
    });

    test('should render', () => {
        assert(node.shadowRoot !== undefined);
    });
});

suite('document save errors', () => {
    let originalFetch;

    suiteSetup(() => {
        customElements.define('test-cabinet-file', CabinetFile);
    });

    setup(() => {
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        globalThis.fetch = originalFetch;
    });

    test('storage URL permission errors retain HTTP status and Problem Details', async () => {
        const api = new CabinetApi({entryPointUrl: 'https://example.org', auth: {token: 'token'}});
        let requests = 0;
        globalThis.fetch = () => {
            requests++;
            return Promise.resolve(
                new Response(JSON.stringify({title: 'Forbidden', detail: 'No write permission'}), {
                    status: 403,
                }),
            );
        };

        try {
            await api.updateFile('blob-id', {type: 'englMasterApplication', metadata: {}});
            assert.fail('Expected the update to fail');
        } catch (error) {
            assert.instanceOf(error, ApiError);
            assert.equal(error.status, 403);
            assert.equal(error.detail, 'No write permission');
        }
        assert.equal(requests, 1, 'The PATCH must not run when URL creation fails');
    });

    test('non-JSON API errors reject instead of falling back', async () => {
        try {
            await ApiError.fromResponse(new Response('Forbidden', {status: 403}));
            assert.fail('Expected JSON parsing to fail');
        } catch (error) {
            assert.instanceOf(error, SyntaxError);
        }
    });

    for (const status of [403, 500]) {
        test(`metadata save reports HTTP ${status} without treating it as PDF validation`, async () => {
            const failure = new ApiError(status, 'Save failed', {});
            const file = document.createElement('test-cabinet-file');
            file.mode = CabinetFile.Modes.EDIT;
            file.state = CabinetFile.States.FILE_LOADED;
            file.objectType = 'test';
            file.objectTypes = {test: {getBlobType: () => 'test'}};
            file.fileHitData = {file: {base: {fileId: 'blob-id', modifiedTimestamp: 1}}};
            file._getUserId = () => 'user-id';
            file._getDocumentStore = () => ({
                updateDocument: () => Promise.reject(failure),
            });
            file.formRef.value = {saving: true, disabled: true};
            let notification;
            file.documentModalNotification = (title, body) => {
                notification = {title, body};
            };

            await file._storeDocumentToBlob({});

            assert.deepEqual(notification, {
                title: file._i18n.t('cabinet-file.notification-title-save-failed'),
                body: file._i18n.t('cabinet-file.notification-body-save-failed'),
            });
            assert.equal(file.uploadFailed, false, 'Not a PDF validation failure');
            assert.equal(file.formRef.value.saving, false);
            assert.equal(file.formRef.value.disabled, false);
            assert.equal(file.state, CabinetFile.States.FILE_LOADED);
            assert.equal(file.mode, CabinetFile.Modes.EDIT);
        });
    }
});
