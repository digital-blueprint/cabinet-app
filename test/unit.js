import {assert} from 'chai';

import '../src/dbp-cabinet-search';
import '../src/dbp-cabinet.js';
import {createTypesenseSortFunction} from '../src/utils.js';

suite('createTypesenseSortFunction', () => {
    test('sorts by a single field ascending', () => {
        const sort = createTypesenseSortFunction('sortKey:asc');
        const docs = [{sortKey: 'b'}, {sortKey: 'a'}, {sortKey: 'c'}];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.sortKey),
            ['a', 'b', 'c'],
        );
    });

    test('sorts by a single field descending', () => {
        const sort = createTypesenseSortFunction('sortKey:desc');
        const docs = [{sortKey: 'b'}, {sortKey: 'a'}, {sortKey: 'c'}];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.sortKey),
            ['c', 'b', 'a'],
        );
    });

    test('sorts by multiple fields with tiebreaking', () => {
        const sort = createTypesenseSortFunction('sortKey:asc,sortKey2:desc');
        const docs = [
            {sortKey: 'b', sortKey2: 1},
            {sortKey: 'a', sortKey2: 2},
            {sortKey: 'a', sortKey2: 5},
        ];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.sortKey2),
            [5, 2, 1],
        );
    });

    test('sorts numerically (not lexicographically)', () => {
        const sort = createTypesenseSortFunction('num:asc');
        const docs = [{num: 10}, {num: 2}, {num: 20}];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.num),
            [2, 10, 20],
        );
    });

    test('handles nested fields via dot notation', () => {
        const sort = createTypesenseSortFunction('person.familyName:asc');
        const docs = [
            {person: {familyName: 'Zebra'}},
            {person: {familyName: 'Apple'}},
            {person: {familyName: 'Mango'}},
        ];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.person.familyName),
            ['Apple', 'Mango', 'Zebra'],
        );
    });

    test('returns 0 for equal objects', () => {
        const sort = createTypesenseSortFunction('sortKey:asc');
        assert.strictEqual(sort({sortKey: 'x'}, {sortKey: 'x'}), 0);
    });

    test('matches the de sort spec from getSearchParameters', () => {
        const sort = createTypesenseSortFunction('sortKey:asc,sortKey2:asc,sortKey3:desc');
        const docs = [
            {sortKey: 'b', sortKey2: 'x', sortKey3: 1},
            {sortKey: 'a', sortKey2: 'z', sortKey3: 9},
            {sortKey: 'a', sortKey2: 'a', sortKey3: 5},
        ];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.sortKey2),
            ['a', 'z', 'x'],
        );
    });

    test('matches the en sort spec from getSearchParameters', () => {
        const sort = createTypesenseSortFunction('sortKey:asc,sortKey2En:asc,sortKey3:desc');
        const docs = [
            {sortKey: 'a', sortKey2En: 'z', sortKey3: 1},
            {sortKey: 'a', sortKey2En: 'a', sortKey3: 9},
            {sortKey: 'b', sortKey2En: 'm', sortKey3: 5},
        ];
        docs.sort(sort);
        assert.deepEqual(
            docs.map((d) => d.sortKey2En),
            ['a', 'z', 'm'],
        );
    });
});

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
