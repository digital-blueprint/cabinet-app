import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from "./dbp-cabinet-lit-element";
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {getCurrentRefinementCSS, getPaginationCSS} from './styles';
import {Icon, InlineNotification, Modal} from '@dbp-toolkit/common';
import {classMap} from "lit/directives/class-map.js";
import {Activity} from './activity.js';
import metadata from './dbp-cabinet-search.metadata.json';
import instantsearch from 'instantsearch.js';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {hits, searchBox, sortBy, stats, pagination} from 'instantsearch.js/es/widgets';
import {configure} from 'instantsearch.js/es/widgets';
import {pascalToKebab} from './utils';
import {CabinetFile} from './components/dbp-cabinet-file.js';
import {CabinetViewPerson} from './components/dbp-cabinet-view-person.js';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';
import {TypesenseService} from './services/typesense.js';
import {updateDatePickersForExternalRefinementChange} from './components/dbp-cabinet-date-facet.js';

class CabinetSearch extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        this.activity = new Activity(metadata);
        this.fuzzySearch = true;
        this.typesenseHost = '';
        this.typesensePort = '';
        this.typesensePath = '';
        this.typesenseProtocol = '';
        this.typesenseKey = '';
        this.typesenseCollection = '';
        this.objectTypeFormComponents = {};
        this.objectTypeHitComponents = {};
        this.objectTypeViewComponents = {};
        this.hitData = {
            "id": "",
            "objectType": "",
        };
        this.documentEditModalRef = createRef();
        this.documentViewPersonModalRef = createRef();
        this.documentFileComponentRef = createRef();
        this.cabinetFacetsRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
        this.instantSearch = {};
        this.facetConfigs = [];
        this.typesenseInstantsearchAdapter = null;
        this.typesenseService = null;
        this.serverConfig = null;
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
            typesenseHost: { type: String, attribute: 'typesense-host' },
            typesensePort: { type: String, attribute: 'typesense-port' },
            typesensePath: { type: String, attribute: 'typesense-path' },
            typesenseProtocol: { type: String, attribute: 'typesense-protocol' },
            typesenseKey: { type: String, attribute: 'typesense-key' },
            typesenseCollection: { type: String, attribute: 'typesense-collection' },
            hitData: { type: Object, attribute: false },
            documentFile: { type: File, attribute: false },
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
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
                    } else {
                        this.initInstantsearch();
                    }

                    // Init the Typesense service with the new bearer token
                    // This needs to happen after the Typesense Instantsearch adapter has been initialized,
                    // not before, or Instantsearch will break! Maybe there is some leaked stated between the two?
                    this.initTypesenseService();
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

        // We need to wait until rendering is complete after this.hitData has changed,
        // or the dialog will not open on the first click
        // https://lit.dev/docs/components/lifecycle/#updatecomplete
        await this.updateComplete;

        this.documentEditModalRef.value.open();
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
            /**
             * @type {CabinetFile}
             */
            const component = this.documentFileComponentRef.value;
            component.setObjectTypeViewComponents(this.objectTypeViewComponents);
            component.setTypesenseService(this.typesenseService);
            await component.openViewDialogWithFileHit(hit);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        // Listen to DbpCabinetDocumentEdit events, to open the file edit dialog
        this.addEventListener('DbpCabinetDocumentEdit', function(event) {
            that.openDocumentEditDialog(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentEdit events, to open the file edit dialog
        this.addEventListener('DbpCabinetDocumentAdd', function(event) {
            /**
             * @type {CabinetFile}
             */
            const component = that.documentFileComponentRef.value;
            component.setTypesenseService(this.typesenseService);
            component.setObjectTypeViewComponents(this.objectTypeViewComponents);
            component.openDocumentAddDialogWithPersonHit(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentView events, to open the file edit dialog
        this.addEventListener('DbpCabinetDocumentView', function(event) {
            that.openDocumentViewDialog(event.detail.hit);
        });

        // Listen to DbpCabinetFilterPerson events to filter to a specific person
        this.addEventListener('DbpCabinetFilterPerson', function(event) {
            that.cabinetFacetsRef.value.filterOnSelectedPerson(event);
        });

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
                        protocol: this.typesenseProtocol
                    }
                ],
                additionalHeaders: {'Authorization': 'Bearer ' + this.auth.token}
            };
            console.log('serverConfig', this.serverConfig);

            this.loadModules();
        });
    }

    initInstantsearch() {
        if (!this.auth.token || this.facetConfigs.length === 0) {
            return;
        }

        this.search = this.createInstantsearch();
        const search = this.search;

        search.addWidgets([
            configure({
                hitsPerPage: 24
            }),
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
            search.addWidgets(
                this.createFacets()
            );
        }

        search.start();

        search.on('render', () => {
            // Handle gradients display on facets.
            this.cabinetFacetsRef.value.handleGradientDisplay();
            this.cabinetFacetsRef.value.hideFilterGroupIfEmpty();
        });

        // Clear date facets on refinement clearing.
        search.helper.on('change', (res) => {
            updateDatePickersForExternalRefinementChange(res, this.cabinetFacetsRef.value.facets);
        });

        // TODO: Improve on workaround to show hits after the page loads
        setTimeout(() => {
            this._('input.ais-SearchBox-input').value = ' ';
            search.refresh();
        }, 1000);
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
                margin-top: 1em;
                display: grid;
                grid-template-columns: 24em minmax(0, 1fr);
                grid-template-areas: "empty header" "sidebar main";
                gap: 0 2em;
            }

            .result-container.wide-facets {
                grid-template-columns: 40em minmax(0, 1fr);
            }

            .result-container.no-facets {
                grid-template-columns: minmax(0, 1fr);
                grid-template-areas: "header" "main";
            }

            dbp-cabinet-facets {
                grid-row-start: 2;
            }

            .results {
                grid-area: main;
            }

            .search-box-container {
                display: flex;
            }

            .search-box-widget {
                flex-grow: 1;
            }

            .sort-widget .ais-SortBy-select {
                height: 2em;
                padding: 1px .5em;
                padding-right: 2em;
                /* override toolkit select style */
                background-size: 16px;
                background-position: right .5em center;
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
                padding-inline: .5em;
            }

            .ais-SearchBox-submit {
                width: 2em;
                background-color: var(--dbp-background);
                color: var(--dbp-content);
                border: var(--dbp-border);
                /* prevent double borders */
                border-left: 0 none;
                border-right: 0 none;
            }

            .ais-SearchBox-submit svg path {
                fill: var(--dbp-content);
            }

            .ais-SearchBox-submit svg {
                transition: transform 0.15s ease-in-out;
            }

            .ais-SearchBox-submit:hover svg {
                transform: scale(1.5);
            }

            .ais-Hits-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
                gap: 2em;
                padding: 0;
                margin-top: 0;
            }

            .ais-Hits-item {
                padding: 5px;
                border: 1px solid var(--dbp-content);
                list-style-type: none;
                overflow: hidden;
                min-height: calc(300px + 5vh);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            .hits-person-footer{
                display: grid;
                justify-content: end;
                gap: 10px;
                grid-template-columns: auto auto auto;
            }
            .hits-doc-footer{
                position: relative;
                display: flex;
                justify-content: flex-end;
            }

        `;
    }

    /**
     * Get the search parameters for the Typesense Instantsearch adapter depending on the fuzzy search setting
     */
    getSearchParameters() {
        // https://typesense.org/docs/0.25.1/api/search.html#ranking-and-sorting-parameters
        let searchParameters = {
            query_by: "person.familyName,person.givenName,file.base.fileName,objectType,person.stPersonNr,person.studId,person.identNrObfuscated,person.birthDate",
            // @TODO we should set typo tolerance by field. ex.: birthdate or identNrObfuscated dont need typo tolerance
            sort_by: "@type:desc,_text_match:desc,person.familyName:asc",
            num_typos: "2,2,0,0,0,0,0,0"
        };

        if (!this.fuzzySearch) {
            searchParameters.num_typos = "0";
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

    initTypesenseService() {
        if (!this.serverConfig || !this.typesenseCollection || !this.auth.token) {
            return;
        }

        this.typesenseService = new TypesenseService(this.serverConfig, this.typesenseCollection);
        console.log('initTypesenseService this.typesenseService', this.typesenseService);

        // Update the Typesense service with the new bearer token
        /**
         * @type {CabinetFile}
         */
        const fileComponent = this.documentFileComponentRef.value;
        if (fileComponent) {
            fileComponent.setTypesenseService(this.typesenseService);
        }
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
            showReset: false,
            showLoadingIndicator: false,
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

                    if (!customElements.get(tagName) && objectTypeHitComponent) {
                        customElements.define(tagName, objectTypeHitComponent);
                    }

                    // Note: We can't access local functions, nor can we use a script tag, so we are using a custom event to open the file edit dialog (is this still the case with preact?)
                    // Note: "html" is preact htm, not lit-html!

                    const buttonRowHtml = objectType === 'person' ? html`
                    <footer class="hits-person-footer">
                        <button class="button" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentAdd', {detail: {hit: hit}, bubbles: true, composed: true}));}}>Add Document</button>
                        <button class="button is-primary" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}, bubbles: true, composed: true}));}}>View</button>
                        <button class="button select-person-button"
                            onclick="${(event) => { this.dispatchEvent(new CustomEvent('DbpCabinetFilterPerson', {detail: {person: hit.person.person}, bubbles: true, composed: true}));
                            }}">
                            ${ /*@TODO: find something to test here */ hit ? 'Select' : 'Unselect' }
                        </button>
                    </footer>
                    ` : html`
                    <footer class="hits-doc-footer">
                        <button class="button is-primary button-view" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}, bubbles: true, composed: true}));}}>view</button>
                    </footer>
                    `;

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
        return sortBy({
            container: this._('#sort-by'),
            items: [
                { label: 'Best Match', value: `${this.typesenseCollection}` }, /* default sorting "@type:desc,_text_match:desc,person.familyName:asc" */
                { label: 'Family name', value: `${this.typesenseCollection}/sort/@type:desc,person.familyName:asc,_text_match:desc` },
                { label: 'Last modified Documents', value: `${this.typesenseCollection}/sort/@type:asc,file.base.modifiedTimestamp:desc,_text_match:desc` }
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
        return this.cabinetFacetsRef.value.createFacetsFromConfig(this.facetConfigs);
    }

    getDocumentEditModalHtml() {
        // TODO: In production it maybe would be better to fetch the typesense document again to get the latest data
        const hit = this.hitData;
        console.log('getDocumentEditModalHtml this.hitData', this.hitData);
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
        console.log('this.objectTypeFormComponents[objectType]', this.objectTypeFormComponents[objectType]);

        if (!customElements.get(tagName)) {
            customElements.define(tagName, this.objectTypeFormComponents[objectType]);
        }

        // We need to use staticHtml and unsafeStatic here, because we want to set the tag name from
        // a variable and need to set the "data" property from a variable too!
        return staticHtml`
            <dbp-modal
                ${ref(this.documentEditModalRef)}
                modal-id="document-edit-modal"
                title="${i18n.t('document-edit-modal-title')}"
                width="80%"
                height="80%"
                min-width="80%"
                min-height="80%"
                subscribe="lang">
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
        console.log('getDocumentViewModalHtml this.hitData', this.hitData);
        const objectType = hit.objectType;
        console.log('objectType', objectType);

        if (objectType === '') {
            return html``;
        }

        if (objectType === 'person') {
            // We need to use staticHtml here, because we want to set the tag name from
            // a variable and need to set the "data" property from a variable too!
            return staticHtml`
                <dbp-cabinet-view-person
                    ${ref(this.documentViewPersonModalRef)}
                    subscribe="lang,file-handling-enabled-targets,nextcloud-web-app-password-url,nextcloud-webdav-url,nextcloud-name,nextcloud-file-url,nextcloud-auth-info,base-path"
                    .data=${hit}
                ></dbp-cabinet-view-person>
            `;
        }
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
            <dbp-inline-notification class=" ${classMap({hidden: this.isLoggedIn() || this.isLoading() || this.loadingTranslations})}"
                                     type="warning"
                                     body="${i18n.t('error-login-message')}">
            </dbp-inline-notification>

            <div class="${classMap({hidden: !this.isLoggedIn() || this.isLoading() || this.loadingTranslations})}">
                <h1>Search</h1>
                <div class="search-box-container">
                    <div id="searchbox" class="search-box-widget"></div>
                    <div id="sort-by" class="sort-widget"></div>
                </div>
                <div class="result-container">
                    <div id="result-count"></div>
                    <dbp-cabinet-facets
                        ${ref(this.cabinetFacetsRef)}
                        .search="${this.search}"
                        subscribe="lang">
                    </dbp-cabinet-facets>
                    <div class="results">
                        <div id="hits"></div>
                        <div id="pagination-bottom"></div>
                    </div>
                </div>

                ${this.getDocumentEditModalHtml()}
                ${this.getDocumentViewModalHtml()}

                <dbp-cabinet-file
                    mode="${CabinetFile.Modes.ADD}"
                    ${ref(this.documentFileComponentRef)}
                    subscribe="lang,auth,entry-point-url,file-handling-enabled-targets,nextcloud-web-app-password-url,nextcloud-webdav-url,nextcloud-name,nextcloud-file-url,nextcloud-auth-info,base-path"
                ></dbp-cabinet-file>
            </div>
        `;
    }

    async loadModules() {
        try {
            // Fetch the JSON file containing module paths
            const response = await fetch(this.basePath + 'modules.json');
            const data = await response.json();

            console.log('data', data);
            let formComponents = {};
            let hitComponents = {};
            let viewComponents = {};

            // Iterate over the module paths and dynamically import each module
            // TODO: In a real-life scenario, you would probably want access only those keys that are needed (but we will need them all)
            for (const [schemaKey, path] of Object.entries(data["objectTypes"])) {
                const module = await import(path);

                console.log('schemaKey', schemaKey);
                console.log('path', path);
                console.log('module', module);
                const object = new module.default();

                if (object.name) {
                    const name = object.name;
                    console.log(name);
                    // If the name starts with "file", add it to the list of file document types
                    if (name.startsWith('file')) {
                        // TODO: We might need some kind of translation here
                        this.fileDocumentTypeNames[name] = name;
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
                if (object.getInstantSearchConfig) {
                    console.log(object.getInstantSearchConfig());
                }
            }

            this.objectTypeFormComponents = formComponents;
            console.log('formComponents', formComponents);
            this.objectTypeHitComponents = hitComponents;
            console.log('hitComponents', hitComponents);
            this.objectTypeViewComponents = viewComponents;
            console.log('viewComponents', viewComponents);
            console.log('fileDocumentTypeNames', this.fileDocumentTypeNames);

            const instantSearchModule = await import(data["instantSearch"]);
            this.instantSearch = new instantSearchModule.default();
            this.facetConfigs = this.instantSearch.getFacetsConfig();

            this.initInstantsearch();

            /**
             * @type {CabinetFile}
             */
            const addDocumentComponent = this.documentFileComponentRef.value;
            addDocumentComponent.setFileObjectTypeNames(this.fileDocumentTypeNames);
            addDocumentComponent.setObjectTypeViewComponents(this.objectTypeViewComponents);
            addDocumentComponent.setFileDocumentFormComponents(formComponents);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
