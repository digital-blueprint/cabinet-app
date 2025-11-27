import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {IconButton, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {TabulatorTable} from '@dbp-toolkit/tabulator-table';
import {
    scopedElements as modalNotificationScopedElements,
    sendModalNotification,
} from '../modules/modal-notification';
import {SelectionColumnConfiguration} from './selection-column-configuration';

export class SelectionDialog extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.personTableRef = createRef();
        this.documentTableRef = createRef();
        this.personColumnConfigRef = createRef();
        this.documentColumnConfigRef = createRef();
        this.hitSelections = this.constructor.EmptyHitSelection;
        this.facetNumber = 0;
        this.activeTab = this.constructor.HitSelectionType.PERSON;
        this.personGearButton = null;
        this.documentGearButton = null;
        this.personColumnVisibilityStates = {};
        this.documentColumnVisibilityStates = {};
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
            'dbp-tabulator-table': TabulatorTable,
            'dbp-selection-column-configuration': SelectionColumnConfiguration,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitSelections: {type: Object, attribute: false},
            activeTab: {type: String, attribute: false},
            personColumnVisibilityStates: {type: Object, attribute: false},
            documentColumnVisibilityStates: {type: Object, attribute: false},
        };
    }

    async open(hitSelections) {
        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        this.hitSelections = hitSelections;

        // Reset gear buttons to ensure clean state
        this.personGearButton = null;
        this.documentGearButton = null;

        // Load column visibility states
        this.loadColumnVisibilityStates();

        // Rerender the modal content
        await this.requestUpdate();

        console.log('open modal', modal);
        console.log('open this.hitSelections', this.hitSelections);
        modal.open();

        // Build tables after modal is opened and content is rendered
        await this.updateComplete;
        this.buildTablesIfNeeded();
    }

    /**
     * Load column visibility states from localStorage
     */
    loadColumnVisibilityStates() {
        if (!this.settingsLocalStoragePrefix) {
            // Initialize with defaults
            this.personColumnVisibilityStates = this.getDefaultColumnVisibility('person');
            this.documentColumnVisibilityStates = this.getDefaultColumnVisibility('document');
            return;
        }

        // Load person column visibility
        const personKey = `${this.settingsLocalStoragePrefix}columnVisibilityStates:person`;
        try {
            const saved = JSON.parse(localStorage.getItem(personKey));
            this.personColumnVisibilityStates = saved || this.getDefaultColumnVisibility('person');
        } catch (e) {
            console.warn('Failed to load person column visibility states', e);
            this.personColumnVisibilityStates = this.getDefaultColumnVisibility('person');
        }

        // Load document column visibility
        const documentKey = `${this.settingsLocalStoragePrefix}columnVisibilityStates:document`;
        try {
            const saved = JSON.parse(localStorage.getItem(documentKey));
            this.documentColumnVisibilityStates =
                saved || this.getDefaultColumnVisibility('document');
        } catch (e) {
            console.warn('Failed to load document column visibility states', e);
            this.documentColumnVisibilityStates = this.getDefaultColumnVisibility('document');
        }
    }

    /**
     * Get default column visibility
     * @param type
     */
    getDefaultColumnVisibility(type) {
        const columns =
            type === 'person'
                ? SelectionColumnConfiguration.getPersonColumns()
                : SelectionColumnConfiguration.getDocumentColumns();

        return columns.reduce((acc, col) => {
            if (col.defaultVisible) {
                acc[col.id] = true;
            }
            return acc;
        }, {});
    }

    /**
     * Handle column settings stored event
     * @param {CustomEvent} e - The column settings stored event
     */
    async onColumnSettingsStored(e) {
        const {selectionType, columnVisibilityStates} = e.detail;

        if (selectionType === 'person') {
            this.personColumnVisibilityStates = columnVisibilityStates;
        } else if (selectionType === 'document') {
            this.documentColumnVisibilityStates = columnVisibilityStates;
        }

        // Rebuild the tables with new columns
        await this.requestUpdate();
        await this.updateComplete;

        // Force rebuild the tables with new column configuration
        const personTable = this.personTableRef.value;
        const documentTable = this.documentTableRef.value;

        if (selectionType === 'person' && personTable) {
            if (personTable.tabulatorTable) {
                // Destroy and rebuild the table with new columns
                personTable.tabulatorTable.destroy();
                personTable.tableReady = false;
            }
            personTable.buildTable();
        } else if (selectionType === 'document' && documentTable) {
            if (documentTable.tabulatorTable) {
                // Destroy and rebuild the table with new columns
                documentTable.tabulatorTable.destroy();
                documentTable.tableReady = false;
            }
            documentTable.buildTable();
        }
    }

    close() {
        /**
         * @type {Modal}
         */
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
                    --dbp-modal-max-width: 900px;
                }

                .modal-container {
                    display: grid;
                    grid-template-columns: 150px 1fr;
                    gap: 0;
                    height: 100%;
                    min-height: 400px;
                }

                .modal-nav {
                    cursor: pointer;
                    overflow: hidden;
                    background-color: var(--dbp-background);
                    border-right: var(--dbp-border);
                    display: flex;
                    flex-direction: column;
                }

                .modal-nav > button {
                    padding: 15px 10px;
                    text-align: center;
                    width: 100%;
                    background-color: var(--dbp-background);
                    color: var(--dbp-content);
                    border: 0;
                    border-left: 3px solid transparent;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .modal-nav > button:hover {
                    background-color: var(--dbp-hover-background-color, rgba(0, 0, 0, 0.05));
                }

                .modal-nav > button:focus-visible {
                    box-shadow: inset 0px 0px 3px 1px var(--dbp-primary);
                }

                .modal-nav .nav-icon {
                    width: 35px;
                    height: 35px;
                }

                .modal-nav .active {
                    border-left-color: var(--dbp-accent);
                }

                .modal-nav .active p {
                    font-weight: bold;
                }

                .modal-nav .active .nav-icon {
                    color: var(--dbp-accent);
                }

                .modal-nav p {
                    margin: 0;
                    font-size: 0.875rem;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: center;
                }

                .tab-content {
                    display: none;
                    padding: 20px;
                    overflow-y: auto;
                }

                .tab-content.active {
                    display: block;
                }

                .tab-content h3 {
                    margin-top: 0;
                }

                .selection-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .selection-list li {
                    padding: 10px;
                    border-bottom: 1px solid var(--dbp-muted);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .selection-list li:last-child {
                    border-bottom: none;
                }

                .selection-count {
                    background-color: var(--dbp-accent);
                    color: white;
                    border-radius: 12px;
                    padding: 2px 8px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    min-width: 20px;
                    text-align: center;
                }
            `,
        ];
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getModalHtml() {
        const i18n = this._i18n;

        return html`
            <dbp-modal
                ${ref(this.modalRef)}
                id="selection-dialog"
                modal-id="selection-dialog"
                width="600px"
                height="80%"
                min-width="300px"
                min-height="80%"
                subscribe="lang"
                sticky-footer
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="title" class="modal-title">
                    <dbp-icon
                        title="${i18n.t('selection-dialog.batch-operations')}"
                        name="cog"></dbp-icon>
                    <h2>${i18n.t('selection-dialog.batch-operations')}</h2>
                </div>
                <div slot="header" class="header">
                    <div class="modal-notification">
                        <dbp-notification
                            id="modal-notification"
                            inline
                            lang="${this.lang}"></dbp-notification>
                    </div>
                </div>
                <div slot="content" class="modal-content">${this.renderContent()}</div>
                <div slot="footer" class="modal-footer"></div>
            </dbp-modal>
        `;
    }

    /**
     * Sends a notification to the filter modal
     * @param summary Summary of the notification
     * @param body Body of the notification
     * @param type Type can be info/success/warning/danger
     * @param timeout Timeout in seconds, 0 means no timeout
     */
    sendFilterModalNotification(summary, body, type = 'info', timeout = null) {
        sendModalNotification(
            'modal-notification',
            summary,
            body,
            type,
            timeout,
            'save-filter-settings',
        );
    }

    /**
     * Get value from object using dot notation path
     * @param obj
     * @param path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Build table columns based on visibility configuration
     * @param type
     * @param gearButtonRef
     * @param gearButtonCallback
     */
    buildTableColumns(type, gearButtonRef, gearButtonCallback) {
        const i18n = this._i18n;
        const columns = [];
        const columnConfigs =
            type === 'person'
                ? SelectionColumnConfiguration.getPersonColumns()
                : SelectionColumnConfiguration.getDocumentColumns();
        const visibilityStates =
            type === 'person'
                ? this.personColumnVisibilityStates
                : this.documentColumnVisibilityStates;

        // Add row number column
        columns.push({
            title: 'rowNumber',
            field: 'rowNumber',
            width: 60,
            hozAlign: 'center',
        });

        // Add visible data columns
        columnConfigs.forEach((colConfig) => {
            if (visibilityStates[colConfig.id] === true) {
                columns.push({
                    title: i18n.t(colConfig.name),
                    field: colConfig.id,
                    widthGrow: 1,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        if (value === null || value === undefined) {
                            return '';
                        }
                        // Format dates if needed
                        if (colConfig.field.includes('Timestamp')) {
                            return new Date(value * 1000).toLocaleString(this.lang);
                        }
                        return value;
                    },
                });
            }
        });

        // Add actions column with gear button and delete button
        columns.push({
            title: 'actions',
            field: 'actions',
            width: 80,
            hozAlign: 'center',
            headerSort: false,
            titleFormatter: (cell) => {
                if (gearButtonRef) {
                    return gearButtonRef;
                }

                const button = this.createScopedElement('dbp-icon-button');
                button.setAttribute('icon-name', 'cog');
                button.setAttribute(
                    'title',
                    i18n.t('selection-dialog.configure-columns', 'Configure Columns'),
                );
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    gearButtonCallback();
                });
                button.style.position = 'relative';
                button.style.left = '16px';

                if (type === 'person') {
                    this.personGearButton = button;
                } else {
                    this.documentGearButton = button;
                }

                return button;
            },
            formatter: (cell) => {
                const button = this.createScopedElement('dbp-icon-button');
                button.setAttribute('icon-name', 'trash');
                button.setAttribute('title', i18n.t('selection-dialog.remove', 'Remove'));
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rowData = cell.getRow().getData();
                    const selectionType =
                        type === 'person'
                            ? this.constructor.HitSelectionType.PERSON
                            : this.constructor.HitSelectionType.DOCUMENT_FILE;
                    this.removeSelection(selectionType, rowData.id);
                });
                return button;
            },
        });

        return columns;
    }

    /**
     * Build table data with all field values
     * @param type
     * @param selections
     */
    buildTableData(type, selections) {
        const columnConfigs =
            type === 'person'
                ? SelectionColumnConfiguration.getPersonColumns()
                : SelectionColumnConfiguration.getDocumentColumns();

        return selections.map((id, index) => {
            const hit =
                this.hitSelections[
                    type === 'person'
                        ? this.constructor.HitSelectionType.PERSON
                        : this.constructor.HitSelectionType.DOCUMENT_FILE
                ][id];

            const rowData = {
                rowNumber: index + 1,
                id: id,
                actions: '',
            };

            // Add all field values
            columnConfigs.forEach((colConfig) => {
                if (hit) {
                    rowData[colConfig.id] = this.getNestedValue(hit, colConfig.field);
                }
            });

            return rowData;
        });
    }

    /**
     * Build table languages config
     * @param type
     */
    buildTableLangs(type) {
        const i18n = this._i18n;
        const columnConfigs =
            type === 'person'
                ? SelectionColumnConfiguration.getPersonColumns()
                : SelectionColumnConfiguration.getDocumentColumns();

        const langs = {
            en: {
                columns: {rowNumber: '#', actions: i18n.t('selection-dialog.actions', {lng: 'en'})},
            },
            de: {
                columns: {rowNumber: '#', actions: i18n.t('selection-dialog.actions', {lng: 'de'})},
            },
        };

        // Add column names
        columnConfigs.forEach((colConfig) => {
            langs.en.columns[colConfig.id] = i18n.t(colConfig.name, {lng: 'en'});
            langs.de.columns[colConfig.id] = i18n.t(colConfig.name, {lng: 'de'});
        });

        return langs;
    }

    renderContent() {
        const i18n = this._i18n;
        console.log('renderContent hitSelections', this.hitSelections);

        if (!this.hitSelections) {
            return html`
                <p>No items found.</p>
            `;
        }

        const personSelections = Object.keys(
            this.hitSelections[this.constructor.HitSelectionType.PERSON] || {},
        );
        const documentSelections = Object.keys(
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {},
        );

        // Build table data with all field values
        const personTableData = this.buildTableData('person', personSelections);
        const documentTableData = this.buildTableData('document', documentSelections);

        // Build table options for persons
        const personTableOptions = {
            layout: 'fitColumns',
            langs: this.buildTableLangs('person'),
            columns: this.buildTableColumns('person', this.personGearButton, () =>
                this.openColumnConfiguration('person'),
            ),
        };

        // Build table options for documents
        const documentTableOptions = {
            layout: 'fitColumns',
            langs: this.buildTableLangs('document'),
            columns: this.buildTableColumns('document', this.documentGearButton, () =>
                this.openColumnConfiguration('document'),
            ),
        };

        return html`
            <div class="modal-container">
                <div class="modal-nav" role="tablist">
                    <button
                        role="tab"
                        aria-selected="${this.activeTab ===
                        this.constructor.HitSelectionType.PERSON}"
                        aria-controls="select-persons"
                        title="${i18n.t('selection-dialog.persons-tab', 'Personen')}"
                        @click="${() => {
                            this.activeTab = this.constructor.HitSelectionType.PERSON;
                        }}"
                        class="${this.activeTab === this.constructor.HitSelectionType.PERSON
                            ? 'active'
                            : ''}">
                        <dbp-icon class="nav-icon" name="user"></dbp-icon>
                        <p>
                            ${i18n.t('selection-dialog.persons-tab', 'Personen')}
                            <span class="selection-count">${personSelections.length}</span>
                        </p>
                    </button>
                    <button
                        role="tab"
                        aria-selected="${this.activeTab ===
                        this.constructor.HitSelectionType.DOCUMENT_FILE}"
                        aria-controls="select-documents"
                        title="${i18n.t('selection-dialog.documents-tab', 'Dokumente')}"
                        @click="${() => {
                            this.activeTab = this.constructor.HitSelectionType.DOCUMENT_FILE;
                        }}"
                        class="${this.activeTab === this.constructor.HitSelectionType.DOCUMENT_FILE
                            ? 'active'
                            : ''}">
                        <dbp-icon class="nav-icon" name="files"></dbp-icon>
                        <p>
                            ${i18n.t('selection-dialog.documents-tab', 'Dokumente')}
                            <span class="selection-count">${documentSelections.length}</span>
                        </p>
                    </button>
                </div>

                <div class="tab-panels">
                    <div
                        id="select-persons"
                        role="tabpanel"
                        class="tab-content ${this.activeTab ===
                        this.constructor.HitSelectionType.PERSON
                            ? 'active'
                            : ''}">
                        <h3>${i18n.t('selection-dialog.persons-title', 'Selected Persons')}</h3>
                        ${personSelections.length > 0
                            ? html`
                                  <dbp-tabulator-table
                                      ${ref(this.personTableRef)}
                                      lang="${this.lang}"
                                      class="selection-table"
                                      identifier="person-selection-table"
                                      .data=${personTableData}
                                      .options=${personTableOptions}></dbp-tabulator-table>
                              `
                            : html`
                                  <p>
                                      ${i18n.t(
                                          'selection-dialog.no-persons',
                                          'No persons selected.',
                                      )}
                                  </p>
                              `}
                    </div>

                    <div
                        id="select-documents"
                        role="tabpanel"
                        class="tab-content ${this.activeTab ===
                        this.constructor.HitSelectionType.DOCUMENT_FILE
                            ? 'active'
                            : ''}">
                        <h3>${i18n.t('selection-dialog.documents-title', 'Selected Documents')}</h3>
                        ${documentSelections.length > 0
                            ? html`
                                  <dbp-tabulator-table
                                      ${ref(this.documentTableRef)}
                                      lang="${this.lang}"
                                      class="selection-table"
                                      identifier="document-selection-table"
                                      .data=${documentTableData}
                                      .options=${documentTableOptions}></dbp-tabulator-table>
                              `
                            : html`
                                  <p>
                                      ${i18n.t(
                                          'selection-dialog.no-documents',
                                          'No documents selected.',
                                      )}
                                  </p>
                              `}
                    </div>
                </div>
            </div>
        `;
    }

    onCloseModal() {
        // Send a close event to the parent component
        this.dispatchEvent(
            new CustomEvent('close', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    removeSelection(type, id) {
        console.log('removeSelection', type, id);
        // Create a new object to trigger reactivity
        const newSelections = {...this.hitSelections};
        delete newSelections[type][id];
        this.hitSelections = newSelections;

        // Update the table data immediately
        this.updateTableData(type);

        // Dispatch event to notify parent component
        this.dispatchEvent(
            new CustomEvent('selection-removed', {
                detail: {type, id},
                bubbles: true,
                composed: true,
            }),
        );
    }

    updateTableData(type) {
        // Get the selections for the type
        const selections = Object.keys(this.hitSelections[type] || {});

        // Prepare the new data with all field values
        const tableType = type === this.constructor.HitSelectionType.PERSON ? 'person' : 'document';
        const tableData = this.buildTableData(tableType, selections);

        // Update the appropriate table
        if (type === this.constructor.HitSelectionType.PERSON) {
            const personTable = this.personTableRef.value;
            if (personTable && personTable.tabulatorTable) {
                personTable.tabulatorTable.setData(tableData);
            }
        } else if (type === this.constructor.HitSelectionType.DOCUMENT_FILE) {
            const documentTable = this.documentTableRef.value;
            if (documentTable && documentTable.tabulatorTable) {
                documentTable.tabulatorTable.setData(tableData);
            }
        }
    }

    buildTablesIfNeeded() {
        // Build person table if it exists and hasn't been built yet
        const personTable = this.personTableRef.value;
        if (personTable && !personTable.tableReady) {
            console.log('Building person table');
            personTable.buildTable();
        }

        // Build document table if it exists and hasn't been built yet
        const documentTable = this.documentTableRef.value;
        if (documentTable && !documentTable.tableReady) {
            console.log('Building document table');
            documentTable.buildTable();
        }
    }

    openColumnConfiguration(type) {
        console.log('openColumnConfiguration', type);
        if (type === 'person') {
            const configDialog = this.personColumnConfigRef.value;
            if (configDialog) {
                configDialog.open(type);
            }
        } else if (type === 'document') {
            const configDialog = this.documentColumnConfigRef.value;
            if (configDialog) {
                configDialog.open(type);
            }
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // Build tables after render
        if (changedProperties.has('hitSelections') || changedProperties.has('activeTab')) {
            this.updateComplete.then(() => {
                this.buildTablesIfNeeded();
            });
        }
    }

    render() {
        // const i18n = this._i18n;
        console.log('-- Render SelectionDialog --', {
            auth: this.auth,
            settingsLocalStoragePrefix: this.settingsLocalStoragePrefix,
        });

        return html`
            ${this.getModalHtml()}
            <dbp-selection-column-configuration
                ${ref(this.personColumnConfigRef)}
                lang="${this.lang}"
                .auth="${this.auth}"
                @columnSettingsStored="${this
                    .onColumnSettingsStored}"></dbp-selection-column-configuration>
            <dbp-selection-column-configuration
                ${ref(this.documentColumnConfigRef)}
                lang="${this.lang}"
                .auth="${this.auth}"
                @columnSettingsStored="${this
                    .onColumnSettingsStored}"></dbp-selection-column-configuration>
        `;
    }
}
