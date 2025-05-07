'use strict';

import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';
import {CabinetFacets} from './components/dbp-cabinet-facets.js';

export default class DbpTypesenseInstantsearchAdapter extends TypesenseInstantSearchAdapter {
    /** @type {CabinetFacets} */
    facetComponent = null;

    facetConfigs = {};

    /**
     * @param {CabinetFacets} facetComponent
     */
    setFacetComponent(facetComponent) {
        this.facetComponent = facetComponent;
    }

    setFacetConfigs(facetConfigs) {
        this.facetConfigs = facetConfigs;
    }

    async _adaptAndPerformTypesenseRequest(instantsearchRequests) {
        // Override facet names
        let facetNames = this.facetComponent.gatherActivatedWidgetsFacetNames(this.facetConfigs);
        console.log('_adaptAndPerformTypesenseRequest facetNames', facetNames);
        // console.log('_adaptAndPerformTypesenseRequest instantsearchRequests[0].params.facets', instantsearchRequests[0].params.facets);
        instantsearchRequests[0].params.facets = facetNames;

        var typesenseResponse = await super._adaptAndPerformTypesenseRequest(instantsearchRequests);
        typesenseResponse.results[0].facet_counts = this.dummyFacetCountsData();

        return typesenseResponse;
    }

    dummyFacetCountsData = () => {
        return [
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Person',
                        value: 'Person',
                    },
                    {
                        count: 5,
                        highlighted: 'DocumentFile',
                        value: 'DocumentFile',
                    },
                ],
                field_name: '@type',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Zulassungsbescheid',
                        value: 'Zulassungsbescheid',
                    },
                    {
                        count: 5,
                        highlighted: 'Kontaktaufnahme',
                        value: 'Kontaktaufnahme',
                    },
                    {
                        count: 5,
                        highlighted: 'Staatsbürgerschaftsnachweis',
                        value: 'Staatsbürgerschaftsnachweis',
                    },
                    {
                        count: 5,
                        highlighted: 'Geburtsurkunde',
                        value: 'Geburtsurkunde',
                    },
                    {
                        count: 5,
                        highlighted: 'Personalausweis',
                        value: 'Personalausweis',
                    },
                    {
                        count: 5,
                        highlighted: 'Betreuungszusage',
                        value: 'Betreuungszusage',
                    },
                    {
                        count: 5,
                        highlighted: 'Reisepass',
                        value: 'Reisepass',
                    },
                    {
                        count: 5,
                        highlighted: 'Führerschein',
                        value: 'Führerschein',
                    },
                    {
                        count: 5,
                        highlighted: 'Heiratsurkunde',
                        value: 'Heiratsurkunde',
                    },
                ],
                field_name: 'file.base.additionalType.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'cabinet-bucket',
                        value: 'cabinet-bucket',
                    },
                ],
                field_name: 'file.base.fileSource',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'study-archive-80',
                        value: 'study-archive-80',
                    },
                    {
                        count: 5,
                        highlighted: 'admission-archive-80',
                        value: 'admission-archive-80',
                    },
                    {
                        count: 5,
                        highlighted: 'subordination-delete-3',
                        value: 'subordination-delete-3',
                    },
                    {
                        count: 5,
                        highlighted: 'generalApplications-archive-3',
                        value: 'generalApplications-archive-3',
                    },
                    {
                        count: 5,
                        highlighted: 'vacation-archive-3',
                        value: 'vacation-archive-3',
                    },
                    {
                        count: 5,
                        highlighted: 'other-archive-3',
                        value: 'other-archive-3',
                    },
                    {
                        count: 5,
                        highlighted: 'communication-archive-10',
                        value: 'communication-archive-10',
                    },
                    {
                        count: 5,
                        highlighted: 'other-delete-3',
                        value: 'other-delete-3',
                    },
                    {
                        count: 5,
                        highlighted: 'financial-archive-7',
                        value: 'financial-archive-7',
                    },
                ],
                field_name: 'file.base.isPartOf',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: '24S',
                        value: '24S',
                    },
                    {
                        count: 5,
                        highlighted: '23W',
                        value: '23W',
                    },
                    {
                        count: 5,
                        highlighted: '21W',
                        value: '21W',
                    },
                    {
                        count: 5,
                        highlighted: '22S',
                        value: '22S',
                    },
                ],
                field_name: 'file.base.semester',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Unbekannt (UF 033 243)',
                        value: 'Unbekannt (UF 033 243)',
                    },
                    {
                        count: 5,
                        highlighted: 'Unbekannt (UF 066 468)',
                        value: 'Unbekannt (UF 066 468)',
                    },
                    {
                        count: 5,
                        highlighted: 'Unbekannt (UB 066 484)',
                        value: 'Unbekannt (UB 066 484)',
                    },
                    {
                        count: 5,
                        highlighted: 'Masterstudium; Biotechnology',
                        value: 'Masterstudium; Biotechnology',
                    },
                ],
                field_name: 'file.base.studyFieldName',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'GZ 2021-0.123.456',
                        value: 'GZ 2021-0.123.456',
                    },
                    {
                        count: 5,
                        highlighted: 'VR 2023/789-B',
                        value: 'VR 2023/789-B',
                    },
                    {
                        count: 5,
                        highlighted: '987654-AB/2023',
                        value: '987654-AB/2023',
                    },
                    {
                        count: 5,
                        highlighted: 'AZ 10 C 1234/23',
                        value: 'AZ 10 C 1234/23',
                    },
                    {
                        count: 5,
                        highlighted: '567/2022-XYZ',
                        value: '567/2022-XYZ',
                    },
                ],
                field_name: 'file.base.subjectOf',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'granted',
                        value: 'granted',
                    },
                    {
                        count: 5,
                        highlighted: 'rejected',
                        value: 'rejected',
                    },
                ],
                field_name: 'file.file-cabinet-admissionNotice.decision',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'MNE',
                        value: 'MNE',
                    },
                    {
                        count: 5,
                        highlighted: 'HRV',
                        value: 'HRV',
                    },
                    {
                        count: 5,
                        highlighted: 'AUT',
                        value: 'AUT',
                    },
                ],
                field_name: 'file.file-cabinet-identityDocument.nationality',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'H.techn.u.gewerbl. Lehranstalt',
                        value: 'H.techn.u.gewerbl. Lehranstalt',
                    },
                    {
                        count: 5,
                        highlighted: 'Realgymnasium',
                        value: 'Realgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'Gymnasium',
                        value: 'Gymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'ausländische Reifeprüfung',
                        value: 'ausländische Reifeprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'Oberstufenrealgymnasium',
                        value: 'Oberstufenrealgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'ausl. postsekund.Bildungseinr.',
                        value: 'ausl. postsekund.Bildungseinr.',
                    },
                    {
                        count: 5,
                        highlighted: '* Schulform unbekannt *',
                        value: '* Schulform unbekannt *',
                    },
                    {
                        count: 5,
                        highlighted: 'Handelsakademie',
                        value: 'Handelsakademie',
                    },
                    {
                        count: 5,
                        highlighted: 'H.Lehranst. f.wirtsch. Berufe',
                        value: 'H.Lehranst. f.wirtsch. Berufe',
                    },
                    {
                        count: 5,
                        highlighted: 'Bachelorstud. and. inl. Univ.',
                        value: 'Bachelorstud. and. inl. Univ.',
                    },
                    {
                        count: 5,
                        highlighted: 'Berufsreifeprüfung',
                        value: 'Berufsreifeprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'Reifeprüfung nicht relevant',
                        value: 'Reifeprüfung nicht relevant',
                    },
                    {
                        count: 5,
                        highlighted: 'Reife/Koop.-Vertrag (Ausland)',
                        value: 'Reife/Koop.-Vertrag (Ausland)',
                    },
                    {
                        count: 5,
                        highlighted: 'gilt als inländisch',
                        value: 'gilt als inländisch',
                    },
                    {
                        count: 5,
                        highlighted: 'Wirtschaftskundl.Realgymnasium',
                        value: 'Wirtschaftskundl.Realgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'BA f.Elementarpädagogik',
                        value: 'BA f.Elementarpädagogik',
                    },
                    {
                        count: 5,
                        highlighted: 'Naturwissensch. Realgymnasium',
                        value: 'Naturwissensch. Realgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'keine Reifeprüfung',
                        value: 'keine Reifeprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'Master-/Diplomst.and.inl.Univ.',
                        value: 'Master-/Diplomst.and.inl.Univ.',
                    },
                    {
                        count: 5,
                        highlighted: 'inl. FH-Bachelorstudiengang',
                        value: 'inl. FH-Bachelorstudiengang',
                    },
                    {
                        count: 5,
                        highlighted: 'Studienberechtigungsprüfung',
                        value: 'Studienberechtigungsprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'H.land- u.forstwirt. Lehranst.',
                        value: 'H.land- u.forstwirt. Lehranst.',
                    },
                    {
                        count: 5,
                        highlighted: 'inl. FH-Diplom-/MA-Studiengang',
                        value: 'inl. FH-Diplom-/MA-Studiengang',
                    },
                    {
                        count: 5,
                        highlighted: '(Wirtsch.kundl.) RG f.Berufst.',
                        value: '(Wirtsch.kundl.) RG f.Berufst.',
                    },
                    {
                        count: 5,
                        highlighted: 'IB Diploma (Ausland)',
                        value: 'IB Diploma (Ausland)',
                    },
                    {
                        count: 5,
                        highlighted: 'Gymnasium für Berufstätige',
                        value: 'Gymnasium für Berufstätige',
                    },
                    {
                        count: 5,
                        highlighted: 'Europäisches Abitur (Ausland)',
                        value: 'Europäisches Abitur (Ausland)',
                    },
                    {
                        count: 5,
                        highlighted: 'Neusprachliches Gymnasium',
                        value: 'Neusprachliches Gymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'Externistenreifeprüfung',
                        value: 'Externistenreifeprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'Humanistisches Gymnasium',
                        value: 'Humanistisches Gymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'Realistisches Gymnasium',
                        value: 'Realistisches Gymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'ausl. beschränkte HS-Reife',
                        value: 'ausl. beschränkte HS-Reife',
                    },
                    {
                        count: 5,
                        highlighted: 'Bachelorstudium eigene Univ.',
                        value: 'Bachelorstudium eigene Univ.',
                    },
                    {
                        count: 5,
                        highlighted: 'inl. Pädagogische Hochschule',
                        value: 'inl. Pädagogische Hochschule',
                    },
                    {
                        count: 5,
                        highlighted: 'IB Diploma (Inland)',
                        value: 'IB Diploma (Inland)',
                    },
                    {
                        count: 5,
                        highlighted: 'inl. postsekund. Bildungseinr.',
                        value: 'inl. postsekund. Bildungseinr.',
                    },
                    {
                        count: 5,
                        highlighted: 'Mathematisches Realgymnasium',
                        value: 'Mathematisches Realgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'Master-/Diplomst.eigene Univ.',
                        value: 'Master-/Diplomst.eigene Univ.',
                    },
                    {
                        count: 5,
                        highlighted: 'BA-Stud.bes.Stud.erf.eig.Uni. ',
                        value: 'BA-Stud.bes.Stud.erf.eig.Uni. ',
                    },
                    {
                        count: 5,
                        highlighted: 'BA für Sozialpädagogik',
                        value: 'BA für Sozialpädagogik',
                    },
                    {
                        count: 5,
                        highlighted: 'Aufbaurealgymnasium',
                        value: 'Aufbaurealgymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'künstler. Zulassungsprüfung',
                        value: 'künstler. Zulassungsprüfung',
                    },
                    {
                        count: 5,
                        highlighted: 'Studienberecht. HG/HStudBerG',
                        value: 'Studienberecht. HG/HStudBerG',
                    },
                    {
                        count: 5,
                        highlighted: 'Doktoratsstud. and. inl. Univ.',
                        value: 'Doktoratsstud. and. inl. Univ.',
                    },
                    {
                        count: 5,
                        highlighted: 'Aufbaugymnasium',
                        value: 'Aufbaugymnasium',
                    },
                    {
                        count: 5,
                        highlighted: 'Aufbaumittelschule',
                        value: 'Aufbaumittelschule',
                    },
                    {
                        count: 5,
                        highlighted: 'Reife/Koop.-Vertrag (Inland)',
                        value: 'Reife/Koop.-Vertrag (Inland)',
                    },
                    {
                        count: 5,
                        highlighted: 'Europäisches Abitur (Inland)',
                        value: 'Europäisches Abitur (Inland)',
                    },
                    {
                        count: 5,
                        highlighted: 'Berufl. Qual./Berufserfahrung',
                        value: 'Berufl. Qual./Berufserfahrung',
                    },
                    {
                        count: 5,
                        highlighted: 'inl. akkred. Privatuniversität',
                        value: 'inl. akkred. Privatuniversität',
                    },
                ],
                field_name: 'person.admissionQualificationType.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.exmatriculationSemester',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.exmatriculationStatus.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Männlich',
                        value: 'Männlich',
                    },
                    {
                        count: 5,
                        highlighted: 'Weiblich',
                        value: 'Weiblich',
                    },
                    {
                        count: 5,
                        highlighted: 'Divers',
                        value: 'Divers',
                    },
                    {
                        count: 5,
                        highlighted: 'Kein Eintrag',
                        value: 'Kein Eintrag',
                    },
                    {
                        count: 5,
                        highlighted: 'Offen',
                        value: 'Offen',
                    },
                    {
                        count: 5,
                        highlighted: 'Inter',
                        value: 'Inter',
                    },
                ],
                field_name: 'person.gender.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Österreich',
                        value: 'Österreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Deutschland',
                        value: 'Deutschland',
                    },
                    {
                        count: 5,
                        highlighted: 'Bosnien und Herzegowina',
                        value: 'Bosnien und Herzegowina',
                    },
                    {
                        count: 5,
                        highlighted: 'Italien',
                        value: 'Italien',
                    },
                    {
                        count: 5,
                        highlighted: 'Slowenien',
                        value: 'Slowenien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kroatien',
                        value: 'Kroatien',
                    },
                    {
                        count: 5,
                        highlighted: 'Indien',
                        value: 'Indien',
                    },
                    {
                        count: 5,
                        highlighted: 'Pakistan',
                        value: 'Pakistan',
                    },
                    {
                        count: 5,
                        highlighted: 'Ungarn',
                        value: 'Ungarn',
                    },
                    {
                        count: 5,
                        highlighted: 'Ukraine',
                        value: 'Ukraine',
                    },
                    {
                        count: 5,
                        highlighted: 'Bangladesch',
                        value: 'Bangladesch',
                    },
                    {
                        count: 5,
                        highlighted: 'Russland',
                        value: 'Russland',
                    },
                    {
                        count: 5,
                        highlighted: 'Ägypten',
                        value: 'Ägypten',
                    },
                    {
                        count: 5,
                        highlighted: 'Spanien',
                        value: 'Spanien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kosovo',
                        value: 'Kosovo',
                    },
                    {
                        count: 5,
                        highlighted: 'Serbien',
                        value: 'Serbien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kasachstan',
                        value: 'Kasachstan',
                    },
                    {
                        count: 5,
                        highlighted: 'Albanien',
                        value: 'Albanien',
                    },
                    {
                        count: 5,
                        highlighted: 'Iran',
                        value: 'Iran',
                    },
                    {
                        count: 5,
                        highlighted: 'Nigeria',
                        value: 'Nigeria',
                    },
                    {
                        count: 5,
                        highlighted: 'Türkei',
                        value: 'Türkei',
                    },
                    {
                        count: 5,
                        highlighted: 'China',
                        value: 'China',
                    },
                    {
                        count: 5,
                        highlighted: 'Bulgarien',
                        value: 'Bulgarien',
                    },
                    {
                        count: 5,
                        highlighted: 'Sri Lanka',
                        value: 'Sri Lanka',
                    },
                    {
                        count: 5,
                        highlighted: 'Frankreich',
                        value: 'Frankreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Vereinigte Staaten',
                        value: 'Vereinigte Staaten',
                    },
                    {
                        count: 5,
                        highlighted: 'Schweiz',
                        value: 'Schweiz',
                    },
                    {
                        count: 5,
                        highlighted: 'Rumänien',
                        value: 'Rumänien',
                    },
                    {
                        count: 5,
                        highlighted: 'Mexiko',
                        value: 'Mexiko',
                    },
                    {
                        count: 5,
                        highlighted: 'Finnland',
                        value: 'Finnland',
                    },
                    {
                        count: 5,
                        highlighted: 'Guatemala',
                        value: 'Guatemala',
                    },
                    {
                        count: 5,
                        highlighted: 'Polen',
                        value: 'Polen',
                    },
                    {
                        count: 5,
                        highlighted: 'Kanada',
                        value: 'Kanada',
                    },
                    {
                        count: 5,
                        highlighted: 'Tschechien',
                        value: 'Tschechien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kirgisistan',
                        value: 'Kirgisistan',
                    },
                    {
                        count: 5,
                        highlighted: 'Belgien',
                        value: 'Belgien',
                    },
                    {
                        count: 5,
                        highlighted: 'Belarus',
                        value: 'Belarus',
                    },
                    {
                        count: 5,
                        highlighted: 'Slowakei',
                        value: 'Slowakei',
                    },
                    {
                        count: 5,
                        highlighted: 'Griechenland',
                        value: 'Griechenland',
                    },
                    {
                        count: 5,
                        highlighted: 'Schweden',
                        value: 'Schweden',
                    },
                    {
                        count: 5,
                        highlighted: 'Südkorea',
                        value: 'Südkorea',
                    },
                    {
                        count: 5,
                        highlighted: 'Brasilien',
                        value: 'Brasilien',
                    },
                    {
                        count: 5,
                        highlighted: 'Nordmazedonien',
                        value: 'Nordmazedonien',
                    },
                    {
                        count: 5,
                        highlighted: 'Vereinigtes Königreich',
                        value: 'Vereinigtes Königreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Portugal',
                        value: 'Portugal',
                    },
                    {
                        count: 5,
                        highlighted: 'Luxemburg',
                        value: 'Luxemburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Norwegen',
                        value: 'Norwegen',
                    },
                    {
                        count: 5,
                        highlighted: 'Algerien',
                        value: 'Algerien',
                    },
                    {
                        count: 5,
                        highlighted: 'Nepal',
                        value: 'Nepal',
                    },
                    {
                        count: 5,
                        highlighted: 'Ghana',
                        value: 'Ghana',
                    },
                ],
                field_name: 'person.homeAddress.country.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Graz',
                        value: 'Graz',
                    },
                    {
                        count: 5,
                        highlighted: 'Klagenfurt am Wörthersee',
                        value: 'Klagenfurt am Wörthersee',
                    },
                    {
                        count: 5,
                        highlighted: 'Wien',
                        value: 'Wien',
                    },
                    {
                        count: 5,
                        highlighted: 'Villach',
                        value: 'Villach',
                    },
                    {
                        count: 5,
                        highlighted: 'Leoben',
                        value: 'Leoben',
                    },
                    {
                        count: 5,
                        highlighted: 'Linz',
                        value: 'Linz',
                    },
                    {
                        count: 5,
                        highlighted: 'Wolfsberg',
                        value: 'Wolfsberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Salzburg',
                        value: 'Salzburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Gratwein-Straßengel',
                        value: 'Gratwein-Straßengel',
                    },
                    {
                        count: 5,
                        highlighted: 'Kapfenberg',
                        value: 'Kapfenberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Gleisdorf',
                        value: 'Gleisdorf',
                    },
                    {
                        count: 5,
                        highlighted: 'Seiersberg-Pirka',
                        value: 'Seiersberg-Pirka',
                    },
                    {
                        count: 5,
                        highlighted: 'Weiz',
                        value: 'Weiz',
                    },
                    {
                        count: 5,
                        highlighted: 'Deutschlandsberg',
                        value: 'Deutschlandsberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Feldbach',
                        value: 'Feldbach',
                    },
                    {
                        count: 5,
                        highlighted: 'Bruck an der Mur',
                        value: 'Bruck an der Mur',
                    },
                    {
                        count: 5,
                        highlighted: 'Leibnitz',
                        value: 'Leibnitz',
                    },
                    {
                        count: 5,
                        highlighted: 'St. Veit an der Glan',
                        value: 'St. Veit an der Glan',
                    },
                    {
                        count: 5,
                        highlighted: 'Hart bei Graz',
                        value: 'Hart bei Graz',
                    },
                    {
                        count: 5,
                        highlighted: 'Feldkirchen in Kärnten',
                        value: 'Feldkirchen in Kärnten',
                    },
                    {
                        count: 5,
                        highlighted: 'Spittal an der Drau',
                        value: 'Spittal an der Drau',
                    },
                    {
                        count: 5,
                        highlighted: 'Hartberg',
                        value: 'Hartberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Voitsberg',
                        value: 'Voitsberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Wels',
                        value: 'Wels',
                    },
                    {
                        count: 5,
                        highlighted: 'Feldkirchen bei Graz',
                        value: 'Feldkirchen bei Graz',
                    },
                    {
                        count: 5,
                        highlighted: 'Trofaiach',
                        value: 'Trofaiach',
                    },
                    {
                        count: 5,
                        highlighted: 'SARAJEVO',
                        value: 'SARAJEVO',
                    },
                    {
                        count: 5,
                        highlighted: 'BANJA LUKA',
                        value: 'BANJA LUKA',
                    },
                    {
                        count: 5,
                        highlighted: 'Hitzendorf',
                        value: 'Hitzendorf',
                    },
                    {
                        count: 5,
                        highlighted: 'Völkermarkt',
                        value: 'Völkermarkt',
                    },
                    {
                        count: 5,
                        highlighted: 'St. Stefan',
                        value: 'St. Stefan',
                    },
                    {
                        count: 5,
                        highlighted: 'Fürstenfeld',
                        value: 'Fürstenfeld',
                    },
                    {
                        count: 5,
                        highlighted: 'Stainz',
                        value: 'Stainz',
                    },
                    {
                        count: 5,
                        highlighted: 'Raaba-Grambach',
                        value: 'Raaba-Grambach',
                    },
                    {
                        count: 5,
                        highlighted: 'Judenburg',
                        value: 'Judenburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Eggersdorf bei Graz',
                        value: 'Eggersdorf bei Graz',
                    },
                    {
                        count: 5,
                        highlighted: 'Frohnleiten',
                        value: 'Frohnleiten',
                    },
                    {
                        count: 5,
                        highlighted: 'MÜNCHEN',
                        value: 'MÜNCHEN',
                    },
                    {
                        count: 5,
                        highlighted: 'Köflach',
                        value: 'Köflach',
                    },
                    {
                        count: 5,
                        highlighted: 'St. Andrä',
                        value: 'St. Andrä',
                    },
                    {
                        count: 5,
                        highlighted: 'Lienz',
                        value: 'Lienz',
                    },
                    {
                        count: 5,
                        highlighted: 'Kindberg',
                        value: 'Kindberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Knittelfeld',
                        value: 'Knittelfeld',
                    },
                    {
                        count: 5,
                        highlighted: 'Velden am Wörther See',
                        value: 'Velden am Wörther See',
                    },
                    {
                        count: 5,
                        highlighted: 'Innsbruck',
                        value: 'Innsbruck',
                    },
                    {
                        count: 5,
                        highlighted: 'Hausmannstätten',
                        value: 'Hausmannstätten',
                    },
                    {
                        count: 5,
                        highlighted: 'Lieboch',
                        value: 'Lieboch',
                    },
                    {
                        count: 5,
                        highlighted: 'Gratkorn',
                        value: 'Gratkorn',
                    },
                    {
                        count: 5,
                        highlighted: 'Spielberg',
                        value: 'Spielberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Bad Schwanberg',
                        value: 'Bad Schwanberg',
                    },
                ],
                field_name: 'person.homeAddress.place',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Steiermark',
                        value: 'Steiermark',
                    },
                    {
                        count: 5,
                        highlighted: 'Kärnten',
                        value: 'Kärnten',
                    },
                    {
                        count: 5,
                        highlighted: 'Oberösterreich',
                        value: 'Oberösterreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Salzburg',
                        value: 'Salzburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Burgenland',
                        value: 'Burgenland',
                    },
                    {
                        count: 5,
                        highlighted: 'Wien',
                        value: 'Wien',
                    },
                    {
                        count: 5,
                        highlighted: 'Niederösterreich',
                        value: 'Niederösterreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Tirol',
                        value: 'Tirol',
                    },
                    {
                        count: 5,
                        highlighted: 'Bayern',
                        value: 'Bayern',
                    },
                    {
                        count: 5,
                        highlighted: 'Federacija Bosna i Hercegovina',
                        value: 'Federacija Bosna i Hercegovina',
                    },
                    {
                        count: 5,
                        highlighted: 'Trentino-Südtirol',
                        value: 'Trentino-Südtirol',
                    },
                    {
                        count: 5,
                        highlighted: 'Vorarlberg',
                        value: 'Vorarlberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Republika Srpska',
                        value: 'Republika Srpska',
                    },
                    {
                        count: 5,
                        highlighted: 'Baden-Württemberg',
                        value: 'Baden-Württemberg',
                    },
                    {
                        count: 5,
                        highlighted: 'Nordrhein-Westfalen',
                        value: 'Nordrhein-Westfalen',
                    },
                    {
                        count: 5,
                        highlighted: 'Hessen',
                        value: 'Hessen',
                    },
                    {
                        count: 5,
                        highlighted: 'Serbien',
                        value: 'Serbien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kosovo',
                        value: 'Kosovo',
                    },
                    {
                        count: 5,
                        highlighted: 'Punjab',
                        value: 'Punjab',
                    },
                    {
                        count: 5,
                        highlighted: 'Maribor',
                        value: 'Maribor',
                    },
                    {
                        count: 5,
                        highlighted: 'Niedersachsen',
                        value: 'Niedersachsen',
                    },
                    {
                        count: 5,
                        highlighted: 'Grad Zagreb',
                        value: 'Grad Zagreb',
                    },
                    {
                        count: 5,
                        highlighted: 'Kerala',
                        value: 'Kerala',
                    },
                    {
                        count: 5,
                        highlighted: 'Almaty',
                        value: 'Almaty',
                    },
                    {
                        count: 5,
                        highlighted: 'Rheinland-Pfalz',
                        value: 'Rheinland-Pfalz',
                    },
                    {
                        count: 5,
                        highlighted: 'Berlin',
                        value: 'Berlin',
                    },
                    {
                        count: 5,
                        highlighted: 'İstanbul',
                        value: 'İstanbul',
                    },
                    {
                        count: 5,
                        highlighted: 'Vas',
                        value: 'Vas',
                    },
                    {
                        count: 5,
                        highlighted: 'Tiranë',
                        value: 'Tiranë',
                    },
                    {
                        count: 5,
                        highlighted: 'Tehrān',
                        value: 'Tehrān',
                    },
                    {
                        count: 5,
                        highlighted: 'Međimurska županija',
                        value: 'Međimurska županija',
                    },
                    {
                        count: 5,
                        highlighted: 'Moskva',
                        value: 'Moskva',
                    },
                    {
                        count: 5,
                        highlighted: 'Al Qāhirah',
                        value: 'Al Qāhirah',
                    },
                    {
                        count: 5,
                        highlighted: 'Kyïv',
                        value: 'Kyïv',
                    },
                    {
                        count: 5,
                        highlighted: 'Guatemala',
                        value: 'Guatemala',
                    },
                    {
                        count: 5,
                        highlighted: 'Sachsen',
                        value: 'Sachsen',
                    },
                    {
                        count: 5,
                        highlighted: 'Brandenburg',
                        value: 'Brandenburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Mahārāshtra',
                        value: 'Mahārāshtra',
                    },
                    {
                        count: 5,
                        highlighted: 'Pest',
                        value: 'Pest',
                    },
                    {
                        count: 5,
                        highlighted: 'Budapest',
                        value: 'Budapest',
                    },
                    {
                        count: 5,
                        highlighted: 'Dhaka Zila',
                        value: 'Dhaka Zila',
                    },
                    {
                        count: 5,
                        highlighted: 'Ad Daqahlīyah',
                        value: 'Ad Daqahlīyah',
                    },
                    {
                        count: 5,
                        highlighted: 'Hamburg',
                        value: 'Hamburg',
                    },
                    {
                        count: 5,
                        highlighted: 'Lagos',
                        value: 'Lagos',
                    },
                    {
                        count: 5,
                        highlighted: 'Nordmazedonien',
                        value: 'Nordmazedonien',
                    },
                    {
                        count: 5,
                        highlighted: "Dnipropetrovs'ka Oblast'",
                        value: "Dnipropetrovs'ka Oblast'",
                    },
                    {
                        count: 5,
                        highlighted: 'Bishkek',
                        value: 'Bishkek',
                    },
                    {
                        count: 5,
                        highlighted: 'Shkodër',
                        value: 'Shkodër',
                    },
                    {
                        count: 5,
                        highlighted: 'North-West Frontier Province',
                        value: 'North-West Frontier Province',
                    },
                    {
                        count: 5,
                        highlighted: 'Sofija Grad',
                        value: 'Sofija Grad',
                    },
                ],
                field_name: 'person.homeAddress.region',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: '24W',
                        value: '24W',
                    },
                    {
                        count: 5,
                        highlighted: '23W',
                        value: '23W',
                    },
                    {
                        count: 5,
                        highlighted: '22W',
                        value: '22W',
                    },
                    {
                        count: 5,
                        highlighted: '21W',
                        value: '21W',
                    },
                    {
                        count: 5,
                        highlighted: '20W',
                        value: '20W',
                    },
                    {
                        count: 5,
                        highlighted: '19W',
                        value: '19W',
                    },
                    {
                        count: 5,
                        highlighted: '18W',
                        value: '18W',
                    },
                    {
                        count: 5,
                        highlighted: '17W',
                        value: '17W',
                    },
                    {
                        count: 5,
                        highlighted: '25S',
                        value: '25S',
                    },
                    {
                        count: 5,
                        highlighted: '16W',
                        value: '16W',
                    },
                    {
                        count: 5,
                        highlighted: '15W',
                        value: '15W',
                    },
                    {
                        count: 5,
                        highlighted: '24S',
                        value: '24S',
                    },
                    {
                        count: 5,
                        highlighted: '14W',
                        value: '14W',
                    },
                    {
                        count: 5,
                        highlighted: '23S',
                        value: '23S',
                    },
                    {
                        count: 5,
                        highlighted: '13W',
                        value: '13W',
                    },
                    {
                        count: 5,
                        highlighted: '12W',
                        value: '12W',
                    },
                    {
                        count: 5,
                        highlighted: '22S',
                        value: '22S',
                    },
                    {
                        count: 5,
                        highlighted: '21S',
                        value: '21S',
                    },
                    {
                        count: 5,
                        highlighted: '19S',
                        value: '19S',
                    },
                    {
                        count: 5,
                        highlighted: '11W',
                        value: '11W',
                    },
                    {
                        count: 5,
                        highlighted: '20S',
                        value: '20S',
                    },
                    {
                        count: 5,
                        highlighted: '10W',
                        value: '10W',
                    },
                    {
                        count: 5,
                        highlighted: '09W',
                        value: '09W',
                    },
                    {
                        count: 5,
                        highlighted: '17S',
                        value: '17S',
                    },
                    {
                        count: 5,
                        highlighted: '18S',
                        value: '18S',
                    },
                    {
                        count: 5,
                        highlighted: '08W',
                        value: '08W',
                    },
                    {
                        count: 5,
                        highlighted: '07W',
                        value: '07W',
                    },
                    {
                        count: 5,
                        highlighted: '16S',
                        value: '16S',
                    },
                    {
                        count: 5,
                        highlighted: '06W',
                        value: '06W',
                    },
                    {
                        count: 5,
                        highlighted: '14S',
                        value: '14S',
                    },
                    {
                        count: 5,
                        highlighted: '04W',
                        value: '04W',
                    },
                    {
                        count: 5,
                        highlighted: '03W',
                        value: '03W',
                    },
                    {
                        count: 5,
                        highlighted: '02W',
                        value: '02W',
                    },
                    {
                        count: 5,
                        highlighted: '15S',
                        value: '15S',
                    },
                    {
                        count: 5,
                        highlighted: '05W',
                        value: '05W',
                    },
                    {
                        count: 5,
                        highlighted: '13S',
                        value: '13S',
                    },
                    {
                        count: 5,
                        highlighted: '01W',
                        value: '01W',
                    },
                    {
                        count: 5,
                        highlighted: '11S',
                        value: '11S',
                    },
                    {
                        count: 5,
                        highlighted: '12S',
                        value: '12S',
                    },
                    {
                        count: 5,
                        highlighted: '98W',
                        value: '98W',
                    },
                    {
                        count: 5,
                        highlighted: '00W',
                        value: '00W',
                    },
                    {
                        count: 5,
                        highlighted: '99W',
                        value: '99W',
                    },
                    {
                        count: 5,
                        highlighted: '97W',
                        value: '97W',
                    },
                    {
                        count: 5,
                        highlighted: '93W',
                        value: '93W',
                    },
                    {
                        count: 5,
                        highlighted: '96W',
                        value: '96W',
                    },
                    {
                        count: 5,
                        highlighted: '10S',
                        value: '10S',
                    },
                    {
                        count: 5,
                        highlighted: '09S',
                        value: '09S',
                    },
                    {
                        count: 5,
                        highlighted: '95W',
                        value: '95W',
                    },
                    {
                        count: 5,
                        highlighted: '89W',
                        value: '89W',
                    },
                    {
                        count: 5,
                        highlighted: '07S',
                        value: '07S',
                    },
                ],
                field_name: 'person.immatriculationSemester',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [
                    {
                        count: 5,
                        highlighted: 'Österreich',
                        value: 'Österreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Deutschland',
                        value: 'Deutschland',
                    },
                    {
                        count: 5,
                        highlighted: 'Bosnien und Herzegowina',
                        value: 'Bosnien und Herzegowina',
                    },
                    {
                        count: 5,
                        highlighted: 'Kroatien',
                        value: 'Kroatien',
                    },
                    {
                        count: 5,
                        highlighted: 'Italien (Südtirol)',
                        value: 'Italien (Südtirol)',
                    },
                    {
                        count: 5,
                        highlighted: 'Ukraine',
                        value: 'Ukraine',
                    },
                    {
                        count: 5,
                        highlighted: 'Russland',
                        value: 'Russland',
                    },
                    {
                        count: 5,
                        highlighted: 'Ägypten',
                        value: 'Ägypten',
                    },
                    {
                        count: 5,
                        highlighted: 'Ungarn',
                        value: 'Ungarn',
                    },
                    {
                        count: 5,
                        highlighted: 'Slowenien',
                        value: 'Slowenien',
                    },
                    {
                        count: 5,
                        highlighted: 'Italien',
                        value: 'Italien',
                    },
                    {
                        count: 5,
                        highlighted: 'Indien',
                        value: 'Indien',
                    },
                    {
                        count: 5,
                        highlighted: 'Türkei',
                        value: 'Türkei',
                    },
                    {
                        count: 5,
                        highlighted: 'Pakistan',
                        value: 'Pakistan',
                    },
                    {
                        count: 5,
                        highlighted: 'Iran',
                        value: 'Iran',
                    },
                    {
                        count: 5,
                        highlighted: 'Rumänien',
                        value: 'Rumänien',
                    },
                    {
                        count: 5,
                        highlighted: 'Bangladesch',
                        value: 'Bangladesch',
                    },
                    {
                        count: 5,
                        highlighted: 'Serbien',
                        value: 'Serbien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kasachstan',
                        value: 'Kasachstan',
                    },
                    {
                        count: 5,
                        highlighted: 'Spanien',
                        value: 'Spanien',
                    },
                    {
                        count: 5,
                        highlighted: 'Nigeria',
                        value: 'Nigeria',
                    },
                    {
                        count: 5,
                        highlighted: 'Albanien',
                        value: 'Albanien',
                    },
                    {
                        count: 5,
                        highlighted: 'Kosovo',
                        value: 'Kosovo',
                    },
                    {
                        count: 5,
                        highlighted: 'China',
                        value: 'China',
                    },
                    {
                        count: 5,
                        highlighted: 'Syrien',
                        value: 'Syrien',
                    },
                    {
                        count: 5,
                        highlighted: 'Frankreich',
                        value: 'Frankreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Bulgarien',
                        value: 'Bulgarien',
                    },
                    {
                        count: 5,
                        highlighted: 'Polen',
                        value: 'Polen',
                    },
                    {
                        count: 5,
                        highlighted: 'Vereinigte Staaten',
                        value: 'Vereinigte Staaten',
                    },
                    {
                        count: 5,
                        highlighted: 'unbekannt',
                        value: 'unbekannt',
                    },
                    {
                        count: 5,
                        highlighted: 'Schweiz',
                        value: 'Schweiz',
                    },
                    {
                        count: 5,
                        highlighted: 'Sri Lanka',
                        value: 'Sri Lanka',
                    },
                    {
                        count: 5,
                        highlighted: 'Mexiko',
                        value: 'Mexiko',
                    },
                    {
                        count: 5,
                        highlighted: 'Vereinigtes Königreich',
                        value: 'Vereinigtes Königreich',
                    },
                    {
                        count: 5,
                        highlighted: 'Kirgisistan',
                        value: 'Kirgisistan',
                    },
                    {
                        count: 5,
                        highlighted: 'Griechenland',
                        value: 'Griechenland',
                    },
                    {
                        count: 5,
                        highlighted: 'Nordmazedonien',
                        value: 'Nordmazedonien',
                    },
                    {
                        count: 5,
                        highlighted: 'Brasilien',
                        value: 'Brasilien',
                    },
                    {
                        count: 5,
                        highlighted: 'Niederlande',
                        value: 'Niederlande',
                    },
                    {
                        count: 5,
                        highlighted: 'Slowakei',
                        value: 'Slowakei',
                    },
                    {
                        count: 5,
                        highlighted: 'Afghanistan',
                        value: 'Afghanistan',
                    },
                    {
                        count: 5,
                        highlighted: 'Finnland',
                        value: 'Finnland',
                    },
                    {
                        count: 5,
                        highlighted: 'Tschechien',
                        value: 'Tschechien',
                    },
                    {
                        count: 5,
                        highlighted: 'Guatemala',
                        value: 'Guatemala',
                    },
                    {
                        count: 5,
                        highlighted: 'Belarus',
                        value: 'Belarus',
                    },
                    {
                        count: 5,
                        highlighted: 'Kanada',
                        value: 'Kanada',
                    },
                    {
                        count: 5,
                        highlighted: 'Portugal',
                        value: 'Portugal',
                    },
                    {
                        count: 5,
                        highlighted: 'Belgien',
                        value: 'Belgien',
                    },
                    {
                        count: 5,
                        highlighted: 'Schweden',
                        value: 'Schweden',
                    },
                    {
                        count: 5,
                        highlighted: 'Südkorea',
                        value: 'Südkorea',
                    },
                ],
                field_name: 'person.nationalities.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.person',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.personalStatus.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.studentStatus.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.studyAddress.country.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.studyAddress.place',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'person.studyAddress.region',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'study.name',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'study.status.text',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
            {
                counts: [],
                field_name: 'study.type',
                sampled: false,
                stats: {
                    total_values: 5,
                },
            },
        ];
    };
}
