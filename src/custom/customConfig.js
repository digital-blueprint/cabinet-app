import {createInstance} from './i18n.js';

function translationRenderFunction(lang, schemaField, value, operator = null) {
    let i18n = createInstance();
    i18n.changeLanguage(lang);
    return i18n.t(`custom:typesense-schema.${schemaField}.${value}`, value);
}

function _renderDate(lang, value, operator, timeZone = undefined) {
    let i18n = createInstance();
    i18n.changeLanguage(lang);
    let date = new Date(value * 1000).toLocaleDateString('de-AT', {
        timeZone: timeZone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    if (operator === undefined) {
        return `${date}`;
    }
    let operatorLabel =
        operator === '>='
            ? i18n.t('custom:cabinet-search.refinement-date-after-text')
            : i18n.t('custom:cabinet-search.refinement-date-before-text');
    return `${operatorLabel} ${date}`;
}

function renderDateForExport(lang, schemaField, value) {
    let date = new Date(value * 1000).toLocaleString(lang);
    return `${date}`;
}

function datePickerLocalRenderFunction(lang, schemaField, value, operator) {
    return _renderDate(lang, value, operator);
}

function datePickerUTCRenderFunction(lang, schemaField, value, operator) {
    return _renderDate(lang, value, operator, 'UTC');
}

export default class CabinetConfig {
    constructor() {
        this._i18n = createInstance();
        this.lang = this._i18n.language;
    }

    /**
     * Returns an array of all available object type names.
     * @returns {string[]}
     */
    getDocumentObjectTypeNames() {
        return [
            'file-admission-notice',
            'file-cabinet-communication',
            'file-cabinet-identityDocument',
            'file-cabinet-minimalSchema',
            'file-cabinet-citizenshipCertificate',
            'file-cabinet-englMasterApplication',
            'file-cabinet-englMasterDataSheet',
            'file-cabinet-entranceQualificationApplication',
            'file-cabinet-entranceQualificationRecognition',
        ];
    }

    getPersonObjectTypeName() {
        return 'person';
    }

    /**
     * Dynamically loads and instantiates the object type for the given name.
     * @param {string} name
     * @returns {Promise<BaseObject>}
     */
    async loadObjectType(name) {
        let module;
        switch (name) {
            case 'file-admission-notice':
                module = await import('./objectTypes/fileAdmissionNotice.js');
                break;
            case 'file-cabinet-communication':
                module = await import('./objectTypes/fileCommunication.js');
                break;
            case 'file-cabinet-identityDocument':
                module = await import('./objectTypes/fileIdentityDocument.js');
                break;
            case 'file-cabinet-minimalSchema':
                module = await import('./objectTypes/fileMinimalSchema.js');
                break;
            case 'file-cabinet-citizenshipCertificate':
                module = await import('./objectTypes/fileCitizenshipCertificate.js');
                break;
            case 'file-cabinet-englMasterApplication':
                module = await import('./objectTypes/fileEnglMasterApplication.js');
                break;
            case 'file-cabinet-englMasterDataSheet':
                module = await import('./objectTypes/fileEnglMasterDataSheet.js');
                break;
            case 'file-cabinet-entranceQualificationApplication':
                module = await import('./objectTypes/fileEntranceQualificationApplication.js');
                break;
            case 'file-cabinet-entranceQualificationRecognition':
                module = await import('./objectTypes/fileEntranceQualificationRecognition.js');
                break;
            case 'person':
                module = await import('./objectTypes/person.js');
                break;
            default:
                throw new Error(`Unknown object type: ${name}`);
        }
        return new module.default();
    }

    /**
     * Returns the Typesense sort_by spec string for the given language.
     * @param {string} lang
     * @returns {string}
     */
    getSortSpec(lang) {
        return lang === 'de'
            ? 'sortKey:asc,sortKey2:asc,sortKey3:desc'
            : 'sortKey:asc,sortKey2En:asc,sortKey3:desc';
    }

    async generateExportPersonPdf(hit, lang, withInternalData = false) {
        let module = await import('./objectTypes/export.js');
        this._i18n.changeLanguage(lang);
        return await module.generateExportPersonPdf(this._i18n, hit, withInternalData);
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
     *  localized: Set automatically for `selectField` facets; marks a facet
     *    whose value is language-dependent so the search requests
     *    `facet_return_parent` and the parent object (with the other language's
     *    value) is returned, allowing selections to survive a language change.
     * @param lang
     * @returns {Array} - Array of search facets config
     */
    getFacetsConfig(lang = 'de') {
        const showMoreLimitValue = 50;

        let i18n = this._i18n;
        i18n.changeLanguage(lang);

        // A "select field" is a localized leaf (`.text`/`.textEn`) of a parent
        // object that also holds the other language's value. Facets built with
        // it are flagged with `localized: true` (see the post-pass below) so
        // we can request `facet_return_parent` for them.
        const parentTextFields = new Set();
        const selectField = (parentField) => {
            const field = lang === 'de' ? `${parentField}.text` : `${parentField}.textEn`;
            parentTextFields.add(field);
            return field;
        };

        const facetsConfig = [
            {
                'filter-group': {
                    id: 'category',
                    name: i18n.t('custom:cabinet-search.type-filter-group-title'),
                },
            },
            {
                id: '@type',
                groupId: 'category',
                schemaField: '@type',
                schemaFieldType: 'checkbox',
                name: i18n.t('custom:cabinet-search.filter-type-title'),
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
            {
                'filter-group': {
                    id: 'person',
                    name: i18n.t('custom:cabinet-search.person-filter-group-title'),
                },
            },
            {
                id: 'person.person',
                groupId: 'person',
                schemaField: 'person.person',
                schemaFieldType: 'checkbox',
                name: i18n.t('custom:cabinet-search.filter-person-person-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-birth-date-timestamp-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-personal-status-text-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-student-status-text-title'),
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
                name: i18n.t(
                    'custom:cabinet-search.filter-person-exmatriculation-status-text-title',
                ),
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
                name: i18n.t(
                    'custom:cabinet-search.filter-person-admission-qualification-type-text-title',
                ),
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
                name: i18n.t('custom:cabinet-search.filter-person-nationalities-text-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-gender-text-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-immatriculation-semester-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-exmatriculation-semester-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-home-address-country-text-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-home-address-region-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-home-address-place-title'),
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
                name: i18n.t(
                    'custom:cabinet-search.filter-person-study-address-country-text-title',
                ),
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
                name: i18n.t('custom:cabinet-search.filter-person-study-address-region-title'),
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
                name: i18n.t('custom:cabinet-search.filter-person-study-address-place-title'),
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
                name: i18n.t('custom:cabinet-search.filter-study-name-title'),
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
                name: i18n.t('custom:cabinet-search.filter-study-type-title'),
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
                name: i18n.t('custom:cabinet-search.filter-study-status-text-title'),
                facetOptions: {
                    facet: {
                        searchable: false,
                        showMoreLimit: showMoreLimitValue,
                    },
                },
            },
            // Document properties
            {
                'filter-group': {
                    id: 'file',
                    name: i18n.t('custom:cabinet-search.document-filter-group-title'),
                },
            },
            {
                id: 'file.base.additionalType',
                groupId: 'file',
                schemaField: 'file.base.additionalType.key',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: i18n.t('custom:cabinet-search.filter-file-base-additional-type-text-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.createdTimestamp',
                groupId: 'file',
                schemaField: 'file.base.createdTimestamp',
                schemaFieldType: 'datepicker',
                name: i18n.t('custom:cabinet-search.filter-file-base-created-timestamp-title'),
                renderFunction: datePickerLocalRenderFunction,
            },
            {
                id: 'file.base.recommendedDeletionTimestamp',
                groupId: 'file',
                schemaField: 'file.base.recommendedDeletionTimestamp',
                schemaFieldType: 'datepicker',
                name: i18n.t(
                    'custom:cabinet-search.filter-file-base-recommended-deletion-timestamp-title',
                ),
                renderFunction: datePickerLocalRenderFunction,
            },
            {
                id: 'file.base.fileSource',
                groupId: 'file',
                schemaField: 'file.base.fileSource',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: i18n.t('custom:cabinet-search.filter-file-base-file-source-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.studyField',
                groupId: 'file',
                schemaField: selectField('file.base.studyField'),
                schemaFieldType: 'checkbox',
                name: i18n.t('custom:cabinet-search.filter-file-base-study-field-name-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.semester',
                groupId: 'file',
                schemaField: 'file.base.semester',
                schemaFieldType: 'checkbox',
                name: i18n.t('custom:cabinet-search.filter-file-base-semester-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.base.isPartOf',
                groupId: 'file',
                schemaField: 'file.base.isPartOf',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: i18n.t('custom:cabinet-search.filter-file-base-is-part-of-title'),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.file-cabinet-admissionNotice.decision',
                groupId: 'file',
                schemaField: 'file.file-cabinet-admissionNotice.decision',
                schemaFieldType: 'checkbox',
                renderFunction: translationRenderFunction,
                name: i18n.t(
                    'custom:cabinet-search.filter-file-file-cabinet-admission-notice-decision-title',
                ),
                facetOptions: {facet: {searchable: false}},
            },
            {
                id: 'file.shared.nationality',
                groupId: 'file',
                schemaField: selectField('file.shared.nationality'),
                schemaFieldType: 'checkbox',
                name: i18n.t('custom:cabinet-search.filter-file-file-shared-nationality-title'),
                facetOptions: {facet: {searchable: true}},
            },
        ];

        // Flag facets whose value is language-dependent, so the search can
        // request `facet_return_parent` for them.
        for (const facetConfig of facetsConfig) {
            if (parentTextFields.has(facetConfig.schemaField)) {
                facetConfig.localized = true;
            }
        }

        return facetsConfig;
    }

    /**
     * Get available columns for person type in selection dialogs
     * @param lang
     * @returns {Array} - Array of column configurations
     */
    getPersonColumns(lang = 'de') {
        let i18n = this._i18n;
        i18n.changeLanguage(lang);
        return [
            {
                id: 'person.studId',
                name: i18n.t('custom:selection-column-config.person.studId'),
                field: 'person.studId',
                defaultVisible: true,
            },
            {
                id: 'person.stPersonNr',
                name: i18n.t('custom:selection-column-config.person.stPersonNr'),
                field: 'person.stPersonNr',
                defaultVisible: true,
            },
            {
                id: 'person.givenName',
                name: i18n.t('custom:selection-column-config.person.givenName'),
                field: 'person.givenName',
                defaultVisible: true,
            },
            {
                id: 'person.familyName',
                name: i18n.t('custom:selection-column-config.person.familyName'),
                field: 'person.familyName',
                defaultVisible: true,
            },
            {
                id: 'person.birthDate',
                name: i18n.t('custom:selection-column-config.person.birthDate'),
                field: 'person.birthDate',
                defaultVisible: true,
            },
            {
                id: 'person.nationality',
                name: i18n.t('custom:selection-column-config.person.nationality'),
                field: 'person.nationality.text',
                defaultVisible: true,
            },
            {
                id: 'person.personalStatus',
                name: i18n.t('custom:selection-column-config.person.personalStatus'),
                field: 'person.personalStatus.text',
                defaultVisible: false,
            },
            {
                id: 'person.studentStatus',
                name: i18n.t('custom:selection-column-config.person.studentStatus'),
                field: 'person.studentStatus.text',
                defaultVisible: false,
            },
            {
                id: 'person.exmatriculationStatus',
                name: i18n.t('custom:selection-column-config.person.exmatriculationStatus'),
                field: 'person.exmatriculationStatus.text',
                defaultVisible: false,
            },
            {
                id: 'person.admissionQualificationType',
                name: i18n.t('custom:selection-column-config.person.admissionQualificationType'),
                field: 'person.admissionQualificationType.text',
                defaultVisible: false,
            },
            {
                id: 'person.nationalities',
                name: i18n.t('custom:selection-column-config.person.nationalities'),
                field: 'person.nationalities.text',
                defaultVisible: false,
            },
            {
                id: 'person.gender',
                name: i18n.t('custom:selection-column-config.person.gender'),
                field: 'person.gender.text',
                defaultVisible: false,
            },
            {
                id: 'person.immatriculationSemester',
                name: i18n.t('custom:selection-column-config.person.immatriculationSemester'),
                field: 'person.immatriculationSemester',
                defaultVisible: false,
            },
            {
                id: 'person.exmatriculationSemester',
                name: i18n.t('custom:selection-column-config.person.exmatriculationSemester'),
                field: 'person.exmatriculationSemester',
                defaultVisible: false,
            },
            {
                id: 'person.homeAddress.country',
                name: i18n.t('custom:selection-column-config.person.homeAddress.country'),
                field: 'person.homeAddress.country.text',
                defaultVisible: false,
            },
            {
                id: 'person.homeAddress.region',
                name: i18n.t('custom:selection-column-config.person.homeAddress.region'),
                field: 'person.homeAddress.region',
                defaultVisible: false,
            },
            {
                id: 'person.homeAddress.place',
                name: i18n.t('custom:selection-column-config.person.homeAddress.place'),
                field: 'person.homeAddress.place',
                defaultVisible: false,
            },
            {
                id: 'person.studyAddress.country',
                name: i18n.t('custom:selection-column-config.person.studyAddress.country'),
                field: 'person.studyAddress.country.text',
                defaultVisible: false,
            },
            {
                id: 'person.studyAddress.region',
                name: i18n.t('custom:selection-column-config.person.studyAddress.region'),
                field: 'person.studyAddress.region',
                defaultVisible: false,
            },
            {
                id: 'person.studyAddress.place',
                name: i18n.t('custom:selection-column-config.person.studyAddress.place'),
                field: 'person.studyAddress.place',
                defaultVisible: false,
            },
            {
                id: 'person.emailAddressUniversity',
                name: i18n.t('custom:selection-column-config.person.emailAddressUniversity'),
                field: 'person.emailAddressUniversity',
                defaultVisible: false,
            },
            {
                id: 'person.study.name',
                name: i18n.t('custom:selection-column-config.person.study.name'),
                field: 'study.name',
                defaultVisible: false,
            },
            {
                id: 'person.study.type',
                name: i18n.t('custom:selection-column-config.person.study.type'),
                field: 'study.type',
                defaultVisible: false,
            },
            {
                id: 'person.study.status',
                name: i18n.t('custom:selection-column-config.person.study.status'),
                field: 'study.status.text',
                defaultVisible: false,
            },
        ];
    }

    /**
     * Get available columns for document type in selection dialogs
     * @param lang
     * @returns {Array} - Array of column configurations
     */
    getDocumentColumns(lang = 'de') {
        const selectField = (parentField) => {
            return lang === 'de' ? `${parentField}.text` : `${parentField}.textEn`;
        };
        let i18n = this._i18n;
        i18n.changeLanguage(lang);
        return [
            {
                id: 'file.base.additionalType',
                name: i18n.t('custom:selection-column-config.document.additionalType'),
                field: selectField('file.base.additionalType'),
                defaultVisible: true,
                renderFunction: translationRenderFunction,
            },
            {
                id: 'person.familyName',
                name: i18n.t('custom:selection-column-config.person.familyName'),
                field: 'person.familyName',
                defaultVisible: true,
            },
            {
                id: 'person.givenName',
                name: i18n.t('custom:selection-column-config.person.givenName'),
                field: 'person.givenName',
                defaultVisible: true,
            },
            {
                id: 'file.base.createdTimestamp',
                name: i18n.t('custom:selection-column-config.document.createdTimestamp'),
                field: 'file.base.createdTimestamp',
                defaultVisible: true,
                renderFunction: renderDateForExport,
            },
            {
                id: 'file.base.modifiedTimestamp',
                name: i18n.t('custom:selection-column-config.document.modifiedTimestamp'),
                field: 'file.base.modifiedTimestamp',
                defaultVisible: false,
                renderFunction: renderDateForExport,
            },
            {
                id: 'file.base.recommendedDeletionTimestamp',
                name: i18n.t(
                    'custom:selection-column-config.document.recommendedDeletionTimestamp',
                ),
                field: 'file.base.recommendedDeletionTimestamp',
                defaultVisible: true,
                renderFunction: renderDateForExport,
            },
            {
                id: 'file.base.studyField',
                name: i18n.t('custom:selection-column-config.document.studyField'),
                field: selectField('file.base.studyField'),
                defaultVisible: true,
            },
            {
                id: 'file.base.semester',
                name: i18n.t('custom:selection-column-config.document.semester'),
                field: 'file.base.semester',
                defaultVisible: true,
            },
            {
                id: 'file.base.fileSource',
                name: i18n.t('custom:selection-column-config.document.fileSource'),
                field: 'file.base.fileSource',
                defaultVisible: true,
                renderFunction: translationRenderFunction,
            },
            {
                id: 'file.base.disposalType',
                name: i18n.t('custom:selection-column-config.document.disposalType'),
                field: 'file.base.disposalType',
                defaultVisible: false,
                renderFunction: translationRenderFunction,
            },
            {
                id: 'file.base.isPartOf',
                name: i18n.t('custom:selection-column-config.document.isPartOf'),
                field: 'file.base.isPartOf',
                defaultVisible: true,
                renderFunction: translationRenderFunction,
            },
            {
                id: 'file.base.comment',
                name: i18n.t('custom:selection-column-config.document.comment'),
                field: 'file.base.comment',
                defaultVisible: false,
            },
            {
                id: 'file.base.subjectOf',
                name: i18n.t('custom:selection-column-config.document.subjectOf'),
                field: 'file.base.subjectOf',
                defaultVisible: true,
            },
        ];
    }
}
