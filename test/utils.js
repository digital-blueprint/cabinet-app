import {assert} from 'chai';

import {mergeNestedConditions} from '../src/utils.js';

suite('utils', () => {
    test('mergeNestedConditions', () => {
        // basic
        assert.deepEqual(
            mergeNestedConditions(
                'studies',
                'base.isScheduledForDeletion:false && studies.name:=[`Bachelorstudium; Molekularbiologie`] && studies.statusText:=[`gemeldet`] && studies.type:=[`Bachelorstudium`]',
            ),
            'base.isScheduledForDeletion:false && studies.{name:=[`Bachelorstudium; Molekularbiologie`] && statusText:=[`gemeldet`] && type:=[`Bachelorstudium`]}',
        );

        // if there is only one condition, we don't need to merge
        assert.deepEqual(
            mergeNestedConditions(
                'studies',
                'base.isScheduledForDeletion:false && studies.name:=[`Bachelorstudium; Molekularbiologie`]',
            ),
            'base.isScheduledForDeletion:false && studies.name:=[`Bachelorstudium; Molekularbiologie`]',
        );

        // out of order
        assert.deepEqual(
            mergeNestedConditions(
                'studies',
                'studies.name:=[`Bachelorstudium; Molekularbiologie`] && base.isScheduledForDeletion:false && studies.statusText:=[`gemeldet`] && studies.type:=[`Bachelorstudium`]',
            ),
            'base.isScheduledForDeletion:false && studies.{name:=[`Bachelorstudium; Molekularbiologie`] && statusText:=[`gemeldet`] && type:=[`Bachelorstudium`]}',
        );
    });
});
