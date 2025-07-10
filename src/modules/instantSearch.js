import {createInstance} from '../i18n.js';

// Dummy function to make translations
function t(key) {
    return key;
}

function translationRenderFunction(i18n, schemaField, value, operator = null) {
    let text = i18n.t(`typesense-schema.${schemaField}.${value}`, value);
    return text;
}

function datePickerRenderFunction(i18n, schemaField, value, operator = null) {
    let date = new Date(value * 1000).toLocaleDateString('de-AT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    let operatorLabel =
        operator === '>='
            ? i18n.t('cabinet-search.refinement-date-after-text')
            : i18n.t('cabinet-search.refinement-date-before-text');
    return `${operatorLabel} ${date}`;
}

export default class InstantSearchModule {
    constructor() {
        this._i18n = createInstance();
        this.lang = this._i18n.language;
    }

    /**
     * Customize facets config. These attributes are merged with the default config.
     * Each configuration object in the returned array can have the following properties:
     *
     *  filter-group: An object defining a filter group.
     *  id: A unique identifier for the filter group.
     *  name: The translation key used as title of the filter group.
     *  groupId: A name of the group ID to which the schema field belongs.
     *  schemaField: The typesense schema field to be used for the facet.
     *  schemaFieldType: The type of the facet (e.g., "checkbox", "datepicker").
     *  renderFunction: A function to render the facet value, which can be used for translations.
     *  facetOptions: An object containing options for the facet.
     *  facet: An object to override facet options.
     *  - facet options: https://www.algolia.com/doc/api-reference/widgets/refinement-list/js/
     *  usePanel: A boolean indicating whether to use a panel for the facet (optional, defaults to true).
     *  hidden: A boolean indicating whether the facet should be hidden (optional, defaults to false).
     * @returns {Array} - Array of search facets config
     */
    getFacetsConfig() {
        const showMoreLimitValue = 50;
        return [
            {'filter-group': {id: 'category', name: t('cabinet-search.type-filter-group-title')}},
            {
                groupId: 'category',
                schemaField: '@type',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-type-title'),
                renderFunction: translationRenderFunction,
                facetOptions: {
                    facet: {
                        searchable: false,
                        sortBy: ['name:desc'],
                    },
                },
                usePanel: false,
            },
            // Person properties
            {'filter-group': {id: 'person', name: t('cabinet-search.person-filter-group-title')}},
            {
                groupId: 'person',
                schemaField: 'person.person',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-person-title'),
                hidden: true,
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.birthDateTimestamp',
                name: t('cabinet-search.filter-person-birth-date-timestamp-title'),
                schemaFieldType: 'datepicker',
                renderFunction: datePickerRenderFunction,
            },
            {
                groupId: 'person',
                schemaField: 'person.personalStatus.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-personal-status-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.studentStatus.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-student-status-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.exmatriculationStatus.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-exmatriculation-status-text-title'),
                facetOptions: {
                    facet: {
                        showMore: false,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.admissionQualificationType.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-admission-qualification-type-text-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.nationalities.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-nationalities-text-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.gender.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-gender-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.immatriculationSemester',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-immatriculation-semester-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.exmatriculationSemester',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-exmatriculation-semester-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.homeAddress.country.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-home-address-country-text-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.homeAddress.region',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-home-address-region-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.homeAddress.place',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-home-address-place-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.studyAddress.country.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-study-address-country-text-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.studyAddress.region',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-study-address-region-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'person.studyAddress.place',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-study-address-place-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'study.name',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-study-name-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'study.type',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-study-type-title'),
                facetOptions: {
                    facet: {
                        showMore: true,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            {
                groupId: 'person',
                schemaField: 'study.status.text',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-study-status-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            // Document properties
            {'filter-group': {id: 'file', name: t('cabinet-search.document-filter-group-title')}},
            {
                groupId: 'file',
                schemaField: 'file.base.additionalType.key',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-additional-type-text-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.base.createdTimestamp',
                schemaFieldType: 'datepicker',
                name: t('cabinet-search.filter-file-base-created-timestamp-title'),
                renderFunction: datePickerRenderFunction,
            },
            {
                groupId: 'file',
                schemaField: 'file.base.recommendedDeletionTimestamp',
                schemaFieldType: 'datepicker',
                name: t('cabinet-search.filter-file-base-recommended-deletion-timestamp-title'),
                renderFunction: datePickerRenderFunction,
            },
            {
                groupId: 'file',
                schemaField: 'file.base.fileSource',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-file-source-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.base.studyFieldName',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-base-study-field-name-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.base.semester',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-base-semester-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.base.isPartOf',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-is-part-of-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.base.subjectOf',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-base-subject-of-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.file-cabinet-admissionNotice.decision',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-file-cabinet-admission-notice-decision-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                groupId: 'file',
                schemaField: 'file.file-cabinet-identityDocument.nationalityText',
                schemaFieldType: 'checkbox',
                name: t(
                    'cabinet-search.filter-file-file-cabinet-identity-document-nationality-title',
                ),
                facetOptions: {facet: {searchable: true}},
            },
        ];
    }
}
