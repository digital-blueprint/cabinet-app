import {css, html} from 'lit';
import {html as staticHtml, unsafeStatic} from 'lit/static-html.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from "./dbp-cabinet-lit-element";
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Icon, InlineNotification, Modal} from '@dbp-toolkit/common';
import {classMap} from "lit/directives/class-map.js";
import {Activity} from './activity.js';
import metadata from './dbp-cabinet-search.metadata.json';
import instantsearch from 'instantsearch.js';
import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {hits, searchBox} from 'instantsearch.js/es/widgets';
import {configure} from 'instantsearch.js/es/widgets';
import {pascalToKebab} from './utils';
import {CabinetFile} from './components/dbp-cabinet-file.js';
import {CabinetViewPerson} from './components/dbp-cabinet-view-person.js';
import {CabinetViewFile} from './components/dbp-cabinet-view-file.js';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';

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
        this.documentViewFileModalRef = createRef();
        this.documentFileComponentRef = createRef();
        this.cabinetFacetsRef = createRef();
        this.documentFile = null;
        this.fileDocumentTypeNames = {};
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-modal': Modal,
            'dbp-cabinet-file': CabinetFile,
            'dbp-cabinet-view-person': CabinetViewPerson,
            'dbp-cabinet-view-file': CabinetViewFile,
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
            const component = this.documentViewFileModalRef.value;
            component.setObjectTypeViewComponents(this.objectTypeViewComponents);
            await component.openDialogWithHit(hit);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        let that = this;
        this._loginStatus = '';
        this._loginState = [];

        this.addEventListener('DbpCabinetDocumentTugo', (event) => {
            let hit = event.detail.hit;
            window.open(hit.person.coUrl);
        });

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
            component.openDocumentAddDialogWithHit(event.detail.hit);
        });

        // Listen to DbpCabinetDocumentView events, to open the file edit dialog
        this.addEventListener('DbpCabinetDocumentView', function(event) {
            that.openDocumentViewDialog(event.detail.hit);
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
        this.search = this.createInstantsearch();
        const search = this.search;

        search.addWidgets([
            configure({
                hitsPerPage: 24
            }),
            this.createSearchBox(),
            this.createHits()
        ]);

        search.start();

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

            .result-container {
                margin-top: 2em;
                display: grid;
                grid-template-columns: 20em minmax(0, 1fr);
                gap: 20px;
            }

            .ais-Hits-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 20px;
                padding: 0;
                margin-top: 0;
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
            query_by: "base.familyName,base.givenName,file.base.fileName,objectType",
            // TODO: Enable again when we have sorting in our Typesense schema
            // sort_by: "base.familyName:asc,base.givenName:asc,objectType:asc"
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

                    if (!customElements.get(tagName) && objectTypeHitComponent) {
                        customElements.define(tagName, objectTypeHitComponent);
                    }

                    // Note: We can't access local functions, nor can we use a script tag, so we are using a custom event to open the file edit dialog (is this still the case with preact?)
                    // Note: "html" is preact htm, not lit-html!

                    const buttonRowHtml = objectType === 'person' ? html`
                        <button class="button" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentTugo', {detail: {hit: hit}, bubbles: true, composed: true}));}}>TUGO</button>
                        <button class="button" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentAdd', {detail: {hit: hit}, bubbles: true, composed: true}));}}>Add Document</button>
                        <button class="button" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}, bubbles: true, composed: true}));}}>More</button>
                    ` : html`
                        <button class="button is-primary" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentDownload', {detail: {hit: hit}, bubbles: true, composed: true}));}}>Download</button>
                        <button class="button" onclick=${() => { this.dispatchEvent(new CustomEvent('DbpCabinetDocumentView', {detail: {hit: hit}, bubbles: true, composed: true}));}}>View</button>
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
        console.log('hit', hit);
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
        } else {
            return staticHtml`
                <dbp-cabinet-file
                    mode="view"
                    ${ref(this.documentViewFileModalRef)}
                    subscribe="lang,file-handling-enabled-targets,nextcloud-web-app-password-url,nextcloud-webdav-url,nextcloud-name,nextcloud-file-url,nextcloud-auth-info,base-path"
                    .data=${hit}
                ></dbp-cabinet-file>
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
                <div id="searchbox"></div>
                <div class="result-container">
                    <dbp-cabinet-facets
                        ${ref(this.cabinetFacetsRef)}
                        .search="${this.search}"
                        subscribe="lang">
                    </dbp-cabinet-facets>
                    <div class="results">
                        <div id="hits"></div>
                    </div>
                </div>

                ${this.getDocumentEditModalHtml()}
                ${this.getDocumentViewModalHtml()}
                <dbp-cabinet-file
                    mode="add"
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

            /**
             * @type {CabinetFile}
             */
            const addDocumentComponent = this.documentFileComponentRef.value;
            addDocumentComponent.setFileDocumentTypeNames(this.fileDocumentTypeNames);
            addDocumentComponent.setFileDocumentFormComponents(formComponents);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    }
}

commonUtils.defineCustomElement('dbp-cabinet-search', CabinetSearch);
