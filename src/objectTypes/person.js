import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from './baseObject';

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
    postCode;
    /** @type {KeyedText} */
    country;
}

class BaseHit {
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
}

class Study {
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
}

class Application {
    /** @type {string} */
    studyKey;
    /** @type {string} */
    studyName;
    /** @type {string} */
    studyType;
}

class Person {
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
        studAddress;
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
}

class PersonHit {
    /** @type {string} */
    id;
    /** @type {string} */
    objectType;
    /** @type {BaseHit} */
    base;
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
                    <input type="text" id="firstname" name="firstname" value="${data.base.givenName}" required>
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input type="text" id="lastname" name="lastname" value="${data.base.familyName}" required>
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
                color: #f3aa13;
            }
        `;
    }

    render() {
        let hit = /** @type {PersonHit} */ (this.data);
        return html`
            <h2>Person</h2>
            lang: ${this.lang}<br />
            givenName: ${hit.base.givenName}<br />
            familyName: ${hit.base.familyName}<br />
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
            <h4>Base</h4>
            <ul>
                <li><b>stPersonNr:</b> ${hit.base.stPersonNr}</li>
                <li><b>studId:</b> ${hit.base.studId}</li>
                <li><b>givenName:</b> ${hit.base.givenName}</li>
                <li><b>familyName:</b> ${hit.base.familyName}</li>
                <li><b>fullName:</b> ${hit.base.fullName}</li>
                <li><b>person:</b> ${hit.base.person}</li>
                <li><b>birthDate:</b> ${hit.base.birthDate}</li>
                <li><b>identNrObfuscated:</b> ${hit.base.identNrObfuscated}</li>
            </ul>
            <h4>Person</h4>
            <ul>
                <li><b>nationality:</b> ${hit.person.nationality?.text}</li>
                <li><b>nationalitySecondary:</b> ${hit.person.nationalitySecondary?.text}</li>
                <li><b>nationalities:</b> ${hit.person.nationalities.map(n => n.text).join(', ')}</li>
                <li><b>admissionQualificationType:</b> ${hit.person.admissionQualificationType?.text}</li>
                <li><b>schoolCertificateDate:</b> ${hit.person.schoolCertificateDate}</li>
                <li><b>homeAddress:</b>
                    <ul>
                        <li><b>note:</b> ${hit.person.homeAddress?.note}</li>
                        <li><b>street:</b> ${hit.person.homeAddress?.street}</li>
                        <li><b>place:</b> ${hit.person.homeAddress?.place}</li>
                        <li><b>postCode:</b> ${hit.person.homeAddress?.postCode}</li>
                        <li><b>country:</b> ${hit.person.homeAddress?.country?.text}</li>
                    </ul>
                </li>
                <li><b>studAddress:</b>
                    <ul>
                        <li><b>note:</b> ${hit.person.studAddress?.note}</li>
                        <li><b>street:</b> ${hit.person.studAddress?.street}</li>
                        <li><b>place:</b> ${hit.person.studAddress?.place}</li>
                        <li><b>postCode:</b> ${hit.person.studAddress?.postCode}</li>
                        <li><b>country:</b> ${hit.person.studAddress?.country?.text}</li>
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
                    </ul>
                </li>
                `)}
            </ul>
            <h4>Applications</h4>
            <ul>
                ${hit.person.applications.map(study => html`
                <li>
                    <ul>
                        <li><b>studyKey:</b> ${study.studyKey}</li>
                        <li><b>studyName:</b> ${study.studyName}</li>
                        <li><b>studyType:</b> ${study.studyType}</li>
                    </ul>
                </li>
                `)}
            </ul>
        `;
    }
}
