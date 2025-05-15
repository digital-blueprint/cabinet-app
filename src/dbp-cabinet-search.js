import {css, html} from 'lit';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPCabinetLitElement from './dbp-cabinet-lit-element';
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {getCurrentRefinementCSS, getPaginationCSS} from './styles';
import {Icon, InlineNotification, Modal} from '@dbp-toolkit/common';
import {classMap} from 'lit/directives/class-map.js';
import {Activity} from './activity.js';
import metadata from './dbp-cabinet-search.metadata.json';
import instantsearch from 'instantsearch.js';
import DbpTypesenseInstantSearchAdapter from './dbp-typesense-instantsearch-adapter.js';
import {hits, searchBox, sortBy, stats, pagination} from 'instantsearch.js/es/widgets';
import {configure} from 'instantsearch.js/es/widgets';
import {pascalToKebab} from './utils';
import {CabinetFile} from './components/dbp-cabinet-file.js';
import {CabinetViewPerson} from './components/dbp-cabinet-view-person.js';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';
import {TypesenseService, TYPESENSE_COLLECTION} from './services/typesense.js';
import {updateDatePickersForExternalRefinementChange} from './components/dbp-cabinet-date-facet.js';
import {BaseObject} from './baseObject.js';
import {name as pkgName} from '../package.json';

class CabinetSearch extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.activity = new Activity(metadata);
        this.fuzzySearch = true;
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            id: '',
            objectType: '',
        };
        this.documentViewPersonModalRef = createRef();
        this.documentFileComponentRef = createRef();
        this.cabinetFacetsRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        /** @type {InstantSearchModule} */
        this.instantSearchModule = {};
        this.facetConfigs = [];
        this.typesenseInstantsearchAdapter = null;
        // Only show not-deleted documents by default
        this.showScheduledForDeletion = false;
        this.search = null;
        this.configureWidget = null;
        this.documentViewId = null;
        this.personViewId = null;
        this.resetRoutingUrl = false;
        this.lockDocumentViewDialog = false;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-modal': Modal,
            'dbp-cabinet-file': CabinetFile,
            'dbp-cabinet-view-person': CabinetViewPerson,
            'dbp-inline-notification': InlineNotification,
            'dbp-cabinet-facets': CabinetFacets,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            hitData: {type: Object, attribute: false},
            documentFile: {type: File, attribute: false},
            showScheduledForDeletion: {type: Boolean, attribute: false},
            search: {type: Object, attribute: false},
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    // Refresh the search after switching the language to update hits with new language
                    if (this.search) {
                        this.search.refresh();
                    }
                    break;
                case 'auth':
                    // Update the Typesense Instantsearch adapter configuration with the new bearer token
                    if (this.typesenseInstantsearchAdapter) {
                        this.typesenseInstantsearchAdapter.updateConfiguration(
                            this.getTypesenseInstantsearchAdapterConfig(),
                        );
                    } else {
                        this.initInstantsearch();
                    }

                    this.handleAutomaticDocumentViewOpen();
                    this.handleAutomaticPersonViewOpen();

                    break;
                case 'showScheduledForDeletion':
                    if (!this.search) {
                        return;
                    }

                    // We need to remove the "configure" widget and add it again, because it seems we can't update the filters directly
                    this.search.removeWidgets([this.configureWidget]);
                    this.search.addWidgets([this.createConfigureWidget()]);
                    break;
                case 'routingUrl':
                    this.handleRoutingUrlChange();
                    break;
            }
        });

        super.update(changedProperties);
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

    connectedCallback() {
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
        this.addEventListener('DbpCabinetDocumentChanged', function () {
            console.log('Refresh after document changed');
            this.search.refresh();
        });

        // Listen to DbpCabinetFilterPerson events to filter to a specific person
        this.addEventListener('DbpCabinetFilterPerson', function (event) {
            that.cabinetFacetsRef.value.filterOnSelectedPerson(event);
        });

        this.updateComplete.then(async () => {
            await this.loadModules();
            await this.handleAutomaticDocumentViewOpen();
            await this.handleAutomaticPersonViewOpen();
        });
    }

    initInstantsearch() {
        if (!this.auth.token || this.facetConfigs.length === 0) {
            return;
        }

        this.search = this.createInstantsearch();
        const search = this.search;

        search.addWidgets([
            this.createConfigureWidget(),
            this.createSearchBox(),
            this.createHits(),
            this.createSortBy(),
            this.createStats(),
            this.createPagination('#pagination-bottom'),
        ]);

        if (this.facetConfigs.length === 0) {
            this._('dbp-cabinet-facets').remove();
            this._('.result-container').classList.add('no-facets');
        }

        if (this.facetConfigs.length > 0 && this.search) {
            search.addWidgets(this.createFacets());
        }

        search.start();

        search.on('render', () => {
            /** @type {CabinetFacets} */
            const ref = this.cabinetFacetsRef.value;

            // Handle gradients display on facets.
            ref.handleGradientDisplay();
            ref.hideFilterGroupIfEmpty();

            // Create the click events for the facets to we can refresh the search if a facet was opened
            ref.createFacetToggleClickEvents();
        });

        // Clear date facets on refinement clearing.
        search.helper.on('change', (res) => {
            /** @type {CabinetFacets} */
            const ref = this.cabinetFacetsRef.value;

            updateDatePickersForExternalRefinementChange(res, ref.facets);
        });
    }

    createConfigureWidget() {
        console.log(
            'createConfigureWidget this.showScheduledForDeletion',
            this.showScheduledForDeletion,
        );

        this.configureWidget = configure({
            hitsPerPage: 24,
            // Show not-deleted documents / Show only deleted documents
            filters:
                'base.isScheduledForDeletion:' + (this.showScheduledForDeletion ? 'true' : 'false'),
        });

        return this.configureWidget;
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getLinkCss()}
            ${commonStyles.getNotificationCSS()}
            ${commonStyles.getActivityCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}
            ${commonStyles.getFormAddonsCSS()}
            ${getCurrentRefinementCSS()}
            ${getPaginationCSS()}

            .result-container {
                margin-top: 0;
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

            dbp-cabinet-facets {
                grid-row-start: 2;
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

            .sort-widget .ais-SortBy-select {
                height: 2em;
                padding: 1px 0.5em;
                padding-right: 2em;
                /* override toolkit select style */
                background-size: 16px;
                background-position: right 0.5em center;
                display: none;
            }

            .sort-widget .ais-SortBy-select option {
                background-color: var(--dbp-background);
                color: var(--dbp-content);
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
                fill: var(--dbp-override-content);
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

            .hit-person-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .hit-person-last-modify-content {
                flex: 1;
                color: var(--dbp-override-content);
            }

            .hits-person-footer {
                display: grid;
                grid-template-columns: repeat(3, auto); /* auto adjusts to button widths */
                gap: 5px;
                justify-content: end;
            }

            .hits-doc-footer {
                position: relative;
                display: flex;
                justify-content: flex-end;
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

            .dropdown-title {
                padding: 5px;
                align-items: center;
                display: none;
            }

            .ais-CurrentRefinements-categoryLabel {
                color: var(--dbp-content);
            }

            @media (max-width: 1280px) and (min-width: 768px) {
            }
        `;
    }

    /**
     * Get the search parameters for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getSearchParameters() {
        // https://typesense.org/docs/0.25.1/api/search.html#ranking-and-sorting-parameters
        let searchParameters = {
            query_by:
                'person.familyName,person.givenName,file.base.fileName,objectType,person.stPersonNr,person.studId,person.identNrObfuscated,person.birthDate',
            // @TODO we should set typo tolerance by field. ex.: birthdate or identNrObfuscated dont need typo tolerance
            sort_by: 'person.person:asc,@type:desc,objectType:desc',
            // Show not-deleted documents / Show only deleted documents
            // filter_by: "base.isScheduledForDeletion:" + (this.showScheduledForDeletion ? "true" : "false"),
            // filter_by: "file.base.deleteAtTimestamp:>0",
            // filter_by: "@type:=Person || file.base.isSchedulerForDeletion:=false",
            num_typos: '2,2,0,0,0,0,0,0',
            group_by: 'base.personGroupId',
            group_limit: 1,
            group_missing_values: false,
            facet_strategy: 'exhaustive',
        };

        if (!this.fuzzySearch) {
            searchParameters.num_typos = '0';
            searchParameters.typo_tokens_threshold = 0;
        }

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
        return {
            server: serverConfig,
            additionalSearchParameters: this.getSearchParameters(),
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
        });
    }

    createSearchBox() {
        const i18n = this._i18n;
        const placeholderText = i18n.t('search-cabinet');
        return searchBox({
            container: this._('#searchbox'),
            showLoadingIndicator: false,
            placeholder: placeholderText,
        });
    }

    createHits() {
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
                item: (hit, {html}) => {
                    const i18n = this._i18n;
                    const buttonLabel = hit.isFiltered
                        ? i18n.t('unselect-button-name')
                        : i18n.t('focus-button-name');

                    const objectType = hit.objectType;
                    const tagPart = pascalToKebab(hit.objectType);
                    const tagName = 'dbp-cabinet-object-type-hit-' + tagPart;
                    const objectTypeHitComponent = this.objectTypeHitComponents[objectType];

                    if (!customElements.get(tagName) && objectTypeHitComponent) {
                        customElements.define(tagName, objectTypeHitComponent);
                    }

                    // Note: We can't access local functions, nor can we use a script tag, so we are using a custom event to open the file edit dialog (is this still the case with preact?)
                    // Note: "html" is preact html, not lit-html!
                    const buttonRowHtml =
                        objectType === 'person'
                            ? html`
                                  <div class="hit-person-row">
                                      <div class="hit-person-last-modify-content">
                                          ${i18n.t('sync-hit')}:${'\u00A0'}${Intl.DateTimeFormat(
                                              'de',
                                              {
                                                  year: 'numeric',
                                                  month: '2-digit',
                                                  day: '2-digit',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  second: '2-digit',
                                              },
                                          ).format(hit.person.syncTimestamp * 1000)}
                                          <br />
                                      </div>
                                      <footer class="hits-person-footer">
                                          <button
                                              class="button"
                                              onclick=${() => {
                                                  this.dispatchEvent(
                                                      new CustomEvent('DbpCabinetDocumentAdd', {
                                                          detail: {hit: hit},
                                                          bubbles: true,
                                                          composed: true,
                                                      }),
                                                  );
                                              }}>
                                              ${i18n.t('buttons.add.documents')}
                                          </button>
                                          <button
                                              class="button select-person-button"
                                              onclick="${(event) => {
                                                  this.dispatchEvent(
                                                      new CustomEvent('DbpCabinetFilterPerson', {
                                                          detail: {person: hit.person.person},
                                                          bubbles: true,
                                                          composed: true,
                                                      }),
                                                  );
                                              }}">
                                              ${buttonLabel}
                                          </button>
                                          <button
                                              class="button is-primary"
                                              onclick=${() => {
                                                  this.dispatchEvent(
                                                      new CustomEvent('DbpCabinetDocumentView', {
                                                          detail: {hit: hit},
                                                          bubbles: true,
                                                          composed: true,
                                                      }),
                                                  );
                                              }}>
                                              ${i18n.t('buttons.view')}
                                          </button>
                                      </footer>
                                  </div>
                              `
                            : html``;

                    // TODO: Subscriber attribute "lang" doesn't work anymore, so we need to set the lang attribute manually, so it at least works when the hit is rendered initially
                    return html`
                        <${tagName} subscribe="lang" lang="${this.lang}" data=${hit}></${tagName}>
                        ${buttonRowHtml}
                    `;
                },
            },
        });
    }

    createSortBy() {
        const i18n = this._i18n;
        const container = this._('#sort-by');
        const titleElement = document.createElement('div');
        titleElement.textContent = i18n.t('sorting') + ' :';
        titleElement.className = 'dropdown-title';
        container.insertAdjacentElement('beforebegin', titleElement);
        return sortBy({
            container: container,
            items: [
                {
                    label: i18n.t('default-sort'),
                    value: `${TYPESENSE_COLLECTION}`,
                } /* default sorting "@type:desc,_text_match:desc,person.familyName:asc" */,
                {
                    label: i18n.t('family-name'),
                    value: `${TYPESENSE_COLLECTION}/sort/@type:desc,person.familyName:asc,_text_match:desc`,
                },
                {
                    label: i18n.t('last-modified-documents'),
                    value: `${TYPESENSE_COLLECTION}/sort/@type:asc,file.base.modifiedTimestamp:desc,_text_match:desc`,
                },
            ],
        });
    }

    createStats() {
        return stats({
            container: this._('#result-count'),
        });
    }

    createPagination(id) {
        return pagination({
            container: this._(id),
        });
    }

    createFacets() {
        /** @type {CabinetFacets} */
        const ref = this.cabinetFacetsRef.value;
        return ref.createFacetsFromConfig(this.facetConfigs);
    }

    toggleShowDeleted(event) {
        this.showScheduledForDeletion = event.target.checked;
    }

    render() {
        const i18n = this._i18n;
        const algoliaCss = commonUtils.getAssetURL(pkgName, 'algolia-min.css');

        console.log('-- Render --');

        return html`
            <link rel="stylesheet" href="${algoliaCss}" />
            <div
                class="control ${classMap({
                    hidden: this.isLoggedIn() || !this.isLoading() || !this.loadingTranslations,
                })}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>
            <div
                class="notification is-warning ${classMap({
                    hidden: this.isLoggedIn() || this.isLoading() || this.loadingTranslations,
                })}">
                ${i18n.t('error-login-message')}
                <a href="#" @click="${this._onLoginClicked}">${i18n.t('error-login-link')}</a>
            </div>

            <div
                class="${classMap({
                    hidden: !this.isLoggedIn() || this.isLoading() || this.loadingTranslations,
                })}">
                <div class="search-box-container">
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
                    <div id="sort-by" class="sort-widget"></div>
                </div>
                <div>
                    <input
                        type="checkbox"
                        id="deleted-checkbox"
                        @click="${this.toggleShowDeleted}" />
                    <label for="deleted-checkbox">${i18n.t('show-deleted-only')}</label>
                </div>
                <div class="result-container">
                    <div id="result-count"></div>
                    <dbp-cabinet-facets
                        ${ref(this.cabinetFacetsRef)}
                        .search="${this.search}"
                        subscribe="lang"></dbp-cabinet-facets>
                    <div class="results">
                        <div id="hits"></div>
                        <div id="pagination-bottom"></div>
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
            </div>
        `;
    }

    resetRoutingUrlIfNeeded() {
        if (this.resetRoutingUrl) {
            this.sendSetPropertyEvent('routing-url', '/', true);
            this.resetRoutingUrl = false;
        }
    }

    async loadModules() {
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

            this.initInstantsearch();

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
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
