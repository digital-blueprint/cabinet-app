// noinspection CssUnusedSymbol,JSUnresolvedReference

import {Icon, ScopedElementsMixin} from '@dbp-toolkit/common';
import {css, html} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
import {classMap} from 'lit/directives/class-map.js';
import {repeat} from 'lit/directives/repeat.js';
import {FacetPanel} from './facet-panel.js';
import {connectRefinementList} from 'instantsearch.js/es/connectors/index.js';
import {RefinementList} from './refinement-list.js';
import {DateRangeRefinement, connectComplexDateRangeRefinement} from './date-range-refinement.js';
import {connectConfigure} from 'instantsearch.js/es/connectors';
import {ConfigureWidget} from './configure-widget.js';

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
            'dbp-icon': Icon,
            'dbp-cabinet-facet-panel': FacetPanel,
            'dbp-cabinet-refinement-list': RefinementList,
            'dbp-cabinet-date-range-refinement': DateRangeRefinement,
            'dbp-cabinet-configure-widget': ConfigureWidget,
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

    createConfigureWidget() {
        let cabinetFacets = this;

        const renderConfig = (renderOptions, isFirstRender) => {
            const container = renderOptions.widgetParams.container;

            let configureWidget;
            if (isFirstRender) {
                configureWidget = cabinetFacets.createScopedElement('dbp-cabinet-configure-widget');
                configureWidget.setAttribute('subscribe', 'lang');
                container.replaceChildren(configureWidget);
            } else {
                configureWidget = container.children[0];
            }
            configureWidget.configureRenderOptions = renderOptions;
        };

        let customConfigure = connectConfigure(renderConfig);
        return customConfigure({
            searchParameters: {filters: 'base.isScheduledForDeletion:false'},
            container: this._(`#custom-configure`),
        });
    }

    /**
     * Generates a facet based on schema name of a configuration
     * @param {object} facetConfig - configuration for the facet
     * @returns {function(): *}
     */
    generateFacet(facetConfig) {
        let that = this;

        const {schemaField, schemaFieldType = 'checkbox', facetOptions = {}} = facetConfig;

        // Remove special characters from schema field name to use as css class and translation key.
        const schemaFieldSafe = schemaField.replace(/[@#]/g, '');

        const cssClass = this.schemaNameToKebabCase(schemaFieldSafe);

        let cabinetFacets = this;

        return function () {
            if (schemaFieldType === 'checkbox') {
                const defaultRefinementListOptions = {
                    fieldType: schemaFieldType,
                    container: that._(`#${cssClass}`),
                    attribute: schemaField,
                    sortBy: ['isRefined:desc', 'count:desc', 'name:asc'],
                    limit: 12,
                    searchable: true,
                };
                const refinementListOptions = {
                    ...defaultRefinementListOptions,
                    ...(facetOptions.facet || {}),
                };

                that.facets.push(refinementListOptions);

                const renderRefinementList = (renderOptions, isFirstRender) => {
                    const container = renderOptions.widgetParams.container;

                    let refinementList;
                    if (isFirstRender) {
                        refinementList = cabinetFacets.createScopedElement(
                            'dbp-cabinet-refinement-list',
                        );
                        refinementList.setAttribute('subscribe', 'lang');
                        refinementList.renderFunction = facetConfig.renderFunction;
                        container.replaceChildren(refinementList);
                    } else {
                        refinementList = container.children[0];
                    }
                    refinementList.refinementListRenderOptions = renderOptions;
                };

                const customRefinementList = connectRefinementList(renderRefinementList);
                return customRefinementList(refinementListOptions);
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

                const renderDateRefinement = (renderOptions, isFirstRender) => {
                    const container = renderOptions.widgetParams.container;

                    let dateRefinement;
                    if (isFirstRender) {
                        dateRefinement = cabinetFacets.createScopedElement(
                            'dbp-cabinet-date-range-refinement',
                        );
                        dateRefinement.setAttribute('subscribe', 'lang');
                        container.replaceChildren(dateRefinement);
                    } else {
                        dateRefinement = container.children[0];
                    }
                    dateRefinement.refinementRenderOptions = renderOptions;
                };

                const customDateRefinement =
                    connectComplexDateRangeRefinement(renderDateRefinement);
                return customDateRefinement(dateRefinementOptions);
            }
        };
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
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            // language=css
            css`
                button {
                    border-radius: var(--dbp-border-radius);
                    cursor: pointer;
                    padding: calc(0.375em - 1px) 0.75em;
                    text-align: center;
                    white-space: nowrap;
                    font-size: inherit;
                    font-weight: bolder;
                    font-family: inherit;
                    transition:
                        c 0.15s,
                        color 0.15s;
                    background: var(--dbp-secondary-surface);
                    color: var(--dbp-on-secondary-surface);
                    border-color: var(--dbp-secondary-surface-border-color);
                    border: 1px solid;
                }

                .dbp-button-icon {
                    font-size: 1.2em;
                    top: 0.2em;
                    margin-right: 2px;
                    color: var(--dbp-secondary);
                }

                .display-none {
                    display: none !important;
                }

                .filters {
                    height: 100%;
                }

                .filter-header {
                    padding-bottom: 0.8em;
                    border-bottom: 5px solid var(--dbp-accent);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .filter-header__left {
                    display: flex;
                }

                .filter-header__right-group {
                    display: flex;
                    align-items: center;
                    gap: 0.2em;
                }

                .filter-header__right {
                    display: flex;
                    align-items: center;
                }

                .filter-header__title {
                    margin: 0;
                    font-weight: bold;
                }

                .facet-filter-icon {
                    color: var(--dbp-accent);
                    padding-right: 0.5em;
                    align-items: center;
                    justify-self: center;
                }

                .facet-settings-button {
                    background: transparent;
                    border: none;
                    font-size: 2rem;
                    color: var(--dbp-accent);
                    cursor: pointer;
                    padding: 0;
                }

                #custom-configure {
                    margin-top: 1em;
                }

                .filters-container {
                    margin-top: 2em;
                }

                .filter-exit-icon {
                    cursor: pointer;
                    color: var(--dbp-accent);
                    font-size: 1.5em;
                }

                .filter-group {
                    margin-bottom: 2em;
                    display: flex;
                    flex-direction: column;
                    gap: 1em;
                }

                .filter-title {
                    margin: 0;
                    padding-left: 1px;
                    font-weight: bold;
                }

                .filter:has(> [hidden]) {
                    display: none;
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

                    .facet-settings-button {
                        margin-right: 20px;
                    }
                }
            `,
        ];
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

        let renderGroupFacets = (facets) => {
            return html`
                ${repeat(
                    facets,
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
                        let facets = getFacetsForGroup(filterGroup.id);
                        // if there are no visible facets, hide the group
                        let hidden = facets.filter((facet) => !facet.hidden).length === 0;
                        return html`
                            <div
                                id="${filterGroup.id}"
                                class="filter-group filter-group--${filterGroup.id} ${hidden
                                    ? 'display-none'
                                    : ''}">
                                <h3 class="filter-title">${this._i18n.t(`${filterGroup.name}`)}</h3>
                                ${renderGroupFacets(facets)}
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
                        <h2 class="filter-header__title">${i18n.t('cabinet-search.filters')}</h2>
                    </div>
                    <div class="filter-header__right-group">
                        <div class="filter-header__right">
                            <button
                                class="button"
                                title="${i18n.t('filter-settings.filter-configuration')}"
                                aria-label="${i18n.t('filter-settings.filter-configuration')}"
                                @click="${this.openFilterSettings}">
                                <dbp-icon
                                    class="dbp-button-icon"
                                    name="cog"
                                    aria-hidden="true"></dbp-icon>
                                ${i18n.t('filter-settings.configuration')}
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
                </div>
                <div id="filters-container" class="filters-container">${renderGroups()}</div>
                <div id="custom-configure"></div>
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
