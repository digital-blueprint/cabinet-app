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
import {hits, searchBox} from 'instantsearch.js/es/widgets';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {configure} from 'instantsearch.js/es/widgets';
import {pascalToKebab} from './utils';

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
        this.fileTypeForms = {};
        this.fileTypeHitComponents = {};
        this.editFileId = '';
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
            fileTypeForms: { type: Object, attribute: false },
            fileTypeHitComponents: { type: Object, attribute: false },
            editFileId: { type: String },
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
                    if (this.typesenseInstantsearchAdapter) {
                        this.typesenseInstantsearchAdapter.updateConfiguration(this.getTypesenseInstantsearchAdapterConfig());
                    }
                    break;
            }
        });

        super.update(changedProperties);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    openFileEditDialog(id, hit) {
        // TODO: Use correct form component for the file type
        // TODO: Load the file data and populate the form
        this.editFileId = id;
        console.log('openFileEditDialog hit', hit);
        this._('#file-edit-modal').open();
    }

    connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        // Listen to DbpCabinetFileEdit events, to open the file edit dialog
        document.addEventListener('DbpCabinetFileEdit', function(event) {
            that.openFileEditDialog(event.detail.id, event.detail.hit);
        });

        this.updateComplete.then(() => {
            console.log('-- updateComplete --');
            this.loadModules();

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
                    hitsPerPage: 24,
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
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 20px;
                padding: 0;
            }

            .ais-Hits-item {
                padding: 5px;
                border: 1px solid black;
                list-style-type: none;
                overflow: hidden;
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
        return hits({
            container: this._("#hits"),
            escapeHTML: true,
            templates: {
                item: (hit) => {
                    const id = hit.id;
                    const filetype = hit.filetype;
                    const tagPart = pascalToKebab(hit.filetype);
                    const tagName = 'dbp-cabinet-filetype-hit-' + tagPart;
                    const fileTypeHitComponent = this.fileTypeHitComponents[filetype];

                    if (!customElements.get(tagName) && fileTypeHitComponent) {
                        customElements.define(tagName, fileTypeHitComponent);
                    }

                    const hitObjectString = JSON.stringify(hit).replace(/'/g, "&apos;");

                    // Serialize the hit object to a string and pass it as a parameter to the hit component
                    // TODO: Do we need to replace "&apos;" with "'" in the components again?
                    // Note: We can't use "html" in a hit template, because instantsearch.js is writing to the DOM directly in a web component
                    // Note: We can't access local functions, nor can we use a script tag, so we are using a custom event to open the file edit dialog
                    // TODO: Find a way to serialize the hit object to a string and pass it as a parameter to the hit component
                    return `
                        <${tagName} subscribe="lang" data='${hitObjectString}'></${tagName}>
                        <button onclick="document.dispatchEvent(new CustomEvent('DbpCabinetFileEdit', {detail: {id: '${id}', hit: {}}}))">Edit</button>
                    `;
                },
            },
        });
    }

    editFile() {
        console.log('editFile');
    }

    getFileTypeFormsHtml() {
        const ids = Object.keys(this.fileTypeForms);
        let results = [];
        console.log('ids', ids);

        ids.forEach((id) => {
            const tagPart = pascalToKebab(id);
            const tagName = 'dbp-cabinet-filetype-form-' + tagPart;
            if (!customElements.get(tagName)) {
                customElements.define(tagName, this.fileTypeForms[id]);
            }

            // Note: Only use "html", if we really need use sanitized HTML
            results.push(html`
                <p>
                    <h3>${id} - ${tagName}</h3>
                    ${unsafeHTML(`<${tagName} subscribe="lang" user-id="123"></${tagName}>`)}
                </p>
            `);
        });

        return results;
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render --');
        console.log('this.fileTypeForms', this.fileTypeForms);

        return html`
            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading() || !this.loadingTranslations })}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>

            <h1>Search</h1>
            <div id="searchbox"></div>
            <h2>Search Results</h2>
            <div id="hits"></div>
            <h2>Blob Schema Forms</h2>
            ${this.getFileTypeFormsHtml()}

            <dbp-modal id="file-edit-modal" modal-id="file-edit-modal" title="${i18n.t('file-edit-modal-title')}" subscribe="lang">
                <div slot="content">
                    Content<br />
                    File ID: ${this.editFileId}
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
        // ${unsafeHTML('<div id="searchbox">searchbox</div><div id="hits">hits</div>')}
    }

    async loadModules() {
        try {
            // Fetch the JSON file containing module paths
            const response = await fetch(this.basePath + 'modules.json');
            const data = await response.json();

            console.log('data', data);
            let forms = {};
            let hitComponents = {};

            // Iterate over the module paths and dynamically import each module
            // TODO: In a real-life scenario, you would probably want access only those keys that are needed
            for (const [schemaKey, path] of Object.entries(data["filetypes"])) {
                const module = await import(path);

                console.log('schemaKey', schemaKey);
                console.log('path', path);
                console.log('module', module);
                const object = new module.default();

                // Example usage of imported modules
                if (object.name) {
                    console.log(object.name);
                }

                if (object.getFormComponent) {
                    forms[object.name] = object.getFormComponent();
                }
                if (object.getHitComponent) {
                    hitComponents[object.name] = object.getHitComponent();
                }
                if (object.getInstantSearchConfig) {
                    console.log(object.getInstantSearchConfig());
                }
            }

            this.fileTypeForms = forms;
            console.log('forms', forms);
            this.fileTypeHitComponents = hitComponents;
            console.log('hitComponents', hitComponents);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
