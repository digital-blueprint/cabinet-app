import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
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
        this.objectTypeForms = {};
        this.objectTypeHitComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.documentEditModalRef = createRef();
        this.documentViewModalRef = createRef();
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
            objectTypeForms: { type: Object, attribute: false },
            objectTypeHitComponents: { type: Object, attribute: false },
            editHitData: { type: Object },
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

    async openDocumentEditDialog(hit) {
        this.hitData = hit;

        // We need to wait until rendering is complete after this.editHitData has changed,
        // or the dialog will not open on the first click
        // https://lit.dev/docs/components/lifecycle/#updatecomplete
        await this.updateComplete;

        this.documentEditModalRef.value.open();
    }

    async openDocumentViewDialog(hit) {
        this.hitData = hit;

        // We need to wait until rendering is complete after this.editHitData has changed,
        // or the dialog will not open on the first click
        // https://lit.dev/docs/components/lifecycle/#updatecomplete
        await this.updateComplete;

        this.documentViewModalRef.value.open();
    }

    connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        // Listen to DbpCabinetDocumentEdit events, to open the file edit dialog
        document.addEventListener('DbpCabinetDocumentEdit', function(event) {
            that.openDocumentEditDialog(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentView events, to open the file edit dialog
        document.addEventListener('DbpCabinetDocumentView', function(event) {
            that.openDocumentViewDialog(event.detail.hit);
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
            ${commonStyles.getButtonCSS()}
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
            query_by: "file-filename,objectType",
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
                item: (hit, {html}) => {
                    const objectType = hit.objectType;
                    const tagPart = pascalToKebab(hit.objectType);
                    const tagName = 'dbp-cabinet-object-type-hit-' + tagPart;
                    const objectTypeHitComponent = this.objectTypeHitComponents[objectType];

                    console.log('tagName', tagName);
                    console.log('objectTypeHitComponent', objectTypeHitComponent);

                    if (!customElements.get(tagName) && objectTypeHitComponent) {
                        customElements.define(tagName, objectTypeHitComponent);
                    }

                    // Note: We can't access local functions, nor can we use a script tag, so we are using a custom event to open the file edit dialog (is this still the case with preact?)
                    // TODO: Subscriber attribute "lang" doesn't work anymore, how to do a normal attribute in preact?
                    // Note: "html" is preact htm, not lit-html!

                    const buttonRowHtml = objectType === 'student' ? html`
                        <button class="button" onclick=${() => { document.dispatchEvent(new CustomEvent('DbpCabinetDocumentTugo', {detail: {hit: hit}}));}}>TUGO</button>
                        <button class="button" onclick=${() => { document.dispatchEvent(new CustomEvent('DbpCabinetDocumentEdit', {detail: {hit: hit}}));}}>Add Document</button>
                        <button class="button" onclick=${() => { document.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}}));}}>More</button>
                    ` : html`
                        <button class="button is-primary" onclick=${() => { document.dispatchEvent(new CustomEvent('DbpCabinetDocumentDownload', {detail: {hit: hit}}));}}>Download</button>
                        <button class="button" onclick=${() => { document.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}}));}}>View</button>
                    `;

                    return html`
                        <${tagName} subscribe="lang" data=${hit}></${tagName}>
                        ${buttonRowHtml}
                    `;
                },
            },
        });
    }

    getDocumentEditModalHtml() {
        // TODO: In production it maybe would be better to fetch the typesense document again to get the latest data
        const hit = this.hitData;
        console.log('hit', hit);
        const objectType = hit.objectType;

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html`<dbp-modal ${ref(this.documentEditModalRef)} modal-id="document-edit-modal"></dbp-modal>`;
        }

        const id = hit.id;
        const i18n = this._i18n;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-edit-form-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log('this.objectTypeForms[objectType]', this.objectTypeForms[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeForms[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <dbp-modal ${ref(this.documentEditModalRef)} modal-id="document-edit-modal" title="${i18n.t('document-edit-modal-title')}" subscribe="lang">
                <div slot="content">
                    Document ID: ${id}<br />
                    ObjectType: ${objectType}<br />
                    Size: ${hit.filesize}<br />
                    <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-edit-form-${id}" subscribe="lang" user-id="123" .data=${hit}></${unsafeStatic(tagName)}>
                </div>
                <div slot="footer" class="modal-footer">
                    Footer
                </div>
            </dbp-modal>
        `;
    }

    getDocumentViewModalHtml() {
        // TODO: In production it maybe would be better to fetch the typesense document again to get the latest data
        const hit = this.hitData;
        console.log('hit', hit);
        const objectType = hit.objectType;

        if (objectType === '') {
            console.log('objectType empty', objectType);
            return html`<dbp-modal ${ref(this.documentViewModalRef)} modal-id="document-view-modal"></dbp-modal>`;
        }

        const id = hit.id;
        const i18n = this._i18n;
        const tagPart = pascalToKebab(objectType);
        const tagName = 'dbp-cabinet-object-type-view-form-' + tagPart;

        console.log('objectType', objectType);
        console.log('tagName', tagName);
        console.log('this.objectTypeForms[objectType]', this.objectTypeForms[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeForms[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <dbp-modal ${ref(this.documentViewModalRef)} modal-id="document-view-modal" title="${i18n.t('document-view-modal-title')}" subscribe="lang">
                <div slot="content">
                    Document ID: ${id}<br />
                    ObjectType: ${objectType}<br />
                    <${unsafeStatic(tagName)} id="dbp-cabinet-object-type-view-form-${id}" subscribe="lang" user-id="123" .data=${hit}></${unsafeStatic(tagName)}>
                </div>
                <div slot="footer" class="modal-footer">
                    View Footer
                </div>
            </dbp-modal>
        `;
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render --');
        console.log('this.objectTypeForms', this.objectTypeForms);

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
            ${this.getDocumentEditModalHtml()}
            ${this.getDocumentViewModalHtml()}
        `;
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
            // TODO: In a real-life scenario, you would probably want access only those keys that are needed (but we will need them all)
            for (const [schemaKey, path] of Object.entries(data["objectTypes"])) {
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

            this.objectTypeForms = forms;
            console.log('forms', forms);
            this.objectTypeHitComponents = hitComponents;
            console.log('hitComponents', hitComponents);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
