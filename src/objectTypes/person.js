import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';
import {renderFieldWithHighlight} from '../utils';

export default class extends BaseObject {
    name = 'person';

    getFormComponent() {
        return CabinetFormElement;
    }

    getHitComponent() {
        return CabinetHitElement;
    }

    getViewComponent() {
        return CabinetViewElement;
    }
}

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

class Study {
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

class Person {
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

class PersonHit {
    /** @type {string} */
    id;
    /** @type {string} */
    objectType;
    /** @type {Person} */
    person;
}

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');
        const data = this.data;

        return html`
            <form>
                <h2>Person Form</h2>
                lang: ${this.lang}<br />
                user-id: ${this.userId}<br />
                <fieldset>
                    <legend>Firstname</legend>
                    <input type="text" id="firstname" name="firstname" value="${data.person.givenName}" required>
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input type="text" id="lastname" name="lastname" value="${data.person.familyName}" required>
                    <label for="lastname">Lastname</label>
                </fieldset>

                <button class="button is-primary" type="submit">Submit</button>
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            h2 {
                color: #222120;
            }
            .ais-Hits-header {
                border-bottom: 1px solid #222120;
                margin-bottom: calc(7px + 1vh);
                padding-bottom:15px;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap:10px;
                padding: 5px;
            }
            .ais-Hits-content {
                gap: 10px;
                display: grid;
                grid-template-rows: repeat(3, 1fr);
            }
            .hit-person-content-item3 {
                /* grid-row: 3/3; */
            }
            .right-column {
                text-align: right;

            }
        `;
    }

    render() {
        let hit = /** @type {PersonHit} */(this.data);
        return html`
            <header class="ais-Hits-header">
                <h2>studId</h2>
                <h2>stPersonNr</h2>
                <div class="right-column">
                    <svg width="1.4em" height="1.4em" viewBox="0 0 30 30"
                        version="1.1"
                        id="svg1"
                        xml:space="preserve"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:svg="http://www.w3.org/2000/svg"><defs
                            id="defs1" /><g
                            id="layer1"
                            transform="translate(-92.043131,-137.65208)"><g
                            id="g1"
                            transform="matrix(0.26458333,0,0,0.26458333,91.723384,135.27083)"><path
                                class="st0"
                                d="M 8.5,87.7"
                                id="path1" /><g
                                id="g3">
                            <path
                        d="M 50,57 C 63.2,57 74,46.2 74,33 74,19.8 63.2,9 50,9 36.8,9 26,19.7 26,33 26,46.3 36.8,57 50,57 Z M 50,14.5 C 60.2,14.5 68.5,22.8 68.5,33 68.5,43.2 60.2,51.5 50,51.5 39.8,51.5 31.5,43.2 31.5,33 31.5,22.8 39.8,14.5 50,14.5 Z"
                        id="path2"
                        style="fill:#9e1e4d;fill-opacity:1" />
                            <path
                        d="M 97.9,86.2 C 84.7,74.5 67.7,68 50,68 32.3,68 15.3,74.5 2.1,86.2 c -1.1,1 -1.2,2.7 -0.2,3.9 1,1.1 2.7,1.2 3.9,0.2 C 17.9,79.5 33.7,73.5 50,73.5 c 16.3,0 32.1,6 44.3,16.8 0.5,0.5 1.2,0.7 1.8,0.7 0.8,0 1.5,-0.3 2.1,-0.9 1,-1.1 0.9,-2.9 -0.3,-3.9 z"
                        id="path3"
                        style="fill:#9e1e4d;fill-opacity:1" />
                        </g></g></g>
                        <style
                            type="text/css"
                            id="style1">
                            .st0{fill:none;stroke:#000000;stroke-width:5;stroke-miterlimit:10;}
                        </style>
                    </svg>
                </div>
            </header>
            <main class="ais-Hits-content">
                <div>lang: ${this.lang}</div>
                <!-- givenName: ${hit.person.givenName}<br /> -->
                <div>givenName: ${renderFieldWithHighlight(hit, 'person.givenName')}</div>
                <!-- familyName: ${hit.person.familyName}<br /> -->
                <div>familyName: ${renderFieldWithHighlight(hit, 'person.familyName')}</div>
                <!-- birthDate: ${hit.person.birthDate}<br /> -->
                <div>${renderFieldWithHighlight(hit, 'person.birthDate')}</div>
                <div>
                    <div><b>study:</b></div>
                    <div><b>semester:</b></div>
                </div>
                <div class="hit-person-content-item3">
                    <b>syncTimestamp:</b> ${new Date(hit.person.syncTimestamp * 1000)}
                </div>
            </main>
        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    render() {
        let hit = /** @type {PersonHit} */ (this.data);
        return html`
            <h2>Person</h2>
            lang: ${this.lang}<br />
            <br>
            <h4>Person</h4>
            <ul>
                <li><b>stPersonNr:</b> ${hit.person.stPersonNr}</li>
                <li><b>studId:</b> ${hit.person.studId}</li>
                <li><b>givenName:</b> ${hit.person.givenName}</li>
                <li><b>familyName:</b> ${hit.person.familyName}</li>
                <li><b>fullName:</b> ${hit.person.fullName}</li>
                <li><b>person:</b> ${hit.person.person}</li>
                <li><b>birthDate:</b> ${hit.person.birthDate}</li>
                <li><b>identNrObfuscated:</b> ${hit.person.identNrObfuscated}</li>
                <li><b>nationality:</b> ${hit.person.nationality?.text}</li>
                <li><b>nationalitySecondary:</b> ${hit.person.nationalitySecondary?.text}</li>
                <li><b>nationalities:</b> ${hit.person.nationalities.map(n => n.text).join(', ')}</li>
                <li><b>admissionQualificationType:</b> ${hit.person.admissionQualificationType?.text}</li>
                <li><b>schoolCertificateDate:</b> ${hit.person.schoolCertificateDate}</li>
                <li><b>telephoneNumber:</b> ${hit.person.telephoneNumber}</li>
                <li><b>tuitionStatus:</b> ${hit.person.tuitionStatus}</li>
                <li><b>tuitionExemptionType:</b> ${hit.person.tuitionExemptionType}</li>
                <li><b>note:</b> ${hit.person.note}</li>
                <li><b>studyLimitStartSemester:</b> ${hit.person.studyLimitStartSemester}</li>
                <li><b>studyLimitEndSemester:</b> ${hit.person.studyLimitEndSemester}</li>
                <li><b>homeAddress:</b>
                    <ul>
                        <li><b>note:</b> ${hit.person.homeAddress?.note}</li>
                        <li><b>street:</b> ${hit.person.homeAddress?.street}</li>
                        <li><b>place:</b> ${hit.person.homeAddress?.place}</li>
                        <li><b>region:</b> ${hit.person.homeAddress?.region}</li>
                        <li><b>postCode:</b> ${hit.person.homeAddress?.postCode}</li>
                        <li><b>country:</b> ${hit.person.homeAddress?.country?.text}</li>
                        <li><b>telephoneNumber:</b> ${hit.person.homeAddress?.telephoneNumber}</li>
                    </ul>
                </li>
                <li><b>studyAddress:</b>
                    <ul>
                        <li><b>note:</b> ${hit.person.studyAddress?.note}</li>
                        <li><b>street:</b> ${hit.person.studyAddress?.street}</li>
                        <li><b>place:</b> ${hit.person.studyAddress?.place}</li>
                        <li><b>region:</b> ${hit.person.studyAddress?.region}</li>
                        <li><b>postCode:</b> ${hit.person.studyAddress?.postCode}</li>
                        <li><b>country:</b> ${hit.person.studyAddress?.country?.text}</li>
                        <li><b>telephoneNumber:</b> ${hit.person.studyAddress?.telephoneNumber}</li>
                    </ul>
                </li>
                <li><b>emailAddressUniversity:</b> ${hit.person.emailAddressUniversity}</li>
                <li><b>emailAddressConfirmed:</b> ${hit.person.emailAddressConfirmed}</li>
                <li><b>emailAddressTemporary:</b> ${hit.person.emailAddressTemporary}</li>
                <li><b>personalStatus:</b> ${hit.person.personalStatus?.text}</li>
                <li><b>studentStatus:</b> ${hit.person.studentStatus?.text}</li>
                <li><b>immatriculationDate:</b> ${hit.person.immatriculationDate}</li>
                <li><b>immatriculationSemester:</b> ${hit.person.immatriculationSemester}</li>
                <li><b>exmatriculationDate:</b> ${hit.person.exmatriculationDate}</li>
                <li><b>exmatriculationSemester:</b> ${hit.person.exmatriculationSemester}</li>
                <li><b>exmatriculationStatus:</b> ${hit.person.exmatriculationStatus?.text}</li>
                <li><b>academicTitlePreceding:</b> ${hit.person.academicTitlePreceding}</li>
                <li><b>academicTitleFollowing:</b> ${hit.person.academicTitleFollowing}</li>
                <li><b>academicTitles:</b> ${hit.person.academicTitles.join(', ')}</li>
                <li><b>formerFamilyName:</b> ${hit.person.formerFamilyName}</li>
                <li><b>socialSecurityNr:</b> ${hit.person.socialSecurityNr}</li>
                <li><b>bpk:</b> ${hit.person.bpk}</li>
                <li><b>gender:</b> ${hit.person.gender?.text}</li>
                <li><b>coUrl:</b> <a href="${hit.person.coUrl}">${hit.person.coUrl}</a></li>
                <li><b>syncTimestamp:</b> ${new Date(hit.person.syncTimestamp * 1000)}</li>
            </ul>
            <h4>Studies</h4>
            <ul>
                ${hit.person.studies.map(study => html`
                <li>
                    <ul>
                        <li><b>coUrl:</b> <a href="${study.coUrl}">${study.coUrl}</a></li>
                        <li><b>id:</b> ${study.id}</li>
                        <li><b>curriculumVersion:</b> ${study.curriculumVersion}</li>
                        <li><b>exmatriculationSemester:</b> ${study.exmatriculationSemester}</li>
                        <li><b>exmatriculationDate:</b> ${study.exmatriculationDate}</li>
                        <li><b>exmatriculationType:</b> ${study.exmatriculationType?.text}</li>
                        <li><b>immatriculationDate:</b> ${study.immatriculationDate}</li>
                        <li><b>immatriculationSemester:</b> ${study.immatriculationSemester}</li>
                        <li><b>key:</b> ${study.key}</li>
                        <li><b>name:</b> ${study.name}</li>
                        <li><b>qualificationDate:</b> ${study.qualificationDate}</li>
                        <li><b>qualificationState:</b> ${study.qualificationState?.text}</li>
                        <li><b>qualificationType:</b> ${study.qualificationType?.text}</li>
                        <li><b>semester:</b> ${study.semester}</li>
                        <li><b>status:</b> ${study.status?.text}</li>
                        <li><b>type:</b> ${study.type}</li>
                        <li><b>additionalCertificates:</b> ${study.additionalCertificates.map(c => c.text).join(', ')}</li>
                    </ul>
                </li>
                `)}
            </ul>
            <h4>Applications</h4>
            <ul>
                ${hit.person.applications.map(application => html`
                <li>
                    <ul>
                        <li><b>id:</b> ${application.id}</li>
                        <li><b>studyId:</b> ${application.studyId}</li>
                        <li><b>studyKey:</b> ${application.studyKey}</li>
                        <li><b>studyName:</b> ${application.studyName}</li>
                        <li><b>studyType:</b> ${application.studyType}</li>
                        <li><b>startSemester:</b> ${application.startSemester}</li>
                        <li><b>qualificationCertificateDate:</b> ${application.qualificationCertificateDate}</li>
                        <li><b>qualificationIssuingCountry:</b> ${application.qualificationIssuingCountry?.text}</li>
                        <li><b>qualificationType:</b> ${application.qualificationType?.text}</li>
                    </ul>
                </li>
                `)}
            </ul>
        `;
    }
}
