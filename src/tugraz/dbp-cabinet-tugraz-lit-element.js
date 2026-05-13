import {LangMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
import {createInstance} from './i18n.js';

export default class DBPCabinetTugrazLitElement extends LangMixin(
    DBPCabinetLitElement,
    createInstance,
    '_i18nTugraz',
) {}
