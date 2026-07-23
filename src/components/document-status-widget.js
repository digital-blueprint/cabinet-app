import {html, css} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';

/**
 * The stable uiState key under which the document-status selection is stored.
 * This is what shows up as `uiState[index].documentStatus` and is what makes
 * the selection survive a search recreation (it round-trips through
 * getUiState()/initialUiState just like the built-in refinementList widget).
 */
const UI_STATE_KEY = 'documentStatus';

/** The default selection when nothing is stored in the uiState. */
const DEFAULT_OPTION = 'active';

/**
 * Maps a document-status option key to its Typesense `filters` string.
 * Kept as a function because two options depend on the current time.
 * @param {string} option
 * @returns {string}
 */
function optionToFilters(option) {
    switch (option) {
        case 'active':
            return 'base.isScheduledForDeletion:false && base.isCurrent:true';
        case 'active-obsolete':
            return 'base.isScheduledForDeletion:false';
        case 'deleted':
            return 'base.isScheduledForDeletion:true';
        case 'toDelete':
            return `file.base.recommendedDeletionTimestamp :< ${Math.floor(Date.now() / 1000)}`;
        case 'toArchive':
            return `file.base.recommendedArchivalTimestamp :< ${Math.floor(Date.now() / 1000)}`;
        default:
            return optionToFilters(DEFAULT_OPTION);
    }
}

/**
 * A custom InstantSearch connector for the document-status filter.
 *
 * Unlike the built-in `configure` widget (whose `searchParameters` are static
 * developer config and therefore override any restored uiState), this connector
 * treats the selection as a first-class piece of uiState:
 *
 *  - `getWidgetUiState` writes the current selection into `uiState.documentStatus`
 *  - `getWidgetSearchParameters` reads it back from the (restored) uiState and
 *    translates it into the `filters` query parameter
 *
 * As a result the selection round-trips through getUiState()/initialUiState the
 * same way built-in widgets do, so it survives a search recreation (on facet
 * config or language changes) with no external state carrying.
 * @param {function(object, boolean): void} renderFn - called with (renderState, isFirstRender)
 * @param {function(): void} [unmountFn]
 */
export function connectDocumentStatus(renderFn, unmountFn = () => {}) {
    return function documentStatus(widgetParams) {
        const connectorState = {};

        return {
            $$type: 'cabinet.documentStatus',

            getWidgetRenderState({helper}) {
                if (!connectorState.refine) {
                    connectorState.refine = (option) => {
                        // Persist the selection so it is picked up by
                        // getWidgetUiState, then apply the derived filters.
                        connectorState.currentOption = option;
                        helper.setQueryParameter('filters', optionToFilters(option)).search();
                    };
                }

                // Derive the current option from the live query state so the
                // render always reflects what is actually being searched
                // (including the value restored from initialUiState).
                const currentOption =
                    connectorState.currentOption ??
                    filtersToOption(helper?.state?.filters) ??
                    DEFAULT_OPTION;

                return {
                    selectedOption: currentOption,
                    refine: connectorState.refine,
                    widgetParams,
                };
            },

            getRenderState(renderState, renderOptions) {
                return {
                    ...renderState,
                    documentStatus: this.getWidgetRenderState(renderOptions),
                };
            },

            init(initOptions) {
                const {instantSearchInstance} = initOptions;
                renderFn({...this.getWidgetRenderState(initOptions), instantSearchInstance}, true);
            },

            render(renderOptions) {
                const {instantSearchInstance} = renderOptions;
                renderFn(
                    {...this.getWidgetRenderState(renderOptions), instantSearchInstance},
                    false,
                );
            },

            dispose({state}) {
                unmountFn();
                // Remove our query parameter from the state on unmount.
                return state.setQueryParameter('filters', undefined);
            },

            getWidgetUiState(uiState, {searchParameters}) {
                const option =
                    connectorState.currentOption ??
                    filtersToOption(searchParameters.filters) ??
                    DEFAULT_OPTION;
                return {
                    ...uiState,
                    [UI_STATE_KEY]: option,
                };
            },

            getWidgetSearchParameters(searchParameters, {uiState}) {
                const option = uiState[UI_STATE_KEY] ?? DEFAULT_OPTION;
                connectorState.currentOption = option;
                return searchParameters.setQueryParameter('filters', optionToFilters(option));
            },
        };
    };
}

/**
 * Best-effort reverse mapping from a `filters` string back to an option key.
 * Used as a fallback when the connector has no explicitly tracked option yet.
 * @param {string|undefined} filters
 * @returns {string|null}
 */
function filtersToOption(filters) {
    if (!filters) {
        return null;
    }
    if (filters === 'base.isScheduledForDeletion:true') {
        return 'deleted';
    }
    if (filters.startsWith('file.base.recommendedDeletionTimestamp')) {
        return 'toDelete';
    }
    if (filters.startsWith('file.base.recommendedArchivalTimestamp')) {
        return 'toArchive';
    }
    if (filters === 'base.isScheduledForDeletion:false') {
        return 'active-obsolete';
    }
    return 'active';
}

export class DocumentStatusWidget extends LangMixin(DBPLitElement, createInstance) {
    static styles = [
        commonStyles.getThemeCSS(),
        commonStyles.getGeneralCSS(false),
        css`
            :host {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .hidden {
                display: none;
            }

            .refinement-list {
                list-style: none;
                position: relative;
                padding: 0;
                margin: 0;
            }

            .refinement-list-obsolete-checkbox {
                list-style: none;
                position: relative;
                padding: 0;
                margin-left: 20px;
            }

            .refinement-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 2px 0px;
                padding-right: 0;
                user-select: none;
            }

            .refinement-checkbox {
                margin-right: 8px;
                cursor: pointer;
                width: 1rem;
                height: 1rem;
            }

            .refinement-text {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 8px;
            }
        `,
    ];

    static properties = {
        // The render options supplied by the connectDocumentStatus connector.
        documentStatusRenderOptions: {type: Object, attribute: false},
    };

    constructor() {
        super();
        this.documentStatusRenderOptions = null;
    }

    /**
     * The currently selected option, driven entirely by the connector's render
     * options (which are derived from the search/uiState). This is the single
     * source of truth, so the DOM is a pure function of it and no manual
     * reconciliation is needed after a search recreation.
     * @returns {string}
     */
    get _selectedOption() {
        return this.documentStatusRenderOptions?.selectedOption ?? DEFAULT_OPTION;
    }

    _refine(option) {
        this.documentStatusRenderOptions?.refine(option);
    }

    _handleShowActive() {
        this._refine('active');
    }

    _handleShowDeletedOnly() {
        this._refine('deleted');
    }

    _handleShowToDeleteOnly() {
        this._refine('toDelete');
    }

    _handleShowToArchiveOnly() {
        this._refine('toArchive');
    }

    _handleShowObsolete(event) {
        this._refine(event.target.checked ? 'active-obsolete' : 'active');
    }

    render() {
        const option = this._selectedOption;
        const isActive = option === 'active' || option === 'active-obsolete';
        return html`
            <div class="refinement-list-container">
                <ul class="refinement-list">
                    <li class="refinement-list">
                        <label class="refinement-label">
                            <input
                                id="inputShowActiveOnly"
                                type="radio"
                                class="refinement-checkbox"
                                @change=${this._handleShowActive}
                                name="document-filter"
                                .checked=${isActive} />
                            <span class="refinement-text">${this._i18n.t('show-active-only')}</span>
                        </label>
                        <ul class="refinement-list-obsolete-checkbox ${isActive ? '' : 'hidden'}">
                            <li class="refinement-list">
                                <label class="refinement-label">
                                    <input
                                        type="checkbox"
                                        class="refinement-checkbox"
                                        @change=${this._handleShowObsolete}
                                        name="document-filter"
                                        .checked=${option === 'active-obsolete'} />
                                    <span class="refinement-text">
                                        ${this._i18n.t('show-obsolete-also')}
                                    </span>
                                </label>
                            </li>
                        </ul>
                    </li>
                    <li class="refinement-list">
                        <label class="refinement-label">
                            <input
                                type="radio"
                                class="refinement-checkbox"
                                @change=${this._handleShowDeletedOnly}
                                name="document-filter"
                                .checked=${option === 'deleted'} />
                            <span class="refinement-text">
                                ${this._i18n.t('show-deleted-only')}
                            </span>
                        </label>
                    </li>
                    <li class="refinement-list">
                        <label class="refinement-label">
                            <input
                                type="radio"
                                class="refinement-checkbox"
                                @change=${this._handleShowToDeleteOnly}
                                name="document-filter"
                                .checked=${option === 'toDelete'} />
                            <span class="refinement-text">
                                ${this._i18n.t('show-to-delete-only')}
                            </span>
                        </label>
                    </li>
                    <li class="refinement-list">
                        <label class="refinement-label">
                            <input
                                type="radio"
                                class="refinement-checkbox"
                                @change=${this._handleShowToArchiveOnly}
                                name="document-filter"
                                .checked=${option === 'toArchive'} />
                            <span class="refinement-text">
                                ${this._i18n.t('show-to-archive-only')}
                            </span>
                        </label>
                    </li>
                </ul>
            </div>
        `;
    }
}
