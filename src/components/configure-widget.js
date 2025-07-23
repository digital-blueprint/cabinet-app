import {html, css} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';

export class ConfigureWidget extends LangMixin(DBPLitElement, createInstance) {
    static styles = [
        commonStyles.getThemeCSS(),
        commonStyles.getGeneralCSS(false),
        css`
            :host {
                display: flex;
                flex-direction: column;
                gap: 6px;
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
        `,
    ];

    static properties = {
        configureRenderOptions: {type: Object},
    };

    constructor() {
        super();
        this.configureRenderOptions = null;
    }

    _handleCheckboxChange(event) {
        let filters = event.target.checked
            ? 'base.isScheduledForDeletion:true'
            : 'base.isScheduledForDeletion:false';
        this.configureRenderOptions.refine({filters: filters});
    }

    render() {
        return html`
            <div class="refinement-list-container">
                <ul class="refinement-list">
                    <li class="refinement-item">
                        <label class="refinement-label">
                            <input
                                type="checkbox"
                                class="refinement-checkbox"
                                @change=${this._handleCheckboxChange} />
                            <span class="refinement-text">
                                ${this._i18n.t('show-deleted-only')}
                            </span>
                        </label>
                    </li>
                </ul>
            </div>
        `;
    }
}
