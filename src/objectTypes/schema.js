
class KeyedText {
    /** @type {string} */
    key;
    /** @type {string} */
    text;
}

class Address {
    /** @type {string} */
    note;
    /** @type {string} */
    street;
    /** @type {string} */
    place;
    /** @type {string} */
    region;
    /** @type {string} */
    postCode;
    /** @type {KeyedText} */
    country;
    /** @type {string} */
    telephoneNumber;
}

export class Study {
    /** @type {string} */
    id;
    /** @type {string} */
    coUrl;
    /** @type {?string} */
    curriculumVersion;
    /** @type {?string} */
    exmatriculationSemester;
    /** @type {?string} */
    exmatriculationDate;
    /** @type {?KeyedText} */
    exmatriculationType;
    /** @type {?string} */
    immatriculationDate;
    /** @type {?string} */
    immatriculationSemester;
    /** @type {string} */
    key;
    /** @type {string} */
    name;
    /** @type {?string} */
    qualificationDate;
    /** @type {?KeyedText} */
    qualificationState;
    /** @type {?KeyedText} */
    qualificationType;
    /** @type {string} */
    semester;
    /** @type {KeyedText} */
    status;
    /** @type {string} */
    type;
    /** @type {KeyedText[]} */
    additionalCertificates;
}

class Application {
    /** @type {string} */
    id;
    /** @type {?string} */
    studyId;
    /** @type {string} */
    studyKey;
    /** @type {string} */
    studyName;
    /** @type {string} */
    studyType;
    /** @type {string} */
    startSemester;
    /** @type {?string} */
    qualificationCertificateDate;
    /** @type {?KeyedText} */
    qualificationIssuingCountry;
    /** @type {?KeyedText} */
    qualificationType;
}

export class Person {
        /** @type {string} */
        birthDate;
        /** @type {string} */
        familyName;
        /** @type {string} */
        givenName;
        /** @type {string} */
        identNrObfuscated;
        /** @type {string} */
        person;
        /** @type {string} */
        stPersonNr;
        /** @type {string} */
        studId;
        /** @type {string} */
        fullName;
        /** @type {KeyedText} */
        nationality;
        /** @type {?KeyedText} */
        nationalitySecondary;
        /** @type {KeyedText[]} */
        nationalities;
        /** @type {KeyedText} */
        admissionQualificationType;
        /** @type {?string} */
        schoolCertificateDate;
        /** @type {?Address} */
        homeAddress;
        /** @type {?Address} */
        studyAddress;
        /** @type {?string} */
        emailAddressUniversity;
        /** @type {?string} */
        emailAddressConfirmed;
        /** @type {?string} */
        emailAddressTemporary;
        /** @type {KeyedText} */
        personalStatus;
        /** @type {KeyedText} */
        studentStatus;
        /** @type {string} */
        immatriculationDate;
        /** @type {string} */
        immatriculationSemester;
        /** @type {string} */
        exmatriculationDate;
        /** @type {string} */
        exmatriculationSemester;
        /** @type {?KeyedText} */
        exmatriculationStatus;
        /** @type {?string} */
        academicTitlePreceding;
        /** @type {?string} */
        academicTitleFollowing;
        /** @type {string[]} */
        academicTitles;
        /** @type {?string} */
        formerFamilyName;
        /** @type {?string} */
        socialSecurityNr;
        /** @type {?string} */
        bpk;
        /** @type {KeyedText} */
        gender;
        /** @type {string} */
        coUrl;
        /** @type {number} */
        syncTimestamp;
        /** @type {Study[]} */
        studies;
        /** @type {Application[]} */
        applications;
        /** @type {?string} */
        telephoneNumber;
        /** @type {?string} */
        tuitionStatus;
        /** @type {?string} */
        tuitionExemptionType;
        /** @type {?string} */
        note;
        /** @type {?string} */
        studyLimitStartSemester;
        /** @type {?string} */
        studyLimitEndSemester;
}

export class PersonHit {
    /** @type {string} */
    id;
    /** @type {string} */
    objectType;
    /** @type {Person} */
    person;
}
