import {createInstance} from '../i18n.js';

export default class {
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
     *  schemaField: A the typesense schema field to be used for the facet.
     *  schemaFieldType: The type of the facet (e.g., "checkbox", "datepicker").
     *  facetOptions: An object containing options for the facet.
     *  facet: An object to override facet options.
     *  - facet options: https://www.algolia.com/doc/api-reference/widgets/refinement-list/js/
     *  panel: An object to override panel options.
     *  - panel options: https://www.algolia.com/doc/api-reference/widgets/panel/js/
     *  usePanel: A boolean indicating whether to use a panel for the facet (optional).
     * @returns {Array} - Array of search facets config
     */
    getFacetsConfig() {
        const showMoreLimitValue = 1000;
        return [
            { "filter-group": { "id": "category", "name": "cabinet-search.type-filter-group-title"}},
            { "groupId": "category", "schemaField": "@type", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-person', searchable: false, sortBy: ['alpha:asc']}}, "usePanel": false},

            // Person properties
            { "filter-group": { "id": "person", "name": "cabinet-search.person-filter-group-title"}},
            { "groupId": "person", "schemaField": "person.person", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-person',  showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.birthDateTimestamp", "schemaFieldType": "datepicker"},
            { "groupId": "person", "schemaField": "person.personalStatus.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-personal-status-text', searchable: false, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studentStatus.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-status-text', searchable: false, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.exmatriculationStatus.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-status', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.admissionQualificationType.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-admission-qualification-type', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.nationalities.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-nationalities-text', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.gender.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-gender', searchable: false}}},
            { "groupId": "person", "schemaField": "person.immatriculationSemester", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-immatriculation-semester', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.exmatriculationSemester", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-semester', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.homeAddress.country.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address-country-text', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.homeAddress.region", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address-region', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.homeAddress.place", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address-place', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studyAddress.region", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address-region', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studyAddress.place", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address-place', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studyAddress.country.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address-country', showMore: true, showMoreLimit: showMoreLimitValue}}},

            // Study field properties
            { "filter-group": { "id": "study", "name": "cabinet-search.study-filter-group-title"}},
            { "groupId": "study", "schemaField": "study.name", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-study-name', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "study", "schemaField": "study.type", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-study-type', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "study", "schemaField": "study.status.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-study-status-text', searchable: false,  showMoreLimit: showMoreLimitValue}}},

            // Document properties
            { "filter-group": { "id": "file", "name": "cabinet-search.document-filter-group-title"}},
            { "groupId": "file", "schemaField": "file.base.additionalType.text", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.createdTimestamp", "schemaFieldType": "datepicker"},
            { "groupId": "file", "schemaField": "file.base.recommendedDeletionTimestamp", "schemaFieldType": "datepicker"},
            { "groupId": "file", "schemaField": "file.base.fileSource", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.studyFieldName", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.semester", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.isPartOf", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.subjectOf", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.file-cabinet-admissionNotice.decision", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.file-cabinet-citizenshipCertificate.nationality", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}},
            { "groupId": "file", "schemaField": "file.file-cabinet-identityDocument.nationality", "schemaFieldType": "checkbox", "facetOptions": { facet: { searchable: false}}}
        ];
    }
}
