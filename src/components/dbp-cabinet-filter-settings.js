import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {IconButton, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button, Icon, Modal} from '@dbp-toolkit/common';
import {
    scopedElements as modalNotificationScopedElements,
    sendModalNotification,
} from '../modules/modal-notification';

export class CabinetFilterSettings extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.modalRef = createRef();
        this.facetConfigs = [];
    }

    static get scopedElements() {
        return {
            ...modalNotificationScopedElements(),
            'dbp-icon': Icon,
            'dbp-button': Button,
            'dbp-icon-button': IconButton,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            facetConfigs: {type: Array, attribute: false},
        };
    }

    async open(facetConfigs) {
        // Load the facet visibility states from localStorage again,
        // because the modal might have been closed without saving the settings
        this.loadFacetVisibilityStates();

        console.log('open facetConfigs', facetConfigs);

        // Filter facetConfigs to only include items with groupId 'person' or 'file', don't include 'person.person'
        this.facetConfigs = (facetConfigs || []).filter(
            (item) =>
                (item.groupId === 'person' || item.groupId === 'file' || item['filter-group']) &&
                item.schemaField !== 'person.person' &&
                item['filter-group']?.id !== 'category',
        );

        /**
         * @type {Modal}
         */
        const modal = this.modalRef.value;
        console.log('modal', modal);
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
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}

            :host {
                --dbp-modal-max-width: 650px;
            }

            #filter-modal .modal-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            #filter-modal .modal-title h1 {
                color: var(--dbp-override-accent);
                padding-top: 0.5rem;
                font-weight: 300;
                font-size: 1.5em;
                margin: 0;
            }

            #filter-modal .modal-content {
                display: grid;
                gap: 10px;
                grid-auto-flow: row;
                /* Add space for the scrollbar */
                margin-right: 5px;
            }

            #filter-modal .modal-content h2 {
                font-size: 1.5em;
            }

            #filter-modal .modal-footer {
                display: flex;
                gap: 10px;
                padding-top: 10px;
                justify-content: space-between;
                /* We need spacing because of the spacing in #filter-modal .modal-content */
                margin-right: 3px;
            }

            .facet-filter-icon {
                color: var(--dbp-override-accent);
                font-size: 2em;
            }

            .facets {
                max-width: 100%;
                margin: 0;
                list-style-type: none;
                padding: 0;
                display: grid;
                width: 100%;
            }

            .facet-field {
                align-items: center;
                height: 50px;
                border: 1px solid var(--dbp-muted);
                display: flex;
                margin-bottom: 5px;
                width: 100%;
            }

            .category-field {
                align-items: center;
                height: 50px;
                display: flex;
                margin-bottom: 5px;
                width: 100%;
            }

            .category-field h2 {
                flex: 1;
                margin-top: 0.5em;
            }

            .category-field dbp-icon-button {
                /* Compensate for the border of .facet-field  */
                margin-right: -1px;
            }

            .facet-button {
                justify-content: center;
                display: flex;
                align-items: center;
                height: 50px;
                width: 50px;
                min-width: 50px;
                flex-grow: 0;
                cursor: pointer;
            }

            .facet-button dbp-icon {
                font-size: 1.3em;
                top: 0;
            }

            .facet-button.hidden,
            .extended-menu.hidden {
                display: none !important;
            }

            .facet-title {
                flex-grow: 2;
                text-overflow: ellipsis;
                overflow: hidden;
                padding-left: 5px;
                text-align: left;
            }

            .facet-order {
                background-color: var(--dbp-muted-surface);
                color: var(--dbp-on-muted-surface);
                font-weight: bold;
            }
        `;
    }

    /**
     * Returns the modal dialog for adding a document to a person after the document was selected
     * in the file source
     */
    getModalHtml() {
        const i18n = this._i18n;
        const buttonsDisabled =
            !this.facetConfigs || this.facetConfigs.length === 0 || !this.settingsLocalStorageKey;

        return html`
            <dbp-modal
                ${ref(this.modalRef)}
                id="filter-modal"
                modal-id="filter-modal"
                width="600px"
                height="80%"
                min-width="300px"
                min-height="80%"
                subscribe="lang"
                sticky-footer
                @dbp-modal-closed="${this.onCloseModal}">
                <div slot="title" class="modal-title">
                    <dbp-icon
                        class="facet-filter-icon"
                        title="${i18n.t('cabinet-search.facet-settings')}"
                        aria-label="${i18n.t('cabinet-search.facet-settings')}"
                        name="cog"></dbp-icon>
                    <h1>Filter configuration</h1>
                </div>
                <div slot="header" class="header">
                    <div class="modal-notification">
                        <dbp-notification
                            id="modal-notification"
                            inline
                            lang="${this.lang}"></dbp-notification>
                    </div>
                </div>
                <div slot="content" class="modal-content">${this.renderFacetList()}</div>
                <div slot="footer" class="modal-footer">
                    <div>
                        <dbp-button
                            title="${i18n.t('filter-settings.abort')}"
                            type="is-secondary"
                            no-spinner-on-click
                            @click="${this.close}">
                            ${i18n.t('filter-settings.abort')}
                        </dbp-button>
                    </div>
                    <div>
                        <dbp-button
                            title="${i18n.t('filter-settings.all-filters-hide')}"
                            type="is-secondary"
                            no-spinner-on-click
                            ?disabled="${buttonsDisabled}"
                            @click="${this.hideAllFacets}">
                            ${i18n.t('filter-settings.all-filters-hide')}
                        </dbp-button>
                        <dbp-button
                            title="${i18n.t('filter-settings.all-filters-show')}"
                            type="is-secondary"
                            no-spinner-on-click
                            ?disabled=${buttonsDisabled}
                            @click="${this.showAllFacets}">
                            ${i18n.t('filter-settings.all-filters-show')}
                        </dbp-button>
                    </div>
                    <dbp-button
                        type="is-primary"
                        ?disabled=${buttonsDisabled}
                        @click="${this.storeSettings}">
                        ${i18n.t('filter-settings.save')}
                    </dbp-button>
                </div>
            </dbp-modal>
        `;
    }

    renderFacetListItem(item, key) {
        const i18n = this._i18n;

        if (item['filter-group']) {
            return html`
                <li class="facet-fields ${item.schemaField}" data-index="${key}">
                    <div class="category-field">
                        <h2>${i18n.t(item['filter-group'].name)}</h2>
                        ${this.renderFacetGroupVisibilityIconButton(item)}
                    </div>
                </li>
            `;
        } else {
            return html`
                <li class="facet-fields ${item.schemaField}" data-index="${key}">
                    <div class="facet-field">
                        <span class="facet-button facet-order">${key + 1}</span>
                        <span class="facet-title"><strong>${i18n.t(item.name)}</strong></span>
                        ${this.renderFacetVisibilityIconButton(item)}
                    </div>
                </li>
            `;
        }
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

    renderFacetVisibilityIconButton(item) {
        const visible = this.facetVisibilityStates[item.schemaField] === true;

        return html`
            <dbp-icon-button
                icon-name="${visible ? 'source_icons_eye-empty' : 'source_icons_eye-off'}"
                class="facet-visibility-icon"
                @click="${() => {
                    this.changeFacetVisibility(item, !visible);
                }}"></dbp-icon-button>
        `;
    }

    changeFacetVisibility(item, visible) {
        console.log('changeFacetVisibility item', item);

        // Change the visibility of the facet
        // Currently we only support toggling the visibility
        this.facetVisibilityStates[item.schemaField] = visible;

        // Let's delete the facet visibility state if the facet is not visible anymore
        if (!visible) {
            delete this.facetVisibilityStates[item.schemaField];
        }

        console.log('changeFacetVisibility this.facetVisibilityStates', this.facetVisibilityStates);

        // Because the visibility state has changed, we need to re-render the list
        // Setting a property of this.facetVisibilityStates will not trigger a re-render
        this.requestUpdate();
    }

    renderFacetList() {
        if (!this.facetConfigs || this.facetConfigs.length === 0) {
            return html`
                <p>No facets configured.</p>
            `;
        }

        return html`
            <ul class="facets">
                ${this.facetConfigs.map(this.renderFacetListItem.bind(this))}
            </ul>
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

    render() {
        // const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            ${this.getModalHtml()}
        `;
    }

    /**
     * @param ev
     */
    async onDocumentFileSelected(ev) {
        console.log('ev.detail.file', ev.detail.file);
        this.documentFile = ev.detail.file;

        // We need to wait until rendering is complete after this.documentFile has changed
        await this.updateComplete;

        const pdfViewer = this._('#document-add-pdf-viewer');

        // Load the PDF in the PDF viewer with the double reloading workaround,
        // because the page wasn't always shown
        await pdfViewer.showPDF(this.documentFile, {}, true);

        // Workaround to trigger a resize after the PDF was loaded, so the PDF is shown correctly
        pdfViewer._onWindowResize();

        // Opens the modal dialog for adding a document to a person after the document was
        // selected in the file source
        this.modalRef.value.open();
    }

    storeSettings(e) {
        if (!this.settingsLocalStorageKey) {
            console.warn('No settingsLocalStorageKey set, cannot store settings.');
            return;
        }

        /**
         * @type {IconButton}
         */
        const button = e.target;
        button.start();

        // Store the current facet visibility states in localStorage
        localStorage.setItem(
            this.settingsLocalStorageKey,
            JSON.stringify(this.facetVisibilityStates),
        );

        button.stop();

        const customEvent = new CustomEvent('settingsStored', {
            detail: {...this.facetVisibilityStates},
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(customEvent);

        this.close();
    }

    hideAllFacets() {
        this.facetVisibilityStates = {};
    }

    showAllFacets() {
        // Show all facets by setting the visibility state to true for all facets in this.facetVisibilityStates
        this.facetVisibilityStates = this.facetConfigs.reduce((acc, item) => {
            acc[item.schemaField] = true;
            return acc;
        }, {});
    }

    renderFacetGroupVisibilityIconButton(item) {
        const groupId = item['filter-group'].id;

        // Check if there is at least one facet item in this.facetVisibilityStates with the groupId that is visible
        const visible = Object.keys(this.facetVisibilityStates).some(
            (key) => this.facetVisibilityStates[key] === true && key.startsWith(groupId),
        );

        return html`
            <dbp-icon-button
                icon-name="${visible ? 'source_icons_eye-empty' : 'source_icons_eye-off'}"
                class="facet-visibility-icon"
                @click="${() => {
                    this.changeFacetGroupVisibility(item, !visible);
                }}"></dbp-icon-button>
        `;
    }

    changeFacetGroupVisibility(item, visible) {
        const groupId = item['filter-group'].id;

        // Find all facets in this.facetVisibilityStates that have the correct groupId and change their visibility
        this.facetConfigs.forEach((facetItem) => {
            if (facetItem.groupId === groupId) {
                this.facetVisibilityStates[facetItem.schemaField] = visible;
            }
        });

        // Set a new states-object to trigger a re-render
        this.facetVisibilityStates = {...this.facetVisibilityStates};
    }
}
