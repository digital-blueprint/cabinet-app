import {html, css} from 'lit';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';
import {repeat} from 'lit/directives/repeat.js';
import {live} from 'lit/directives/live.js';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';

function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * A customizable refinement list web component for filtering items, supporting search, show more/less, and custom rendering.
 */
export class RefinementList extends LangMixin(DBPLitElement, createInstance) {
    static styles = [
        commonStyles.getThemeCSS(),
        commonStyles.getGeneralCSS(false),
        commonStyles.getButtonCSS(),
        css`
            :host {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .refinement-list.has-gradients::after {
                content: '';
                display: block;
                height: 30px;
                width: 100%;
                background: linear-gradient(
                    0deg,
                    rgb(from var(--dbp-background) r g b / 100%) 0%,
                    rgb(from var(--dbp-background) r g b / 60%) 60%,
                    rgb(from var(--dbp-background) r g b / 0%) 100%
                );
                pointer-events: none;
                z-index: 99;
                position: absolute;
                bottom: 0;
            }

            .search-input {
                width: 100%;
                box-sizing: border-box;
                background-color: var(--dbp-background);
                color: var(--dbp-content);
                border: var(--dbp-border);
            }

            .refinement-list {
                list-style: none;
                position: relative;
                padding: 0;
                margin: 0;
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
            }

            .refinement-text {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-right: 8px;
            }

            .refinement-count {
                color: var(--dbp-muted);
                font-size: 0.9em;
                flex-shrink: 0;
            }

            .empty-state {
                font-style: italic;
                text-align: center;
                padding: 10px 20px;
                color: var(--dbp-muted);
            }

            .hidden {
                display: none;
            }
        `,
    ];

    static properties = {
        refinementListRenderOptions: {type: Object},
        _searchValue: {type: String, state: true},
        renderFunction: {type: Object, attribute: false},
    };

    constructor() {
        super();
        this.refinementListRenderOptions = {};
        this._searchValue = '';
        this.renderFunction = null;
        this._debounce = debounce((func, value) => {
            func(value);
        }, 150);
    }

    updated(changedProperties) {
        if (changedProperties.has('refinementListRenderOptions')) {
            if (this.refinementListRenderOptions.isFromSearch === false && this._searchValue) {
                this._searchValue = '';
            }
        }
    }

    _handleSearchInput(event) {
        const value = event.target.value;
        this._searchValue = value;
        this._debounce(this.refinementListRenderOptions.searchForItems, value);
    }

    _handleRefinementChange(event, item) {
        event.preventDefault();
        this.refinementListRenderOptions.refine(item.value);
    }
    _handleShowMoreClick() {
        this.refinementListRenderOptions.toggleShowMore();
    }

    _renderSearchInput() {
        if (!this.refinementListRenderOptions.widgetParams.searchable) {
            return '';
        }

        return html`
            <input
                type="text"
                class="search-input"
                placeholder=${this._i18n.t('facets.search.placeholder')}
                .value=${live(this._searchValue)}
                @input=${this._handleSearchInput} />
        `;
    }

    _renderRefinementList() {
        const {
            items = [],
            canRefine = true,
            canToggleShowMore = false,
            widgetParams = {},
        } = this.refinementListRenderOptions;

        if (!canRefine) {
            return html`
                <div class="empty-state">${this._i18n.t('facets.no-refinements')}</div>
            `;
        }

        if (items.length === 0) {
            return html`
                <div class="empty-state">${this._i18n.t('facets.no-items-found')}</div>
            `;
        }

        let renderRefinementText = (item) => {
            if (this.renderFunction) {
                let value = this.renderFunction(
                    this._i18n,
                    widgetParams.attribute,
                    item.value,
                    null,
                );
                return html`
                    <span class="refinement-text" title="${value}">${value}</span>
                `;
            } else {
                return html`
                    <span class="refinement-text" title="${item.label}">
                        ${unsafeHTML(item.highlighted)}
                    </span>
                `;
            }
        };

        return html`
            <div class="refinement-list-container">
                <ul class="refinement-list ${canToggleShowMore ? 'has-gradients' : ''}">
                    ${repeat(
                        items,
                        (item) => item.value,
                        (item) => html`
                            <li class="refinement-item">
                                <label class="refinement-label">
                                    <input
                                        type="checkbox"
                                        class="refinement-checkbox"
                                        .checked=${live(item.isRefined)}
                                        @change=${(e) => this._handleRefinementChange(e, item)} />
                                    ${renderRefinementText(item)}
                                    <span class="refinement-count">(${item.count})</span>
                                </label>
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }

    _renderShowMoreButton() {
        const {canToggleShowMore = false, isShowingMore = false} = this.refinementListRenderOptions;

        return html`
            <button
                class="button is-small ${!canToggleShowMore ? 'hidden' : ''}"
                ?disabled=${!canToggleShowMore}
                @click=${this._handleShowMoreClick}>
                ${isShowingMore
                    ? this._i18n.t('facets.show-less')
                    : this._i18n.t('facets.show-more')}
            </button>
        `;
    }

    render() {
        return html`
            ${this._renderSearchInput()} ${this._renderRefinementList()}
            ${this._renderShowMoreButton()}
        `;
    }
}

customElements.define('refinement-list', RefinementList);
