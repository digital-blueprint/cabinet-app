import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import {css, html} from 'lit';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {Button} from '@dbp-toolkit/common';
import DBPCabinetLitElement from '../dbp-cabinet-lit-element.js';
// import {pascalToKebab} from '../utils';
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
        // const createCategoryRefinementList = this.generateFacet('@type', false);

        // Person facets
        const createBasePersonRefinementList = this.generateFacet(
            'base.person'
        );
        const createPersonNationalitiesRefinementList = this.generateFacet(
            'person.nationalities.text'
        );
        const createPersonAdmissionQualificationTypeKeyRefinementList = this.generateFacet(
            'person.admissionQualificationType.key',
        );
        const createPersonHomeAddressPlaceRefinementList = this.generateFacet(
            'person.homeAddress.place',
        );
        const createPersonStudAddressPlaceRefinementList = this.generateFacet(
            'person.studAddress.place',
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
            'person.academicTitles',
        );
        const createPersonGenderKeyRefinementList = this.generateFacet(
            'person.gender.key',
        );
        const createPersonStudiesNameRefinementList = this.generateFacet(
            'person.studies.name'
        );
        const createPersonStudiesTypeRefinementList = this.generateFacet(
            'person.studies.type',
        );
        const createPersonApplicationsStudyTypeRefinementList = this.generateFacet(
            'person.applications.studyType',
        );

        // File facets
        const createFileAdditionalTypeRefinementList = this.generateFacet(
            'file.base.additionalType'
        );
        const createFileBaseStudentLifeCyclePhaseRefinementList = this.generateFacet(
            'file.base.studentLifeCyclePhase',
        );
        const createFileBaseStudyFieldRefinementList = this.generateFacet(
            'file.base.studyField'
        );
        const createFileBaseSubjectOfRefinementList = this.generateFacet(
            'file.base.subjectOf',
        );
        const createFileCitizenshipCertificateNationalityRefinementList = this.generateFacet(
            'file.citizenshipCertificate.nationality',
        );
        const createFileIdentityDocumentNationalityRefinementList = this.generateFacet(
            'file.identityDocument.nationality',
        );

        this.search.addWidgets([
            this.createCategoryRefinementList(),
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

            createFileAdditionalTypeRefinementList(),
            createFileBaseStudentLifeCyclePhaseRefinementList(),
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

    generateFacet(schemaField) {
        const i18n = this._i18n;
        let that = this;

        const cssClass = this.schemaNameToKebabCase(schemaField);
        const translationKey = this.schemaNameToKebabCase(schemaField);
        // console.log('schemaField: ', schemaField);
        // console.log('cssClass: ', cssClass);
        // console.log('translationKey: ', translationKey);
        return function() {
            const GeneratedRefinementList = panel({
                templates: {
                    header(options, { html }) {
                        return i18n.t(`cabinet-search.filter-${translationKey}-title`);
                    },
                },
                collapsed: () => true,
            })(refinementList);

            return GeneratedRefinementList({
                container: that._(`#${cssClass}`),
                attribute: schemaField,
                templates: {
                    item(item, {html}) {
                        // console.log(`${schemaField}: `, item);
                        return html`
                    <div class="refinement-list-item refinement-list-item--${cssClass}">
                        <div class="refinement-list-item-inner">
                            <label class="refinement-list-item-checkbox">
                                <input type="checkbox" class="custom-checkbox" aria-label="${item.label}" value="${item.value}" ?checked=${item.isRefined} />
                            </label>
                            <span class="refinement-list-item-name" title="${item.label}">${item.label}</span>
                        </div>
                        <span class="refinement-list-item-count">(${item.count})</span>
                    </div>
                    `;
                    }
                },
            });
        };
    }

    schemaNameToKebabCase(input) {
        return input
            .split('.')
            .map(part => part.replace(/([A-Z])/g, '-$1').toLowerCase())
            .join('-')
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
                        <div id="person-nationalities-text" class="filter filter--person-nationalities-text"></div>
                        <div id="person-admission-qualification-type-key" class="filter filter--person"></div>
                        <div id="person-home-address-place" class="filter filter--person"></div>
                        <div id="person-stud-address-place" class="filter filter--person"></div>
                        <div id="person-stud-address-country-key" class="filter filter--person"></div>
                        <div id="person-immatriculation-semester" class="filter filter--person"></div>
                        <div id="person-exmatriculation-semester" class="filter filter--person"></div>
                        <div id="person-exmatriculation-status-key" class="filter filter--person"></div>
                        <div id="person-academic-titles" class="filter filter--person"></div>
                        <div id="person-gender-key" class="filter filter--person"></div>
                        <div id="person-studies-name" class="filter filter--person-studies-name"></div>
                        <div id="person-studies-type" class="filter filter--person"></div>
                        <div id="person-applications-study-type" class="filter filter--person"></div>
                    </div>
                    <div id="document-filters" class="filter-group filter-group--document">
                        <h3 class="filter-title">${i18n.t('cabinet-search.document-filter-group-title')}</h3>
                        <div id="document-type" class="filter filter--document-type"></div>
                        <div id="file-base-additional-type" class="filter filter--file-base-additional-type"></div>
                        <div id="file-base-student-life-cycle-phase" class="filter filter--file-"></div>
                        <div id="file-base-study-field" class="filter filter--file-base-study-field"></div>
                        <div id="file-base-subject-of" class="filter filter--file-"></div>
                        <div id="file-citizenship-certificate-nationality" class="filter filter--file-citizenship-certificate-nationality"></div>
                        <div id="file-identity-document-nationality" class="filter filter--file-identity-document-nationality"></div>
                    </div>
                </div>
            </div>
        `;
    }
}
