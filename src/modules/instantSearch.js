import {createInstance} from '../i18n.js';
// import {CabinetFacets} from '../components/dbp-cabinet-facets.js';

export default class {

    constructor() {
        this._i18n = createInstance();
        this.lang = this._i18n.language;
    }

    /**
     * Customize facets config. These attributes are merged with the default config.
     * @returns {Array} - Array of search facets config
     */
    getFacetsConfig() {
        const showMoreLimitValue = 30;
        return [
            { "filter-group": { "id": "category", "name": "cabinet-search.type-filter-group-title"}},
            { "groupId": "category", "schemaField": "@type", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-base-person', searchable: false, sortBy: ['alpha:asc']}}, "usePanel": false},
            { "filter-group": { "id": "person", "name": "cabinet-search.person-filter-group-title"}},
            { "groupId": "person", "schemaField": "base.person", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-base-person',  showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "base.birthDate", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-base-birth-date'}}},
            { "groupId": "person", "schemaField": "person.studies.name", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-studies-name', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studies.type", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-studies-type', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.personalStatus.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-personal-status-text', searchable: false, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studentStatus.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-status-text', searchable: false, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.exmatriculationStatus.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-status', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studies.status.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-studies-status-text', searchable: false,  showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.admissionQualificationType.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-admission-qualification-type', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.nationalities.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-nationalities-text', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.gender.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-gender', searchable: false}}},
            { "groupId": "person", "schemaField": "person.immatriculationSemester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-immatriculation-semester', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.exmatriculationSemester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-semester', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.homeAddress.country.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address-country-text', showMore: true, showMoreLimit: showMoreLimitValue}}},
            // person:homeAddressRegion ==? person.homeAddress.place | facet: true - in cabinet.typesense.yaml
            { "groupId": "person", "schemaField": "person.homeAddress.place", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studAddress.place", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.studAddress.country.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address-country', showMore: true, showMoreLimit: showMoreLimitValue}}},
            { "groupId": "person", "schemaField": "person.applications.studyType", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-applications-study-type', searchable: false}}},
            { "filter-group": { "id": "file", "name": "cabinet-search.document-filter-group-title"}},
            { "groupId": "file", "schemaField": "file.base.additionalType", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-additional-type', searchable: false}}},
            // file.uploadDate ==?
            // file.recommended.deletionDate == ?
            { "groupId": "file", "schemaField": "file.base.fileSource", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-file-source', searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.semester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-semester', searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.studyField", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-study-field', searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.semester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-semester', searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.isPartOf", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-is-part-of', searchable: false}}},
            { "groupId": "file", "schemaField": "file.base.subjectOf", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-subject-of', searchable: false}}},
            // file.decision ==? file.admissionNotice.decision | facet: false in cabinet.typesense.yaml
            { "groupId": "file",  "schemaField": "file.citizenshipCertificate.nationality", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-citizenship-certificate-nationality', searchable: false}}},
            { "groupId": "file",  "schemaField": "file.identityDocument.nationality", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-identity-document-nationality', searchable: false}}}
        ];
    }
}