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
        this.facetVisibilityStates = {};
        this.settingsLocalStorageKey = '';
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
            facetVisibilityStates: {type: Object, attribute: false},
            settingsLocalStorageKey: {type: String, attribute: false},
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'auth':
                    this.generateSettingsLocalStorageKey();
                    break;
                case 'settingsLocalStorageKey':
                    // If the settingsLocalStorageKey has changed, we need to load the facetVisibilityStates again
                    this.loadFacetVisibilityStates();
                    break;
            }
        });

        super.update(changedProperties);
    }

    loadFacetVisibilityStates() {
        if (!this.settingsLocalStorageKey) {
            return;
        }

        this.facetVisibilityStates =
            JSON.parse(localStorage.getItem(this.settingsLocalStorageKey)) || {};
    }

    generateSettingsLocalStorageKey() {
        const publicId = this.auth && this.auth['user-id'];

        if (publicId) {
            this.settingsLocalStorageKey = `dbp-cabinet:${publicId}:facetVisibilityStates`;
        }
    }
}
