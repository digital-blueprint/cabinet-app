import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {AuthMixin, LangMixin} from '@dbp-toolkit/common';
import {createInstance} from './i18n';

export default class DBPCabinetLitElement extends LangMixin(
    AuthMixin(DBPLitElement),
    createInstance,
) {
    constructor() {
        super();
        this.entryPointUrl = '';
    }

    static get properties() {
        return {
            ...super.properties,
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            fileHandlingEnabledTargets: {type: String, attribute: 'file-handling-enabled-targets'},
            nextcloudWebAppPasswordURL: {type: String, attribute: 'nextcloud-web-app-password-url'},
            nextcloudWebDavURL: {type: String, attribute: 'nextcloud-webdav-url'},
            nextcloudName: {type: String, attribute: 'nextcloud-name'},
            nextcloudFileURL: {type: String, attribute: 'nextcloud-file-url'},
            nextcloudAuthInfo: {type: String, attribute: 'nextcloud-auth-info'},
        };
    }
}
