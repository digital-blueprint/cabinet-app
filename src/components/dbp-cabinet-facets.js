import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html, render} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
// import {Button, IconButton, Translated} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
// import {pascalToKebab} from '../utils';
import {panel, refinementList } from 'instantsearch.js/es/widgets/index.js';
import {connectCurrentRefinements, connectClearRefinements} from 'instantsearch.js/es/connectors';

export class CabinetFacets extends ScopedElementsMixin(DBPCabinetLitElement) {
    constructor() {
        super();
        // this.search = null;
        /** @type {HTMLElement} */
        this.searchResultsElement = null;
    }

    connectedCallback() {
        super.connectedCallback();

        const allFiltersContainer = document.createElement('div');
        allFiltersContainer.setAttribute('id', 'filters-container');
        allFiltersContainer.classList.add('filters-container');

        const currentRefinementsContainer = document.createElement('div');
        currentRefinementsContainer.setAttribute('id', 'current-filters');
        currentRefinementsContainer.classList.add('current-filters');

        const clearRefinementsContainer = document.createElement('div');
        clearRefinementsContainer.setAttribute('id', 'clear-filters');
        clearRefinementsContainer.classList.add('clear-filters');

        allFiltersContainer.append(currentRefinementsContainer);
        allFiltersContainer.append(clearRefinementsContainer);

        this.searchResultsElement = /** @type {HTMLElement} */ (this.closest('.result-container'));
        this.searchResultsElement.prepend(allFiltersContainer);
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            search: {type: Object, attribute: 'search'},
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
        // Person facets
        const createBasePersonRefinementList = this.generateFacet('base.person');
        const createPersonNationalitiesRefinementList = this.generateFacet(
            'person.nationalities.text',
            {
                facet: {
                    searchable: true,
                    limit: 20,
                    searchablePlaceholder: this._i18n.t(
                        'cabinet-search.search-placeholder-person-nationalities-text',
                    ),
                    searchableShowReset: true,
                },
            },
        );
        const createPersonAdmissionQualificationTypeKeyRefinementList = this.generateFacet(
            'person.admissionQualificationType.key',
        );
        const createPersonHomeAddressPlaceRefinementList = this.generateFacet(
            'person.homeAddress.place',
            {
                panel: {},
                facet: {
                    searchable: true,
                    limit: 20,
                    searchablePlaceholder: this._i18n.t(
                        'cabinet-search.search-placeholder-person-home-address',
                    ),
                    searchableShowReset: true,
                },
            },
        );
        const createPersonStudAddressPlaceRefinementList = this.generateFacet(
            'person.studAddress.place',
            {
                panel: {},
                facet: {
                    searchable: true,
                    limit: 20,
                    searchablePlaceholder: this._i18n.t(
                        'cabinet-search.search-placeholder-person-student-address',
                    ),
                    searchableShowReset: true,
                },
            },
        );
        const createPersonStudAddressCountryKeyRefinementList = this.generateFacet(
            'person.studAddress.country.key',
        );
        const createPersonImmatriculationSemesterRefinementList = this.generateFacet(
            'person.immatriculationSemester',
        );
        const createPersonExmatriculationSemesterRefinementList = this.generateFacet(
            'person.exmatriculationSemester',
        );
        const createPersonExmatriculationStatusKeyRefinementList = this.generateFacet(
            'person.exmatriculationStatus.key',
        );
        const createPersonAcademicTitlesRefinementList = this.generateFacet(
            'person.academicTitles'
        );
        const createPersonGenderKeyRefinementList = this.generateFacet(
            'person.gender.key'
        );
        const createPersonStudiesNameRefinementList = this.generateFacet(
            'person.studies.name'
        );
        const createPersonStudiesTypeRefinementList = this.generateFacet(
            'person.studies.type'
        );
        const createPersonApplicationsStudyTypeRefinementList = this.generateFacet(
            'person.applications.studyType',
        );

        // File facets
        const createFileAdditionalTypeRefinementList = this.generateFacet(
            'file.base.additionalType',
        );
        const createFileBaseIsPartOfRefinementList = this.generateFacet(
            'file.base.isPartOf',
        );
        const createFileBaseStudyFieldRefinementList = this.generateFacet(
            'file.base.studyField'
        );
        const createFileBaseSubjectOfRefinementList = this.generateFacet(
            'file.base.subjectOf'
        );
        const createFileCitizenshipCertificateNationalityRefinementList = this.generateFacet(
            'file.citizenshipCertificate.nationality',
        );
        const createFileIdentityDocumentNationalityRefinementList = this.generateFacet(
            'file.identityDocument.nationality',
        );

        // Filters
        const renderCurrentRefinements = (renderOptions) => {
            // const i18n = this._i18n;
            const {
                items,
                refine,
            } = renderOptions;

            // Render the widget
            let listItems = items.map(item => {
                return item.refinements.map(refinement => {
                    let label;
                    switch (item.attribute) {
                        default:
                            label = refinement.value;
                            break;
                    }
                    return html`
                            <li class='ais-CurrentRefinements-category'>
                                <span class='ais-CurrentRefinements-categoryLabel'>${label}</span>
                                <button class='ais-CurrentRefinements-delete' @click="${() => refine(refinement)}">
                                    <span class="visually-hidden">Filter löschen</span>
                                    <span class="filter-close-icon"></span>
                                </button>
                            </li>
                    `;
                });
            });

            const container = this.searchResultsElement.querySelector('#current-filters');
            render(html`
                <div class="ais-CurrentRefinements">
                    <ul class="ais-CurrentRefinements-list">
                        ${listItems}
                        <li id="clear-refinement" class="clear-refinement-container"></li>
                    </ul>
                </div>`,
                container);
        };
        const createCurrentRefinements = () => {
            const customCurrentRefinements = connectCurrentRefinements(renderCurrentRefinements);

            return customCurrentRefinements({
                container: this.searchResultsElement.querySelector('#current-filters'),
            });
        };

        // Clear refinements widget
        const renderClearRefinements = (renderOptions, isFirstRender) => {
            const i18n = this._i18n;
            const { canRefine, refine } = renderOptions;

            if (isFirstRender) {
                const clearButton = document.createElement('button');
                const clearButtonText = document.createElement('span');

                clearButtonText.textContent = i18n.t('cabinet-search.refinement-delete-filters');
                clearButton.appendChild(clearButtonText);
                clearButton.classList.add('clear-refinements-button');

                clearButton.addEventListener('click', () => {
                    refine();
                });
                this.searchResultsElement.querySelector('.clear-refinement-container').appendChild(clearButton);
            }

            this.searchResultsElement.querySelector('.clear-refinement-container').querySelector('button').disabled = !canRefine;
        };

        const createClearRefinements = () => {
            const customClearRefinements = connectClearRefinements(renderClearRefinements);

            return customClearRefinements({
                container: this.searchResultsElement.querySelector('#clear-filters'),
            });
        };

        this.search.addWidgets([
            // Category filter
            this.createCategoryRefinementList(),

            // Filters
            createCurrentRefinements(),
            // Clear filters
            createClearRefinements(),
            // Person filters
            createBasePersonRefinementList(),
            createPersonNationalitiesRefinementList(),
            createPersonAdmissionQualificationTypeKeyRefinementList(),
            createPersonHomeAddressPlaceRefinementList(),
            createPersonStudAddressPlaceRefinementList(),
            createPersonStudAddressCountryKeyRefinementList(),
            createPersonImmatriculationSemesterRefinementList(),
            createPersonExmatriculationSemesterRefinementList(),
            createPersonExmatriculationStatusKeyRefinementList(),
            createPersonAcademicTitlesRefinementList(),
            createPersonGenderKeyRefinementList(),
            createPersonStudiesNameRefinementList(),
            createPersonStudiesTypeRefinementList(),
            createPersonApplicationsStudyTypeRefinementList(),
            // File filters
            createFileAdditionalTypeRefinementList(),
            createFileBaseIsPartOfRefinementList(),
            createFileBaseStudyFieldRefinementList(),
            createFileBaseSubjectOfRefinementList(),
            createFileCitizenshipCertificateNationalityRefinementList(),
            createFileIdentityDocumentNationalityRefinementList(),
        ]);
    }

    // @type
    createCategoryRefinementList() {
        // const i18n = this._i18n;

        return refinementList({
            container: this._('#categories'),
            attribute: '@type',
            templates: {
                item(item, {html}) {
                    return html`
                        <div class="refinement-list-item refinement-list-item--categories">
                            <div class="refinement-list-item-inner">
                                <label class="refinement-list-item-checkbox">
                                    <input
                                        type="checkbox"
                                        class="custom-checkbox"
                                        aria-label="${item.label}"
                                        value="${item.value}"
                                        checked=${item.isRefined} />
                                </label>
                                <span class="refinement-list-item-name" title="${item.label}">
                                    ${item.label}
                                </span>
                            </div>
                            <span class="refinement-list-item-count">(${item.count})</span>
                        </div>
                    `;
                },
            },
        });
    }

    /**
     * Generate facets based on schema name
     * @param {string} schemaField - name of the schema field
     * @param {object} facetOptions - options for the panel and the facet
     * @returns {function(): *}
     */
    generateFacet(schemaField, facetOptions = {}) {
        const i18n = this._i18n;
        let that = this;

        const cssClass = this.schemaNameToKebabCase(schemaField);
        const translationKey = this.schemaNameToKebabCase(schemaField);

        console.log('cssClass: ', cssClass);

        return function () {
            const defaultPanelOptions = {
                templates: {
                    header(options, {html}) {
                        // console.log(options.items, options);
                        return i18n.t(`cabinet-search.filter-${translationKey}-title`);
                    },
                },
                collapsed: () => true,
                hidden(options) {
                    return options.items.length <= 1;
                },
            };
            const panelOptions = {
                ...defaultPanelOptions,
                ...(facetOptions.panel || {}),
            };

            const defaultRefinementListOptions = {
                container: that._(`#${cssClass}`),
                attribute: schemaField,
                sortBy: ['name:asc'],
                templates: {
                    item(item, {html, label, count, isRefined, value, parent }) {
                        // console.log('FIELD: ', schemaField, 'item: ', item);
                        return html`
                            <div class="refinement-list-item refinement-list-item--${cssClass}">
                                <div class="refinement-list-item-inner">
                                    <label class="refinement-list-item-checkbox">
                                        <input
                                            type="checkbox"
                                            class="custom-checkbox"
                                            aria-label="${item.label}"
                                            value="${item.value}"
                                            checked=${item.isRefined} />
                                    </label>
                                    <span class="refinement-list-item-name" title="${item.label}">
                                        ${item.label}
                                    </span>
                                </div>
                                <span class="refinement-list-item-count">(${item.count})</span>
                            </div>
                        `;
                    },
                },
                // transformItems(items, { results }) {
                //     console.log(items);
                //     console.log(results);
                //     return items.map((item) => {
                //         // console.log(item);
                //         // const parentItem = item.data.find((i) => i.value === item.value);
                //         return {
                //             ...item,
                //             // parent: parentItem?.parent,
                //         };
                //     });
                // },
            };
            const refinementListOptions = {
                ...defaultRefinementListOptions,
                ...(facetOptions.facet || {}),
            };

            const PanelWidget = panel(panelOptions)(refinementList);

            return PanelWidget(refinementListOptions);
        };
    }

    /**
     * Convert schema name to kebabCase for css classes and translation keys
     * @param input {string}
     * @returns {string}
     */
    schemaNameToKebabCase(input) {
        return input
            .split('.')
            .map((part) => part.replace(/([A-Z])/g, '-$1').toLowerCase())
            .join('-');
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
            
            .filter:has(> [hidden]) {
                display: none;
            }

            /* panel search */
            .ais-SearchBox-form {
                display: flex;
                gap: 0.25em;
                padding-top: 0.25em;
            }

            .ais-SearchBox-input {
                flex-grow: 1;
            }

            .ais-RefinementList-list {
                list-style: none;
                margin: 0;
                padding: 0.5em 0;
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
                padding: 0 0.25em;
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
                        <h3 class="filter-title">
                            ${i18n.t('cabinet-search.type-filter-group-title')}
                        </h3>
                        <div id="categories" class="filter filter--categories"></div>
                    </div>
                    <div id="person-filters" class="filter-group filter-group--person">
                        <h3 class="filter-title">
                            ${i18n.t('cabinet-search.person-filter-group-title')}
                        </h3>
                        <div id="base-person" class="filter filter--base-person"></div>
                        <div id="person-nationalities-text" class="filter filter--person-nationalities"></div>
                        <div id="person-admission-qualification-type-key" class="filter filter--person-admission-qualification-type"></div>
                        <div id="person-home-address-place" class="filter filter--person"></div>
                        <div id="person-stud-address-place" class="filter filter--person"></div>
                        <div id="person-stud-address-country-key" class="filter filter--person-stud-address-country"></div>
                        <div id="person-immatriculation-semester" class="filter filter--person-immatriculation-semester"></div>
                        <div id="person-exmatriculation-semester" class="filter filter--person-exmatriculation-semester"></div>
                        <div id="person-exmatriculation-status-key" class="filter filter--person-exmatriculation-status"></div>
                        <div id="person-academic-titles" class="filter filter--person-academic-titles"></div>
                        <div id="person-gender-key" class="filter filter--person-gender"></div>
                        <div id="person-studies-name" class="filter filter--person-studies-name"></div>
                        <div id="person-studies-type" class="filter filter--person-studies-type"></div>
                        <div id="person-applications-study-type" class="filter filter--person-applications-study"></div>
                    </div>
                    <div id="document-filters" class="filter-group filter-group--document">
                        <h3 class="filter-title">
                            ${i18n.t('cabinet-search.document-filter-group-title')}
                        </h3>
                        <div id="document-type" class="filter filter--document-type"></div>
                        <div id="file-base-additional-type" class="filter filter--file-base-additional-type"></div>
                        <div id="file-base-is-part-of" class="filter filter--file-is-part-of"></div>
                        <div id="file-base-study-field" class="filter filter--file-base-study-field"></div>
                        <div id="file-base-subject-of" class="filter filter--file-base-subject-of"></div>
                        <div id="file-citizenship-certificate-nationality" class="filter filter--file-citizenship-certificate-nationality"></div>
                        <div id="file-identity-document-nationality" class="filter filter--file-identity-document-nationality"></div>
                    </div>
                </div>
            </div>
        `;
    }
}
