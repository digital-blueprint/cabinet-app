import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {connectCurrentRefinements} from 'instantsearch.js/es/connectors';
import {createInstance} from './i18n';
import {css, html} from 'lit';

class CurrentRefinements extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.currentRenderOptions = null;
        this.facetConfigs = [];
    }

    static get properties() {
        return {
            ...super.properties,
            currentRenderOptions: {type: Object, attribute: false},
            facetConfigs: {type: Array, attribute: false},
        };
    }

    static get styles() {
        return css`
            :host {
                font-size: 0.8em;
            }

            .visually-hidden {
                position: absolute !important;
                clip: rect(1px, 1px, 1px, 1px);
                overflow: hidden;
                height: 1px;
                width: 1px;
                word-wrap: normal;
            }

            .ais-CurrentRefinements--noRefinement {
                min-height: 4em;
            }

            .ais-CurrentRefinements-list {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.5em 1em;
                margin: 0;
                padding: 0 0 1em 0;
                height: 100%;
                list-style: none;
            }

            .ais-CurrentRefinements-item {
                list-style: none;
                display: flex;
                flex-wrap: wrap;
                gap: 0 1em;
            }

            .ais-CurrentRefinements-label {
                display: none;
            }

            .ais-CurrentRefinements-category {
                border: 1px solid var(--dbp-content);
                display: flex;
                white-space: nowrap;
            }

            .ais-CurrentRefinements-delete {
                position: relative;
                background: none;
                border: none 0;
                cursor: pointer;
                color: var(--dbp-content);
            }

            .ais-CurrentRefinements-category:hover .filter-close-icon {
                transform: rotate(90deg);
            }

            .filter-close-icon {
                display: block;
                transition: transform 0.1s ease-in;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3E%3C/svg%3E");
                width: 10px;
                height: 10px;
                background-size: 10px;
                color: var(--dbp-content);
                background: var(--dbp-content);
            }

            .refinement-title {
                color: var(--dbp-on-primary-surface);
                background: var(--dbp-primary-surface);
                padding: 4px 8px;
                font-weight: bold;
            }

            .refinement-value {
                padding: 4px 6px;
            }
        `;
    }

    render() {
        const i18n = this._i18n;
        const {items, refine} = this.currentRenderOptions;

        let listItems = items.map((item) => {
            return item.refinements.map((refinement) => {
                const facetConfig = this.facetConfigs.find(
                    (facet) => facet.schemaField === refinement.attribute,
                );

                let label;
                if (facetConfig.renderFunction) {
                    label = facetConfig.renderFunction(
                        i18n,
                        refinement.attribute,
                        refinement.value,
                        refinement.operator,
                    );
                } else {
                    label = html`
                        ${refinement.value}
                    `;
                }

                return html`
                    <li class="ais-CurrentRefinements-category">
                        <div class="refinement-title">${i18n.t(facetConfig.name)}</div>
                        <div class="refinement-value">
                            <span class="ais-CurrentRefinements-categoryLabel">${label}</span>
                            <button
                                class="ais-CurrentRefinements-delete"
                                title="${i18n.t(
                                    'cabinet-search.refinement-delete-filter-button-text',
                                )}"
                                @click="${() => refine(refinement)}">
                                <span class="visually-hidden">
                                    ${i18n.t('cabinet-search.refinement-delete-filter-button-text')}
                                </span>
                                <span class="filter-close-icon"></span>
                            </button>
                        </div>
                    </li>
                `;
            });
        });

        return html`
            <div class="ais-CurrentRefinements">
                <ul class="ais-CurrentRefinements-list">
                    ${listItems}
                </ul>
            </div>
        `;
    }
}

export function createCurrentRefinements(parent, container, facetConfigs) {
    parent.defineScopedElement('dbp-cabinet-current-refinements', CurrentRefinements);

    const customCurrentRefinements = connectCurrentRefinements((renderOptions, isFirstRender) => {
        const container = renderOptions.widgetParams.container;

        let currentRefinements;
        if (isFirstRender) {
            currentRefinements = parent.createScopedElement('dbp-cabinet-current-refinements');
            currentRefinements.setAttribute('subscribe', 'lang');
            currentRefinements.facetConfigs = facetConfigs;
            container.replaceChildren(currentRefinements);
        } else {
            currentRefinements = container.children[0];
        }

        currentRefinements.currentRenderOptions = renderOptions;
    });

    return customCurrentRefinements({
        container: container,
    });
}
