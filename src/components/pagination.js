import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {connectPagination} from 'instantsearch.js/es/connectors';
import {createInstance} from '../i18n.js';
import {css, html} from 'lit';

class Pagination extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.paginationRenderOptions = null;
    }

    static get properties() {
        return {
            ...super.properties,
            paginationRenderOptions: {type: Object, attribute: false},
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .ais-Pagination-list {
                list-style: none;
                display: flex;
                justify-content: right;
                gap: 3px;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }

            .ais-Pagination-item {
                border: 1px solid var(--dbp-content);
                background-color: var(--dbp-background);
                color: var(--dbp-content);
            }

            .ais-Pagination-link {
                min-width: 1em;
                height: 2em;
                display: block;
                text-align: center;
                line-height: 2em;
                padding: 0 0.5em;
                border: none;
                cursor: pointer;
                color: var(--dbp-content);
                border-radius: 0;
                background: none;
                font-size: inherit;
                font-family: inherit;
                text-decoration: none;
            }

            .ais-Pagination-link:hover {
                color: var(--dbp-hover-color);
                background-color: var(--dbp-hover-background-color);
            }

            .ais-Pagination-item--selected .ais-Pagination-link {
                font-weight: bold;
                background-color: var(--dbp-selected);
                color: var(--dbp-on-selected-surface);
            }

            .ais-Pagination-item--disabled .ais-Pagination-link {
                cursor: not-allowed;
                color: var(--dbp-muted);
            }

            .ais-Pagination-item--disabled .ais-Pagination-link:hover {
                background-color: var(--dbp-hover-background-color);
                color: var(--dbp-hover-color);
            }

            @media (max-width: 489px) {
                .ais-Pagination-list {
                    justify-content: space-between;
                }
                .ais-Pagination-item {
                    width: 100%;
                }
            }
        `;
    }

    render() {
        if (this.paginationRenderOptions === null) {
            return html``;
        }

        const {
            pages,
            currentRefinement,
            nbPages,
            isFirstPage,
            isLastPage,
            refine,
            createURL,
            instantSearchInstance,
        } = this.paginationRenderOptions;

        // This component subscribes to `lang` and can re-render independently
        // of InstantSearch's own render cycle, e.g. after a language change
        // disposes and re-initializes the search. In that window the stored
        // `createURL` closure references a disposed instance and throws
        // (`localInstantSearchInstance is null`). A disposed instance has
        // `started === false`, so render nothing until the search is live again.
        if (!instantSearchInstance || !instantSearchInstance.started) {
            return html``;
        }

        const handleClick = (event, page) => {
            event.preventDefault();
            refine(page);
        };
        const i18n = this._i18n;
        const firstItem = html`
            <li
                class="ais-Pagination-item ais-Pagination-item--firstPage ${
                    isFirstPage ? 'ais-Pagination-item--disabled' : ''
                }">
                ${
                    isFirstPage
                        ? html`
                              <span
                                  class="ais-Pagination-link"
                                  aria-label="${i18n.t('pagination.first-page')}">
                                  «
                              </span>
                          `
                        : html`
                              <a
                                  class="ais-Pagination-link"
                                  href="${createURL(0)}"
                                  aria-label="${i18n.t('pagination.first-page')}"
                                  @click="${(e) => handleClick(e, 0)}">
                                  «
                              </a>
                          `
                }
            </li>
        `;

        const previousItem = html`
            <li
                class="ais-Pagination-item ais-Pagination-item--previousPage ${
                    isFirstPage ? 'ais-Pagination-item--disabled' : ''
                }">
                ${
                    isFirstPage
                        ? html`
                              <span
                                  class="ais-Pagination-link"
                                  aria-label="${i18n.t('pagination.previous-page')}">
                                  ‹
                              </span>
                          `
                        : html`
                              <a
                                  class="ais-Pagination-link"
                                  href="${createURL(currentRefinement - 1)}"
                                  aria-label="${i18n.t('pagination.previous-page')} "
                                  @click="${(e) => handleClick(e, currentRefinement - 1)}">
                                  ‹
                              </a>
                          `
                }
            </li>
        `;

        const pageItems = pages.map(
            (page) => html`
                <li
                    class="ais-Pagination-item ais-Pagination-item--page ${
                        currentRefinement === page ? 'ais-Pagination-item--selected' : ''
                    }">
                    <a
                        class="ais-Pagination-link"
                        href="${createURL(page)}"
                        aria-label="${i18n.t('pagination.page')} ${page + 1}"
                        aria-current="${currentRefinement === page ? 'page' : 'false'}"
                        @click="${(e) => handleClick(e, page)}">
                        ${page + 1}
                    </a>
                </li>
            `,
        );

        const nextItem = html`
            <li
                class="ais-Pagination-item ais-Pagination-item--nextPage ${
                    isLastPage ? 'ais-Pagination-item--disabled' : ''
                }">
                ${
                    isLastPage
                        ? html`
                              <span
                                  class="ais-Pagination-link"
                                  aria-label="${i18n.t('pagination.next-page')}">
                                  ›
                              </span>
                          `
                        : html`
                              <a
                                  class="ais-Pagination-link"
                                  href="${createURL(currentRefinement + 1)}"
                                  aria-label="${i18n.t('pagination.next-page')}"
                                  @click="${(e) => handleClick(e, currentRefinement + 1)}">
                                  ›
                              </a>
                          `
                }
            </li>
        `;

        const lastItem = html`
            <li
                class="ais-Pagination-item ais-Pagination-item--lastPage ${
                    isLastPage ? 'ais-Pagination-item--disabled' : ''
                }">
                ${
                    isLastPage
                        ? html`
                              <span
                                  class="ais-Pagination-link"
                                  aria-label="${i18n.t('pagination.last-page')}">
                                  »
                              </span>
                          `
                        : html`
                              <a
                                  class="ais-Pagination-link"
                                  href="${createURL(nbPages - 1)}"
                                  aria-label="${i18n.t('pagination.last-page')}, ${i18n.t(
                                      'pagination.page',
                                  )} ${nbPages}"
                                  @click="${(e) => handleClick(e, nbPages - 1)}">
                                  »
                              </a>
                          `
                }
            </li>
        `;

        return html`
            <div class="ais-Pagination">
                <ul class="ais-Pagination-list">
                    ${firstItem} ${previousItem} ${pageItems} ${nextItem} ${lastItem}
                </ul>
            </div>
        `;
    }
}

export function createPagination(parent, container) {
    parent.defineScopedElement('dbp-cabinet-pagination', Pagination);

    const customPagination = connectPagination((renderOptions, isFirstRender) => {
        const container = renderOptions.widgetParams.container;

        let pagination;
        if (isFirstRender) {
            pagination = parent.createScopedElement('dbp-cabinet-pagination');
            pagination.setAttribute('subscribe', 'lang');
            container.replaceChildren(pagination);
        } else {
            pagination = container.children[0];
        }

        pagination.paginationRenderOptions = renderOptions;
    });

    return customPagination({
        container: container,
    });
}
