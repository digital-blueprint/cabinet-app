import {assert} from 'chai';

import '../src/dbp-cabinet-search';
import '../src/dbp-cabinet.js';

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
