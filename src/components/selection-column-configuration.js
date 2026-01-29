import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, IconButton, Modal} from '@dbp-toolkit/common';
import {scopedElements as modalNotificationScopedElements} from '../modules/modal-notification';
import InstantSearchModule from '../modules/instantSearch.js';

export class SelectionColumnConfiguration extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.storeSettingsButtonRef = createRef();
        this.selectionType = '';
        this.columnConfigs = [];
        this.columnVisibilityStates = {};
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
            'dbp-modal': Modal,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            selectionType: {type: String, attribute: false},
            columnConfigs: {type: Array, attribute: false},
            columnVisibilityStates: {type: Object, attribute: false},
        };
    }

    /**
     * Get available columns for person type
     */
    static getPersonColumns() {
        const instantSearchModule = new InstantSearchModule();
        return instantSearchModule.getPersonColumns();
    }

    /**
     * Get available columns for document type
     */
    static getDocumentColumns() {
        const instantSearchModule = new InstantSearchModule();
        return instantSearchModule.getDocumentColumns();
    }

    async open(selectionType) {
        const modal = this.modalRef.value;
        this.selectionType = selectionType;

        // Ensure settingsLocalStoragePrefix is set
        if (!this.settingsLocalStoragePrefix) {
            console.log('SelectionColumnConfiguration: generating settingsLocalStoragePrefix...');
            this.getSettingsLocalStoragePrefix();
            // Force update to ensure the property is set
            await this.requestUpdate();
        }

        console.log('SelectionColumnConfiguration.open:', {
            selectionType,
            settingsLocalStoragePrefix: this.settingsLocalStoragePrefix,
            auth: this.auth,
            userId: this.auth?.['user-id'],
        });

        // Load column configurations based on type
        if (selectionType === 'person') {
            this.columnConfigs = this.constructor.getPersonColumns();
        } else if (selectionType === 'document') {
            this.columnConfigs = this.constructor.getDocumentColumns();
        }

        // Load saved column visibility states from localStorage
        this.loadColumnVisibilityStates();

        // Rerender the modal content with all properties set
        await this.requestUpdate();
        await this.updateComplete;

        console.log('Opening column configuration modal:', {
            selectionType,
            columnConfigsLength: this.columnConfigs.length,
            settingsLocalStoragePrefix: this.settingsLocalStoragePrefix,
            willButtonsBeDisabled:
                !this.columnConfigs ||
                this.columnConfigs.length === 0 ||
                !this.settingsLocalStoragePrefix,
        });

        modal.open();
    }

    close() {
        const modal = this.modalRef.value;
        modal.close();
    }

    /**
     * Generate localStorage key for column visibility settings
     */
    getColumnStorageKey() {
        if (!this.settingsLocalStoragePrefix) {
            return null;
        }
        // Use the prefix and add column visibility suffix
        return `${this.settingsLocalStoragePrefix}columnVisibilityStates:${this.selectionType}`;
    }

    /**
     * Load column visibility states from localStorage
     */
    loadColumnVisibilityStates() {
        const storageKey = this.getColumnStorageKey();
        if (!storageKey) {
            // Initialize with default visibility if no storage key
            this.columnVisibilityStates = this.getDefaultColumnVisibility();
            return false;
        }

        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved && typeof saved === 'object') {
                this.columnVisibilityStates = saved;
            } else {
                // Initialize with defaults if nothing saved
                this.columnVisibilityStates = this.getDefaultColumnVisibility();
            }
            return true;
        } catch (e) {
            console.warn('Failed to load column visibility states', e);
            this.columnVisibilityStates = this.getDefaultColumnVisibility();
            return false;
        }
    }

    /**
     * Get default column visibility based on column configs
     */
    getDefaultColumnVisibility() {
        return this.columnConfigs.reduce((acc, col) => {
            if (col.defaultVisible) {
                acc[col.id] = true;
            }
            return acc;
        }, {});
    }

    /**
     * Save column visibility states to localStorage
     * @param {Event} e - The button click event
     */
    storeSettings(e) {
        const storageKey = this.getColumnStorageKey();
        if (!storageKey) {
            console.warn('No storage key available, cannot store settings.');
            return;
        }

        /**
         * @type {Button}
         */
        const button = this.storeSettingsButtonRef.value;
        console.assert(button instanceof Button, 'Store settings button not found');
        button.start();

        // Store the current column visibility states in localStorage
        localStorage.setItem(storageKey, JSON.stringify(this.columnVisibilityStates));

        button.stop();

        // Dispatch event to notify parent component
        const customEvent = new CustomEvent('columnSettingsStored', {
            detail: {
                selectionType: this.selectionType,
                columnVisibilityStates: {...this.columnVisibilityStates},
            },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(customEvent);

        this.close();
    }

    /**
     * Change visibility of a single column
     * @param {object} column - The column configuration object
     * @param {boolean} visible - Whether the column should be visible
     */
    changeColumnVisibility(column, visible) {
        // Create a new object to trigger reactivity
        const newStates = {...this.columnVisibilityStates};

        if (visible) {
            newStates[column.id] = true;
        } else {
            // Delete the state if not visible (to keep storage clean)
            delete newStates[column.id];
        }

        // Set the new object to trigger re-render
        this.columnVisibilityStates = newStates;
    }

    /**
     * Show all columns
     */
    showAllColumns() {
        // Create a new object with all columns visible
        this.columnVisibilityStates = this.columnConfigs.reduce((acc, col) => {
            acc[col.id] = true;
            return acc;
        }, {});

        // Trigger re-render
        this.requestUpdate();
    }

    /**
     * Hide all columns
     */
    hideAllColumns() {
        // Create a new empty object
        this.columnVisibilityStates = {};

        // Trigger re-render
        this.requestUpdate();
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            // language=css
            css`
                :host {
                    --dbp-modal-max-width: 650px;
                }

                .modal-content {
                    display: grid;
                    gap: 10px;
                    grid-auto-flow: row;
                    margin-right: 5px;
                }
                .modal-title {
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                }
                .modal-title h2 {
                    margin: 0;
                    font-weight: 600;
                }

                .column-config-modal-icon {
                    color: var(--dbp-accent);
                    margin-top: 2px;
                    font-size: 1.3em;
                }

                .modal-content h3 {
                    font-size: 1.17em;
                    margin-top: 0;
                    margin-bottom: 10px;
                }
                .modal-content p {
                    color: var(--dbp-muted);
                    font-size: 0.875rem;
                }

                .modal-footer {
                    display: grid;
                    padding-top: 10px;
                    margin-right: 3px;
                    grid-template-columns: 1fr auto auto 1fr;
                    gap: 10px;
                    width: 100%;
                }

                .modal-footer dbp-button:last-child {
                    justify-self: end;
                    margin-right: 3px;
                }

                .columns {
                    max-width: 100%;
                    margin: 0;
                    list-style-type: none;
                    padding: 0;
                    display: grid;
                    width: 100%;
                }

                .column-field {
                    align-items: center;
                    height: 50px;
                    border: 1px solid var(--dbp-muted);
                    display: flex;
                    margin-bottom: 5px;
                    width: 100%;
                }

                .column-button {
                    justify-content: center;
                    display: flex;
                    align-items: center;
                    height: 50px;
                    width: 50px;
                    min-width: 50px;
                    flex-grow: 0;
                    cursor: pointer;
                }

                .column-title {
                    flex-grow: 2;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    padding-left: 5px;
                    text-align: left;
                }

                .column-order {
                    background-color: var(--dbp-muted-surface);
                    color: var(--dbp-on-muted-surface);
                    font-weight: bold;
                }

                @media (max-width: 645px) {
                    .modal-footer {
                        grid-template-columns: 1fr 1fr;
                        grid-template-rows: auto auto;
                    }

                    .modal-footer dbp-button:nth-child(1) {
                        grid-area: 2 / 1;
                    }

                    .modal-footer dbp-button:nth-child(2) {
                        grid-area: 1 / 1;
                    }

                    .modal-footer dbp-button:nth-child(3) {
                        grid-area: 1 / 2;
                    }

                    .modal-footer dbp-button:nth-child(4) {
                        grid-area: 2 / 2;
                    }

                    .modal-footer dbp-button {
                        width: 100%;
                        display: grid;
                        justify-self: stretch;
                    }
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

    renderColumnVisibilityIconButton(column) {
        const visible = this.columnVisibilityStates[column.id] === true;
        const name = this._i18n.t(column.name);

        return html`
            <dbp-icon-button
                icon-name="${visible ? 'source_icons_eye-empty' : 'source_icons_eye-off'}"
                class="column-visibility-icon"
                title="${visible
                    ? this._i18n.t('selection-column-config.column-hide', {
                          name: name,
                      })
                    : this._i18n.t('selection-column-config.column-show', {
                          name: name,
                      })}"
                @click="${() => {
                    this.changeColumnVisibility(column, !visible);
                }}"></dbp-icon-button>
        `;
    }

    renderColumnListItem(column, index) {
        const i18n = this._i18n;

        return html`
            <li class="column-fields ${column.id}" data-index="${index}">
                <div class="column-field">
                    <span class="column-button column-order">${index + 1}</span>
                    <span class="column-title"><strong>${i18n.t(column.name)}</strong></span>
                    ${this.renderColumnVisibilityIconButton(column)}
                </div>
            </li>
        `;
    }

    renderColumnList() {
        if (!this.columnConfigs || this.columnConfigs.length === 0) {
            return html`
                <p>
                    ${this._i18n.t('selection-column-config.no-columns', 'No columns configured.')}
                </p>
            `;
        }

        return html`
            <ul class="columns">
                ${this.columnConfigs.map((col, index) => this.renderColumnListItem(col, index))}
            </ul>
        `;
    }

    renderContent() {
        const i18n = this._i18n;
        const typeLabel =
            this.selectionType === 'person'
                ? i18n.t('selection-dialog.persons-tab', 'Persons')
                : i18n.t('selection-dialog.documents-tab', 'Documents');

        return html`
            <div class="config-section">
                <p>
                    ${i18n.t(
                        'selection-column-config.description',
                        `Configure which columns to display for ${typeLabel}`,
                    )}
                </p>
            </div>

            ${this.renderColumnList()}
        `;
    }

    render() {
        const i18n = this._i18n;
        const buttonsDisabled =
            !this.columnConfigs ||
            this.columnConfigs.length === 0 ||
            !this.settingsLocalStoragePrefix;

        console.log('SelectionColumnConfiguration render:', {
            columnConfigs: this.columnConfigs?.length,
            settingsLocalStoragePrefix: this.settingsLocalStoragePrefix,
            buttonsDisabled: buttonsDisabled,
        });

        return html`
            <dbp-modal
                ${ref(this.modalRef)}
                id="selection-column-configuration"
                modal-id="selection-column-configuration"
                width="600px"
                height="80%"
                min-width="300px"
                min-height="80%"
                subscribe="lang"
                sticky-footer
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="title" class="modal-title">
                    <dbp-icon
                        title="${i18n.t('selection-column-config.title', 'Column Configuration')}"
                        class="column-config-modal-icon"
                        name="cog"></dbp-icon>
                    <h2>${i18n.t('selection-column-config.title', 'Column Configuration')}</h2>
                    
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
                        title="${i18n.t('selection-column-config.abort', 'Abort')}"
                        type="is-secondary"
                        no-spinner-on-click
                        @click="${this.close}">
                        <dbp-icon
                        <dbp-icon
                            name="close"
                            aria-hidden="true"></dbp-icon>
                        ${i18n.t('selection-column-config.abort', 'Abort')}
                    </dbp-button>

                    <dbp-button
                        title="${i18n.t('selection-column-config.all-columns-hide', 'Hide All')}"
                        type="is-secondary"
                        no-spinner-on-click
                        ?disabled="${buttonsDisabled}"
                        @click="${this.hideAllColumns}">
                        <dbp-icon
                            
                            name="source_icons_eye-off"
                            aria-hidden="true"></dbp-icon>
                        ${i18n.t('selection-column-config.all-columns-hide', 'Hide All')}
                    </dbp-button>
                    <dbp-button
                        title="${i18n.t('selection-column-config.all-columns-show', 'Show All')}"
                        type="is-secondary"
                        no-spinner-on-click
                        ?disabled=${buttonsDisabled}
                        @click="${this.showAllColumns}">
                        <dbp-icon
                            
                            name="source_icons_eye-empty"
                            aria-hidden="true"></dbp-icon>
                        ${i18n.t('selection-column-config.all-columns-show', 'Show All')}
                    </dbp-button>

                    <dbp-button
                        title="${i18n.t('selection-column-config.save', 'Save')}"
                        type="is-primary"
                        ${ref(this.storeSettingsButtonRef)}
                        ?disabled=${buttonsDisabled}
                        @click="${this.storeSettings}">
                        <dbp-icon  name="save" aria-hidden="true"></dbp-icon>
                        ${i18n.t('selection-column-config.save', 'Save')}
                    </dbp-button>
                </div>
            </dbp-modal>
        `;
    }
}

customElements.define('dbp-selection-column-configuration', SelectionColumnConfiguration);
