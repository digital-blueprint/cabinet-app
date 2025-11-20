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

export class SelectionDialog extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.personTableRef = createRef();
        this.documentTableRef = createRef();
        this.hitSelections = this.constructor.EmptyHitSelection;
        this.facetNumber = 0;
        this.activeTab = this.constructor.HitSelectionType.PERSON;
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
            'dbp-tabulator-table': TabulatorTable,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitSelections: {type: Object, attribute: false},
            activeTab: {type: String, attribute: false},
        };
    }

    async open(hitSelections) {
        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        this.hitSelections = hitSelections;

        // Rerender the modal content
        this.requestUpdate();

        console.log('open modal', modal);
        console.log('open this.hitSelections', this.hitSelections);
        modal.open();
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

        // Prepare data for person table
        const personTableData = personSelections.map((id, index) => ({
            rowNumber: index + 1,
            id: id,
            actions: '',
        }));

        // Prepare data for document table
        const documentTableData = documentSelections.map((id, index) => ({
            rowNumber: index + 1,
            id: id,
            actions: '',
        }));

        // Table options for persons
        const personTableOptions = {
            layout: 'fitColumns',
            langs: {
                en: {
                    columns: {
                        rowNumber: '#',
                        id: 'ID',
                        actions: i18n.t('selection-dialog.actions', {lng: 'en'}),
                    },
                },
                de: {
                    columns: {
                        rowNumber: '#',
                        id: 'ID',
                        actions: i18n.t('selection-dialog.actions', {lng: 'de'}),
                    },
                },
            },
            columns: [
                {
                    title: 'rowNumber',
                    field: 'rowNumber',
                    width: 60,
                    hozAlign: 'center',
                },
                {
                    title: 'id',
                    field: 'id',
                    widthGrow: 2,
                },
                {
                    title: 'actions',
                    field: 'actions',
                    width: 80,
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const button = document.createElement('dbp-icon-button');
                        button.setAttribute('icon-name', 'trash');
                        button.setAttribute('title', i18n.t('selection-dialog.remove', 'Remove'));
                        button.addEventListener('click', () => {
                            const rowData = cell.getRow().getData();
                            this.removeSelection(
                                this.constructor.HitSelectionType.PERSON,
                                rowData.id,
                            );
                        });
                        return button;
                    },
                },
            ],
        };

        // Table options for documents
        const documentTableOptions = {
            layout: 'fitColumns',
            langs: {
                en: {
                    columns: {
                        rowNumber: '#',
                        id: 'ID',
                        actions: i18n.t('selection-dialog.actions', {lng: 'en'}),
                    },
                },
                de: {
                    columns: {
                        rowNumber: '#',
                        id: 'ID',
                        actions: i18n.t('selection-dialog.actions', {lng: 'de'}),
                    },
                },
            },
            columns: [
                {
                    title: 'rowNumber',
                    field: 'rowNumber',
                    width: 60,
                    hozAlign: 'center',
                },
                {
                    title: 'id',
                    field: 'id',
                    widthGrow: 2,
                },
                {
                    title: 'actions',
                    field: 'actions',
                    width: 80,
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const button = document.createElement('dbp-icon-button');
                        button.setAttribute('icon-name', 'trash');
                        button.setAttribute('title', i18n.t('selection-dialog.remove', 'Remove'));
                        button.addEventListener('click', () => {
                            const rowData = cell.getRow().getData();
                            this.removeSelection(
                                this.constructor.HitSelectionType.DOCUMENT_FILE,
                                rowData.id,
                            );
                        });
                        return button;
                    },
                },
            ],
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

        // Request update to re-render with new data
        this.requestUpdate();

        // Dispatch event to notify parent component
        this.dispatchEvent(
            new CustomEvent('selection-removed', {
                detail: {type, id},
                bubbles: true,
                composed: true,
            }),
        );
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // Build tables after render
        if (changedProperties.has('hitSelections') || changedProperties.has('activeTab')) {
            this.updateComplete.then(() => {
                // Build person table if it exists and has content
                const personTable = this.personTableRef.value;
                if (personTable && !personTable.tableReady) {
                    personTable.buildTable();
                }

                // Build document table if it exists and has content
                const documentTable = this.documentTableRef.value;
                if (documentTable && !documentTable.tableReady) {
                    documentTable.buildTable();
                }
            });
        }
    }

    render() {
        // const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            ${this.getModalHtml()}
        `;
    }
}
