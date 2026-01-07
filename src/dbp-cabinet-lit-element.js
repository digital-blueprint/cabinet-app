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
        this.settingsLocalStoragePrefix = null;

        // Try to load the facet visibility states from localStorage if the settingsLocalStoragePrefix is already set
        this.loadFacetVisibilityStates();
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
            settingsLocalStoragePrefix: {type: String, attribute: false},
        };
    }

    static HitSelectionType = {
        PERSON: 'Person',
        DOCUMENT_FILE: 'DocumentFile',
    };

    /**
     * Returns a fresh copy of the empty hit selection object.
     * Use this instead of directly accessing static EmptyHitSelection (now removed) to avoid mutation issues.
     */
    static createEmptyHitSelection() {
        return {
            [DBPCabinetLitElement.HitSelectionType.PERSON]: {},
            [DBPCabinetLitElement.HitSelectionType.DOCUMENT_FILE]: {},
        };
    }

    static EventType = {
        HIT_SELECTION_CHANGED: 'hitSelectionChanged',
    };

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'auth':
                    // If the auth has changed, and the user is authenticated and the settingsLocalStoragePrefix is not set, we need to generate it
                    // We assume that auth['user-id'] will never change, because the page would be reloaded
                    this.getSettingsLocalStoragePrefix();
                    break;
                case 'settingsLocalStoragePrefix':
                    // If the settingsLocalStoragePrefix has changed, we need to load the facetVisibilityStates
                    // This should only happen one time after initialization
                    this.loadFacetVisibilityStates();
                    break;
            }
        });

        super.update(changedProperties);
    }

    setFacetVisibilityStates(facetVisibilityStates) {
        // If the facetVisibilityStates is not an object or not set, we will not set it locally
        if (typeof facetVisibilityStates !== 'object' || facetVisibilityStates === null) {
            return false;
        }

        this.facetVisibilityStates = facetVisibilityStates;

        return true;
    }

    loadFacetVisibilityStates() {
        // If the settingsLocalStoragePrefix is not set, we need to generate it
        // If that fails, we cannot load the facet visibility states
        let prefix = this.getSettingsLocalStoragePrefix();
        if (prefix === null) {
            return false;
        }

        // Load the facet visibility states from localStorage
        this.setFacetVisibilityStates(
            JSON.parse(localStorage.getItem(prefix + 'facetVisibilityStates')) || {},
        );

        return true;
    }

    getVisibleFacetIds() {
        // Return the names of the facets that are visible
        return this.getVisibleFacetIdsFromFacetStates(this.facetVisibilityStates);
    }

    getVisibleFacetIdsFromFacetStates(facetStates) {
        if (!facetStates || typeof facetStates !== 'object') {
            return [];
        }

        // Return the names of the facets that are visible from a given facetStates object
        return Object.keys(facetStates).filter((facetName) => facetStates[facetName] === true);
    }

    getSettingsLocalStoragePrefix() {
        // We need the publicId from the auth object to generate the settingsLocalStoragePrefix
        const publicId = this.auth && this.auth['user-id'];

        if (!publicId) {
            this.settingsLocalStoragePrefix = null;
        } else {
            this.settingsLocalStoragePrefix = `dbp-cabinet:${publicId}:`;
        }

        return this.settingsLocalStoragePrefix;
    }

    sendHitSelectionEvent(type, identifier, state, hit = null) {
        if (!Object.values(this.constructor.HitSelectionType).includes(type)) {
            throw new Error(
                `Invalid type: ${type}. Must be one of ${Object.values(this.constructor.HitSelectionType).join(', ')}`,
            );
        }

        const customEvent = new CustomEvent(this.constructor.EventType.HIT_SELECTION_CHANGED, {
            detail: {
                type: type,
                identifier: identifier,
                state: state,
                hit: hit,
            },
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(customEvent);
    }
}
