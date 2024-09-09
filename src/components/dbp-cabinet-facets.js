// noinspection CssUnusedSymbol,JSUnresolvedReference

import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html, render} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
// import {Button, IconButton, Translated} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
// import {pascalToKebab} from '../utils';
import {panel, refinementList } from 'instantsearch.js/es/widgets/index.js';
import {connectCurrentRefinements, connectClearRefinements} from 'instantsearch.js/es/connectors';

export class CabinetFacets extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        // this.search = null;
        /** @type {HTMLElement} */
        this.searchResultsElement = null;
    }

    connectedCallback() {
        super.connectedCallback();

        const allFiltersContainer = document.createElement('div');
        allFiltersContainer.setAttribute('id', 'filters-container');
        allFiltersContainer.classList.add('filters-container');

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
            panelHeader.addEventListener('mousedown', (event) => {
                if (event.target.closest('.ais-Panel-collapseButton')) {
                    return;
                } else {
                    panelHeader.querySelector('.ais-Panel-collapseButton').click();
                }
            });
        });
    }

    /**
     * Set facets configurations
     * @param facetsConfigs {array} - configuration for the facets
     */
    createFacetsFromConfig(facetsConfigs) {
        if (Array.isArray(facetsConfigs) === false) {
            return false;
        }
        let facets = [];

        facets.push(this.createCurrentRefinements());
        facets.push(this.createClearRefinements());

        facetsConfigs.forEach((facetConfig) => {
            if (Object.hasOwn(facetConfig, 'filter-group')) {
                this.addFilterHeader(facetConfig['filter-group']);
            } else {
                const facet = this.generateFacet(
                    facetConfig.groupId,
                    facetConfig.schemaField,
                    facetConfig.facetOptions,
                    facetConfig.usePanel
                );
                facets.push(facet());
            }
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

    // @type
    createCategoryRefinementList() {
        // const i18n = this._i18n;

        return refinementList({
            container: this._('#categories'),
            attribute: '@type',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
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
            },
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
        const {
            items,
            refine,
        } = renderOptions;

        // Render the widget
        let listItems = items.map(item => {
            return item.refinements.map(refinement => {
                let label;
                switch (item.attribute) {
                    default:
                        label = refinement.label;
                        break;
                }
                return html`
                    <li class="ais-CurrentRefinements-category">
                        <span class="ais-CurrentRefinements-categoryLabel">${label}</span>
                        <button class="ais-CurrentRefinements-delete"
                                title="${i18n.t('cabinet-search.refinement-delete-filter-button-text')}"
                                @click="${() => refine(refinement)}">
                            <span class="visually-hidden">${i18n.t('cabinet-search.refinement-delete-filter-button-text')}</span>
                            <span class="filter-close-icon"></span>
                        </button>
                    </li>
                `;
            });
        });

        const container = this.searchResultsElement.querySelector('#current-filters');
        render(html`
                <div class="ais-CurrentRefinements">
                    <ul class="ais-CurrentRefinements-list">
                        ${listItems}
                        <li id="clear-refinement" class="clear-refinement-container"></li>
                    </ul>
                </div>`,
            container);
    };

    renderClearRefinements = (renderOptions, isFirstRender) => {
        const i18n = this._i18n;
        const { canRefine, refine } = renderOptions;

        if (isFirstRender) {
            const clearButton = document.createElement('button');
            const clearButtonText = document.createElement('span');

            clearButtonText.textContent = i18n.t('cabinet-search.refinement-delete-all-filters');
            clearButton.appendChild(clearButtonText);
            clearButton.classList.add('clear-refinements-button');

            clearButton.addEventListener('click', () => {
                refine();
            });
            this.searchResultsElement.querySelector('.clear-refinement-container').appendChild(clearButton);
        }

        this.searchResultsElement.querySelector('.clear-refinement-container').querySelector('button').disabled = !canRefine;
    };

    createClearRefinements = () => {
        const customClearRefinements = connectClearRefinements(this.renderClearRefinements);

        return customClearRefinements({
            container: this.searchResultsElement.querySelector('#clear-filters'),
        });
    };

    /**
     * Generate facets based on schema name
     * @param {string} groupId - id of the filter group
     * @param {string} schemaField - name of the schema field
     * @param {object} facetOptions - options for the panel and the facet
     * @param {boolean} usePanel - whether to use panel or not
     * @returns {function(): *}
     */
    generateFacet(groupId, schemaField, facetOptions = {}, usePanel = true) {
        const i18n = this._i18n;
        let that = this;

        // Remove special characters from schema field name to use as css class and translation key.
        const schemaFieldSafe = schemaField.replace(/[@#]/g, '');

        const cssClass = this.schemaNameToKebabCase(schemaFieldSafe);
        const translationKey = this.schemaNameToKebabCase(schemaFieldSafe);

        const filterItem = document.createElement('div');
        filterItem.classList.add('filter');
        filterItem.setAttribute('id', `${cssClass}`);
        filterItem.classList.add(`filter--${cssClass}`);
        this._(`#${groupId}`).appendChild(filterItem);

        return function () {
            const defaultPanelOptions = {
                templates: {
                    header(options, {html}) {
                        return i18n.t(`cabinet-search.filter-${translationKey}-title`);
                    },
                },
                collapsed: () => true,
                hidden(options) {
                    return options.items.length <= 1;
                },
            };
            const panelOptions = {
                ...defaultPanelOptions,
                ...(facetOptions.panel || {}),
            };

            const defaultRefinementListOptions = {
                container: that._(`#${cssClass}`),
                attribute: schemaField,
                sortBy: ['count:desc'],
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
                    }
                },
            };
            const refinementListOptions = {
                ...defaultRefinementListOptions,
                ...(facetOptions.facet || {}),
            };

            if (usePanel === false) {
                return refinementList(refinementListOptions);
            }

            const PanelWidget = panel(panelOptions)(refinementList);

            return PanelWidget(refinementListOptions);
        };
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
            .filters {
                border: 1px solid var(--dbp-content);
                height: 100%;
            }

            .filter-header {
                padding: 1em;
                border-bottom: 1px solid var(--dbp-content);
            }

            .filter-header__title {
                margin: 0;
                font-weight: bold;
            }

            .filters-container {
                padding: 1em;
            }

            .filter-group {
                margin-bottom: 2em;
                display: flex;
                flex-direction: column;
                gap: 1em;
            }

            .filter-title {
                margin: 0;
            }

            .filter:has(> [hidden]) {
                display: none;
            }

            /* panel search */
            .ais-SearchBox-form {
                display: flex;
                gap: 0.25em;
                padding-top: 0.5em;
            }

            .ais-SearchBox-input {
                flex-grow: 1;
            }

            input[type="search"]::-webkit-search-cancel-button {
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
            }

            .ais-Panel-header {
                display: flex;
                gap: 1em;
                align-items: center;
                border: 1px solid var(--dbp-content);
                padding: 0.5em;
                justify-content: space-between;
            }

            /* Prevent text selection on panel headers on click */
            .ais-Panel-header > span {
                user-select: none;
            }

            .ais-Panel-body {
                border: 1px solid var(--dbp-content);
                border-top: none 0;
                padding: 0 0.5em;
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
                <div id="filters-container" class="filters-container">
                </div>
            </div>
        `;
    }
}
