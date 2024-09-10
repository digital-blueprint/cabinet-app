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
        return [
            { "filter-group": { "id": "category", "name": "cabinet-search.type-filter-group-title"}},
            { "groupId": "category", "schemaField": "@type", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-base-person', searchable: false, sortBy: ['alpha:asc']}}, "usePanel": false},
            { "filter-group": { "id": "person", "name": "cabinet-search.person-filter-group-title"}},
            { "groupId": "person", "schemaField": "base.person", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-base-person'}}},
            { "groupId": "person", "schemaField": "person.nationalities.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-nationalities-text'}}},
            { "groupId": "person", "schemaField": "person.admissionQualificationType.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-admission-qualification-type'}}},
            { "groupId": "person",  "schemaField": "person.homeAddress.place", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-home-address'}}},
            { "groupId": "person",  "schemaField": "person.studAddress.place", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address'}}},
            { "groupId": "person",  "schemaField": "person.studAddress.country.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-student-address-country'}}},
            { "groupId": "person",  "schemaField": "person.immatriculationSemester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-immatriculation-semester'}}},
            { "groupId": "person",  "schemaField": "person.exmatriculationSemester", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-semester'}}},
            { "groupId": "person",  "schemaField": "person.exmatriculationStatus.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-exmatriculation-status'}}},
            { "groupId": "person",  "schemaField": "person.academicTitles", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-academic-titles', transformItems: items => items.filter(item => item.label.trim() !== '')}}},
            { "groupId": "person",  "schemaField": "person.gender.text", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-gender'}}},
            { "groupId": "person",  "schemaField": "person.studies.name", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-studies-name', /*showMore: true, showMoreLimit: 50000*/}}},
            { "groupId": "person",  "schemaField": "person.studies.type", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-studies-type'}}},
            { "groupId": "person",  "schemaField": "person.applications.studyType", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-person-applications-study-type'}}},
            { "filter-group": { "id": "file", "name": "cabinet-search.document-filter-group-title"}},
            { "groupId": "file",  "schemaField": "file.base.additionalType", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-additional-type'}}},
            { "groupId": "file",  "schemaField": "file.base.isPartOf", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-is-part-of'}}},
            { "groupId": "file",  "schemaField": "file.base.studyField", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-study-field'}}},
            { "groupId": "file",  "schemaField": "file.base.subjectOf", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-base-subject-of'}}},
            { "groupId": "file",  "schemaField": "file.citizenshipCertificate.nationality", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-citizenship-certificate-nationality'}}},
            { "groupId": "person",  "schemaField": "file.identityDocument.nationality", "facetOptions": { facet: { searchablePlaceholder: 'cabinet-search.search-placeholder-file-identity-document-nationality'}}}
        ];
    }
}