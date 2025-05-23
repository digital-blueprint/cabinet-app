import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {IconButton, AuthMixin, LangMixin} from '@dbp-toolkit/common';
import {Translated} from '@dbp-toolkit/common';
import {createInstance} from './i18n';

export default class DBPCabinetLitElement extends LangMixin(
    AuthMixin(DBPLitElement),
    createInstance,
) {
    constructor() {
        super();
        this.entryPointUrl = '';
    }

    static get scopedElements() {
        return {
            'dbp-icon-button': IconButton,
            'dbp-translated': Translated,
        };
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

    // This will be called after login
    loginCallback() {
        if (!this._initialized) {
            console.log('loginCallback');
        }
    }

    /**
     * Send a fetch to given url with given options
     * @param url
     * @param options
     * @returns {object} response (error or result)
     */
    async httpGetAsync(url, options) {
        let response = await fetch(url, options)
            .then((result) => {
                if (!result.ok) throw result;
                return result;
            })
            .catch((error) => {
                return error;
            });

        return response;
    }
}
