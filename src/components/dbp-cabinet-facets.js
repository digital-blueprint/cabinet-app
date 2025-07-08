// noinspection CssUnusedSymbol,JSUnresolvedReference

import {Icon, LangMixin, ScopedElementsMixin} from '@dbp-toolkit/common';
import {css, html} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
import {refinementList} from 'instantsearch.js/es/widgets/index.js';
import {createDateRefinement} from './dbp-cabinet-date-facet.js';
import {preactRefReplaceElement} from '../utils.js';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element.js';
import {createInstance} from '../i18n.js';
import {classMap} from 'lit/directives/class-map.js';
import {repeat} from 'lit/directives/repeat.js';

class FacetLabel extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.schemaField = '';
        this.value = '';
        this.renderFunction = null;
    }

    static get properties() {
        return {
            ...super.properties,
            renderFunction: {type: Object, attribute: false},
            schemaField: {type: String},
            value: {type: String},
        };
    }

    render() {
        if (this.renderFunction) {
            let value = this.renderFunction(this._i18n, this.schemaField, this.value, null);
            return html`
                <span title="${value}">${value}</span>
            `;
        } else {
            return html`
                <span title="${this.value}">${this.value}</span>
            `;
        }
    }
}

class NoResultsLabel extends LangMixin(DBPLitElement, createInstance) {
    render() {
        return html`
            ${this._i18n.t('facets.no-results')}
        `;
    }
}

class FacetPanel extends LangMixin(ScopedElementsMixin(DBPLitElement), createInstance) {
    constructor() {
        super();
        this.titleKey = '';
        this.isOpen = false;
    }

    static properties = {
        titleKey: {type: String},
        isOpen: {type: Boolean, state: true},
    };

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-icon': Icon,
        };
    }

    static styles = css`
        .chevron-container {
            color: var(--dbp-accent);
            width: 16px;
            height: 16px;
        }

        .panel-header {
            display: flex;
            gap: 1em;
            align-items: center;
            padding: 0.5em auto 0.5em;
            justify-content: space-between;
            user-select: none;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            width: 100%;
            font-size: inherit;
            color: inherit;
            font-family: inherit;
        }

        .content {
            display: none;
            padding-left: 6px;
        }

        .content.show {
            display: block;
        }
    `;

    _toggleContent(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    render() {
        return html`
            <div class="collapsible-section">
                <button
                    class="panel-header"
                    aria-expanded="${this.isOpen}"
                    aria-controls="content"
                    @click="${this._toggleContent}">
                    <span>${this._i18n.t(this.titleKey)}</span>
                    <dbp-icon
                        class="chevron-container"
                        name="${this.isOpen ? 'chevron-up' : 'chevron-down'}"
                        alt="${this.isOpen ? 'chevron-up' : 'chevron-down'}"></dbp-icon>
                </button>
                <div id="content" class="content ${this.isOpen ? 'show' : ''}">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}

export class CabinetFacets extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.facets = [];
        // This hash contains the facet widgets by their schema field name, so we can remove them from the search state later
        this.facetWidgetHash = {};
        this.active = false;
        this._facetsConfigs = [];
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-cabinet-facet-label': FacetLabel,
            'dbp-cabinet-no-results-label': NoResultsLabel,
            'dbp-cabinet-facet-panel': FacetPanel,
            'dbp-icon': Icon,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            active: {type: Boolean, state: true},
            _facetsConfigs: {type: Array, state: true},
        };
    }

    /**
     * Transforms a string with dots and camelCase to kebab-case with hyphens
     * @param {string} input - The input string to transform (e.g., "file.base.createdTimestamp")
     * @returns {string} - The transformed string (e.g., "file-base-created-timestamp")
     */
    transformToDashCase(input) {
        // First, replace all dots with hyphens
        let result = input.replace(/\./g, '-');

        // Then, convert camelCase to kebab-case
        // Look for any uppercase letter that has a lowercase letter before it
        result = result.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

        return result;
    }

    /**
     * Gathers the facet names to use in TypesenseInstantsearchAdapter._adaptAndPerformTypesenseRequest
     * @param facetsConfigs
     * @param originalFacetNames
     * @returns {*[]}
     */
    gatherActivatedWidgetsFacetNames(facetsConfigs, originalFacetNames) {
        // XXX: removed since panels got reworked, this needs to be re-implemented if needed
        return [];
    }

    getSchemaFieldHash(facetsConfigs) {
        let resultHash = {};

        facetsConfigs.forEach((facetConfig) => {
            const id = this.transformToDashCase(facetConfig.schemaField || '');
            if (id) {
                resultHash[id] = facetConfig.schemaField;
            }
        });

        return resultHash;
    }

    /**
     * Creates a facet widget based on a configuration
     * @param facetsConfigs {array} - configuration for the facets
     */
    async createFacetsFromConfig(facetsConfigs) {
        this._facetsConfigs = facetsConfigs;
        // Wait for the DOM to be updated before creating facets referencing it
        await this.updateComplete;

        let facets = [];
        this.facetWidgetHash = {};

        facetsConfigs.forEach((facetConfig) => {
            if (Object.hasOwn(facetConfig, 'filter-group')) {
                return;
            }
            const facet = this.generateFacet(facetConfig);
            const facetWidget = facet();

            // Store the facet widget in the hash for later removal from the search state
            this.facetWidgetHash[facetConfig.schemaField] = facetWidget;

            facets.push(facetWidget);
        });

        return facets;
    }

    /**
     * Returns the facet widget hash, which contains the facet widgets by their schema field name
     * We need this to remove facets from the search state later
     * @returns {*|{}}
     */
    getFacetWidgetHash() {
        return this.facetWidgetHash;
    }

    hideFilterGroupIfEmpty() {
        const filterGroups = this._a('#filters-container .filter-group');
        filterGroups.forEach((filterGroup) => {
            const filterGroupElement = /** @type {HTMLElement} */ (filterGroup);
            const refinementLists = filterGroupElement.querySelectorAll(
                '.filter .ais-RefinementList',
            );
            if (refinementLists.length === 0) {
                return;
            }
            const activeFilters = Array.from(refinementLists).filter(
                (list) => !list.classList.contains('ais-RefinementList--noRefinement'),
            );
            if (activeFilters.length === 0) {
                filterGroupElement.classList.add('display-none');
            } else {
                filterGroupElement.classList.remove('display-none');
            }
        });
    }

    /**
     * Generates a facet based on schema name of a configuration
     * @param {object} facetConfig - configuration for the facet
     * @returns {function(): *}
     */
    generateFacet(facetConfig) {
        const i18n = this._i18n;
        let that = this;

        const {schemaField, schemaFieldType = 'checkbox', facetOptions = {}} = facetConfig;

        // Remove special characters from schema field name to use as css class and translation key.
        const schemaFieldSafe = schemaField.replace(/[@#]/g, '');

        const cssClass = this.schemaNameToKebabCase(schemaFieldSafe);

        let cabinetFacets = this;

        if (facetConfig.searchablePlaceholderKey) {
            const placeholder = i18n.t(facetConfig.searchablePlaceholderKey);
            facetOptions.facet = {
                ...facetOptions.facet,
                searchablePlaceholder: placeholder,
            };
        }

        return function () {
            if (schemaFieldType === 'checkbox') {
                const defaultRefinementListOptions = {
                    fieldType: schemaFieldType,
                    container: that._(`#${cssClass}`),
                    attribute: schemaField,
                    sortBy: ['isRefined:desc', 'count:desc', 'name:asc'],
                    limit: 12,
                    searchable: true,
                    searchableShowReset: false,
                    templates: {
                        searchableNoResults(data, {html}) {
                            let noResultsLabel = cabinetFacets.createScopedElement(
                                'dbp-cabinet-no-results-label',
                            );
                            noResultsLabel.setAttribute('subscribe', 'lang');
                            return html`
                                <span ref=${preactRefReplaceElement(noResultsLabel)}></span>
                            `;
                        },
                        item(item, {html}) {
                            if (item.count === undefined || item.value === 'undefined') {
                                return html`
                                    <div class="facets-no-data">
                                        ${i18n.t('facets.no-data-available')}
                                    </div>
                                `;
                            }

                            let facetLabel =
                                cabinetFacets.createScopedElement('dbp-cabinet-facet-label');
                            facetLabel.setAttribute('schemaField', schemaField);
                            facetLabel.setAttribute('value', item.value);
                            facetLabel.renderFunction = facetConfig.renderFunction;
                            facetLabel.setAttribute('subscribe', 'lang');
                            facetLabel.setAttribute('class', 'refinement-list-item-name');

                            return html`
                                <div class="refinement-list-item refinement-list-item--${cssClass}">
                                    <div class="refinement-list-item-inner">
                                        <label class="refinement-list-item-checkbox">
                                            <input
                                                type="checkbox"
                                                class="custom-checkbox"
                                                aria-label="${item.label}"
                                                value="${item.value}"
                                                checked=${item.isRefined} />
                                        </label>
                                        <span ref=${preactRefReplaceElement(facetLabel)}></span>
                                    </div>
                                    <span class="refinement-list-item-count">(${item.count})</span>
                                </div>
                            `;
                        },
                        searchableSubmit() {
                            return null;
                        },
                    },
                };
                const refinementListOptions = {
                    ...defaultRefinementListOptions,
                    ...(facetOptions.facet || {}),
                };

                that.facets.push(refinementListOptions);

                return refinementList(refinementListOptions);
            }

            if (schemaFieldType === 'datepicker') {
                const defaultDateRefinementOptions = {
                    fieldType: schemaFieldType,
                    attribute: schemaField,
                    container: that._(`#${cssClass}`),
                };
                const dateRefinementOptions = {
                    ...defaultDateRefinementOptions,
                    ...(facetOptions.facet || {}),
                };

                that.facets.push(dateRefinementOptions);

                return createDateRefinement(dateRefinementOptions);
            }
        };
    }

    handleGradientDisplay() {
        const facetWidgets = this._a('#filters-container .filter');

        if (facetWidgets) {
            facetWidgets.forEach((facetWidget) => {
                const widget = /** @type {HTMLElement} */ (facetWidget);

                const COLLAPSED_COUNT = 12;
                const EXPANDED_COUNT = 30;
                const showMoreButton = widget.querySelector('.ais-RefinementList-showMore');
                const searchBox = widget.querySelector('.ais-SearchBox-input');
                const resetButton = widget.querySelector('.ais-SearchBox-reset');
                const facetList = widget.querySelector('.ais-RefinementList-list');
                const facetItems = widget.querySelectorAll('.refinement-list-item');
                const facetCount = facetItems.length;

                // Toggle is-expanded class on showMoreButton click
                if (showMoreButton && showMoreButton.getAttribute('data-event-added') === null) {
                    showMoreButton.addEventListener('click', () => {
                        widget
                            .querySelector('.ais-RefinementList-list')
                            .classList.toggle('is-expanded');
                    });
                    showMoreButton.setAttribute('data-event-added', 'true');
                }

                if (searchBox) {
                    // Handle gradient on search
                    if (searchBox.getAttribute('data-event-added') === null) {
                        searchBox.addEventListener('input', () => {
                            setTimeout(() => {
                                this.showHideFacetGradientOnSearch(facetWidget);
                            }, 200);
                        });
                        searchBox.setAttribute('data-event-added', 'true');
                    }

                    // Handle gradient on search reset
                    if (resetButton && resetButton.getAttribute('data-event-added') === null) {
                        resetButton.addEventListener('click', (event) => {
                            setTimeout(() => {
                                this.showHideFacetGradientOnSearch(facetWidget);
                            }, 200);
                        });
                        resetButton.setAttribute('data-event-added', 'true');
                    }
                }

                // Check if facet needs gradient
                if (facetList) {
                    const isExpanded = facetList.classList.contains('is-expanded');

                    if (!showMoreButton) {
                        widget.classList.add('gradient');
                        return;
                    }
                    // Remove gradient if all facet items are visible.
                    if (!isExpanded && facetCount < COLLAPSED_COUNT) {
                        widget.classList.add('gradient');
                    }
                    if (isExpanded && facetCount < EXPANDED_COUNT) {
                        widget.classList.add('gradient');
                    }
                }
            });
        }
    }

    showHideFacetGradientOnSearch(facetWidget) {
        const EXPANDED_COUNT = 30;
        const facetItems = facetWidget.querySelectorAll('.refinement-list-item');
        const facetCount = facetItems.length;
        const isShowMoreButtonPresent = facetWidget.querySelector('.ais-RefinementList-showMore');

        if (!isShowMoreButtonPresent && facetCount < EXPANDED_COUNT) {
            facetWidget.classList.add('gradient');
        } else {
            facetWidget.classList.remove('gradient');
        }
    }

    toggleFilters() {
        this.active = !this.active;
    }

    /**
     * Convert schema name to kebabCase for CSS classes and translation keys
     * For example, "file.base.createdTimestamp" becomes "file-base-created-timestamp"
     * @param input {string}
     * @returns {string}
     */
    schemaNameToKebabCase(input) {
        return input
            .split('.')
            .map((part) => part.replace(/([A-Z])/g, '-$1').toLowerCase())
            .join('-');
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}

            .display-none {
                display: none !important;
            }

            .filters {
                height: 100%;
            }

            .filter-header {
                padding-bottom: 1.6em;
                border-bottom: 5px solid var(--dbp-override-accent);
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 1em;
            }

            .filter-header__left {
                display: flex;
            }

            .filter-header__title {
                margin: 0;
                font-weight: bold;
            }

            .facet-filter-icon {
                color: var(--dbp-override-accent);
                padding-right: 0.5em;
                align-items: center;
                justify-self: center;
            }

            .facet-settings-button {
                background: transparent;
                border: none;
                font-size: 2rem;
                color: var(--dbp-override-accent);
                cursor: pointer;
                padding: 0.2em;
            }

            .filters-container {
                margin-top: 3em;
            }

            .filter-exit-icon {
                cursor: pointer;
                color: var(--dbp-override-accent);
            }

            .custom-checkbox {
                transform: translateY(-10%);
            }

            .filter-group {
                margin-bottom: 2em;
                display: flex;
                flex-direction: column;
                gap: 1em;
            }

            .refinement-list-item-inner > refinement-list-item-count {
                padding-left: 1em;
            }

            .filter-title {
                margin: 0;
                padding-left: 1px;
                font-weight: bold;
            }

            .filter:has(> [hidden]) {
                display: none;
            }

            /* refinement search */
            .ais-SearchBox-form {
                display: flex;
                gap: 0.25em;
                padding-top: 0.5em;
            }

            .ais-SearchBox-input {
                flex-grow: 1;
            }

            input[type='search']::-webkit-search-cancel-button {
                -webkit-appearance: none;
                appearance: none;
            }

            .ais-SearchBox-input::-webkit-search-cancel-button {
                -webkit-appearance: none;
                appearance: none;
            }

            .ais-RefinementList-list {
                list-style: none;
                margin: 0;
                padding: 0.5em 0;
                position: relative;
            }

            .filter:not(.gradient) .ais-RefinementList-list:after {
                content: '';
                display: block;
                height: 30px;
                width: 100%;
                background: linear-gradient(
                    0deg,
                    rgb(from var(--dbp-background) r g b / 100%) 0%,
                    rgb(from var(--dbp-background) r g b / 60%) 60%,
                    rgb(from var(--dbp-background) r g b / 0%) 100%
                );
                pointer-events: none;
                z-index: 99;
                position: absolute;
                bottom: 0.5em;
            }

            .filter-type-datepicker {
                padding: 1em 0;
                width: max-content;
                display: flex;
                flex-direction: column;
                gap: 1.5em;
                justify-content: center;
            }

            .filter input[type='date'] {
                padding: 0.5em;
            }

            /* input wrapper */
            ::-internal-datetime-container {
                position: relative;
            }
            /* date field wrappers */
            ::-webkit-datetime-edit {
                max-width: max-content;
                padding-right: 0.5em;
            }
            ::-webkit-datetime-edit-fields-wrapper {
            }
            /* date separator */
            ::-webkit-datetime-edit-text {
            }
            /* date fields */
            ::-webkit-datetime-edit-month-field {
            }
            ::-webkit-datetime-edit-day-field {
            }
            ::-webkit-datetime-edit-year-field {
            }
            /* calendar button */
            ::-webkit-calendar-picker-indicator {
                cursor: pointer;
            }
            /* ??? */
            ::-webkit-inner-spin-button {
            }

            .refinement-list-item {
                display: flex;
                gap: 1em;
                justify-content: space-between;
                cursor: pointer;
            }

            .refinement-list-item-inner {
                display: flex;
                max-width: 80%;
            }

            .refinement-list-item-name {
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }

            button.ais-RefinementList-showMore {
                margin-bottom: 1em;
            }

            .facets-no-data {
                color: var(--dbp-override-muted);
            }

            .filter-exit-icon {
                display: none;
            }

            @media (max-width: 768px) {
                .filters {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: calc(100vw - 30px);
                    height: 100vh;
                    background: white;
                    z-index: 9999;
                    transition: transform 0.3s ease-in-out;
                    transform: translateX(-130%);
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
                    overflow-y: auto;
                    padding: 1em;
                }

                .filters.active {
                    transform: translateX(0);
                }

                .filter-exit-icon {
                    display: block;
                }
            }
        `;
    }

    openFilterSettings() {
        console.log('DbpCabinetOpenFilterSettings -- Open Filter Settings --');
        this.dispatchEvent(
            new CustomEvent('DbpCabinetOpenFilterSettings', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render Facets --');

        let getFacetsForGroup = (groupId) => {
            return this._facetsConfigs.filter((facetConfig) => {
                return facetConfig['groupId'] && facetConfig['groupId'] === groupId;
            });
        };

        let getFacetGroups = () => {
            return this._facetsConfigs.filter((facetConfig) => {
                return Object.hasOwn(facetConfig, 'filter-group');
            });
        };

        let renderGroupFacets = (filterGroupId) => {
            return html`
                ${repeat(
                    getFacetsForGroup(filterGroupId),
                    (facetConfig) => facetConfig.schemaField,
                    (facetConfig, index) => {
                        const schemaFieldSafe = facetConfig.schemaField.replace(/[@#]/g, '');
                        const cssClass = this.schemaNameToKebabCase(schemaFieldSafe);
                        const cssTypeClass = this.schemaNameToKebabCase(
                            facetConfig.schemaFieldType,
                        );
                        let hidden = facetConfig.hidden || false;
                        let usePanel = facetConfig.usePanel ?? true;
                        if (usePanel) {
                            return html`
                                <dbp-cabinet-facet-panel
                                    .lang="${this.lang}"
                                    class="${classMap({'display-none': hidden})}"
                                    .titleKey="${facetConfig.name}">
                                    <div
                                        id="${cssClass}"
                                        class="filter filter--${cssClass} filter-type-${cssTypeClass}"></div>
                                </dbp-cabinet-facet-panel>
                            `;
                        } else {
                            return html`
                                <div
                                    id="${cssClass}"
                                    class="${classMap({
                                        'display-none': hidden,
                                        filter: true,
                                        [`filter--${cssClass}`]: true,
                                        [`filter-type-${cssTypeClass}`]: true,
                                    })}"></div>
                            `;
                        }
                    },
                )}
            `;
        };

        let renderGroups = () => {
            return html`
                ${repeat(
                    getFacetGroups(),
                    (facetConfig) => facetConfig['filter-group'].id,
                    (facetConfig, index) => {
                        let filterGroup = facetConfig['filter-group'];
                        return html`
                            <div
                                id="${filterGroup.id}"
                                class="filter-group filter-group--${filterGroup.id}">
                                <h3 class="filter-title">${this._i18n.t(`${filterGroup.name}`)}</h3>
                                ${renderGroupFacets(filterGroup.id)}
                            </div>
                        `;
                    },
                )}
            `;
        };

        return html`
            <div class="filters ${classMap({active: this.active})}">
                <div class="filter-header">
                    <div class="filter-header__left">
                        <dbp-icon name="funnel" class="facet-filter-icon"></dbp-icon>
                        <h2 class="filter-header__title">${i18n.t('cabinet-search.filters')}</h2>
                    </div>
                    <div class="filter-header__right">
                        <button @click="${this.openFilterSettings}" class="facet-settings-button">
                            <dbp-icon
                                title="${i18n.t('cabinet-search.facet-settings')}"
                                aria-label="${i18n.t('cabinet-search.facet-settings')}"
                                name="cog"></dbp-icon>
                        </button>
                    </div>
                    <dbp-icon
                        name="close"
                        id="filter-exit-icon"
                        class="filter-exit-icon"
                        @click=${() => {
                            this.toggleFilters();
                        }}></dbp-icon>
                </div>
                <div id="filters-container" class="filters-container">${renderGroups()}</div>
            </div>
        `;
    }

    /**
     * Remove a widget div and facetWidgetHash entry from the DOM based on the schema field
     * @param schemaField
     */
    removeWidget(schemaField) {
        this._facetsConfigs = this._facetsConfigs.filter((facetConfig) => {
            return facetConfig.schemaField !== schemaField;
        });
        delete this.facetWidgetHash[schemaField];
    }

    /**
     * Remove all widget divs and facetWidgetHash entries from the DOM based on the schema fields
     * @param {Array} schemaFields - Array of schema field names to remove
     */
    removeWidgets(schemaFields) {
        if (!Array.isArray(schemaFields)) {
            return;
        }

        schemaFields.forEach((schemaField) => {
            this.removeWidget(schemaField);
        });
    }
}
