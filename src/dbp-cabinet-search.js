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
import EmailCorrespondence from './blob-schema/email';

class CabinetSearch extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.activity = new Activity(metadata);
        this.entryPointUrl = '';
        this.fuzzySearch = true;
        this.typesenseHost = '';
        this.typesensePort = '';
        this.typesensePath = '';
        this.typesenseProtocol = '';
        this.typesenseKey = '';
        this.typesenseCollection = '';
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
            typesenseHost: { type: String, attribute: 'typesense-host' },
            typesensePort: { type: String, attribute: 'typesense-port' },
            typesensePath: { type: String, attribute: 'typesense-path' },
            typesenseProtocol: { type: String, attribute: 'typesense-protocol' },
            typesenseKey: { type: String, attribute: 'typesense-key' },
            typesenseCollection: { type: String, attribute: 'typesense-collection' },
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
                case "auth":
                    if (!this.serverConfig) {
                        return;
                    }

                    // Update the bearer token in additional headers for the Typesense Instantsearch adapter
                    this.serverConfig.additionalHeaders = { 'Authorization': 'Bearer ' + this.auth.token };

                    console.log('this.serverConfig auth-update', this.serverConfig);

                    // Update the Typesense Instantsearch adapter configuration with the new bearer token
                    this.typesenseInstantsearchAdapter.updateConfiguration(this.getTypesenseInstantsearchAdapterConfig());
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

            this.serverConfig = {
                // Be sure to use an API key that only allows searches, in production
                apiKey: this.typesenseKey,
                nodes: [
                    {
                        host: this.typesenseHost,
                        port: this.typesensePort,
                        path: this.typesensePath,
                        protocol: this.typesenseProtocol,
                    },
                ],
                additionalHeaders: { 'Authorization': 'Bearer ' + this.auth.token, },
            };
            console.log('serverConfig', this.serverConfig);

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

            .ais-Hits-list {
                display: grid;
                grid-auto-flow: column;
                grid-gap: 20px;
                grid-template-rows: 125px 100px;
                justify-content: space-between;
                align-content: space-between;
                padding: 0;
            }

            .ais-Hits-item {
                padding: 20px;
                border: 1px solid black;
                list-style-type: none;
            }
        `;
    }

    /**
     * Get the search parameters for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getSearchParameters() {
        // https://typesense.org/docs/0.25.1/api/search.html#ranking-and-sorting-parameters
        let searchParameters = {
            query_by: "name",
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

        let searchIndexName = this.typesenseCollection;

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
                        <h2>${hit.name}</h2>
                        <p>age: ${hit.age}</p>
                    `;
                },
            },
        });
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render --');

        let handler = new EmailCorrespondence();
        customElements.define('dbp-cabinet-email-correspondence', handler.getFormComponent());

        return html`
            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading() || !this.loadingTranslations })}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>

            <h1>Search</h1>
            <div id="searchbox"></div>
            <div id="hits"></div>
            <dbp-cabinet-email-correspondence></dbp-cabinet-email-correspondence>
        `;
        // ${unsafeHTML('<div id="searchbox">searchbox</div><div id="hits">hits</div>')}
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
