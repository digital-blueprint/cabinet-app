import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {connectClearRefinements} from 'instantsearch.js/es/connectors';
import {createInstance} from './i18n.js';
import {css, html} from 'lit';

class ClearRefinements extends LangMixin(DBPLitElement, createInstance) {
    constructor() {
        super();
        this.clearRenderOptions = null;
    }

    static get properties() {
        return {
            ...super.properties,
            clearRenderOptions: {type: Object, attribute: false},
        };
    }

    static get styles() {
        return css`
            .clear-refinements-button {
                background: transparent;
                border: 1px solid transparent;
                color: var(--dbp-content);
                padding: 7px 7px 7px 30px;
                border-radius: 0;
                font-size: 0.8em;
                position: relative;
                cursor: pointer;
            }

            .clear-refinements-button:before {
                content: '';
                width: 12px;
                height: 12px;
                display: block;
                position: absolute;
                left: 10px;
                top: 10px;
                mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                transition: transform 0.3s ease;
                background-color: var(--dbp-content);
            }

            .clear-refinements-button[disabled] {
                display: none;
            }

            .clear-refinements-button:focus,
            .clear-refinements-button:hover {
                /* border: 1px solid #999; */
                background: transparent;
                text-decoration: underline;
                text-underline-offset: 3px;
            }

            .clear-refinements-button:focus:before,
            .clear-refinements-button:hover:before {
                transform: rotate(360deg);
            }

            .clear-refinements-button-label {
                white-space: nowrap;
            }
        `;
    }

    render() {
        if (this.clearRenderOptions === null) {
            return html``;
        }

        const {canRefine, refine} = this.clearRenderOptions;

        return html`
            <div class="clear-refinement-container">
                <button
                    class="clear-refinements-button"
                    @click=${() => {
                        refine();
                    }}
                    ?disabled=${!canRefine}>
                    <span class="clear-refinements-button-label">
                        ${this._i18n.t('cabinet-search.refinement-delete-all-filters')}
                    </span>
                </button>
            </div>
        `;
    }
}

export function createClearRefinements(parent, container) {
    parent.defineScopedElement('dbp-cabinet-clear-refinements', ClearRefinements);

    const customClearRefinements = connectClearRefinements((renderOptions, isFirstRender) => {
        const container = renderOptions.widgetParams.container;

        let currentRefinements;
        if (isFirstRender) {
            currentRefinements = parent.createScopedElement('dbp-cabinet-clear-refinements');
            currentRefinements.setAttribute('subscribe', 'lang');
            container.replaceChildren(currentRefinements);
        } else {
            currentRefinements = container.children[0];
        }

        currentRefinements.clearRenderOptions = renderOptions;
    });

    return customClearRefinements({
        container: container,
    });
}
