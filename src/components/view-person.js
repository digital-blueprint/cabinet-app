import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {AuthMixin, LangMixin, ScopedElementsMixin, sendNotification} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {createInstance} from '../i18n.js';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Icon, Modal} from '@dbp-toolkit/common';

export class CabinetViewPerson extends ScopedElementsMixin(
    LangMixin(AuthMixin(DBPLitElement), createInstance),
) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.hitData = null;
        this.viewComponent = null;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-modal': Modal,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            hitData: {type: Object, attribute: false},
        };
    }

    close() {
        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;

        if (modal) {
            modal.close();
        }
    }

    setViewComponent(viewComponent) {
        this.viewComponent = viewComponent;
    }

    async openDialogWithHit(hit = null) {
        if (!hit) {
            sendNotification({
                summary: this._i18n.t('person.person-not-found-summary'),
                body: this._i18n.t('person.person-not-found-body'),
                type: 'danger',
                replaceId: 'person-not-found',
                timeout: 5,
            });

            return;
        }

        this.sendSetPropertyEvent('routing-url', `/person/${encodeURIComponent(hit.id)}`, true);
        this.hitData = hit;

        // Wait until hit data is set and rendering is complete
        await this.updateComplete;

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        console.log('modal', modal);
        modal.open();
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            // language=css
            css`
                #view-modal .content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px 10px;
                    grid-auto-flow: row;
                }

                #view-modal .description {
                    grid-area: 1 / 1 / 2 / 3;
                }

                #view-modal .pdf-preview {
                    grid-area: 2 / 1 / 3 / 2;
                }

                #view-modal .form {
                    grid-area: 2 / 2 / 3 / 3;
                }

                #view-modal {
                    --dbp-modal-title-font-size: 24px;
                    --dbp-modal-title-font-weight: bold;
                    --dbp-modal-title-padding: 0 0 0 40px;
                    list-style-type: none;
                    --dbp-modal-min-width: min(75vw, 85vw);
                }

                #view-modal .modal-title-person {
                    display: flex;
                }

                #view-modal .person-modal-icon {
                    color: var(--dbp-accent);
                    margin-top: 2px;
                    font-size: 1.3em;
                }

                #view-modal .person-modal-title {
                    margin: 0 10px;
                    font-weight: bold;
                    font-size: 1.5em;
                }
            `,
        ];
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    render() {
        const hit = this.hitData;
        if (!hit || !this.viewComponent) {
            return html``;
        }
        const id = hit.id;
        const tagName = 'dbp-cabinet-object-type-view-person';
        if (!this.registry.get(tagName)) {
            this.registry.define(tagName, this.viewComponent);
        }

        return html`
            <dbp-modal
                ${ref(this.modalRef)}
                id="view-modal"
                modal-id="view-modal"
                width="80%"
                height="80%"
                min-width="80%"
                min-height="80%"
                subscribe="lang"
                @dbp-modal-closed="${this.onClosePersonModal}">
                <div slot="title" class="modal-title modal-title-person">
                    <dbp-icon name="user" class="person-modal-icon" aria-hidden="true"></dbp-icon>
                    <h2
                        class="person-modal-title"
                        aria-label="${this._i18n.t('hitbox.person-entry')} ${hit.person.fullName}">
                        ${hit.person.fullName}
                    </h2>
                </div>
                <div slot="header"></div>
                <div slot="content">
                    <dbp-cabinet-object-type-view-person
                        id="dbp-cabinet-object-type-view-${id}"
                        subscribe="lang,auth,entry-point-url"
                        .data=${hit}></dbp-cabinet-object-type-view-person>
                </div>
                <div slot="footer" class="modal-footer"></div>
            </dbp-modal>
        `;
    }

    onClosePersonModal() {
        // Send a close event to the parent component
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
    }
}
