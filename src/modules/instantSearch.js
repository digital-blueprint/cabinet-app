import {createInstance} from '../i18n.js';

// Dummy function to make translations
function t(key) {
    return key;
}

function translationRenderFunction(i18n, schemaField, value, operator = null) {
    let text = i18n.t(`typesense-schema.${schemaField}.${value}`, value);
    return text;
}

function _renderDate(i18n, value, operator, timeZone = undefined) {
    let date = new Date(value * 1000).toLocaleDateString('de-AT', {
        timeZone: timeZone,
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

function datePickerLocalRenderFunction(i18n, schemaField, value, operator) {
    return _renderDate(i18n, value, operator);
}

function datePickerUTCRenderFunction(i18n, schemaField, value, operator) {
    return _renderDate(i18n, value, operator, 'UTC');
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
     * @param lang
     * @returns {Array} - Array of search facets config
     */
    getFacetsConfig(lang = 'de') {
        const showMoreLimitValue = 50;

        const selectField = (parentField) => {
            return lang === 'de' ? `${parentField}.text` : `${parentField}.textEn`;
        };

        return [
            {'filter-group': {id: 'category', name: t('cabinet-search.type-filter-group-title')}},
            {
                id: '@type',
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
                id: 'person.person',
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
                id: 'person.birthDateTimestamp',
                groupId: 'person',
                schemaField: 'person.birthDateTimestamp',
                name: t('cabinet-search.filter-person-birth-date-timestamp-title'),
                schemaFieldType: 'datepicker',
                renderFunction: datePickerUTCRenderFunction,
                facetOptions: {
                    facet: {
                        inputIsUtc: true,
                    },
                },
            },
            {
                id: 'person.personalStatus',
                groupId: 'person',
                schemaField: selectField('person.personalStatus'),
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
                id: 'person.studentStatus',
                groupId: 'person',
                schemaField: selectField('person.studentStatus'),
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
                id: 'person.exmatriculationStatus',
                groupId: 'person',
                schemaField: selectField('person.exmatriculationStatus'),
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
                id: 'person.admissionQualificationType',
                groupId: 'person',
                schemaField: selectField('person.admissionQualificationType'),
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
                id: 'person.nationalities',
                groupId: 'person',
                schemaField: selectField('person.nationalities'),
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
                id: 'person.gender',
                groupId: 'person',
                schemaField: selectField('person.gender'),
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-person-gender-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                    },
                },
            },
            {
                id: 'person.immatriculationSemester',
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
                id: 'person.exmatriculationSemester',
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
                id: 'person.homeAddress.country',
                groupId: 'person',
                schemaField: selectField('person.homeAddress.country'),
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
                id: 'person.homeAddress.region',
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
                id: 'person.homeAddress.place',
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
                id: 'person.studyAddress.country',
                groupId: 'person',
                schemaField: selectField('person.studyAddress.country'),
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
                id: 'person.studyAddress.region',
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
                id: 'person.studyAddress.place',
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
                id: 'person.study.name',
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
                id: 'person.study.type',
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
                id: 'person.study.status',
                groupId: 'person',
                schemaField: selectField('study.status'),
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
                id: 'file.base.additionalType',
                groupId: 'file',
                schemaField: 'file.base.additionalType.key',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-additional-type-text-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.createdTimestamp',
                groupId: 'file',
                schemaField: 'file.base.createdTimestamp',
                schemaFieldType: 'datepicker',
                name: t('cabinet-search.filter-file-base-created-timestamp-title'),
                renderFunction: datePickerLocalRenderFunction,
            },
            {
                id: 'file.base.recommendedDeletionTimestamp',
                groupId: 'file',
                schemaField: 'file.base.recommendedDeletionTimestamp',
                schemaFieldType: 'datepicker',
                name: t('cabinet-search.filter-file-base-recommended-deletion-timestamp-title'),
                renderFunction: datePickerLocalRenderFunction,
            },
            {
                id: 'file.base.fileSource',
                groupId: 'file',
                schemaField: 'file.base.fileSource',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-file-source-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.studyField',
                groupId: 'file',
                schemaField: selectField('file.base.studyField'),
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-base-study-field-name-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.semester',
                groupId: 'file',
                schemaField: 'file.base.semester',
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-base-semester-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.isPartOf',
                groupId: 'file',
                schemaField: 'file.base.isPartOf',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-base-is-part-of-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.file-cabinet-admissionNotice.decision',
                groupId: 'file',
                schemaField: 'file.file-cabinet-admissionNotice.decision',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: t('cabinet-search.filter-file-file-cabinet-admission-notice-decision-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.shared.nationality',
                groupId: 'file',
                schemaField: selectField('file.shared.nationality'),
                schemaFieldType: 'checkbox',
                name: t('cabinet-search.filter-file-file-shared-nationality-title'),
                facetOptions: {facet: {searchable: true}},
            },
        ];
    }

    /**
     * Get available columns for person type in selection dialogs
     * @returns {Array} - Array of column configurations
     */
    getPersonColumns() {
        // Use t() to ensure i18next detects these keys and doesn't remove them during tree-shaking
        return [
            {
                id: 'person.studId',
                name: t('selection-column-config.person.studId'),
                field: 'person.studId',
                defaultVisible: true,
            },
            {
                id: 'person.stPersonNr',
                name: t('selection-column-config.person.stPersonNr'),
                field: 'person.stPersonNr',
                defaultVisible: true,
            },
            {
                id: 'person.givenName',
                name: t('selection-column-config.person.givenName'),
                field: 'person.givenName',
                defaultVisible: true,
            },
            {
                id: 'person.familyName',
                name: t('selection-column-config.person.familyName'),
                field: 'person.familyName',
                defaultVisible: true,
            },
            {
                id: 'person.birthDate',
                name: t('selection-column-config.person.birthDate'),
                field: 'person.birthDate',
                defaultVisible: true,
            },
            {
                id: 'person.nationality',
                name: t('selection-column-config.person.nationality'),
                field: 'person.nationality.text',
                defaultVisible: false,
            },
            {
                id: 'person.personalStatus',
                name: t('selection-column-config.person.personalStatus'),
                field: 'person.personalStatus.text',
                defaultVisible: false,
            },
            {
                id: 'person.studentStatus',
                name: t('selection-column-config.person.studentStatus'),
                field: 'person.studentStatus.text',
                defaultVisible: false,
            },
            {
                id: 'person.emailAddressUniversity',
                name: t('selection-column-config.person.emailAddressUniversity'),
                field: 'person.emailAddressUniversity',
                defaultVisible: false,
            },
        ];
    }

    /**
     * Get available columns for document type in selection dialogs
     * @returns {Array} - Array of column configurations
     */
    getDocumentColumns() {
        // Use t() to ensure i18next detects these keys and doesn't remove them during tree-shaking
        return [
            {
                id: 'file.base.additionalType',
                name: t('selection-column-config.document.additionalType'),
                field: 'file.base.additionalType.text',
                defaultVisible: true,
            },
            {
                id: 'person.familyName',
                name: t('selection-column-config.document.person.familyName'),
                field: 'person.familyName',
                defaultVisible: true,
            },
            {
                id: 'person.givenName',
                name: t('selection-column-config.document.person.givenName'),
                field: 'person.givenName',
                defaultVisible: true,
            },
            {
                id: 'person.studId',
                name: t('selection-column-config.document.person.studId'),
                field: 'person.studId',
                defaultVisible: true,
            },
            {
                id: 'file.base.createdTimestamp',
                name: t('selection-column-config.document.createdTimestamp'),
                field: 'file.base.createdTimestamp',
                defaultVisible: false,
            },
            {
                id: 'file.base.modifiedTimestamp',
                name: t('selection-column-config.document.modifiedTimestamp'),
                field: 'file.base.modifiedTimestamp',
                defaultVisible: false,
            },
            {
                id: 'file.base.studyField',
                name: t('selection-column-config.document.studyField'),
                field: 'file.base.studyField.text',
                defaultVisible: false,
            },
            {
                id: 'file.base.semester',
                name: t('selection-column-config.document.semester'),
                field: 'file.base.semester',
                defaultVisible: false,
            },
        ];
    }
}
