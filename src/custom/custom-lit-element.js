import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {AuthMixin, LangMixin} from '@dbp-toolkit/common';
import {createInstance as createInstanceCabinet} from '../i18n.js';
import {createInstance as createInstanceTugraz} from './i18n.js';

export default class CustomLitElement extends LangMixin(
    LangMixin(AuthMixin(DBPLitElement), createInstanceCabinet),
    createInstanceTugraz,
    '_i18nCustom',
) {
    static get properties() {
        return {
            ...super.properties,
            nextcloudWebAppPasswordURL: {type: String, attribute: 'nextcloud-web-app-password-url'},
            nextcloudWebDavURL: {type: String, attribute: 'nextcloud-webdav-url'},
            nextcloudName: {type: String, attribute: 'nextcloud-name'},
            nextcloudFileURL: {type: String, attribute: 'nextcloud-file-url'},
            nextcloudAuthInfo: {type: String, attribute: 'nextcloud-auth-info'},
        };
    }
}
