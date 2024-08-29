import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button} from '@dbp-toolkit/common';
import {css, html} from 'lit';
import {panel, refinementList} from 'instantsearch.js/es/widgets/index.js';

export class CabinetFacets extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    static get scopedElements() {
        return {
            'dbp-button': Button,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            search: { type: Object }
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                break;
                case 'search':
                    this.createAndAddWidget();
                break;
            }
        });

        super.update(changedProperties);
    }

    createAndAddWidget() {
        this.search.addWidgets([
            this.createCategoryRefinementList(),
            this.createBasePersonRefinementList(),
            this.createPersonStudiesRefinementList(),
            this.createPersonNationalitiesRefinementList(),
            this.createFileAdditionalTypeRefinementList(),
            this.createFileStudyFieldRefinementList(),
        ]);
    }

    // @type
    createCategoryRefinementList() {
        // const i18n = this._i18n;

        return refinementList({
            container: this._("#categories"),
            attribute: '@type',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    // base.person
    createBasePersonRefinementList() {
        const i18n = this._i18n;

        const fileAdditionalTypeRefinementList = panel({
            templates: {
                header(options, { html }) {
                    return i18n.t('cabinet-search.filter-base-person-title');
                },
            },
            collapsed: () => true,
        })(refinementList);

        return fileAdditionalTypeRefinementList({
            container: this._("#base-person"),
            attribute: 'base.person',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--base-person">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    // person.nationalities.text
    createPersonNationalitiesRefinementList() {
        const i18n = this._i18n;

        const fileAdditionalTypeRefinementList = panel({
            templates: {
                header(options, { html }) {
                    return i18n.t('cabinet-search.filter-person-nationality-title');
                },
            },
            collapsed: () => true,
        })(refinementList);

        return fileAdditionalTypeRefinementList({
            container: this._("#person-nationalities"),
            attribute: 'person.nationalities.text',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--person-nationalities">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    // file.base.additionalType
    createFileAdditionalTypeRefinementList() {
        const i18n = this._i18n;

        const fileAdditionalTypeRefinementList = panel({
            templates: {
                header(options, { html }) {
                    return i18n.t('cabinet-search.filter-document-type-title');
                },
            },
            collapsed: () => true,
        })(refinementList);

        return fileAdditionalTypeRefinementList({
            container: this._("#file-additional-type"),
            attribute: 'file.base.additionalType',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    // file.base.studyField
    createFileStudyFieldRefinementList() {
        const i18n = this._i18n;

        const fileStudyFieldRefinementList = panel({
            templates: {
                header(options, { html }) {
                    return i18n.t('cabinet-search.filter-document-study-field');
                },
            },
            collapsed: () => true,
        })(refinementList);

        return fileStudyFieldRefinementList({
            container: this._("#file-study-field"),
            attribute: 'file.base.studyField',
            templates: {
                item(item, {html}) {
                    // console.log('Study field:', item);
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    // person.studies.name
    createPersonStudiesRefinementList() {
        const i18n = this._i18n;

        const personStudiesRefinementList = panel({
            templates: {
                header(options, { html }) {
                    return i18n.t('cabinet-search.filter-document-study-field');
                },
            },
            collapsed: () => true,
        })(refinementList);

        return personStudiesRefinementList({
            container: this._("#person-studies"),
            attribute: 'person.studies.name',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                }
            },
        });
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}

            .filters {
                border: 1px solid var(--dbp-content);
                height: 100%;
            }
            
            .filter-header {
                padding: 1em;
                border-bottom: 1px solid var(--dbp-content);
            }

            .filter-header__title {
                margin: 0;
                font-weight: bold;
            }

            .filters-container {
                padding: 1em;
            }

            .filter-group {
                margin-bottom: 2em;
                display: flex;
                flex-direction: column;
                gap: 1em;
            }

            .filter-title {
                margin: 0;
            }

            .ais-RefinementList-list {
                list-style: none;
                margin: 0;
                padding: .5em 0;
            }

            .ais-Panel-header {
                display: flex;
                gap: 1em;
                align-items: center;
                border: 1px solid var(--dbp-content);
                padding: 0.5em;
                justify-content: space-between;
            }

            .ais-Panel-body {
                border: 1px solid var(--dbp-content);
                border-top: none 0;
                padding: 0 .25em;
            }

            .refinement-list-item {
                display: flex;
                gap: 1em;
                justify-content: space-between;
            }
            
            .refinement-list-item-inner {
                display: flex;
                max-width: 80%;
            }

            .refinement-list-item-name {
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }

            .ais-Panel-body {
                /*transition: opacity 0.25s, display 0.25s;*/
                /*transition-behavior: allow-discrete;*/
            }

            .ais-Panel--collapsed .ais-Panel-body {
                opacity: 0;
                display: none;
            }
        `;
    }

    render() {
        const i18n = this._i18n;
        console.log('-- Render Facets --');

        return html`
            <div class="filters">
                <div class="filter-header">
                    <h2 class="filter-header__title">${i18n.t('cabinet-search.filters')}</h2>
                </div>
                <div class="filters-container">
                    <div id="person-filters" class="filter-group filter-group--type">
                        <h3 class="filter-title">${i18n.t('cabinet-search.type-filter-group-title')}</h3>
                        <div id="categories" class="filter filter--categories"></div>
                    </div>
                    <div id="person-filters" class="filter-group filter-group--person">
                        <h3 class="filter-title">${i18n.t('cabinet-search.person-filter-group-title')}</h3>
                        <div id="base-person" class="filter filter--base-person"></div>
                        <div id="person-nationalities" class="filter filter--person-nationalities"></div>
                        <div id="person-studies" class="filter filter--person-studies"></div>
                    </div>
                    <div id="document-filters" class="filter-group filter-group--document">
                        <h3 class="filter-title">${i18n.t('cabinet-search.document-filter-group-title')}</h3>
                        <div id="file-additional-type" class="filter filter--categories"></div>
                        <div id="file-study-field" class="filter filter--study"></div>
                    </div>
                </div>
            </div>
        `;
    }
}