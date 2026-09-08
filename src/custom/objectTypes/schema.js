/**
 * @typedef {object} Translated
 * @property {string} key - The unique key of the value
 * @property {string} text - The display text of the value in German
 * @property {string} textEn - The display text of the value in English
 */

/**
 * @typedef {object} Address
 * @property {string} note - Example: "c/o Erika Mustermann"
 * @property {string} street - Example: "Hauptstraße 42/4"
 * @property {string} place - Example: "Graz"
 * @property {string} region - Example: "Steiermark"
 * @property {string} postCode - Example: "8010"
 * @property {Translated} country - Example: key="168", text="Österreich"
 * @property {string} telephoneNumber - Example: "067612345678"
 */

/**
 * A study objects for "@type" == "Person" documents
 * @typedef {object} Study
 * @property {string} id - Example: "252221"
 * @property {string} coUrl - URL to CO which leads to the page for the study information
 * @property {?string} curriculumVersion - Example: "12U_SPO"
 * @property {?string} exmatriculationSemester - Example: "24S"
 * @property {?string} exmatriculationDate - Example: "2010-01-01"
 * @property {?Translated} exmatriculationType - Example: key="EZ", text="auf Antrag"
 * @property {?string} immatriculationDate - Example: "2010-01-01"
 * @property {?string} immatriculationSemester - Example: "20S"
 * @property {string} key - Example: key="UF 786 600"
 * @property {string} name - Example: "Dr.-Studium d.technischen Wissenschaften; Architektur"
 * @property {?string} qualificationDate - Example: "2010-01-01"
 * @property {?Translated} qualificationState - Example: key="168", text="Österreich"
 * @property {?Translated} qualificationType - Example: key="41", text="Master-/Diplomst.eigene Univ."
 * @property {number} semester - Example: 28
 * @property {Translated} status - Examples: key="I", text="geschlossen (Antrag oder ex lege)"
 * @property {string} type - Example: "Doktoratsstudium"
 * @property {Translated[]} additionalCertificates - Example: key="ZBU", text="Zus.Prfg. - Biologie und Umweltkunde"
 */

/**
 * @typedef {object} Application
 * @property {string} id - Example: "30204"
 * @property {?string} studyId - Example: "252221"
 * @property {string} studyKey - Example: "UF 992 840"
 * @property {string} studyName - Example: "Bachelorstudium; Physik"
 * @property {string} studyType - Example: "Doktoratsstudium"
 * @property {string} startSemester - Example: "22W"
 * @property {?string} qualificationCertificateDate - Example: "2020-06-29"
 * @property {?Translated} qualificationIssuingCountry - Example: key="40", text="Bosnien und Herzegowina"
 * @property {?Translated} qualificationType - Example: key="25", text="ausländische Reifeprüfung"
 */

/**
 * Person related fields that are common to all Person/DocumentFile documents
 * @typedef {object} Person
 * @property {string} stPersonNr - Example: "123"
 * @property {string} studId - Example: "01020340". Called "Identifikationsnummer" in CO
 * @property {string} givenName - Example: "Max"
 * @property {string} familyName - Example: "Mustermann"
 * @property {string} fullName - Equal to "<familyName>, <givenName>"
 * @property {string} person - Equal to "<familyName>, <givenName> (<birthDate>)"
 * @property {string} birthDate - Example: "1970-01-01"
 * @property {string} birthDateDe - German-formatted birth date used by the search index
 * @property {number} birthDateTimestamp - Unix timestamp (UTC was used for converting), for sorting and filtering, ignore the time part
 * @property {string} identNrObfuscated - Example: "F06BCC80D6FC0BDE575B16FB2E3790D5"
 * @property {Translated} nationality - Example: key="168", text="Österreich"
 * @property {?Translated} nationalitySecondary - Example: key="168", text="Österreich"
 * @property {Translated[]} nationalities - A list containing both person.nationality and person.nationalitySecondary, if available
 * @property {Translated} admissionQualificationType - Example: key="38", text="Bachelorstud. and. inl. Univ."
 * @property {?string} schoolCertificateDate - Example: "1970-01-01"
 * @property {?Address} homeAddress - Home address of the student
 * @property {?Address} studyAddress - Study address of the student
 * @property {?string} emailAddressUniversity - Example: "max.mustermann@student.tugraz.at"
 * @property {?string} emailAddressConfirmed - Example: "max.mustermann@example.com"
 * @property {?string} emailAddressTemporary - Example: "max.mustermann@example.com"
 * @property {Translated} personalStatus - Example: key="gültige/r Studierende/r", text="gültige/r Studierende/r"
 * @property {Translated} studentStatus - Example: key="O", text="nicht zugelassen" - Called "Hörerstatus" in CO
 * @property {string} immatriculationDate - Example: "1970-01-01"
 * @property {string} immatriculationSemester - Example: "22W"
 * @property {string} exmatriculationDate - Example: "2023-10-31"
 * @property {string} exmatriculationSemester - Example: "22W"
 * @property {?Translated} exmatriculationStatus - Example: key="EZ", text="ex lege"
 * @property {?string} academicTitlePreceding - Example: "Dipl.-Ing. Dr.techn"
 * @property {?string} academicTitleFollowing - Example: "Bakk.techn."
 * @property {string[]} academicTitles - A list containing both academicTitlePreceding and academicTitleFollowing, if available
 * @property {?string} formerFamilyName - Example: "Maier"
 * @property {?string} socialSecurityNr - Example: "1234010197"
 * @property {?string} bpk - Example: "Kxl/ufp/HOufd8y/+3n6qZ1Cn7E="
 * @property {Translated} gender - Example: key="W", text="Weiblich"
 * @property {string} coUrl - URL to CO which leads to the page for editing the person information
 * @property {number} syncTimestamp - Unix timestamp when the data was last synced from CO
 * @property {?string} telephoneNumber - Example: "067612345678"
 * @property {?string} tuitionStatus - Example: "Ausländer gleichgestellt" - Called "Beitragsstatus" in CO
 * @property {?string} tuitionExemptionType - Example: "L Lehrgang" - Called "Befreiungsart" in CO
 * @property {?string} note - Free form text
 * @property {?string} studyLimitStartSemester - Example: "23W" - Called "Befristet von" in CO
 * @property {?string} studyLimitEndSemester - Example: "24S" - Called "Befristet bis" in CO
 * @property {Study[]} studies - A list of all study objects
 * @property {Application[]} applications - A list of all application objects
 */

/**
 * Fields for all "@type" == "DocumentFile" documents related to the file itself
 * and the file content
 * @typedef {object} FileCommon
 * @property {string} fileSource - Example: "cabinet-bucket" - Currently the external blob bucket name
 * @property {string} mimeType - Example: "application/pdf"
 * @property {number} createdTimestamp - Example: 1729607133 - The unix timestamp of the blob file creation
 * @property {number} modifiedTimestamp - Example: 1729607133 - The unix timestamp of the last blob file/metadata modification
 * @property {string} fileId - Examples: "0192b49e-6abd-7db5-9cb1-f743bbd78c18" - The blob file ID
 * @property {string} fileName - Example: "detailed_article_2.pdf" - The filename of the blob file
 * @property {number} deleteAtTimestamp - Example: 1729607133 - The unix timestamp for when the file will be deleted
 * @property {?number} recommendedDeletionTimestamp - Example: 4854261742 - The unix timestamp for when the file should be deleted by the user
 * @property {?number} recommendedArchivalTimestamp - Example: 4854261742 - The unix timestamp for when the file should be archived
 * Fields for all "@type" == "DocumentFile" documents related to the file content
 * @property {Translated} additionalType - Example: key="AdmissionNotice", text="Zulassungsbescheid"
 * @property {string} groupId - Example: "8794638a-c3f0-441c-a2b6-8e867980e71a" - UUID for grouping multiple versions of the same document
 * @property {?string} comment - Example: Optional comment about the described entity
 * @property {string[]} isPartOf - Example: ["generalApplications-archive-3"] - A list of assigned
 * processes, e.i. purposses of storing, to which this entity is assigned
 * to. Every document needs at least one of the values to be assigned.
 * @property {Translated} studyField - "UF 033 243" - Study field that the described document applies to. The
 * key is either the study field key or the value 'Unspecified'. The value
 * is the study field named that the described document applies to.
 * @property {?string} subjectOf - Example: "GZ 2021-0.123.456" - Optional attribute containing a registry key of a case aka the 'Geschäftszahl'
 * @property {string} semester - Example: "24S" - The semester that the described document applies to
 * @property {"archival"|"deletion"} disposalType - Example: "archival" - Either "archival" or "deletion"
 */

/**
 * Fields that are common to all Person/DocumentFile documents
 * @typedef {object} Base
 * @property {?string} personGroupId - An ID for grouping person and study objects, which is not set for DocumentFile documents
 * @property {boolean} isScheduledForDeletion - Example: true - true for all files that have a deleteAtTimestamp, false otherwise
 * @property {boolean} isCurrent - Indicates whether the object has been superseded by another.
 */

/**
 * @typedef {object} AdmissionNotice
 * @property {string} dateCreated - Example: "1970-01-01" - Date of the student's application in the iso8601 format
 * @property {string} previousStudy - Example: "Something" - Name of the study programme the student graduated in
 * @property {"string"} decision - "rejected" - The registrar's office decision about the admission (required)
 */

/**
 * @typedef {object} EnglMasterApplication
 * @property {string} nativeLanguage - Example: "English" - Name of the native language of the applicant
 * @property {boolean} previousEnrolmentInAustria - "false" - true if the student has been previously enroled in austria (required)
 */

/**
 * @typedef {object} EnglMasterDataSheet
 * @property {string} previousHigherEducationInstitution - Example: "Graz University of Technology" - Name of the institution where the applicant has previously graduated from
 * @property {string} previousHigherEducationPlace - Example: "Graz" - Name of the place where the institution is located
 * @property {string} previousHigherEducationField - Example: "Computer Science" - Name of the educational field the applicant has previously graduated in
 * @property {string} previousHigherEducationCurriculum - Example: "https://example.com" - Link to the curriculum
 * @property {string} previousHigherEducationGrading - Example: "-" - Name of the educational grading system, or a URL to it
 * @property {string} previousHigherEducationCPGA - Example: "8.9" - Float that indicated the CPGA
 */

/**
 * @typedef {object} EntranceQualificationApplication
 * @property {string} previousEducation - Example: "HTL" - The students previous education (required)
 * @property {string} electiveSubject - "Medival Literature" - The suggested elective subject for the entrance qualification exam
 */

/**
 * @typedef {object} EntranceQualificationRecognition
 * @property {string} signedBy - Example: "Michael Scott" - Name of the dean that approved the recognition (required)
 */

/**
 * @typedef {object} Agent
 * @property {string} givenName - Example: "James" - Person's first name
 * @property {string} familyName - "Smith" - Person's last name
 */

/**
 * @typedef {object} Communication
 * @property {string} abstract - Example: "Something, something" - Short description or summarization of the conversation or correspondence
 * @property {Agent} agent - The person involved in the correspondence
 * @property {string} dateCreated - Example: "2023-05-15T09:30:45+05:00" - Date, time and timezone of the correspondence action in the iso8601 format
 */

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-minimalSchema" documents
 * @typedef {object} MinimalSchema
 * @property {?string} dateCreated - Example: "1970-01-01" - Date of issue of the physical document in the iso8601 format
 */

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-identityDocument" documents
 * @typedef {object} IdentityDocument
 * @property {string} nationality - Example: "AUT" - Nationality stated in the document
 * @property {string} identifier - Example: "AT-L-123456" - ID number
 * @property {string} dateCreated - Example: "1970-01-01" - Date of issue of the ID in the iso8601 format
 */

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-citizenshipCertificate" documents
 * @typedef {object} CitizenshipCertificate
 * @property {string} nationality - Example: "AUT" - Nationality stated in the document
 * @property {string} dateCreated - Example: "1970-01-01" - Date of issue of the physical document in the iso8601 format
 */

/**
 * File related fields
 * @typedef {object} File
 * @property {?CitizenshipCertificate} file-cabinet-citizenshipCertificate - Citizenship certificate fields
 * @property {?IdentityDocument} file-cabinet-identityDocument - Identity document fields
 * @property {?MinimalSchema} file-cabinet-minimalSchema - Minimal schema fields
 * @property {?Communication} file-cabinet-communication - Communication fields
 * @property {?AdmissionNotice} file-cabinet-admissionNotice - Admission notice fields
 * @property {?EnglMasterApplication} file-cabinet-englMasterApplication - English master's application fields
 * @property {?EnglMasterDataSheet} file-cabinet-englMasterDataSheet - English master's data sheet fields
 * @property {?EntranceQualificationApplication} file-cabinet-entranceQualificationApplication - Entrance qualification application fields
 * @property {?EntranceQualificationRecognition} file-cabinet-entranceQualificationRecognition - Entrance qualification recognition fields
 * @property {FileCommon} base - Fields common to all files
 */

/**
 * Required fields that are not user defined and always need to exist.
 * @typedef {object} HitFields
 * @property {string} id - The unique Typesense ID of the document
 * @property {string} objectType - Either "person" or one of the various "file-*" types
 * @property {Base} base - Fields common to all person and document hits
 */

/**
 * A search result. `@type` is either "Person" or "DocumentFile".
 * @typedef {HitFields & {'@type': string}} Hit
 */

/**
 * A person search result.
 * `person` contains the person-related fields.
 * @typedef {Hit & {person: Person}} PersonHit
 */

/**
 * A document search result.
 * `file` contains the file-related fields.
 * @typedef {PersonHit & {file: File}} DocumentHit
 */

/**
 * @param {object} hit
 * @returns {PersonHit}
 */
export function getPersonHit(hit) {
    console.assert(hit['@type'] === 'Person');
    return /** @type {PersonHit} */ (hit);
}

/**
 * @param {object} hit
 * @returns {DocumentHit}
 */
export function getDocumentHit(hit) {
    console.assert(hit['@type'] === 'DocumentFile');
    return /** @type {DocumentHit} */ (hit);
}

/**
 * @param {DocumentHit} hit
 * @returns {CitizenshipCertificate}
 */
export function getCitizenshipCertificate(hit) {
    console.assert(hit.objectType === 'file-cabinet-citizenshipCertificate');
    return /** @type {CitizenshipCertificate} */ (hit.file['file-cabinet-citizenshipCertificate']);
}

/**
 * @param {DocumentHit} hit
 * @returns {IdentityDocument}
 */
export function getIdentityDocument(hit) {
    console.assert(hit.objectType === 'file-cabinet-identityDocument');
    return /** @type {IdentityDocument} */ (hit.file['file-cabinet-identityDocument']);
}

/**
 * @param {DocumentHit} hit
 * @returns {MinimalSchema}
 */
export function getMinimalSchema(hit) {
    console.assert(hit.objectType === 'file-cabinet-minimalSchema');
    return /** @type {MinimalSchema} */ (hit.file['file-cabinet-minimalSchema']);
}

/**
 * @param {DocumentHit} hit
 * @returns {Communication}
 */
export function getCommunication(hit) {
    console.assert(hit.objectType === 'file-cabinet-communication');
    return /** @type {Communication} */ (hit.file['file-cabinet-communication']);
}

/**
 * @param {DocumentHit} hit
 * @returns {AdmissionNotice}
 */
export function getAdmissionNotice(hit) {
    console.assert(hit.objectType === 'file-cabinet-admissionNotice');
    return /** @type {AdmissionNotice} */ (hit.file['file-cabinet-admissionNotice']);
}

/**
 * @param {DocumentHit} hit
 * @returns {EnglMasterApplication}
 */
export function getEnglMasterApplication(hit) {
    console.assert(hit.objectType === 'file-cabinet-englMasterApplication');
    return /** @type {EnglMasterApplication} */ (hit.file['file-cabinet-englMasterApplication']);
}

/**
 * @param {DocumentHit} hit
 * @returns {EnglMasterDataSheet}
 */
export function getEnglMasterDataSheet(hit) {
    console.assert(hit.objectType === 'file-cabinet-englMasterDataSheet');
    return /** @type {EnglMasterDataSheet} */ (hit.file['file-cabinet-englMasterDataSheet']);
}

/**
 * @param {DocumentHit} hit
 * @returns {EntranceQualificationApplication}
 */
export function getEntranceQualificationApplication(hit) {
    console.assert(hit.objectType === 'file-cabinet-entranceQualificationApplication');
    return /** @type {EntranceQualificationApplication} */ (
        hit.file['file-cabinet-entranceQualificationApplication']
    );
}

/**
 * @param {DocumentHit} hit
 * @returns {EntranceQualificationRecognition}
 */
export function getEntranceQualificationRecognition(hit) {
    console.assert(hit.objectType === 'file-cabinet-entranceQualificationRecognition');
    return /** @type {EntranceQualificationRecognition} */ (
        hit.file['file-cabinet-entranceQualificationRecognition']
    );
}
