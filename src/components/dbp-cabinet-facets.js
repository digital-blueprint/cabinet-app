// noinspection CssUnusedSymbol,JSUnresolvedReference

import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html, render} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
import {panel, refinementList } from 'instantsearch.js/es/widgets/index.js';
import {connectCurrentRefinements, connectClearRefinements} from 'instantsearch.js/es/connectors';
import {createDateRefinement} from './dbp-cabinet-date-facet.js';

export class CabinetFacets extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        // this.search = null;
        /** @type {HTMLElement} */
        this.searchResultsElement = null;
        this.search = null;
        this.facets = [];
    }

    connectedCallback() {
        super.connectedCallback();

        const allFiltersContainer = document.createElement('div');
        allFiltersContainer.setAttribute('id', 'refinement-container');
        allFiltersContainer.classList.add('refinement-container');

        const currentRefinementsContainer = document.createElement('div');
        currentRefinementsContainer.setAttribute('id', 'current-filters');
        currentRefinementsContainer.classList.add('current-filters');

        const clearRefinementsContainer = document.createElement('div');
        clearRefinementsContainer.setAttribute('id', 'clear-filters');
        clearRefinementsContainer.classList.add('clear-filters');

        allFiltersContainer.append(currentRefinementsContainer);
        allFiltersContainer.append(clearRefinementsContainer);

        this.searchResultsElement = /** @type {HTMLElement} */ (this.closest('.result-container'));
        this.searchResultsElement.prepend(allFiltersContainer);
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            search: {type: Object, attribute: 'search'},
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    break;
                case 'search':
                    this.afterSearchInit();
                    break;
            }
        });

        super.update(changedProperties);
    }

    afterSearchInit() {
        // Add event listeners to open filters by clicking panel headers
        this._a('.ais-Panel-header').forEach((panelHeader) => {
            const header = /** @type {HTMLElement} */(panelHeader);
            header.addEventListener('click', (event) => {
                if (event.target instanceof HTMLElement && !event.target.closest('.ais-Panel-collapseButton')) {
                    const collapseButton = header.querySelector('.ais-Panel-collapseButton');
                    if (collapseButton instanceof HTMLElement) {
                        collapseButton.click();
                    }
                }
            });
        });
    }

    filterOnSelectedPerson(event) {
        if (event.detail.person) {
            // @TODO: don't hardcode facet name?
            const facetName = 'person.person';
            const value = event.detail.person;

            // Get the InstantSearch helper
            const helper = this.search.helper;

            // Toggle the refinement
            helper.toggleRefinement(facetName, value).search();
            this.openFacetOnPersonSelect(facetName);
        }
    }

    /**
     * Open a facet if a person is selected with the "person select" button
     * @param {string} facetName - the name of the facet field
     */
    openFacetOnPersonSelect(facetName) {
        const facetID = facetName.replace('.', '-');

        /** @type {HTMLElement} */
        const facet = this._(`#${facetID}`);

        if (facet && facet.querySelector('.ais-Panel').classList.contains('ais-Panel--collapsed')) {
            /** @type {HTMLElement} */
            const facetHeader = facet.querySelector('.ais-Panel-header');
            facetHeader.click();
        }
    }

    /**
     * Set facets configurations
     * @param facetsConfigs {array} - configuration for the facets
     */
    createFacetsFromConfig(facetsConfigs) {
        if (Array.isArray(facetsConfigs) === false) {
            return [];
        }
        let facets = [];
        // Translate placeholders
        facetsConfigs = this.translatePlaceholders(facetsConfigs);

        facets.push(this.createCurrentRefinements());
        facets.push(this.createClearRefinements());

        facetsConfigs.forEach((facetConfig) => {
            if (Object.hasOwn(facetConfig, 'filter-group')) {
                this.addFilterHeader(facetConfig['filter-group']);
            } else {
                const facet = this.generateFacet(facetConfig);
                facets.push(facet());
            }
            facetConfig = null;
        });

        return facets;
    }

    addFilterHeader(filterGroup) {
        let filterGroupHtml = document.createElement('div');
        filterGroupHtml.setAttribute('id', `${filterGroup.id}`);
        filterGroupHtml.classList.add('filter-group');
        filterGroupHtml.classList.add(`filter-group--${filterGroup.id}`);
        filterGroupHtml.innerHTML = `
            <h3 class="filter-title">
                ${this._i18n.t(`${filterGroup.name}`)}
            </h3>
        `;
        this._('#filters-container').appendChild(filterGroupHtml);
    }

    hideFilterGroupIfEmpty() {
        const filterGroups = this._a('#filters-container .filter-group');
        filterGroups.forEach( filterGroup => {
            const filterGroupElement = /** @type {HTMLElement} */(filterGroup);
            const refinementLists = filterGroupElement.querySelectorAll('.filter .ais-RefinementList');
            if (refinementLists.length === 0) {
                return;
            }
            const activeFilters = Array.from(refinementLists).filter((list) => !list.classList.contains('ais-RefinementList--noRefinement'));
            if (activeFilters.length === 0) {
                filterGroupElement.classList.add('display-none');
            } else {
                filterGroupElement.classList.remove('display-none');
            }
        });
      }

    createCurrentRefinements = () => {
        const customCurrentRefinements = connectCurrentRefinements(this.renderCurrentRefinements);

        return customCurrentRefinements({
            container: this.searchResultsElement.querySelector('#current-filters'),
        });
    };

    renderCurrentRefinements = (renderOptions) => {
        const i18n = this._i18n;
        const {items, refine, widgetParams} = renderOptions;
        const container = widgetParams.container;

        // Render the widget
        let listItems = items.map((item) => {
            return item.refinements.map((refinement) => {
                // Set refinement filter labels
                let label;
                switch (refinement.type) {
                    case 'numeric': {
                        // Date picker refinement filter labels
                        const activeFacet = this.facets.find(facet => facet.attribute === refinement.attribute);
                        if (activeFacet && activeFacet.fieldType === 'datepicker') {
                            let date = new Date(refinement.value * 1000).toLocaleDateString('de-AT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                            let operatorLabel = refinement.operator === '>=' ? i18n.t('cabinet-search.refinement-date-after-text') : i18n.t('cabinet-search.refinement-date-before-text');
                            label = `${operatorLabel} ${date}`;
                        }
                        break;
                    }
                    default: {
                        // Set checkbox refinement filter labels
                        label = refinement.label;
                        break;
                    }
                }
                return html`
                    <li class="ais-CurrentRefinements-category">
                        <span class="ais-CurrentRefinements-categoryLabel">${label}</span>
                        <button
                            class="ais-CurrentRefinements-delete"
                            title="${i18n.t('cabinet-search.refinement-delete-filter-button-text')}"
                            @click="${() => refine(refinement)}">
                            <span class="visually-hidden">
                                ${i18n.t('cabinet-search.refinement-delete-filter-button-text')}
                            </span>
                            <span class="filter-close-icon"></span>
                        </button>
                    </li>
                `;
            });
        });

        /** @type {HTMLElement} */
        // const container = this.searchResultsElement.querySelector('#current-filters');
        render(
            html`
                <div class="ais-CurrentRefinements">
                    <ul class="ais-CurrentRefinements-list">
                        ${listItems}
                        <li id="clear-refinement" class="clear-refinement-container"></li>
                    </ul>
                </div>
            `,
            container,
        );
    };

    renderClearRefinements = (renderOptions, isFirstRender) => {
        const i18n = this._i18n;
        const {canRefine, refine} = renderOptions;

        if (isFirstRender) {
            const clearButton = document.createElement('button');
            const clearButtonText = document.createElement('span');

            clearButtonText.textContent = i18n.t('cabinet-search.refinement-delete-all-filters');
            clearButton.appendChild(clearButtonText);
            clearButton.classList.add('clear-refinements-button');

            clearButton.addEventListener('click', () => {
                refine();
            });
            this.searchResultsElement
                .querySelector('.clear-refinement-container')
                .appendChild(clearButton);
        }

        this.searchResultsElement
            .querySelector('.clear-refinement-container')
            .querySelector('button').disabled = !canRefine;
    };

    createClearRefinements = () => {
        const customClearRefinements = connectClearRefinements(this.renderClearRefinements);

        return customClearRefinements({
            container: this.searchResultsElement.querySelector('#clear-filters'),
        });
    };

    /**
     * Generate facets based on schema name
     * @param {object} facetConfig - configuration for the facet
     * @returns {function(): *}
     */
    generateFacet(facetConfig) {
        const i18n = this._i18n;
        let that = this;

        const {
            groupId,
            schemaField,
            schemaFieldType = 'checkbox',
            facetOptions = {},
            usePanel = true
          } = facetConfig;

        // Remove special characters from schema field name to use as css class and translation key.
        const schemaFieldSafe = schemaField.replace(/[@#]/g, '');

        const cssClass = this.schemaNameToKebabCase(schemaFieldSafe);
        const cssTypeClass = this.schemaNameToKebabCase(schemaFieldType);
        const translationKey = this.schemaNameToKebabCase(schemaFieldSafe);

        const filterItem = document.createElement('div');
        filterItem.classList.add('filter');
        filterItem.setAttribute('id', `${cssClass}`);
        filterItem.classList.add(`filter--${cssClass}`);
        filterItem.classList.add(`filter-type-${cssTypeClass}`);
        this._(`#${groupId}`).appendChild(filterItem);

        return function () {
            const defaultPanelOptions = {
                templates: {
                    header(options, {html}) {
                        return i18n.t(`cabinet-search.filter-${translationKey}-title`);
                    },
                    collapseButtonText(options, { html }) {
                        return html`
                        <span>
                          ${options.collapsed
                            ? html`<svg width="16" height="16" version="1.1" id="Layer_2_1_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                            viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
                            <path d="M2.4,29.6l44.4,44.2c0.9,0.9,2.1,1.3,3.3,1.3c1.2,0,2.4-0.5,3.3-1.3l44.2-44.2c1.1-1.1,1.1-2.8,0-3.9
                            c-0.5-0.5-1.2-0.8-1.9-0.8c-0.7,0-1.4,0.3-1.9,0.8L50.1,69.3L6.3,25.7c-1.1-1.1-2.8-1.1-3.9,0C1.3,26.8,1.3,28.5,2.4,29.6z"/>
                            </svg>`
                            : html`<svg width="16" height="16" version="1.1" id="Layer_2_1_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	                        viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
                            <path d="M97.6,70.4L53.2,26.2c-0.9-0.9-2.1-1.3-3.3-1.3c-1.2,0-2.4,0.5-3.3,1.3L2.4,70.4c-1.1,1.1-1.1,2.8,0,3.9
	                        c0.5,0.5,1.2,0.8,1.9,0.8c0.7,0,1.4-0.3,1.9-0.8l43.6-43.6l43.8,43.6c1.1,1.1,2.8,1.1,3.9,0C98.7,73.2,98.7,71.5,97.6,70.4z"/>
                            </svg>`}
                        </span>
                      `;
                    },
                },
                collapsed: () => true,
                hidden(options) {
                    const facetValues = options.results.getFacetValues(schemaField, {});
                    return Array.isArray(facetValues) ? facetValues.length === 0 : false;
                },
            };
            const panelOptions = {
                ...defaultPanelOptions,
                ...(facetOptions.panel || {}),
            };

            if (schemaFieldType === 'checkbox') {
                const defaultRefinementListOptions = {
                    fieldType: schemaFieldType,
                    container: that._(`#${cssClass}`),
                    attribute: schemaField,
                    sortBy: ['isRefined:desc','count:desc', 'name:asc'],
                    limit: 12,
                    searchable: true,
                    searchableShowReset: false,
                    templates: {
                        item(item, {html}) {
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
                                        <span class="refinement-list-item-name" title="${item.label}">
                                        ${item.label}
                                    </span>
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

                if (usePanel === false) {
                    return refinementList(refinementListOptions);
                } else {
                    const PanelWidget = panel(panelOptions)(refinementList);
                    return PanelWidget(refinementListOptions);
                }
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

                if (usePanel === false) {
                    return createDateRefinement(dateRefinementOptions);
                } else {
                    const PanelWidget = panel(panelOptions)(createDateRefinement);
                    return PanelWidget(dateRefinementOptions);
                }
            }
        };
    }

    // Translate placeholders in array of objects
    translatePlaceholders(facetsConfigs) {
        const i18n = this._i18n;
        return facetsConfigs.map((item) => {
            if (item['filter-group']) {
                return item;
            }

            if (item.facetOptions && item.facetOptions.facet) {
                const facet = item.facetOptions.facet;

                if (facet.searchablePlaceholder) {
                    facet.searchablePlaceholder = i18n.t(facet.searchablePlaceholder);
                }
            }

            return item;
        });
    }

    handleGradientDisplay() {
        const facetWidgets = this._a('#filters-container .filter');

        if (facetWidgets) {
            facetWidgets.forEach(facetWidget => {
                const widget = /** @type {HTMLElement} */ (facetWidget);

                const COLLAPSED_COUNT = 12;
                const EXPANDED_COUNT = 30;
                const showMoreButton  = widget.querySelector('.ais-RefinementList-showMore');
                const searchBox = widget.querySelector('.ais-SearchBox-input');
                const resetButton = widget.querySelector('.ais-SearchBox-reset');
                const facetList = widget.querySelector('.ais-RefinementList-list');
                const facetItems = widget.querySelectorAll('.refinement-list-item');
                const facetCount = facetItems.length;

                // Toggle is-expanded class on showMoreButton click
                if (showMoreButton && showMoreButton.getAttribute('data-event-added') === null) {
                    showMoreButton.addEventListener('click', () => {
                        widget.querySelector('.ais-RefinementList-list').classList.toggle('is-expanded');
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
                        widget.classList.add('no-gradient');
                        return;
                    }
                    // Remove gradient if all facet items are visible.
                    if (!isExpanded && facetCount < COLLAPSED_COUNT) {
                        widget.classList.add('no-gradient');
                    }
                    if (isExpanded && facetCount < EXPANDED_COUNT) {
                        widget.classList.add('no-gradient');
                    }
                }
            });
        }
    }

    showHideFacetGradientOnSearch(facetWidget) {
        const EXPANDED_COUNT = 30;
        const facetItems = facetWidget.querySelectorAll('.refinement-list-item');
        const facetCount = facetItems.length;
        const isShowMoreButtonPresent  = facetWidget.querySelector('.ais-RefinementList-showMore');

        if (!isShowMoreButtonPresent && facetCount < EXPANDED_COUNT) {
            facetWidget.classList.add('no-gradient');
        } else {
            facetWidget.classList.remove('no-gradient');
        }
    }

    /**
     * Convert schema name to kebabCase for css classes and translation keys
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

            /* @TODO: remove this once we have a better solution for hiding facets (from configuration?) */
            .filter--person-person {
                visibility: hidden;
                height: 0;
            }

            .display-none {
                display: none !important;
            }

            .filters {
                height: 100%;
            }

            .filter-header {
                padding: 0.5em;
                border-bottom: 5px solid var(--dbp-override-accent);
            }

            .filter-header__title {
                margin: 0;
                font-weight: bold;
            }

            .filters-container {
                padding: 1em;
                margin-top:3em;
            }

            .filter-group {
                margin-bottom: 2em;
                display: flex;
                flex-direction: column;
                gap: 1em;
            }
            .filter-group--category{
                margin-left:6px;
            }
            .filter-group--person{
                background-image:url(/assets/icon/user.svg);
                background-repeat: no-repeat;
                background-size: 22px 22px;
                background-position-y:5px;
                padding-left: 5px;
            }
            .filter-group--file{
                background-image:url(/assets/icon/docs.svg);
                background-repeat: no-repeat;
                background-size: 22px 22px;
                background-position-y:5px;
                padding-left: 5px;
            }
            .filter-title {
                margin: 0;
                text-decoration: underline 2px solid var(--dbp-override-content);
                padding-left:20px;
            }

            .filter:has(> [hidden]) {
                display: none;
            }

            /* panel search */
            .ais-Panel-collapseButton  {
                background: none !important;
                border: none !important;
            }

            .ais-Panel-collapseButton span {
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
            }

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

            .filter:not(.no-gradient) .ais-RefinementList-list:after {
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

            .ais-Panel-header {
                display: flex;
                gap: 1em;
                align-items: center;
                padding: 0.5em;
                justify-content: space-between;
            }

            /* Prevent text selection on panel headers on click */
            .ais-Panel-header > span {
                user-select: none;
            }

            .ais-Panel-body {
                border-top: none 0;
                padding: 0 0.5em;
            }

            .filter-type-datepicker .ais-Panel-body {
                padding: 1em 0;
            }

            .filter-type-datepicker .ais-Panel-body > div {
                display: flex;
                gap: 1.5em;
                justify-content: center;
            }

            .filter input[type="date"] {
                padding: .5em;
            }

            /* input[type="date"]:invalid::after {
                display: block;
                content: "✖";
            } */

            /* input wrapper */
            ::-internal-datetime-container {position: relative}
            /* date field wrappers */
            ::-webkit-datetime-edit {
                max-width: max-content;
                padding-right: .5em;
            }
            ::-webkit-datetime-edit-fields-wrapper {}
            /* date separator */
            ::-webkit-datetime-edit-text {}
            /* date fields */
            ::-webkit-datetime-edit-month-field {}
            ::-webkit-datetime-edit-day-field {}
            ::-webkit-datetime-edit-year-field {}
            /* calendar button */
            ::-webkit-calendar-picker-indicator { cursor: pointer; }
            /* ??? */
            ::-webkit-inner-spin-button {}


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

            .ais-Panel-body {
                /*transition: opacity 0.25s, display 0.25s;*/
                /*transition-behavior: allow-discrete;*/
            }

            .ais-Panel--collapsed .ais-Panel-body {
                opacity: 0;
                display: none;
            }

            button.ais-RefinementList-showMore {
                margin-bottom: 1em;
            }
        `;
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render Facets --');

        return html`
            <div class="filters">
                <div class="filter-header">
                    <h2 class="filter-header__title">${i18n.t('cabinet-search.filters')}</h2>
                </div>
                <div id="filters-container" class="filters-container"></div>
            </div>
        `;
    }
}
