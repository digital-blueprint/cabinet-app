import {LangMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {connectClearRefinements} from 'instantsearch.js/es/connectors';
import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import {Icon, ScopedElementsMixin} from '@dbp-toolkit/common';
class ClearRefinements extends ScopedElementsMixin(LangMixin(DBPLitElement, createInstance)) {
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
    static get scopedElements() {
        return {
            'dbp-icon': Icon,
        };
    }
    static get styles() {
        return css`
            .clear-refinements-button {
                background: transparent;
                border: 1px solid transparent;
                color: var(--dbp-content);
                margin-left: 30px;
                border-radius: 0;
                font-size: 0.8em;
                position: relative;
                cursor: pointer;
                display: flex;
                gap: 4px;
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
                color: var(--dbp-hover-color);
                background: var(--dbp-hover-background-color);
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
                    <dbp-icon name="close" aria-hidden="true"></dbp-icon>
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
