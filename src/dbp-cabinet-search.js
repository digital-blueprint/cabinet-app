import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {AuthMixin, LangMixin, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from './dbp-cabinet-lit-element';
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {getPaginationCSS} from './styles.js';
import {Icon, InlineNotification, Modal} from '@dbp-toolkit/common';
import {classMap} from 'lit/directives/class-map.js';
import {Activity} from './activity.js';
import metadata from './dbp-cabinet-search.metadata.json';
import instantsearch from 'instantsearch.js';
import DbpTypesenseInstantSearchAdapter from './dbp-typesense-instantsearch-adapter.js';
import {hits, searchBox, stats, pagination} from 'instantsearch.js/es/widgets';
import {configure} from 'instantsearch.js/es/widgets';
import {pascalToKebab, preactRefReplaceChildren} from './utils';
import {CabinetFile} from './components/dbp-cabinet-file.js';
import {CabinetViewPerson} from './components/dbp-cabinet-view-person.js';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';
import {TypesenseService, TYPESENSE_COLLECTION} from './services/typesense.js';
import {BaseObject} from './baseObject.js';
import {name as pkgName} from '../package.json';
import {CabinetFilterSettings} from './components/dbp-cabinet-filter-settings.js';
import InstantSearchModule from './modules/instantSearch.js';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {createInstance} from './i18n';
import {createClearRefinements} from './clear-refinements.js';
import {createCurrentRefinements} from './current-refinements';

class StatsWidget extends LangMixin(AuthMixin(DBPLitElement), createInstance) {
    constructor() {
        super();
        this.data = null;
    }

    static get properties() {
        return {
            ...super.properties,
            data: {type: Object},
        };
    }

    render() {
        if (this.data !== null) {
            return html`
                ${this._i18n.t('search.stats', {
                    count: this.data.nbHits,
                    processingTimeMS: this.data.processingTimeMS,
                })}
            `;
        }
        return html``;
    }
}

class EmptyWidget extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.results = null;
    }

    static get properties() {
        return {
            ...super.properties,
            results: {type: Object},
        };
    }

    static styles = [
        commonStyles.getThemeCSS(),
        commonStyles.getGeneralCSS(false),
        css`
            .no-results {
                text-align: center;
                padding: 1em;
                color: var(--dbp-content);
            }
        `,
    ];

    render() {
        const text = this._i18n.t('search.no-results');
        return html`
            <div class="no-results">${text}</div>
        `;
    }
}

function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => func.apply(this, args), delay);
    };
}

class CabinetSearch extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.activity = new Activity(metadata);
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            id: '',
            objectType: '',
        };
        this.documentViewPersonModalRef = createRef();
        this.documentFileComponentRef = createRef();
        this.filterSettingsModalRef = createRef();
        this.cabinetFacetsRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        /** @type {InstantSearchModule} */
        this.instantSearchModule = null;
        this.facetConfigs = [];
        this.typesenseInstantsearchAdapter = null;
        this.search = null;
        this.configureWidget = null;
        this.documentViewId = null;
        this.personViewId = null;
        this.resetRoutingUrl = false;
        this.lockDocumentViewDialog = false;
        this.facetWidgets = [];
        this._loadModulesPromise = null;
        this._initInstantsearchPromise = null;
        this._initialUiState = null;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-modal': Modal,
            'dbp-cabinet-file': CabinetFile,
            'dbp-cabinet-view-person': CabinetViewPerson,
            'dbp-inline-notification': InlineNotification,
            'dbp-cabinet-facets': CabinetFacets,
            'dbp-cabinet-filter-settings': CabinetFilterSettings,
            'dbp-cabinet-stats-widget': StatsWidget,
            'dbp-cabinet-empty-widget': EmptyWidget,
        };
    }

    async loginCallback(auth) {
        await this.ensureModules();
        await this.ensureInstantsearch();
        await this.updateComplete;
        await this.handleAutomaticDocumentViewOpen();
        await this.handleAutomaticPersonViewOpen();
    }

    async firstUpdated() {
        await this.ensureModules();
    }

    static get properties() {
        return {
            ...super.properties,
            hitData: {type: Object, attribute: false},
            documentFile: {type: File, attribute: false},
            search: {type: Object, attribute: false},
            facetConfigs: {type: Array, state: true},
        };
    }

    update(changedProperties) {
        // We need to call super.update first, so the property facetVisibilityStates is set correctly!
        super.update(changedProperties);

        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'auth':
                    // Update the Typesense Instantsearch adapter configuration with the new bearer token
                    if (this.typesenseInstantsearchAdapter) {
                        this.typesenseInstantsearchAdapter.updateConfiguration(
                            this.getTypesenseInstantsearchAdapterConfig(),
                        );
                    }
                    break;
                case 'routingUrl':
                    this.handleRoutingUrlChange();
                    break;
                case 'facetVisibilityStates':
                    this.updateFacetVisibility();
                    break;
            }
        });
    }

    async handleAutomaticDocumentViewOpen() {
        // The first process that fulfills all needs to open the document view dialog will do so
        if (this.documentViewId && !this.lockDocumentViewDialog && this.auth.token) {
            if (await this.openDocumentViewDialogWithId(this.documentViewId)) {
                this.documentViewId = null;
            }
        }
    }

    async handleAutomaticPersonViewOpen() {
        // The first process that fulfills all needs to open the person view dialog will do so
        if (this.personViewId && this.auth.token) {
            if (await this.openPersonViewDialogWithId(this.personViewId)) {
                this.personViewId = null;
            }
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    async openDocumentAddDialog(hit) {
        this.hitData = hit;
        // Open the file source dialog to select a file
        this._('#file-source').setAttribute('dialog-open', '');
    }

    async openDocumentViewDialog(hit) {
        this.hitData = hit;

        // We need to wait until rendering is complete after this.hitData has changed,
        // or the dialog will not open on the first click
        // https://lit.dev/docs/components/lifecycle/#updatecomplete
        await this.updateComplete;

        const objectType = hit.objectType;

        if (objectType === 'person') {
            /**
             * @type {CabinetViewPerson}
             */
            const component = this.documentViewPersonModalRef.value;
            component.setObjectTypeViewComponents(this.objectTypeViewComponents);
            await component.openDialogWithHit(hit);
        } else {
            this.openDocumentViewDialogWithId(hit.id);
        }
    }

    async openPersonViewDialogWithId(id) {
        /**
         * @type {CabinetViewPerson}
         */
        const component = this.documentViewPersonModalRef.value;

        if (!component || this.objectTypeViewComponents.length === 0) {
            return false;
        }

        component.setObjectTypeViewComponents(this.objectTypeViewComponents);

        const hit = await this._getTypesenseService().fetchItem(id);
        console.assert(hit !== null, 'Error fetching item:', id);
        await component.openDialogWithHit(hit);

        return true;
    }

    async openDocumentViewDialogWithId(id) {
        // We need an extra check, because we need to be very quick in returning false
        if (this.objectTypeViewComponents.length === 0) {
            return false;
        }

        /**
         * @type {CabinetFile}
         */
        const component = this.documentFileComponentRef.value;

        if (!component) {
            return false;
        }

        // We need a lock, because openDocumentViewDialogWithId can be called multiple times
        // so quickly in the lit lifecycle that we make multiple typesense requests and get
        // multiple error messages if the document was not found
        this.lockDocumentViewDialog = true;

        component.setObjectTypeViewComponents(this.objectTypeViewComponents);

        await component.openViewDialogWithFileId(id);
        this.lockDocumentViewDialog = false;

        return true;
    }

    async connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        // Listen to DbpCabinetDocumentAdd events, to open the file dialog in add mode
        this.addEventListener('DbpCabinetDocumentAdd', function (event) {
            /**
             * @type {CabinetFile}
             */
            const component = that.documentFileComponentRef.value;
            component.setObjectTypeViewComponents(this.objectTypeViewComponents);
            component.openDocumentAddDialogWithPersonHit(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentView events, to open the file dialog in view mode
        this.addEventListener('DbpCabinetDocumentView', function (event) {
            that.openDocumentViewDialog(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentChanged events to refresh the search
        this.addEventListener('DbpCabinetDocumentChanged', () => {
            console.log('Refresh after document changed');
            this.search.refresh();
        });

        // Listen to DbpCabinetFilterPerson events to filter to a specific person
        this.addEventListener('DbpCabinetFilterPerson', function (event) {
            let helper = that.search.helper;
            helper.toggleFacetRefinement('person.person', event.detail.person).search();
        });

        // Listen to DbpCabinetFilterPerson events to filter to a specific person
        this.addEventListener('DbpCabinetOpenFilterSettings', async (event) => {
            /** @type {CabinetFilterSettings} */
            const filterSettingsModal = this.filterSettingsModalRef.value;

            filterSettingsModal.open(this.facetConfigs);
        });
    }

    async ensureInstantsearch() {
        if (!this._initInstantsearchPromise) {
            this._initInstantsearchPromise = this._performInitInstantsearch();
        }
        return this._initInstantsearchPromise;
    }

    /**
     * @returns {CabinetFacets}
     */
    getCabinetFacets() {
        return this.cabinetFacetsRef.value;
    }

    async _performInitInstantsearch() {
        const search = this.createInstantsearch();
        this.search = search;

        let facets = this.getCabinetFacets();
        search.addWidgets([
            configure({hitsPerPage: 24}),
            facets.createConfigureWidget(),
            this.createSearchBox(),
            this.createHits(),
            this.createStats(),
            this.createPagination('#pagination-bottom'),
            createClearRefinements(this, this._('#clear-filters')),
            createCurrentRefinements(this, this._('#current-filters'), this.facetConfigs),
        ]);

        this.facetWidgets = await this.createFacets();
        search.addWidgets(this.facetWidgets);
        console.log('initInstantsearch this.createFacets()', this.facetWidgets);

        search.start();

        // When the search is stalled, we dim the search results,
        // so the user knows that the search is still running.
        search.on('render', () => {
            if (search.status === 'stalled') {
                this._('.results').classList.add('stalled');
            } else {
                this._('.results').classList.remove('stalled');
            }
        });
    }

    static get styles() {
        return [
            commonStyles.getThemeCSS(),
            commonStyles.getGeneralCSS(false),
            commonStyles.getButtonCSS(),
            commonStyles.getLinkCss(),
            commonStyles.getNotificationCSS(),
            commonStyles.getActivityCSS(),
            commonStyles.getRadioAndCheckboxCss(),
            commonStyles.getFormAddonsCSS(),
            getPaginationCSS(),
            // language=css
            css`
                .results.stalled {
                    opacity: 0.6;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                }

                .result-container {
                    margin-top: 0;
                    padding-top: 1em;
                    display: grid;
                    grid-template-columns: 24em minmax(0, 1fr);
                    grid-template-areas: 'empty header' 'sidebar main';
                    gap: 0 2em;
                }

                .result-container.wide-facets {
                    grid-template-columns: 40em minmax(0, 1fr);
                }

                .result-container.no-facets {
                    grid-template-columns: minmax(0, 1fr);
                    grid-template-areas: 'header' 'main';
                }

                .refinement-container {
                    padding-top: 1em;
                    grid-area: sub1 / sub1 / span 1 / span 2;
                    display: flex;
                    justify-content: space-between;
                }

                dbp-cabinet-facets {
                    grid-area: sidebar;
                    margin-top: 1em;
                }

                .results {
                    grid-area: main;
                }

                .search-box-container {
                    display: flex;
                    gap: 5px;
                }

                .search-box-widget {
                    flex: 4 1 auto;
                }

                .ais-SearchBox-form {
                    display: flex;
                }

                .ais-SearchBox-input {
                    flex-grow: 1;
                    height: 2em;
                    background-color: var(--dbp-background);
                    color: var(--dbp-content);
                    border: var(--dbp-border);
                    padding-inline: 0.5em;
                    padding: 0 1.2em 0 2.2em;
                    border-radius: 0 !important;
                }

                .help-container {
                    flex: 0.5 auto 0%;
                    background-color: var(--dbp-background);
                    border: var(--dbp-border);
                    /*display:flex is none for now*/
                    display: none;
                    justify-content: center;
                    align-items: center;
                }

                .help-container svg {
                    fill: var(--dbp-content);
                    width: 2em;
                    height: 1.7em;
                }

                .ais-Hits-list {
                    display: grid;
                    grid-template-columns: repeat(1, minmax(300px, 1fr));
                    padding: 0;
                    margin-top: 0;
                    box-sizing: border-box;
                }

                .ais-Hits-item {
                    padding: 5px;
                    border: 1px solid var(--dbp-content);
                    list-style-type: none;
                    overflow: hidden;
                    min-height: calc(100px + 3vh);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .hits-doc-footer {
                    position: relative;
                    display: flex;
                    justify-content: flex-end;
                }

                #hits-footer {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    padding-top: 15px;
                }

                .ais-Pagination-list {
                    padding-top: 0px;
                }

                .ais-Hits-item {
                    width: inherit;
                }

                .button-view {
                    padding: 0.3em 2em;
                    font-size: 18px;
                    background-color: var(--dbp-primary-surface);
                    color: var(--dbp-on-primary-surface);
                    text-align: center;
                    white-space: nowrap;
                    font-size: inherit;
                    font-weight: bolder;
                    font-family: inherit;
                    transition:
                        0.15s,
                        color 0.15s;
                    border: none;
                }

                .ais-CurrentRefinements-categoryLabel {
                    color: var(--dbp-content);
                }

                @media (max-width: 768px) {
                    .result-container {
                        margin-top: 0;
                        display: grid;
                        grid-template-columns: 1fr 1fr auto;
                        grid-template-rows: auto auto;
                        grid-template-areas:
                            'empty header'
                            'sub1 sub2'
                            'main main';
                        gap: 0;
                    }

                    .ais-Hits-list {
                        grid-area: main;
                    }

                    .results {
                        grid-area: main;
                        width: 100%;
                    }

                    .facet-filter-button-icon {
                        color: #9e1e4d;
                        padding-bottom: 0.2em;
                    }

                    .filter-header-button {
                        gap: 0.5em;
                        display: flex;
                        align-items: center;
                        border: var(--dbp-border);
                        height: 1.9em;
                        padding: 0 1em 0 1em;
                        cursor: pointer;
                    }

                    .deleted-only {
                        display: flex;
                        flex-wrap: nowrap;
                        justify-content: end;
                        padding-right: 0.4em;
                    }

                    #result-count {
                    }

                    .refinement-container {
                        display: inline-block;
                    }
                }
                @media (min-width: 1100px) {
                    #filter-header-button {
                        display: none;
                    }
                }

                @media (min-width: 769px) and (max-width: 1099px) {
                    #filter-header-button {
                        display: none;
                    }

                    .dbp-cabinet-facets {
                    }

                    .filter {
                        min-width: 24em;
                        max-width: max-content;
                    }

                    .result-container {
                        gap: 0.5em;
                        grid-template-columns: auto;
                    }
                }

                @media (min-width: 380px) and (max-width: 489px) {
                    #result-count {
                        padding-right: 0.4em;
                    }

                    .result-container {
                        grid-template-columns: auto 1fr;
                        gap: 0;
                    }
                }
            `,
        ];
    }

    /**
     * Get the search parameters for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getSearchParameters() {
        // https://typesense.org/docs/0.25.1/api/search.html#ranking-and-sorting-parameters
        let searchParameters = {
            query_by:
                'person.familyName,person.givenName,file.base.additionalType.text,person.stPersonNr,person.studId,person.birthDateDe,file.base.subjectOf',
            sort_by: 'sortKey:asc',
            // Show not-deleted documents / Show only deleted documents
            // filter_by: "base.isScheduledForDeletion:" + (this.showScheduledForDeletion ? "true" : "false"),
            // filter_by: "file.base.deleteAtTimestamp:>0",
            // filter_by: "@type:=Person || file.base.isSchedulerForDeletion:=false",
            num_typos: '1,1,0,0,0,0,0',
            drop_tokens_threshold: 0,
            typo_tokens_threshold: 0,
            group_by: 'base.personGroupId',
            group_limit: 1,
            group_missing_values: false,
            facet_strategy: 'exhaustive',
        };

        return searchParameters;
    }

    /**
     * Get the config for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getTypesenseInstantsearchAdapterConfig() {
        let serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this.entryPointUrl,
            this.auth.token,
        );
        let facetFields = this.facetConfigs
            .filter((facetConfig) => facetConfig.schemaField)
            .map((facetConfig) => facetConfig.schemaField);
        return {
            server: serverConfig,
            additionalSearchParameters: this.getSearchParameters(),
            // study.status.text can contain ":" for example
            facetableFieldsWithSpecialCharacters: facetFields,
        };
    }

    _getTypesenseService() {
        if (!this.auth.token) {
            throw new Error('No auth token set');
        }

        let serverConfig = TypesenseService.getServerConfigForEntryPointUrl(
            this.entryPointUrl,
            this.auth.token,
        );
        return new TypesenseService(serverConfig);
    }

    /**
     * Create the Instantsearch instance
     */
    createInstantsearch() {
        const typesenseInstantsearchAdapter = new DbpTypesenseInstantSearchAdapter(
            this.getTypesenseInstantsearchAdapterConfig(),
        );

        /** @type {CabinetFacets} */
        const ref = this.cabinetFacetsRef.value;
        typesenseInstantsearchAdapter.setFacetComponent(ref);
        typesenseInstantsearchAdapter.setFacetConfigs(this.facetConfigs);

        // We need to leak the typesenseInstantsearchAdapter instance to the global scope,
        // so we can update the additional search parameters later
        this.typesenseInstantsearchAdapter = typesenseInstantsearchAdapter;

        // typesenseInstantsearchAdapter.typesenseClient is no Typesense.Client instance, it's a Typesense.SearchClient instance!
        const searchClient = typesenseInstantsearchAdapter.searchClient;

        return instantsearch({
            searchClient,
            indexName: TYPESENSE_COLLECTION,
            future: {
                preserveSharedStateOnUnmount: true,
            },
            stalledSearchDelay: 500,
            initialUiState: this._initialUiState ?? {},
        });
    }

    createSearchBox() {
        const i18n = this._i18n;
        const placeholderText = i18n.t('search-cabinet');
        return searchBox({
            container: this._('#searchbox'),
            showLoadingIndicator: false,
            placeholder: placeholderText,
            queryHook: debounce((query, refine) => {
                refine(query);
            }, 150),
        });
    }

    createHits() {
        let cabinetSearch = this;

        return hits({
            container: this._('#hits'),
            escapeHTML: true,
            transformItems: (items) => {
                const helper = this.search.helper;
                const facetName = 'person.person';
                const state = helper.state;

                return items.map((item) => {
                    const value = item.person.person;
                    const active = (state.facetsRefinements?.[facetName] || []).concat(
                        state.disjunctiveFacetsRefinements?.[facetName] || [],
                    );

                    return {
                        ...item,
                        isFiltered: active.includes(value),
                    };
                });
            },

            templates: {
                empty: (results, {html}) => {
                    let emptyElement = cabinetSearch.createScopedElement(
                        'dbp-cabinet-empty-widget',
                    );
                    emptyElement.setAttribute('subscribe', 'lang');
                    emptyElement.results = results;
                    return html`
                        <span ref=${preactRefReplaceChildren(emptyElement)}></span>
                    `;
                },
                item: (hit, {html}) => {
                    const objectType = hit.objectType;
                    const tagPart = pascalToKebab(hit.objectType);
                    const tagName = 'dbp-cabinet-object-type-hit-' + tagPart;
                    const objectTypeHitComponent = this.objectTypeHitComponents[objectType];

                    cabinetSearch.defineScopedElement(tagName, objectTypeHitComponent);
                    let hitElement = cabinetSearch.createScopedElement(tagName);
                    hitElement.setAttribute('subscribe', 'lang');
                    hitElement.data = hit;

                    return html`
                        <span ref=${preactRefReplaceChildren(hitElement)}></span>
                    `;
                },
            },
        });
    }

    createStats() {
        let statsWidget = this.createScopedElement('dbp-cabinet-stats-widget');
        statsWidget.setAttribute('subscribe', 'lang');

        return stats({
            container: this._('#result-count'),
            templates: {
                text: (data, {html}) => {
                    statsWidget.data = data;
                    return html`
                        <span ref=${preactRefReplaceChildren(statsWidget)}></span>
                    `;
                },
            },
        });
    }

    createPagination(id) {
        return pagination({
            container: this._(id),
        });
    }

    /**
     * This will be used as createFacets() in the CabinetFacets component.
     * @returns {Promise<*[]>}
     */
    async createFacets() {
        /** @type {CabinetFacets} */
        const ref = this.cabinetFacetsRef.value;

        // Filter out facets we want to hide
        const visibleFacetNames = this.getVisibleFacetNames();
        visibleFacetNames.push('person.person'); // Always show the person facet, so we can focus
        let visibleFacetsConfigs = this.getVisibleFacetsConfig(
            this.facetConfigs,
            visibleFacetNames,
        );

        return await ref.createFacetsFromConfig(visibleFacetsConfigs);
    }

    /**
     * Returns filtered facets config where only items with schemaField in visibleFacetNames
     * or items with 'filter-group' key are included.
     * @param {Array} facetConfigs
     * @param {Array<string>} visibleFacetNames
     * @returns {Array}
     */
    getVisibleFacetsConfig(facetConfigs, visibleFacetNames) {
        return facetConfigs.filter(
            (item) =>
                // For now we are showing all filter group headlines
                // TODO: Only show filter groups if they have visible facets
                'filter-group' in item ||
                // Always show the category group Person / Document
                item.groupId === 'category' ||
                // Show facets with schemaField that are in the visibleFacetNames
                (item.schemaField && visibleFacetNames.includes(item.schemaField)),
        );
    }

    _onLoginClicked(e) {
        this.sendSetPropertyEvent('requested-login-status', 'logged-in');
        e.preventDefault();
    }

    render() {
        const i18n = this._i18n;
        const algoliaCss = commonUtils.getAssetURL(pkgName, 'algolia-min.css');

        console.log('-- Render --');

        return html`
            <link rel="stylesheet" href="${algoliaCss}" />
            <div
                class="control ${classMap({
                    hidden: this.isLoggedIn() || !this.isAuthPending() || !this.loadingTranslations,
                })}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>
            <div
                class="notification is-warning ${classMap({
                    hidden: this.isLoggedIn() || this.isAuthPending() || this.loadingTranslations,
                })}">
                ${i18n.t('error-login-message')}
                <a href="#" @click="${this._onLoginClicked}">${i18n.t('error-login-link')}</a>
            </div>

            <div
                class="${classMap({
                    hidden: !this.isLoggedIn() || this.isAuthPending() || this.loadingTranslations,
                })}">
                <div class="search-box-container">
                    <div id="filter-header-button" class="filter-header-button"
                        @click="${() => {
                            const cabinetFacets = this.cabinetFacetsRef.value;
                            cabinetFacets.toggleFilters();
                        }}">
                        <dbp-icon name="funnel" class="facet-filter-button-icon"></dbp-icon>
                        <div class="filter-header-button__title">
                            ${i18n.t('cabinet-search.filters')}
                        </div>
                    </div>
                    <div id="searchbox" class="search-box-widget"></div>
                    <div class="help-container">
                        <svg
                            version="1.1"
                            id="Layer_2_1_"
                            x="0px"
                            y="0px"
                            viewBox="0 0 100 100"
                            style="enable-background:new 0 0 100 100;"
                            xml:space="preserve"
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:svg="http://www.w3.org/2000/svg">
                            <defs id="defs3" />
                            <g id="g3">
                                <path
                                    d="M51.1,23.1c-5.9-0.7-11.5,2.3-14.2,7.6c-0.7,1.4-0.2,3,1.2,3.7c1.4,0.7,3,0.2,3.7-1.2c1.7-3.2,5.1-5.1,8.7-4.7   c3.9,0.5,7.1,3.8,7.6,7.6c0.4,3.7-1.5,7.2-4.8,8.8c-4,1.9-6.5,6.1-6.5,10.7v11.7c0,1.5,1.2,2.8,2.8,2.8s2.8-1.2,2.8-2.8V55.6   c0-2.4,1.4-4.7,3.4-5.7c5.4-2.6,8.5-8.3,7.9-14.3C62.7,29.2,57.5,23.9,51.1,23.1z"
                                    id="path1" />
                                <path
                                    d="M49.4,74.9c-1.5,0-2.7,1.2-2.7,2.7s1.2,2.7,2.7,2.7c1.5,0,2.7-1.2,2.7-2.7S50.9,74.9,49.4,74.9z"
                                    id="path2" />
                                <path
                                    d="m 49.3,2.1 c -26,0 -47.2,21.2 -47.2,47.2 0,26 21.2,47.2 47.2,47.2 26,0 47.2,-21.2 47.2,-47.2 C 96.5,23.2 75.3,2.1 49.3,2.1 Z m 0,88.9 C 26.3,91 7.6,72.3 7.6,49.3 7.6,26.3 26.3,7.6 49.3,7.6 72.3,7.6 91,26.3 91,49.3 91,72.3 72.3,91 49.3,91 Z"
                                    id="path3"
                                    style="display:none;fill:#9e1e4d;fill-opacity:1" />
                            </g>
                        </svg>
                    </div>
                </div>
                <div id="refinement-container" class="refinement-container">
                    <div id="current-filters" class="current-filters"></div>
                    <div id="clear-filters" class="clear-filters"></div>
                </div>
                <div class="result-container ${this.facetConfigs.length === 0 ? 'no-facets' : ''}">
                    <dbp-cabinet-facets
                        class="dbp-cabinet-facets"
                        ${ref(this.cabinetFacetsRef)}
                        .search="${this.search}"
                        subscribe="lang"></dbp-cabinet-facets>
                    <div class="results">
                        <div id="hits"></div>
                        <div id="hits-footer">
                            <div id="result-count"></div>
                            <div id="pagination-bottom"></div>
                        </div>
                    </div>
                </div>

                <dbp-cabinet-view-person
                    ${ref(this.documentViewPersonModalRef)}
                    @close="${this.resetRoutingUrlIfNeeded}"
                    subscribe="lang,auth,entry-point-url,file-handling-enabled-targets,nextcloud-web-app-password-url,nextcloud-webdav-url,nextcloud-name,nextcloud-file-url,nextcloud-auth-info"></dbp-cabinet-view-person>

                <dbp-cabinet-file
                    mode="${CabinetFile.Modes.ADD}"
                    ${ref(this.documentFileComponentRef)}
                    @close="${this.resetRoutingUrlIfNeeded}"
                    subscribe="lang,auth,entry-point-url,file-handling-enabled-targets,nextcloud-web-app-password-url,nextcloud-webdav-url,nextcloud-name,nextcloud-file-url,nextcloud-auth-info"></dbp-cabinet-file>

                <dbp-cabinet-filter-settings
                    ${ref(this.filterSettingsModalRef)}
                    @settingsStored=${this.updateFacetVisibilityStates}
                    subscribe="lang,auth,entry-point-url"></dbp-cabinet-view-person>
            </div>
        `;
    }

    resetRoutingUrlIfNeeded() {
        if (this.resetRoutingUrl) {
            this.sendSetPropertyEvent('routing-url', '/', true);
            this.resetRoutingUrl = false;
        }
    }

    /**
     * Update the facet visibility states after the filter settings were stored.
     * @param e
     */
    updateFacetVisibilityStates(e) {
        this.setFacetVisibilityStates(e.detail || {});
    }

    filterFacetConfigsBySchemaFields(schemaFields) {
        return this.facetConfigs.filter((item) => schemaFields.includes(item.schemaField));
    }

    filterFacetWidgetsBySchemaFields(schemaFields) {
        /** @type {CabinetFacets} */
        const ref = this.cabinetFacetsRef.value;
        const facetWidgetHash = ref.getFacetWidgetHash();

        // Return all facet widgets where the key (schemaField) is in schemaFields
        return schemaFields
            .map((field) => facetWidgetHash[field])
            .filter((widget) => widget !== undefined);
    }

    async ensureModules() {
        if (!this._loadModulesPromise) {
            this._loadModulesPromise = this._performLoadModules();
        }
        return this._loadModulesPromise;
    }

    async _performLoadModules() {
        try {
            // Fetch the JSON file containing module paths
            const response = await fetch(commonUtils.getAssetURL(pkgName, 'modules.json'));
            const data = await response.json();

            console.log('data', data);
            let formComponents = {};
            let hitComponents = {};
            let viewComponents = {};

            // Iterate over the module paths and dynamically import each module
            // TODO: In a real-life scenario, you would probably want access only those keys that are needed (but we will need them all)
            for (const [schemaKey, path] of Object.entries(data['objectTypes'])) {
                const module = await import(path);

                console.log('schemaKey', schemaKey);
                console.log('path', path);
                console.log('module', module);

                /**
                 * @type {BaseObject}
                 */
                const object = new module.default();

                if (object.name) {
                    const name = object.name;
                    console.log(name);
                    // If the name starts with "file", add it to the list of file document types
                    if (name.startsWith('file') && object.getAdditionalTypes) {
                        for (const [key, value] of Object.entries(object.getAdditionalTypes())) {
                            this.fileDocumentTypeNames[name + '---' + key] = value;
                        }
                    }
                }

                if (object.getFormComponent) {
                    formComponents[object.name] = object.getFormComponent();
                }
                if (object.getHitComponent) {
                    hitComponents[object.name] = object.getHitComponent();
                }
                if (object.getViewComponent) {
                    viewComponents[object.name] = object.getViewComponent();
                }
            }

            this.objectTypeFormComponents = formComponents;
            console.log('formComponents', formComponents);
            this.objectTypeHitComponents = hitComponents;
            console.log('hitComponents', hitComponents);
            this.objectTypeViewComponents = viewComponents;
            console.log('viewComponents', viewComponents);
            console.log('fileDocumentTypeNames', this.fileDocumentTypeNames);

            const instantSearchModule = await import(data['instantSearch']);
            this.instantSearchModule = new instantSearchModule.default();
            this.facetConfigs = this.instantSearchModule.getFacetsConfig();

            await this.updateComplete;
            /**
             * @type {CabinetFile}
             */
            const addDocumentComponent = this.documentFileComponentRef.value;
            addDocumentComponent.setFileDocumentTypeNames(this.fileDocumentTypeNames);
            addDocumentComponent.setObjectTypeViewComponents(this.objectTypeViewComponents);
            addDocumentComponent.setFileDocumentFormComponents(formComponents);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }

    async handleRoutingUrlChange() {
        const routingData = this.getRoutingData();
        const id = routingData.pathSegments[1];

        if (routingData.pathSegments.length === 0) {
            this.closeDialogs();
        } else {
            switch (routingData.pathSegments[0]) {
                case 'document':
                    this.documentViewId = id;
                    this.resetRoutingUrl = true;
                    await this.handleAutomaticDocumentViewOpen();
                    break;
                case 'person':
                    this.personViewId = id;
                    this.resetRoutingUrl = true;
                    await this.handleAutomaticPersonViewOpen();
                    break;
            }
        }
    }

    closeDialogs() {
        this.documentViewId = null;
        this.personViewId = null;

        /**
         * @type {CabinetFile}
         */
        const fileComponent = this.documentFileComponentRef.value;

        if (fileComponent) {
            fileComponent.close();
        }

        /**
         * @type {CabinetViewPerson}
         */
        const personComponent = this.documentViewPersonModalRef.value;

        if (personComponent) {
            personComponent.close();
        }

        console.log('handleRoutingUrlChange reset');
    }

    async updateFacetVisibility() {
        if (!this.search) {
            return;
        }

        let fullReInit = true;

        if (fullReInit) {
            this._initialUiState = this.search.getUiState();
            this.search.dispose();
            this.search = null;
            this._initInstantsearchPromise = null;
            await this.ensureInstantsearch();
        } else {
            // XXX: this doesn't work completely. it still sends the facets in the request

            // Remove all facet widgets before creating new ones
            this.search.removeWidgets(this.facetWidgets);
            this.facetWidgets = [];

            // Create new facet widgets based on the current facet visibility states
            this.facetWidgets = await this.createFacets();

            // Add the new facet widgets to the search instance
            this.search.addWidgets(this.facetWidgets);
        }
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
