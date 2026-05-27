import {
    createInstance as _createInstance,
    setOverridesByGlobalCache,
} from '@dbp-toolkit/common/i18next.js';

import de from '../i18n/de/custom.json';
import en from '../i18n/en/custom.json';

export function createInstance() {
    return _createInstance({en: en, de: de}, 'de', 'en', 'custom');
}

export {setOverridesByGlobalCache};
