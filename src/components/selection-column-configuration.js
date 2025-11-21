import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {scopedElements as modalNotificationScopedElements} from '../modules/modal-notification';

export class SelectionColumnConfiguration extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.selectionType = '';
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-modal': Modal,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            selectionType: {type: String, attribute: false},
        };
    }

    async open(selectionType) {
        const modal = this.modalRef.value;
        this.selectionType = selectionType;

        // Rerender the modal content
        await this.requestUpdate();

        console.log('open column configuration modal for', selectionType);
        modal.open();
    }

    close() {
        const modal = this.modalRef.value;
        modal.close();
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            // language=css
            css`
                :host {
                    --dbp-modal-max-width: 600px;
                }

                .modal-content {
                    padding: 20px;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 15px;
                    border-top: var(--dbp-border);
                }

                .config-section {
                    margin-bottom: 20px;
                }

                .config-section h3 {
                    margin-top: 0;
                    margin-bottom: 10px;
                }

                .config-section p {
                    color: var(--dbp-muted);
                    font-size: 0.875rem;
                }
            `,
        ];
    }

    onCloseModal() {
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderContent() {
        const i18n = this._i18n;
        const typeLabel =
            this.selectionType === 'person'
                ? i18n.t('selection-dialog.persons-tab', 'Persons')
                : i18n.t('selection-dialog.documents-tab', 'Documents');

        return html`
            <div class="config-section">
                <h3>${i18n.t('selection-column-configuration.title', 'Column Configuration')}</h3>
                <p>
                    ${i18n.t(
                        'selection-column-configuration.description',
                        `Configure columns for ${typeLabel}`,
                    )}
                </p>
            </div>

            <div class="config-section">
                <p>
                    ${i18n.t(
                        'selection-column-configuration.placeholder',
                        'Configuration options will be displayed here.',
                    )}
                </p>
            </div>
        `;
    }

    render() {
        const i18n = this._i18n;

        return html`
            <dbp-modal
                ${ref(this.modalRef)}
                id="selection-column-configuration"
                modal-id="selection-column-configuration"
                width="600px"
                min-width="300px"
                subscribe="lang"
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="title" class="modal-title">
                    <dbp-icon
                        title="${i18n.t(
                            'selection-column-configuration.title',
                            'Column Configuration',
                        )}"
                        name="cog"></dbp-icon>
                    <h2>
                        ${i18n.t('selection-column-configuration.title', 'Column Configuration')}
                    </h2>
                </div>
                <div slot="header" class="header">
                    <div class="modal-notification">
                        <dbp-notification
                            id="column-config-notification"
                            inline
                            lang="${this.lang}"></dbp-notification>
                    </div>
                </div>
                <div slot="content" class="modal-content">${this.renderContent()}</div>
                <div slot="footer" class="modal-footer">
                    <dbp-button
                        type="is-secondary"
                        value="${i18n.t('selection-column-configuration.close', 'Close')}"
                        @click="${() => this.close()}"></dbp-button>
                    <dbp-button
                        type="is-primary"
                        value="${i18n.t('selection-column-configuration.save', 'Save')}"
                        @click="${() => this.close()}"></dbp-button>
                </div>
            </dbp-modal>
        `;
    }
}

customElements.define('dbp-selection-column-configuration', SelectionColumnConfiguration);
