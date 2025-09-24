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
                font-size: 13px;
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
                mask: url("data:image/svg+xml,%3Csvg width='12px' height='12px' stroke-width='1.03' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' color='%23000000'%3E%3Cg clip-path='url(%23restart_svg__clip0_1735_6488)' stroke='%23000000' stroke-width='1.03' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6.677 20.567C2.531 18.021.758 12.758 2.717 8.144 4.875 3.06 10.745.688 15.829 2.846c5.084 2.158 7.456 8.029 5.298 13.113a9.954 9.954 0 01-3.962 4.608'%3E%3C/path%3E%3Cpath d='M17 16v4.4a.6.6 0 00.6.6H22M12 22.01l.01-.011'%3E%3C/path%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='restart_svg__clip0_1735_6488'%3E%3Cpath fill='%23fff' d='M0 0h24v24H0z'%3E%3C/path%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");
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
