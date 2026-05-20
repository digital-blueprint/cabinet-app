import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {AuthMixin, LangMixin} from '@dbp-toolkit/common';
import {createInstance} from './i18n';

export default class DBPCabinetLitElement extends LangMixin(
    AuthMixin(DBPLitElement),
    createInstance,
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
