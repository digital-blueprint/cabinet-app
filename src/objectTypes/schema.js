class Translated {
    /**
     * The unique key of the value
     * @type {string}
     */
    key;

    /**
     * The display text of the value in German
     * @type {string}
     */
    text;

    /**
     * The display text of the value in English
     * @type {string}
     */
    textEn;
}

class Address {
    /**
     * Example: "c/o Erika Mustermann"
     * @type {string}
     */
    note;

    /**
     * Example: "Hauptstraße 42/4"
     * @type {string}
     */
    street;

    /**
     * Example: "Graz"
     * @type {string}
     */
    place;

    /**
     * Example: "Steiermark"
     * @type {string}
     */
    region;

    /**
     * Example: "8010"
     * @type {string}
     */
    postCode;

    /**
     * Example: key="168", text="Österreich"
     * @type {Translated}
     */
    country;

    /**
     * Example: "067612345678"
     * @type {string}
     */
    telephoneNumber;
}

/**
 * A study objects for "@type" == "Person" documents
 */
class Study {
    /**
     * Example: "252221"
     * @type {string}
     */
    id;

    /**
     * URL to CO which leads to the page for the study information
     * @type {string}
     */
    coUrl;

    /**
     * Example: "12U_SPO"
     * @type {?string}
     */
    curriculumVersion;

    /**
     * Example: "24S"
     * @type {?string}
     */
    exmatriculationSemester;

    /**
     * Example: "2010-01-01"
     * @type {?string}
     */
    exmatriculationDate;

    /**
     * Example: key="EZ", text="auf Antrag"
     * @type {?Translated}
     */
    exmatriculationType;

    /**
     * Example: "2010-01-01"
     * @type {?string}
     */
    immatriculationDate;

    /**
     * Example: "20S"
     * @type {?string}
     */
    immatriculationSemester;

    /**
     * Example: key="UF 786 600"
     * @type {string}
     */
    key;

    /**
     * Example: "Dr.-Studium d.technischen Wissenschaften; Architektur"
     * @type {string}
     */
    name;

    /**
     * Example: "2010-01-01"
     * @type {?string}
     */
    qualificationDate;

    /**
     * Example: key="168", text="Österreich"
     * @type {?Translated}
     */
    qualificationState;

    /**
     * Example: key="41", text="Master-/Diplomst.eigene Univ."
     * @type {?Translated}
     */
    qualificationType;

    /**
     * Example: 28
     * @type {number}
     */
    semester;

    /**
     * Examples: key="I", text="geschlossen (Antrag oder ex lege)"
     * @type {Translated}
     */
    status;

    /**
     * Example: "Doktoratsstudium"
     * @type {string}
     */
    type;

    /**
     * Example: key="ZBU", text="Zus.Prfg. - Biologie und Umweltkunde"
     * @type {Translated[]}
     */
    additionalCertificates;
}

class Application {
    /**
     * Example: "30204"
     * @type {string}
     */
    id;

    /**
     * Example: "252221"
     * @type {?string}
     */
    studyId;

    /**
     * Example: "UF 992 840"
     * @type {string}
     */
    studyKey;

    /**
     * Example: "Bachelorstudium; Physik"
     * @type {string}
     */
    studyName;

    /**
     * Example: "Doktoratsstudium"
     * @type {string}
     */
    studyType;

    /**
     * Example: "22W"
     * @type {string}
     */
    startSemester;

    /**
     * Example: "2020-06-29"
     * @type {?string}
     */
    qualificationCertificateDate;

    /**
     * Example: key="40", text="Bosnien und Herzegowina"
     * @type {?Translated}
     */
    qualificationIssuingCountry;

    /**
     * Example: key="25", text="ausländische Reifeprüfung"
     * @type {?Translated}
     */
    qualificationType;
}

/**
 * Person related fields that are common to all Person/DocumentFile documents
 */
class Person {
    /**
     * Example: "123"
     * @type {string}
     */
    stPersonNr;

    /**
     * Example: "01020340". Called "Identifikationsnummer" in CO
     * @type {string}
     */
    studId;

    /**
     * Example: "Max"
     * @type {string}
     */
    givenName;

    /**
     * Example: "Mustermann"
     * @type {string}
     */
    familyName;

    /**
     * Equal to "<familyName>, <givenName>"
     * @type {string}
     */
    fullName;

    /**
     * Equal to "<familyName>, <givenName> (<birthDate>)"
     * @type {string}
     */
    person;

    /**
     * Example: "1970-01-01"
     * @type {string}
     */
    birthDate;

    /**
     * Unix timestamp (UTC was used for converting), for sorting and filtering, ignore the time part
     * @type {number}
     */
    birthDateTimestamp;

    /**
     * Example: "F06BCC80D6FC0BDE575B16FB2E3790D5"
     * @type {string}
     */
    identNrObfuscated;

    /**
     * Example: key="168", text="Österreich"
     * @type {Translated}
     */
    nationality;

    /**
     * Example: key="168", text="Österreich"
     * @type {?Translated}
     */
    nationalitySecondary;

    /**
     * A list containing both person.nationality and person.nationalitySecondary, if available
     * @type {Translated[]}
     */
    nationalities;

    /**
     * Example: key="38", text="Bachelorstud. and. inl. Univ."
     * @type {Translated}
     */
    admissionQualificationType;

    /**
     * Example: "1970-01-01"
     * @type {?string}
     */
    schoolCertificateDate;

    /**
     * Home address of the student
     * @type {?Address}
     */
    homeAddress;

    /**
     * Study address of the student
     * @type {?Address}
     */
    studyAddress;

    /**
     * Example: "max.mustermann@student.tugraz.at"
     * @type {?string}
     */
    emailAddressUniversity;

    /**
     * Example: "max.mustermann@example.com"
     * @type {?string}
     */
    emailAddressConfirmed;

    /**
     * Example: "max.mustermann@example.com"
     * @type {?string}
     */
    emailAddressTemporary;

    /**
     * Example: key="gültige/r Studierende/r", text="gültige/r Studierende/r"
     * @type {Translated}
     */
    personalStatus;

    /**
     * Example: key="O", text="nicht zugelassen" - Called "Hörerstatus" in CO
     * @type {Translated}
     */
    studentStatus;

    /**
     * Example: "1970-01-01"
     * @type {string}
     */
    immatriculationDate;

    /**
     * Example: "22W"
     * @type {string}
     */
    immatriculationSemester;

    /**
     * Example: "2023-10-31"
     * @type {string}
     */
    exmatriculationDate;

    /**
     * Example: "22W"
     * @type {string}
     */
    exmatriculationSemester;

    /**
     * Example: key="EZ", text="ex lege"
     * @type {?Translated}
     */
    exmatriculationStatus;

    /**
     * Example: "Dipl.-Ing. Dr.techn"
     * @type {?string}
     */
    academicTitlePreceding;

    /**
     * Example: "Bakk.techn."
     * @type {?string}
     */
    academicTitleFollowing;

    /**
     * A list containing both academicTitlePreceding and academicTitleFollowing, if available
     * @type {string[]}
     */
    academicTitles;

    /**
     * Example: "Maier"
     * @type {?string}
     */
    formerFamilyName;

    /**
     * Example: "1234010197"
     * @type {?string}
     */
    socialSecurityNr;

    /**
     * Example: "Kxl/ufp/HOufd8y/+3n6qZ1Cn7E="
     * @type {?string}
     */
    bpk;

    /**
     * Example: key="W", text="Weiblich"
     * @type {Translated}
     */
    gender;

    /**
     * URL to CO which leads to the page for editing the person information
     * @type {string}
     */
    coUrl;

    /**
     * Unix timestamp when the data was last synced from CO
     * @type {number}
     */
    syncTimestamp;

    /**
     * Example: "067612345678"
     * @type {?string}
     */
    telephoneNumber;

    /**
     * Example: "Ausländer gleichgestellt" - Called "Beitragsstatus" in CO
     * @type {?string}
     */
    tuitionStatus;

    /**
     * Example: "L Lehrgang" - Called "Befreiungsart" in CO
     * @type {?string}
     */
    tuitionExemptionType;

    /**
     * Free form text
     * @type {?string}
     */
    note;

    /**
     * Example: "23W" - Called "Befristet von" in CO
     * @type {?string}
     */
    studyLimitStartSemester;

    /**
     * Example: "24S" - Called "Befristet bis" in CO
     * @type {?string}
     */
    studyLimitEndSemester;

    /**
     * A list of all study objects
     * @type {Study[]}
     */
    studies;

    /**
     * A list of all application objects
     * @type {Application[]}
     */
    applications;
}

/**
 * Fields for all "@type" == "DocumentFile" documents related to the file itself
 */
class FileBase {
    /**
     * Example: "cabinet-bucket" - Currently the external blob bucket name
     * @type {string}
     */
    fileSource;

    /**
     * Example: "application/pdf"
     * @type {string}
     */
    mimeType;

    /**
     * Example: 1729607133 - The unix timestamp of the blob file creation
     * @type {number}
     */
    createdTimestamp;

    /**
     * Example: 1729607133 - The unix timestamp of the last blob file/metadata modification
     * @type {number}
     */
    modifiedTimestamp;

    /**
     * Examples: "0192b49e-6abd-7db5-9cb1-f743bbd78c18" - The blob file ID
     * @type {string}
     */
    fileId;

    /**
     * Example: "detailed_article_2.pdf" - The filename of the blob file
     * @type {string}
     */
    fileName;

    /**
     * Example: 1729607133 - The unix timestamp for when the file will be deleted
     * @type {number}
     */
    deleteAtTimestamp;

    /**
     * Example: 4854261742 - The unix timestamp for when the file should be deleted by the user
     * @type {?number}
     */
    recommendedDeletionTimestamp;

    /**
     * Example: 4854261742 - The unix timestamp for when the file should be archived
     * @type {?number}
     */
    recommendedArchivalTimestamp;
}

/**
 * Fields for all "@type" == "DocumentFile" documents related to the file content
 */
class FileCommon extends FileBase {
    /**
     * Example: key="AdmissionNotice", text="Zulassungsbescheid"
     * @type {Translated}
     */
    additionalType;

    /**
     * Example: "foobar" - ID for grouping multiple versions of the same document
     * @type {?string}
     */
    groupId;

    /**
     * Example: Optional comment about the described entity
     * @type {?string}
     */
    comment;

    /**
     * Example: ["generalApplications-archive-3"] - A list of assigned
     * processes, e.i. purposses of storing, to which this entity is assigned
     * to. Every document needs at least one of the values to be assigned.
     * @type {string[]}
     */
    isPartOf;

    /**
     * "UF 033 243" - Study field that the described document applies to. The
     * key is either the study field key or the value 'Unspecified'. The value
     * is the study field named that the described document applies to.
     * @type {Translated}
     */
    studyField;

    /**
     * Example: "GZ 2021-0.123.456" - Optional attribute containing a registry key of a case aka the 'Geschäftszahl'
     * @type {?string}
     */
    subjectOf;

    /**
     * Example: "24S" - The semester that the described document applies to
     * @type {string}
     */
    semester;

    /**
     * Example: "archival" - Either "archival" or "deletion"
     * @type {"archival"|"deletion"}
     */
    disposalType;
}

/**
 * Fields that are common to all Person/DocumentFile documents
 */
class Base {
    /**
     * An ID for grouping person and study objects, which is not set for DocumentFile documents
     * @type {?string}
     */
    personGroupId;

    /**
     * Example: true - true for all files that have a deleteAtTimestamp, false otherwise
     * @type {boolean}
     */
    isScheduledForDeletion;

    /**
     * Indicates whether the object has been superseded by another.
     * @type {boolean}
     */
    isCurrent;
}

class AdmissionNotice {
    /**
     * Example: "1970-01-01" - Date of the student's application in the iso8601 format
     * @type {string}
     */
    dateCreated;

    /**
     * Example: "Something" - Name of the study programme the student graduated in
     * @type {string}
     */
    previousStudy;

    /**
     * "rejected" - The registrar's office decision about the admission (required)
     * @type {"string"}
     */
    decision;
}

class Agent {
    /**
     * Example: "James" - Person's first name
     * @type {string}
     */
    givenName;

    /**
     * "Smith" - Person's last name
     * @type {string}
     */
    familyName;
}

class Communication {
    /**
     * Example: "Something, something" - Short description or summarization of the conversation or correspondence
     * @type {string}
     */
    abstract;

    /** @type {Agent} */
    agent;

    /**
     * Example: "2023-05-15T09:30:45+05:00" - Date, time and timezone of the correspondence action in the iso8601 format
     * @type {string}
     */
    dateCreated;
}

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-minimalSchema" documents
 */
class MinimalSchema {
    /**
     * Example: "1970-01-01" - Date of issue of the physical document in the iso8601 format
     * @type {?string}
     */
    dateCreated;
}

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-identityDocument" documents
 */
class IdentityDocument {
    /**
     * Example: "AUT" - Nationality stated in the document
     * @type {string}
     */
    nationality;

    /**
     * Example: "AT-L-123456" - ID number
     * @type {string}
     */
    identifier;

    /**
     * Example: "1970-01-01" - Date of issue of the ID in the iso8601 format
     * @type {string}
     */
    dateCreated;
}

/**
 * Fields for all "@type" == "DocumentFile" and objectType == "file-cabinet-citizenshipCertificate" documents
 */
class CitizenshipCertificate {
    /**
     * Example: "AUT" - Nationality stated in the document
     * @type {string}
     */
    nationality;

    /**
     * Example: "1970-01-01" - Date of issue of the physical document in the iso8601 format
     * @type {string}
     */
    dateCreated;
}

/**
 * File related fields
 */
class File {
    constructor() {
        /** @type {?CitizenshipCertificate} */
        this['file-cabinet-citizenshipCertificate'] = undefined;
        /** @type {?IdentityDocument} */
        this['file-cabinet-identityDocument'] = undefined;
        /** @type {?MinimalSchema} */
        this['file-cabinet-minimalSchema'] = undefined;
        /** @type {?Communication} */
        this['file-cabinet-communication'] = undefined;
        /** @type {?AdmissionNotice} */
        this['file-cabinet-admissionNotice'] = undefined;
    }

    /** @type {FileCommon} */
    base;
}

/**
 * Required fields that are not user defined and always need to exist.
 */
class Hit {
    constructor() {
        /**
         * Either "Person" or "DocumentFile"
         * @type {string}
         */
        this['@type'] = undefined;
    }

    /**
     * The unique typesense ID of the document
     * @type {string}
     */
    id;

    /**
     * Either "person" or various "file-*"
     * @type {string}
     */
    objectType;

    /** @type {Base} */
    base;
}

export class PersonHit extends Hit {
    /** @type {Person} */
    person;
}

export class DocumentHit extends PersonHit {
    /** @type {File} */
    file;
}

/**
 * @param {object} hit
 * @returns {PersonHit}
 */
export function getPersonHit(hit) {
    console.assert(hit['@type'] === 'Person');
    return hit;
}

/**
 * @param {object} hit
 * @returns {DocumentHit}
 */
export function getDocumentHit(hit) {
    console.assert(hit['@type'] === 'DocumentFile');
    return hit;
}

/**
 * @param {DocumentHit} hit
 * @returns {CitizenshipCertificate}
 */
export function getCitizenshipCertificate(hit) {
    console.assert(hit.objectType === 'file-cabinet-citizenshipCertificate');
    return hit.file['file-cabinet-citizenshipCertificate'];
}

/**
 * @param {DocumentHit} hit
 * @returns {IdentityDocument}
 */
export function getIdentityDocument(hit) {
    console.assert(hit.objectType === 'file-cabinet-identityDocument');
    return hit.file['file-cabinet-identityDocument'];
}

/**
 * @param {DocumentHit} hit
 * @returns {MinimalSchema}
 */
export function getMinimalSchema(hit) {
    console.assert(hit.objectType === 'file-cabinet-minimalSchema');
    return hit.file['file-cabinet-minimalSchema'];
}

/**
 * @param {DocumentHit} hit
 * @returns {Communication}
 */
export function getCommunication(hit) {
    console.assert(hit.objectType === 'file-cabinet-communication');
    return hit.file['file-cabinet-communication'];
}

/**
 * @param {DocumentHit} hit
 * @returns {AdmissionNotice}
 */
export function getAdmissionNotice(hit) {
    console.assert(hit.objectType === 'file-cabinet-admissionNotice');
    return hit.file['file-cabinet-admissionNotice'];
}
