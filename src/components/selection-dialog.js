import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {IconButton, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {TabulatorTable} from '@dbp-toolkit/tabulator-table';
import {FileSink} from '@dbp-toolkit/file-handling';
import {
    scopedElements as modalNotificationScopedElements,
    sendModalNotification,
} from '../modules/modal-notification';
import {SelectionColumnConfiguration} from './selection-column-configuration';
import {BlobOperations} from '../utils/blob-operations';
import {dataURLtoFile} from '../utils';
import {getSelectorFixCSS} from '../styles.js';
import {TypesenseService} from '../services/typesense.js';
import {getPersonHit} from '../objectTypes/schema.js';
import InstantSearchModule from '../modules/instantSearch.js';
import {exportPersonPdf} from '../objectTypes/person.js';

export class SelectionDialog extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.personTableRef = createRef();
        this.documentTableRef = createRef();
        this.deletedDocumentTableRef = createRef();
        this.personColumnConfigRef = createRef();
        this.documentColumnConfigRef = createRef();
        this.fileSinkRef = createRef();
        this.hitSelections = this.constructor.EmptyHitSelection;
        this.facetNumber = 0;
        this.activeTab = this.constructor.HitSelectionType.PERSON;
        this.activeDocumentTab = 'active'; // 'active' or 'deleted'
        this.personGearButton = null;
        this.documentGearButton = null;
        this.deletedDocumentGearButton = null;
        // Initialize with default visibility states so tables render correctly on first load
        this.personColumnVisibilityStates = this.getDefaultColumnVisibility('person');
        this.documentColumnVisibilityStates = this.getDefaultColumnVisibility('document');
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
            'dbp-tabulator-table': TabulatorTable,
            'dbp-selection-column-configuration': SelectionColumnConfiguration,
            'dbp-file-sink': FileSink,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitSelections: {type: Object, attribute: false},
            activeTab: {type: String, attribute: false},
            activeDocumentTab: {type: String, attribute: false},
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

        // // Clean up old selections that only have 'true' instead of actual hit objects
        // const cleanedSelections = {};
        // let removedCount = 0;
        // const removedItems = [];
        //
        // for (const type in hitSelections) {
        //     cleanedSelections[type] = {};
        //     for (const id in hitSelections[type]) {
        //         const hit = hitSelections[type][id];
        //         // Only keep selections that have actual hit objects
        //         if (hit && typeof hit === 'object' && hit !== true) {
        //             cleanedSelections[type][id] = hit;
        //         } else {
        //             removedCount++;
        //             removedItems.push({type, id});
        //             console.warn(`Removing old selection ${id} of type ${type} (no hit data)`);
        //         }
        //     }
        // }
        //
        // if (removedCount > 0) {
        //     console.warn(
        //         `Removed ${removedCount} old selections without hit data. Please reselect these items.`,
        //     );
        //
        //     // Notify parent to update its hitSelections
        //     for (const item of removedItems) {
        //         this.dispatchEvent(
        //             new CustomEvent('selection-removed', {
        //                 detail: {type: item.type, id: item.id},
        //                 bubbles: true,
        //                 composed: true,
        //             }),
        //         );
        //     }
        // }
        //
        // this.hitSelections = cleanedSelections;
        // console.log('open cleanedSelections', cleanedSelections);

        // Reset gear buttons to ensure clean state
        this.personGearButton = null;
        this.documentGearButton = null;
        this.deletedDocumentGearButton = null;

        // Reset to active documents tab
        this.activeDocumentTab = 'active';

        // Set the active tab based on whether there are person selections
        const personSelections = hitSelections[this.constructor.HitSelectionType.PERSON] || {};
        const documentSelections =
            hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};
        const hasPersonSelections = Object.keys(personSelections).length > 0;
        const hasDocumentSelections = Object.keys(documentSelections).length > 0;

        // If no person was selected but there are documents, open the Documents tab
        // Otherwise, default to Persons tab
        if (!hasPersonSelections && hasDocumentSelections) {
            this.activeTab = this.constructor.HitSelectionType.DOCUMENT_FILE;
        } else {
            this.activeTab = this.constructor.HitSelectionType.PERSON;
        }

        // Load column visibility states
        this.loadColumnVisibilityStates();

        // Rerender the modal content with new data
        await this.requestUpdate();

        console.log('open modal', modal);
        console.log('open this.hitSelections', this.hitSelections);
        modal.open();

        // Wait for the content to render and tables to receive their properties
        await this.updateComplete;

        // Give the table components time to process their reactive property updates
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Now build the tables
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
        const deletedDocumentTable = this.deletedDocumentTableRef.value;

        if (selectionType === 'person' && personTable) {
            if (personTable.tabulatorTable) {
                // Destroy and rebuild the table with new columns
                personTable.tabulatorTable.destroy();
                personTable.tableReady = false;
            }
            personTable.buildTable();
        } else if (selectionType === 'document') {
            // Rebuild active documents table
            if (documentTable) {
                if (documentTable.tabulatorTable) {
                    documentTable.tabulatorTable.destroy();
                    documentTable.tableReady = false;
                }
                documentTable.buildTable();
            }

            // Rebuild deleted documents table
            if (deletedDocumentTable) {
                if (deletedDocumentTable.tabulatorTable) {
                    deletedDocumentTable.tabulatorTable.destroy();
                    deletedDocumentTable.tableReady = false;
                }
                deletedDocumentTable.buildTable();
            }
        }

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;

        // This a very crude, yet effective workaround to prevent a horizontal scrollbar after column changes
        // All more same methods seemed to fail
        modal.close();
        setTimeout(() => {
            modal.open();
        }, 100);
    }

    close() {
        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        modal.close();
    }

    /**
     * Schedule all active documents for deletion
     */
    async scheduleActiveDocumentsForDeletion() {
        const i18n = this._i18n;
        const documentSelections =
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};

        // Get active documents only
        const activeDocuments = Object.entries(documentSelections).filter(
            ([_id, hit]) => hit && typeof hit === 'object' && !hit.base?.isScheduledForDeletion,
        );

        if (activeDocuments.length === 0) {
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const successfulIds = [];

        for (const [id, hit] of activeDocuments) {
            try {
                const fileId = hit.file?.base?.fileId;
                const objectType = hit.objectType;
                if (!fileId) {
                    console.error('No file identifier found for document', id);
                    failCount++;
                    continue;
                }
                if (!objectType) {
                    console.error('No objectType found for document', id);
                    failCount++;
                    continue;
                }

                await this.doFileDeletionForFileId(fileId, objectType, false);

                // Update the hit data locally
                hit.base.isScheduledForDeletion = true;
                successCount++;
                successfulIds.push(id);
            } catch (error) {
                console.error('Failed to delete document', id, error);
                failCount++;
            }
        }

        // Show notification
        if (successCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.deletion-success'),
                i18n.t('selection-dialog.deletion-success-message', {
                    count: successCount,
                }),
                'success',
            );
            // Clear only successfully deleted items
            this.clearSelectionItems(
                this.constructor.HitSelectionType.DOCUMENT_FILE,
                successfulIds,
            );
        }

        if (failCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.deletion-error'),
                i18n.t('selection-dialog.deletion-error-message', {
                    count: failCount,
                }),
                'danger',
            );
        }

        // Trigger a re-render
        await this.requestUpdate();
        this.updateTableData(this.constructor.HitSelectionType.DOCUMENT_FILE);
    }

    /**
     * Undelete all deleted documents
     */
    async undeleteDeletedDocuments() {
        const i18n = this._i18n;
        const documentSelections =
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};

        // Get deleted documents only
        const deletedDocuments = Object.entries(documentSelections).filter(
            ([_id, hit]) => hit && typeof hit === 'object' && hit.base?.isScheduledForDeletion,
        );

        if (deletedDocuments.length === 0) {
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const successfulIds = [];

        for (const [id, hit] of deletedDocuments) {
            try {
                const fileId = hit.file?.base?.fileId;
                const objectType = hit.objectType;
                if (!fileId) {
                    console.error('No file identifier found for document', id);
                    failCount++;
                    continue;
                }
                if (!objectType) {
                    console.error('No objectType found for document', id);
                    failCount++;
                    continue;
                }

                await this.doFileDeletionForFileId(fileId, objectType, true);

                // Update the hit data locally
                hit.base.isScheduledForDeletion = false;
                successCount++;
                successfulIds.push(id);
            } catch (error) {
                console.error('Failed to undelete document', id, error);
                failCount++;
            }
        }

        // Show notification
        if (successCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.undeletion-success'),
                i18n.t('selection-dialog.undeletion-success-message', {
                    count: successCount,
                }),
                'success',
            );
            // Clear only successfully undeleted items
            this.clearSelectionItems(
                this.constructor.HitSelectionType.DOCUMENT_FILE,
                successfulIds,
            );
        }

        if (failCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.undeletion-error'),
                i18n.t('selection-dialog.undeletion-error-message', {
                    count: failCount,
                }),
                'danger',
            );
        }

        // Trigger a re-render
        await this.requestUpdate();
        this.updateTableData(this.constructor.HitSelectionType.DOCUMENT_FILE);
    }

    /**
     * Delete a file by ID (schedule for deletion)
     * @param {string} fileId - The file identifier
     * @param {string} objectType - The object type (e.g., 'file-cabinet-document')
     * @param {boolean} undelete - Whether to undelete the file
     */
    async doFileDeletionForFileId(fileId, objectType, undelete = false) {
        return BlobOperations.doFileDeletionForFileId(
            this.entryPointUrl,
            this.auth.token,
            fileId,
            objectType,
            undelete,
        );
    }

    /**
     * Export all persons based on selector value
     * @param {Event} e - The change event from the selector
     */
    async exportPersons(e) {
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        // Reset selector immediately before async operations
        e.target.selectedIndex = 0;

        const i18n = this._i18n;
        const personSelections = this.hitSelections[this.constructor.HitSelectionType.PERSON] || {};

        const persons = Object.entries(personSelections);

        if (persons.length === 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-error'),
                i18n.t('selection-dialog.no-persons-to-export'),
                'warning',
            );
            return;
        }

        let successCount = 0;
        let failCount = 0;

        try {
            switch (selectorValue) {
                case 'csv':
                    await this.exportPersonsAsCSV(persons);
                    successCount = persons.length;
                    break;
                case 'excel':
                    await this.exportPersonsAsExcel(persons);
                    successCount = persons.length;
                    break;
                case 'pdf':
                    await this.exportPersonsAsPDF(persons);
                    successCount = persons.length;
                    break;
                case 'attachments': {
                    const result = await this.exportPersonsAttachments(persons);
                    successCount = result.successCount;
                    failCount = result.failCount;
                    break;
                }
                default:
                    return;
            }

            if (successCount > 0) {
                this.sendFilterModalNotification(
                    i18n.t('selection-dialog.persons-export-success'),
                    i18n.t('selection-dialog.persons-export-success-message', {
                        count: successCount,
                    }),
                    'success',
                );
            }

            if (failCount > 0) {
                this.sendFilterModalNotification(
                    i18n.t('selection-dialog.export-error'),
                    i18n.t('selection-dialog.export-error-message', {
                        count: failCount,
                    }),
                    'danger',
                );
            }
        } catch (error) {
            console.error('Failed to export persons', error);
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-error'),
                error.message,
                'danger',
            );
        }
    }

    /**
     * Export persons as CSV
     * @param {Array} persons - Array of [id, hit] tuples
     */
    async exportPersonsAsCSV(persons) {
        const i18n = this._i18n;
        const instantSearchModule = new InstantSearchModule();
        const columnConfigs = instantSearchModule.getPersonColumns();

        // CSV header
        const headers = columnConfigs.map((col) => i18n.t(col.name));
        let csvContent = headers.join(',') + '\n';

        // CSV rows
        persons.forEach(([, hit]) => {
            if (hit && typeof hit === 'object' && hit !== null && hit !== true) {
                const row = columnConfigs.map((col) => {
                    const value = this.getNestedValue(hit, col.field);
                    if (value === null || value === undefined) {
                        return '';
                    }
                    // Escape CSV values
                    let strValue = String(value);
                    if (
                        strValue.includes(',') ||
                        strValue.includes('"') ||
                        strValue.includes('\n')
                    ) {
                        strValue = '"' + strValue.replace(/"/g, '""') + '"';
                    }
                    return strValue;
                });
                csvContent += row.join(',') + '\n';
            }
        });

        // Download CSV
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const file = new File([blob], 'persons_export.csv', {type: 'text/csv'});
        this.fileSinkRef.value.files = [file];

        // Close modal to show FileSink dialog
        const modal = this.modalRef.value;
        modal.close();
    }

    /**
     * Export persons as Excel
     * @param {Array} persons - Array of [id, hit] tuples
     */
    async exportPersonsAsExcel(persons) {
        const i18n = this._i18n;
        const ExcelJS = (await import('exceljs')).default;
        const instantSearchModule = new InstantSearchModule();
        const columnConfigs = instantSearchModule.getPersonColumns();

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Persons');

        // Add headers
        const headers = columnConfigs.map((col) => i18n.t(col.name));
        worksheet.addRow(headers);

        // Add data rows
        persons.forEach(([, hit]) => {
            if (hit && typeof hit === 'object' && hit !== null && hit !== true) {
                const row = columnConfigs.map((col) => {
                    const value = this.getNestedValue(hit, col.field);
                    if (value === null || value === undefined) {
                        return '';
                    }
                    return value;
                });
                worksheet.addRow(row);
            }
        });

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const file = new File([blob], 'persons_export.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        this.fileSinkRef.value.files = [file];

        // Close modal to show FileSink dialog
        const modal = this.modalRef.value;
        modal.close();
    }

    /**
     * Export persons as PDF (using the same format as in person.js)
     * @param {Array} persons - Array of [id, hit] tuples
     */
    async exportPersonsAsPDF(persons) {
        const i18n = this._i18n;
        const pdfFiles = [];

        // Generate PDFs for each person
        for (const [, hit] of persons) {
            if (hit && typeof hit === 'object' && hit !== null && hit !== true) {
                const personHit = getPersonHit(hit);
                // Generate PDF and collect the file
                const pdfFile = await this.generatePersonPdfFile(i18n, personHit);
                pdfFiles.push(pdfFile);
            }
        }

        // Download all PDFs via FileSink
        if (pdfFiles.length > 0) {
            this.fileSinkRef.value.files = pdfFiles;

            // Close modal to show FileSink dialog
            const modal = this.modalRef.value;
            modal.close();
        }
    }

    /**
     * Generate a PDF file for a person (returns File object instead of downloading)
     * @param {object} i18n
     * @param {object} hit
     * @returns {Promise<File>}
     */
    async generatePersonPdfFile(i18n, hit) {
        return await exportPersonPdf(i18n, hit, false, true);
    }

    /**
     * Export person as PDF (for backward compatibility - now uses generatePersonPdfFile)
     * @param {object} i18n
     * @param {object} hit
     * @param {boolean} withInternalData - unused but kept for compatibility
     */
    async exportPersonPdf(i18n, hit, withInternalData = false) {
        const pdfFile = await this.generatePersonPdfFile(i18n, hit);

        // Create a temporary link to download the file
        const url = URL.createObjectURL(pdfFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export all documents/attachments for selected persons
     * @param {Array} persons - Array of [id, hit] tuples
     */
    async exportPersonsAttachments(persons) {
        let files = [];
        let successCount = 0;
        let failCount = 0;

        // Get TypesenseService
        let serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this.entryPointUrl,
            this.auth.token,
        );
        let typesense = new TypesenseService(serverConfig);

        for (const [id, hit] of persons) {
            if (hit && typeof hit === 'object' && hit !== null && hit !== true) {
                try {
                    const personHit = getPersonHit(hit);
                    const personId = personHit.person.person;

                    // Fetch all documents for this person
                    const documents = await typesense.fetchItemsByFilter(
                        `person.person:=[\`${personId}\`] && objectType:=file-cabinet-document`,
                        250, // max documents per person
                    );

                    // Create a folder name for this person
                    const folderName = `${personHit.person.familyName}_${personHit.person.givenName}_${personHit.person.studId}`;

                    // Download each document
                    for (const doc of documents) {
                        try {
                            const fileId = doc.file?.base?.fileId;
                            if (!fileId) {
                                console.warn('No fileId for document', doc.id);
                                continue;
                            }

                            const documentFile = await BlobOperations.downloadFileFromBlob(
                                this.entryPointUrl,
                                this.auth.token,
                                fileId,
                                dataURLtoFile,
                            );

                            // Add folder structure to filename
                            const fileName = `${folderName}/${documentFile.name}`;
                            const fileWithPath = new File([documentFile], fileName, {
                                type: documentFile.type,
                            });
                            files.push(fileWithPath);
                        } catch (error) {
                            console.error('Failed to download document', doc.id, error);
                            failCount++;
                        }
                    }

                    if (documents.length > 0) {
                        successCount++;
                    }
                } catch (error) {
                    console.error('Failed to fetch documents for person', id, error);
                    failCount++;
                }
            }
        }

        if (files.length > 0) {
            // Use FileSink to download all files
            this.fileSinkRef.value.files = files;

            // Close the modal to show the FileSink dialog
            const modal = this.modalRef.value;
            modal.close();
        }

        return {successCount, failCount};
    }

    /**
     * Export all active documents
     * @param {Event} e - The change event from the selector
     */
    async exportActiveDocuments(e) {
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        // Reset selector immediately before async operations
        e.target.selectedIndex = 0;

        const i18n = this._i18n;
        const documentSelections =
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};

        // Filter active documents only
        const activeDocuments = Object.entries(documentSelections).filter(
            ([_id, hit]) => hit && typeof hit === 'object' && !hit.base?.isScheduledForDeletion,
        );

        if (activeDocuments.length === 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-error'),
                i18n.t('selection-dialog.no-active-documents-to-export'),
                'warning',
            );
            return;
        }

        await this.exportDocuments(activeDocuments, selectorValue);
    }

    /**
     * Export all deleted documents
     * @param {Event} e - The change event from the selector
     */
    async exportDeletedDocuments(e) {
        const selectorValue = e.target.value;
        if (!selectorValue) {
            return;
        }

        // Reset selector immediately before async operations
        e.target.selectedIndex = 0;

        const i18n = this._i18n;
        const documentSelections =
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};

        // Filter deleted documents only
        const deletedDocuments = Object.entries(documentSelections).filter(
            ([_id, hit]) => hit && typeof hit === 'object' && hit.base?.isScheduledForDeletion,
        );

        if (deletedDocuments.length === 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-error'),
                i18n.t('selection-dialog.no-deleted-documents-to-export'),
                'warning',
            );
            return;
        }

        await this.exportDocuments(deletedDocuments, selectorValue);
    }

    /**
     * Export documents based on selector value
     * @param {Array} documents - Array of [id, hit] tuples
     * @param {string} selectorValue - What to export (document-file-only, metadata-only, or all)
     */
    async exportDocuments(documents, selectorValue) {
        const i18n = this._i18n;
        let files = [];
        let successCount = 0;
        let failCount = 0;
        const successfulIds = [];

        for (const [id, hit] of documents) {
            try {
                const fileId = hit.file?.base?.fileId;
                if (!fileId) {
                    console.error('No file identifier found for document', id);
                    failCount++;
                    continue;
                }

                // Add metadata file if requested
                if (selectorValue !== 'document-file-only') {
                    const metadataFileName = `${hit.file?.base?.fileName || fileId}_metadata.json`;
                    const metadataFile = new File(
                        [JSON.stringify(hit, null, 2)],
                        metadataFileName,
                        {
                            type: 'application/json',
                        },
                    );
                    files.push(metadataFile);
                }

                // Add document file if requested
                if (selectorValue !== 'metadata-only') {
                    const documentFile = await BlobOperations.downloadFileFromBlob(
                        this.entryPointUrl,
                        this.auth.token,
                        fileId,
                        dataURLtoFile,
                    );
                    files.push(documentFile);
                }

                successCount++;
                successfulIds.push(id);
            } catch (error) {
                console.error('Failed to export document', id, error);
                failCount++;
            }
        }

        if (files.length > 0) {
            // Use FileSink to download all files
            this.fileSinkRef.value.files = files;

            // Close the modal to show the FileSink dialog
            const modal = this.modalRef.value;
            modal.close();
        }

        // Show notification about results
        if (successCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-success'),
                i18n.t('selection-dialog.export-success-message', {
                    count: successCount,
                }),
                'success',
            );
            // Clear only successfully exported items
            this.clearSelectionItems(
                this.constructor.HitSelectionType.DOCUMENT_FILE,
                successfulIds,
            );
        }

        if (failCount > 0) {
            this.sendFilterModalNotification(
                i18n.t('selection-dialog.export-error'),
                i18n.t('selection-dialog.export-error-message', {
                    count: failCount,
                }),
                'danger',
            );
        }
    }

    onFileSinkDialogClosed() {
        // Reopen the modal after file sink dialog is closed
        const modal = this.modalRef.value;
        if (modal && !modal.isOpen()) {
            modal.open();
        }
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            commonStyles.getButtonCSS(),
            getSelectorFixCSS(),
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

                .document-sub-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid var(--dbp-muted);
                }

                .sub-tab {
                    padding: 10px 20px;
                    background-color: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    color: var(--dbp-content);
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }

                .sub-tab:hover {
                    background-color: var(--dbp-hover-background-color, rgba(0, 0, 0, 0.05));
                }

                .sub-tab.active {
                    border-bottom-color: var(--dbp-accent);
                    font-weight: bold;
                }

                .sub-tab .selection-count {
                    background-color: var(--dbp-muted);
                    color: var(--dbp-content);
                }

                .sub-tab.active .selection-count {
                    background-color: var(--dbp-accent);
                    color: white;
                }

                .document-table-container {
                    display: none;
                }

                .document-table-container.active {
                    display: block;
                }

                .export-controls {
                    margin-bottom: 15px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                @media (max-width: 768px) {
                    .export-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .dropdown-menu {
                        width: 100%;
                    }
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

        console.log(`[${type}] buildTableColumns - visibilityStates:`, visibilityStates);
        console.log(`[${type}] buildTableColumns - columnConfigs:`, columnConfigs);

        // Add row number column
        columns.push({
            title: 'rowNumber',
            field: 'rowNumber',
            width: 60,
            hozAlign: 'center',
        });

        // Add visible data columns
        columnConfigs.forEach((colConfig) => {
            console.log(
                `[${type}] Checking column ${colConfig.id}: visibility =`,
                visibilityStates[colConfig.id],
            );
            if (visibilityStates[colConfig.id] === true) {
                columns.push({
                    title: i18n.t(colConfig.name),
                    field: colConfig.id,
                    widthGrow: 1,
                    headerSort: true,
                    sorter: 'string',
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const value = rowData[colConfig.id];
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

        const selectionEntries = Object.entries(selections);
        console.log(`[${type}] Building table data for ${selectionEntries.length} selections`);
        console.log(`[${type}] Column configs:`, columnConfigs);

        return selectionEntries.map(([id, hit], index) => {
            console.log(`[${type}] Hit object for ${id}:`, hit);
            console.log(
                `[${type}] Hit type:`,
                typeof hit,
                'Is object?',
                typeof hit === 'object' && hit !== null,
            );

            if (hit && typeof hit === 'object' && hit !== null) {
                console.log(`[${type}] Hit keys:`, Object.keys(hit));
            }

            const rowData = {
                rowNumber: index + 1,
                id: id,
                actions: '',
            };

            // Add all field values
            columnConfigs.forEach((colConfig) => {
                if (hit && typeof hit === 'object' && hit !== null && hit !== true) {
                    const value = this.getNestedValue(hit, colConfig.field);
                    rowData[colConfig.id] = value;
                    console.log(
                        `[${type}] Column ${colConfig.id} (field: ${colConfig.field}):`,
                        value,
                    );
                } else {
                    console.warn(`[${type}] Invalid hit for ${id}:`, hit);
                }
            });

            console.log(`[${type}] Row data for ${id}:`, rowData);
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

        const personSelections = this.hitSelections[this.constructor.HitSelectionType.PERSON] || {};
        const documentSelections =
            this.hitSelections[this.constructor.HitSelectionType.DOCUMENT_FILE] || {};

        console.log('renderContent this.hitSelections', this.hitSelections);
        console.log('renderContent personSelections', personSelections);

        // Separate active and deleted documents
        const activeDocuments = {};
        const deletedDocuments = {};

        Object.entries(documentSelections).forEach(([id, hit]) => {
            // Check if the document is scheduled for deletion
            if (hit && typeof hit === 'object' && hit.base?.isScheduledForDeletion) {
                deletedDocuments[id] = hit;
            } else {
                activeDocuments[id] = hit;
            }
        });

        console.log('renderContent activeDocuments', activeDocuments);
        console.log('renderContent deletedDocuments', deletedDocuments);

        // Build table data with all field values
        const personTableData = this.buildTableData('person', personSelections);
        const activeDocumentTableData = this.buildTableData('document', activeDocuments);
        const deletedDocumentTableData = this.buildTableData('document', deletedDocuments);

        // Build table options for persons
        const personTableOptions = {
            layout: 'fitColumns',
            nestedFieldSeparator: false, // Treat dots in field names as literal characters
            langs: this.buildTableLangs('person'),
            columns: this.buildTableColumns('person', this.personGearButton, () =>
                this.openColumnConfiguration('person'),
            ),
        };

        console.log('[person] Table options:', personTableOptions);
        console.log('[person] Table columns:', personTableOptions.columns);
        console.log(
            '[person] Table columns detail:',
            personTableOptions.columns.map((c) => ({title: c.title, field: c.field})),
        );
        console.log('[person] Table data:', personTableData);
        console.log(
            '[person] First row data keys:',
            personTableData[0] ? Object.keys(personTableData[0]) : 'no data',
        );

        // Build table options for active documents
        const documentTableOptions = {
            layout: 'fitColumns',
            nestedFieldSeparator: false, // Treat dots in field names as literal characters
            langs: this.buildTableLangs('document'),
            columns: this.buildTableColumns('document', this.documentGearButton, () =>
                this.openColumnConfiguration('document'),
            ),
        };

        // Build table options for deleted documents
        const deletedDocumentTableOptions = {
            layout: 'fitColumns',
            nestedFieldSeparator: false, // Treat dots in field names as literal characters
            langs: this.buildTableLangs('document'),
            columns: this.buildTableColumns('document', this.deletedDocumentGearButton, () =>
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
                            <span class="selection-count">
                                ${Object.keys(personSelections).length}
                            </span>
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
                            <span class="selection-count">
                                ${Object.keys(documentSelections).length}
                            </span>
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
                        ${Object.keys(personSelections).length > 0
                            ? html`
                                  <div class="export-controls">
                                      <select
                                          id="export-persons-select"
                                          class="dropdown-menu"
                                          @change="${this.exportPersons}">
                                          <option value="" disabled selected>
                                              ${i18n.t(
                                                  'selection-dialog.export-persons',
                                                  'Export Persons',
                                              )}
                                          </option>
                                          <option value="csv">
                                              ${i18n.t('selection-dialog.export-csv', 'CSV')}
                                          </option>
                                          <option value="excel">
                                              ${i18n.t('selection-dialog.export-excel', 'Excel')}
                                          </option>
                                          <option value="pdf">
                                              ${i18n.t('selection-dialog.export-pdf', 'PDF')}
                                          </option>
                                          <option value="attachments">
                                              ${i18n.t(
                                                  'selection-dialog.export-attachments',
                                                  'Attachments',
                                              )}
                                          </option>
                                      </select>
                                  </div>
                                  <dbp-tabulator-table
                                      ${ref(this.personTableRef)}
                                      lang="${this.lang}"
                                      class="selection-table"
                                      identifier="person-selection-table"
                                      pagination-enabled
                                      pagination-size="10"
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

                        <!-- Sub-tabs for active and deleted documents -->
                        <div class="document-sub-tabs">
                            <button
                                class="sub-tab ${this.activeDocumentTab === 'active'
                                    ? 'active'
                                    : ''}"
                                @click="${() => {
                                    this.activeDocumentTab = 'active';
                                }}">
                                ${i18n.t('selection-dialog.active-documents', 'Active')}
                                <span class="selection-count">
                                    ${Object.keys(activeDocuments).length}
                                </span>
                            </button>
                            <button
                                class="sub-tab ${this.activeDocumentTab === 'deleted'
                                    ? 'active'
                                    : ''}"
                                @click="${() => {
                                    this.activeDocumentTab = 'deleted';
                                }}">
                                ${i18n.t('selection-dialog.deleted-documents', 'Deleted')}
                                <span class="selection-count">
                                    ${Object.keys(deletedDocuments).length}
                                </span>
                            </button>
                        </div>

                        <!-- Active documents table -->
                        <div
                            class="document-table-container ${this.activeDocumentTab === 'active'
                                ? 'active'
                                : ''}">
                            ${Object.keys(activeDocuments).length > 0
                                ? html`
                                      <div class="export-controls">
                                          <dbp-button
                                              value="${i18n.t(
                                                  'selection-dialog.delete-all-active',
                                                  'Delete All',
                                              )}"
                                              @click="${() =>
                                                  this.scheduleActiveDocumentsForDeletion()}"
                                              type="is-primary">
                                              ${i18n.t(
                                                  'selection-dialog.delete-all-active',
                                                  'Delete All',
                                              )}
                                          </dbp-button>
                                          <select
                                              id="export-active-select"
                                              class="dropdown-menu"
                                              @change="${this.exportActiveDocuments}">
                                              <option value="" disabled selected>
                                                  ${i18n.t(
                                                      'selection-dialog.export-documents',
                                                      'Export Documents',
                                                  )}
                                              </option>
                                              <option value="document-file-only">
                                                  ${i18n.t(
                                                      'doc-modal-document-only',
                                                      'Document Only',
                                                  )}
                                              </option>
                                              <option value="metadata-only">
                                                  ${i18n.t('doc-modal-only-data', 'Metadata Only')}
                                              </option>
                                              <option value="all">
                                                  ${i18n.t('doc-modal-all', 'All')}
                                              </option>
                                          </select>
                                      </div>
                                      <dbp-tabulator-table
                                          ${ref(this.documentTableRef)}
                                          lang="${this.lang}"
                                          class="selection-table"
                                          identifier="document-selection-table"
                                          pagination-enabled
                                          pagination-size="10"
                                          .data=${activeDocumentTableData}
                                          .options=${documentTableOptions}></dbp-tabulator-table>
                                  `
                                : html`
                                      <p>
                                          ${i18n.t(
                                              'selection-dialog.no-active-documents',
                                              'No active documents selected.',
                                          )}
                                      </p>
                                  `}
                        </div>

                        <!-- Deleted documents table -->
                        <div
                            class="document-table-container ${this.activeDocumentTab === 'deleted'
                                ? 'active'
                                : ''}">
                            ${Object.keys(deletedDocuments).length > 0
                                ? html`
                                      <div class="export-controls">
                                          <dbp-button
                                              value="${i18n.t(
                                                  'selection-dialog.undelete-all-deleted',
                                                  'Undelete All',
                                              )}"
                                              @click="${() => this.undeleteDeletedDocuments()}"
                                              type="is-primary">
                                              ${i18n.t(
                                                  'selection-dialog.undelete-all-deleted',
                                                  'Undelete All',
                                              )}
                                          </dbp-button>
                                          <select
                                              id="export-deleted-select"
                                              class="dropdown-menu"
                                              @change="${this.exportDeletedDocuments}">
                                              <option value="" disabled selected>
                                                  ${i18n.t(
                                                      'selection-dialog.export-documents',
                                                      'Export Documents',
                                                  )}
                                              </option>
                                              <option value="document-file-only">
                                                  ${i18n.t(
                                                      'doc-modal-document-only',
                                                      'Document Only',
                                                  )}
                                              </option>
                                              <option value="metadata-only">
                                                  ${i18n.t('doc-modal-only-data', 'Metadata Only')}
                                              </option>
                                              <option value="all">
                                                  ${i18n.t('doc-modal-all', 'All')}
                                              </option>
                                          </select>
                                      </div>
                                      <dbp-tabulator-table
                                          ${ref(this.deletedDocumentTableRef)}
                                          lang="${this.lang}"
                                          class="selection-table"
                                          identifier="deleted-document-selection-table"
                                          pagination-enabled
                                          pagination-size="10"
                                          .data=${deletedDocumentTableData}
                                          .options=${deletedDocumentTableOptions}></dbp-tabulator-table>
                                  `
                                : html`
                                      <p>
                                          ${i18n.t(
                                              'selection-dialog.no-deleted-documents',
                                              'No deleted documents selected.',
                                          )}
                                      </p>
                                  `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    onCloseModal() {
        // Send a close event to the parent component and request a reload
        this.dispatchEvent(
            new CustomEvent('close', {
                detail: {reloadSearch: true},
                bubbles: true,
                composed: true,
            }),
        );
    }

    /**
     * Clear specific selection items by their IDs
     * @param {string} type - The selection type (e.g., DOCUMENT_FILE, PERSON)
     * @param {Array<string>} ids - Array of IDs to clear from selection
     */
    clearSelectionItems(type, ids) {
        if (!ids || ids.length === 0) {
            return;
        }

        // Notify parent to clear specific selections
        this.dispatchEvent(
            new CustomEvent('clear-selection-items', {
                detail: {type, ids},
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
        const selections = this.hitSelections[type] || {};

        // Prepare the new data with all field values
        const tableType = type === this.constructor.HitSelectionType.PERSON ? 'person' : 'document';

        // Update the appropriate table
        if (type === this.constructor.HitSelectionType.PERSON) {
            const tableData = this.buildTableData(tableType, selections);
            const personTable = this.personTableRef.value;
            if (personTable && personTable.tabulatorTable) {
                personTable.tabulatorTable.setData(tableData);
            }
        } else if (type === this.constructor.HitSelectionType.DOCUMENT_FILE) {
            // Separate active and deleted documents
            const activeDocuments = {};
            const deletedDocuments = {};

            Object.entries(selections).forEach(([id, hit]) => {
                // Check if the document is scheduled for deletion
                if (hit && typeof hit === 'object' && hit.base?.isScheduledForDeletion) {
                    deletedDocuments[id] = hit;
                } else {
                    activeDocuments[id] = hit;
                }
            });

            // Update active documents table
            const activeTableData = this.buildTableData(tableType, activeDocuments);
            const documentTable = this.documentTableRef.value;
            if (documentTable && documentTable.tabulatorTable) {
                documentTable.tabulatorTable.setData(activeTableData);
            }

            // Update deleted documents table
            const deletedTableData = this.buildTableData(tableType, deletedDocuments);
            const deletedDocumentTable = this.deletedDocumentTableRef.value;
            if (deletedDocumentTable && deletedDocumentTable.tabulatorTable) {
                deletedDocumentTable.tabulatorTable.setData(deletedTableData);
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

        // Build deleted document table if it exists and hasn't been built yet
        const deletedDocumentTable = this.deletedDocumentTableRef.value;
        if (deletedDocumentTable && !deletedDocumentTable.tableReady) {
            console.log('Building deleted document table');
            deletedDocumentTable.buildTable();
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
            <dbp-file-sink
                ${ref(this.fileSinkRef)}
                subscribe="nextcloud-store-session:nextcloud-store-session"
                lang="${this.lang}"
                enabled-targets="${this.fileHandlingEnabledTargets}"
                nextcloud-auth-url="${this.nextcloudWebAppPasswordURL}"
                nextcloud-web-dav-url="${this.nextcloudWebDavURL}"
                nextcloud-name="${this.nextcloudName}"
                nextcloud-auth-info="${this.nextcloudAuthInfo}"
                nextcloud-file-url="${this.nextcloudFileURL}"
                @dbp-file-sink-dialog-closed="${this.onFileSinkDialogClosed}"></dbp-file-sink>
        `;
    }
}
