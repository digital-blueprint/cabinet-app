import {html, css} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {LangMixin} from '@dbp-toolkit/common';
import {createInstance} from '../i18n';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {createRef, ref} from 'lit/directives/ref.js';

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
        this.includeObsoleteCheckboxRef = createRef();
    }

    _handleShowActive(event) {
        let filters = 'base.isScheduledForDeletion:false && base.isCurrent:true';
        this.includeObsoleteCheckboxRef.value.classList.toggle('hidden');
        this.configureRenderOptions.refine({filters: filters});
    }

    _handleShowDeletedOnly(event) {
        let filters = 'base.isScheduledForDeletion:true';
        this.includeObsoleteCheckboxRef.value.classList.add('hidden');
        this.configureRenderOptions.refine({filters: filters});
    }

    _handleShowToDeleteOnly(event) {
        let filters = `file.base.recommendedDeletionTimestamp :< ${Math.floor(Date.now() / 1000)}`;
        this.includeObsoleteCheckboxRef.value.classList.add('hidden');
        this.configureRenderOptions.refine({filters: filters});
    }

    _handleShowToArchiveOnly(event) {
        let filters = ''; // TODO add filter when typesense property "recommendedArchivalDate" was added
        this.includeObsoleteCheckboxRef.value.classList.add('hidden');
        this.configureRenderOptions.refine({filters: filters});
    }

    _handleShowObsolete(event) {
        let filters = '';
        if (event.target.checked) {
            filters = 'base.isScheduledForDeletion:false'; // TODO add filter
        } else {
            filters = 'base.isScheduledForDeletion:false && base.isCurrent:true'; // TODO add filter
        }
        this.configureRenderOptions.refine({filters: filters});
    }

    render() {
        return html`
            <div class="refinement-list-container">
                <ul class="refinement-list">
                    <li class="refinement-list">
                        <input
                            id="inputShowActiveOnly"
                            type="radio"
                            class="refinement-checkbox"
                            @change=${this._handleShowActive}
                            name="document-filter"
                            checked />
                        <span class="refinement-text">${this._i18n.t('show-active-only')}</span>
                        <ul
                            ${ref(this.includeObsoleteCheckboxRef)}
                            class="refinement-list-obsolete-checkbox">
                            <li class="refinement-list">
                                <input
                                    type="checkbox"
                                    class="refinement-checkbox"
                                    @change=${this._handleShowObsolete}
                                    name="document-filter" />
                                <span class="refinement-text">
                                    ${this._i18n.t('show-obsolete-also')}
                                </span>
                            </li>
                        </ul>
                    </li>
                    <li class="refinement-list">
                        <input
                            type="radio"
                            class="refinement-checkbox"
                            @change=${this._handleShowDeletedOnly}
                            name="document-filter" />
                        <span class="refinement-text">${this._i18n.t('show-deleted-only')}</span>
                    </li>
                    <li class="refinement-list">
                        <input
                            type="radio"
                            class="refinement-checkbox"
                            @change=${this._handleShowToDeleteOnly}
                            name="document-filter" />
                        <span class="refinement-text">${this._i18n.t('show-to-delete-only')}</span>
                    </li>
                    <!--<li class="refinement-list">
                        <input
                            type="radio"
                            class="refinement-checkbox"
                            @change=${this._handleShowToArchiveOnly}
                            name="document-filter">
                        <span class="refinement-text">
                            ${this._i18n.t('show-to-archive-only')}
                        </span>
                    </li>-->
                </ul>
            </div>
        `;
    }
}
