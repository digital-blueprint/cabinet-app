import {createInstance} from './i18n.js';
import {css, html} from 'lit';
// import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from "./dbp-cabinet-lit-element";
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Icon} from "@dbp-toolkit/common";
import {classMap} from "lit/directives/class-map.js";
import {Activity} from './activity.js';
import metadata from './dbp-cabinet-search.metadata.json';
import instantsearch from 'instantsearch.js';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {configure, hits, searchBox} from 'instantsearch.js/es/widgets';

class CabinetSearch extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.activity = new Activity(metadata);
        this.entryPointUrl = '';
        this.fuzzySearch = true;

        const typesenseConfig = {
            host: 'wisskomm-search-dev.tugraz.at',
            port: '443',
            protocol: 'https',
            key: 'frontend-search-key-1---'
        };

        this.serverConfig = {
            // Be sure to use an API key that only allows searches, in production
            apiKey: typesenseConfig.key,
            nodes: [
                {
                    host: typesenseConfig.host,
                    port: typesenseConfig.port,
                    protocol: typesenseConfig.protocol,
                },
            ],
            // Cache search results from server. Defaults to 2 minutes. Set to 0 to disable caching.
            cacheSearchResultsForSeconds: 2 * 60,
        };
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            entryPointUrl: { type: String, attribute: 'entry-point-url' },
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    if (this.cabinetRequestsTable) {
                        this.cabinetRequestsTable.setLocale(this.lang);
                    }
                    break;
            }
        });

        super.update(changedProperties);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    connectedCallback() {
        super.connectedCallback();
        this._loginStatus = '';
        this._loginState = [];

        this.updateComplete.then(() => {
            console.log('-- updateComplete --');

            this.search = this.createInstantsearch();
            const search = this.search;

            search.addWidgets([
                configure({
                    hitsPerPage: 12,
                }),
                this.createSearchBox(),
                this.createHits(),
            ]);

            search.start();

            console.log('search', search);
        });
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getLinkCss()}
            ${commonStyles.getNotificationCSS()}
            ${commonStyles.getActivityCSS()}
            ${commonStyles.getModalDialogCSS()}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getRadioAndCheckboxCss()}
        `;
    }

    /**
     * Get the search parameters for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getSearchParameters() {
        // https://typesense.org/docs/0.25.1/api/search.html#ranking-and-sorting-parameters
        let searchParameters = {
            group_by: 'group_id',
            group_limit: 1,
            min_len_1typo: 2,
            facet_query_num_typos: 0,
            query_by: "event_title,event_description,event_location_name,program_name,organization_name",
            sort_by: "_text_match:desc,event_end:asc" // see https://plan.tugraz.at/task/51022#comment-6396
        };

        if (!this.fuzzySearch) {
            searchParameters.num_typos = 0;
            searchParameters.typo_tokens_threshold = 0;
        }

        return searchParameters;
    }

    /**
     * Get the config for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getTypesenseInstantsearchAdapterConfig() {
        return {
            server: this.serverConfig,
            geoLocationField: "location",
            // XXX: https://github.com/typesense/typesense-instantsearch-adapter?tab=readme-ov-file#special-characters-in-field-names--values
            facetableFieldsWithSpecialCharacters: ["event_address_city", "organization_name"],
            additionalSearchParameters: this.getSearchParameters()
        };
    }

    /**
     * Create the Instantsearch instance
     */
    createInstantsearch() {
        const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter(
            this.getTypesenseInstantsearchAdapterConfig());

        // We need to leak the typesenseInstantsearchAdapter instance to the global scope,
        // so we can update the additional search parameters later
        this.typesenseInstantsearchAdapter = typesenseInstantsearchAdapter;

        // typesenseInstantsearchAdapter.typesenseClient is no Typesense.Client instance, it's a Typesense.SearchClient instance!
        const searchClient = typesenseInstantsearchAdapter.searchClient;

        let searchIndexName = this.searchIndexName;

        return instantsearch({
            searchClient,
            indexName: searchIndexName,
            future: {
                preserveSharedStateOnUnmount: true,
            },
        });
    }

    createSearchBox() {
        return searchBox({
            container: this._("#searchbox"),
        });
    }

    createHits() {
        console.log('this._(#hits)', this._('#hits'));

        return hits({
            container: this._("#hits"),
            templates: {
                item: (hit) => {
                    return `
                        <div>
                            <h2>${hit.event_title}</h2>
                            <p>${hit.event_description}</p>
                        </div>
                    `;
                },
            },
        });
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render --');

        return html`
            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading() || !this.loadingTranslations })}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>

            Implementation here:
            <div id="searchbox">searchbox</div>
            <div id="hits">hits</div>
        `;
        // ${unsafeHTML('<div id="searchbox">searchbox</div><div id="hits">hits</div>')}
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
