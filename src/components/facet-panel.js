import {Icon, LangMixin, ScopedElementsMixin} from '@dbp-toolkit/common';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {createInstance} from '../i18n';
import {css, html} from 'lit';

export class FacetPanel extends LangMixin(ScopedElementsMixin(DBPLitElement), createInstance) {
    constructor() {
        super();
        this.titleKey = '';
        this.isOpen = false;
    }

    static properties = {
        titleKey: {type: String},
        isOpen: {type: Boolean, state: true},
    };

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-icon': Icon,
        };
    }

    static styles = css`
        .chevron-container {
            color: var(--dbp-accent);
            width: 16px;
            height: 16px;
        }

        .panel-header {
            display: flex;
            gap: 1em;
            align-items: center;
            padding: 0.5em auto 0.5em;
            justify-content: space-between;
            user-select: none;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            width: 100%;
            font-size: inherit;
            color: inherit;
            font-family: inherit;
        }

        .content {
            display: none;
            padding-left: 6px;
        }

        .content.show {
            display: block;
        }
    `;

    _toggleContent(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    render() {
        return html`
            <div class="collapsible-section">
                <button
                    class="panel-header"
                    aria-expanded="${this.isOpen}"
                    aria-controls="content"
                    @click="${this._toggleContent}">
                    <span>${this._i18n.t(this.titleKey)}</span>
                    <dbp-icon
                        class="chevron-container"
                        name="${this.isOpen ? 'chevron-up' : 'chevron-down'}"
                        alt="${this.isOpen ? 'chevron-up' : 'chevron-down'}"></dbp-icon>
                </button>
                <div id="content" class="content ${this.isOpen ? 'show' : ''}">
                    <slot></slot>
                </div>
            </div>
        `;
    }
}
