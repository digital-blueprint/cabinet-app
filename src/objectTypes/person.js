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

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');
        const data = this.data;

        return html`
            <form>
                <h2>Person Form</h2>
                lang: ${this.lang}<br />
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
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap:10px;
                padding: 15px 5px;
            }
            .person-id {
                display: flex;
                text-align: left;
                align-items: center;
            }
            .person-num{
                display: flex;
            }
            .ais-Hits-content {
                gap: 10px;
                display: flex;
                flex-direction: column;
                word-break: normal;
            }
            .hit-person-content-item1{
                align-self: start;
                font-size:24px;
                font-weight:bold;
            }
            .hit-person-content-item2{
                align-self: start;
            }
            .hit-person-content-item3{
                align-self: start;
            }
            .SyncStatus{
                align-self: flex-end;
            }
            .right-column {
                display: flex;
                text-align: right;
                justify-content: right;
            }
        `;
    }

    render() {
        let hit = /** @type {PersonHit} */(this.data);
        return html`
            <header class="ais-Hits-header">
                <div class="person-id"><!-- studId: ${hit.person.studId}-->
                    ${renderFieldWithHighlight(hit, 'person.studId')}|${renderFieldWithHighlight(hit, 'person.stPersonNr')}
                </div>
                <div class="person-num"><!-- stPersonNr: ${hit.person.stPersonNr}-->

                </div>
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
                <div class="hit-person-content-item1">
                    <!-- familyName: ${hit.person.familyName}-->
                    ${renderFieldWithHighlight(hit, 'person.familyName')},
                    <!-- givenName: ${hit.person.givenName} -->
                    ${renderFieldWithHighlight(hit, 'person.givenName')}<br />
                    <!-- birthDate: ${hit.person.birthDate}-->
                    ${renderFieldWithHighlight(hit, 'person.birthDate')}
                </div><br />
                <div class="hit-person-content-item2">
                    ${hit.person.studies.map(study => html`${study.name} (${study.status.text})<br />`)}
                </div>
                <div class="hit-person-content-item3">
                last synchronized:&nbsp;${Intl.DateTimeFormat('de').format(new Date())}
                <br />
                lang: ${this.lang}
                </div>
            </main>


        `;
    }
}

class CabinetViewElement extends BaseViewElement {
    static get styles() {
        // language=css
        return css`
            ${super.styles}

            .modal-Gi-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .modal-Gi-header-svg {
                    margin-right: 0.5rem;
                }

                .modal-Gi-header-title h4 {
                    margin: 0;
                }
                .info-container {
                    display: flex;
                    justify-content: space-between;
                }
                .info-list {
                    columns: 2;
                    -webkit-columns: 2;
                    -moz-columns: 2;
                    list-style-type: none;
                    padding: 0;
                }
                .info-list li {
                    break-inside: avoid;
                    padding: 5px 0;
                }
                .modal-Si-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .modal-Si-header-svg {
                    margin-right: 0.5rem;
                }
                .modal-Si-header-title h4 {
                    margin: 0;
                }
                .modal-Ci-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .modal-Ci-header-svg {
                    margin-right: 0.5rem;
                }
                .modal-Ci-header-title h4 {
                    margin: 0;
                }

        `;
    }
    render() {
        let hit = /** @type {PersonHit} */ (this.data);
        return html`
            <h2>${hit.person.fullName}</h2>
            lang: ${this.lang}<br />
            <br>
            <div class="modal-Gi-header-container">
            <div class="modal-Gi-header-svg">
                <svg fill="#000000" width="32px" height="32px" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
                <path d="M225.26514,60.20508l-96-32a4.00487,4.00487,0,0,0-2.53028,0l-96,32c-.05713.019-.10815.04809-.16406.06958-.08545.033-.16821.06811-.251.10644a4.04126,4.04126,0,0,0-.415.22535c-.06714.04174-.13575.08007-.20044.12548a3.99,3.99,0,0,0-.47632.39307c-.02027.01953-.0437.0354-.06348.05542a3.97787,3.97787,0,0,0-.44556.53979c-.04077.0586-.07373.12183-.11132.18262a3.99741,3.99741,0,0,0-.23487.43262c-.03613.07837-.06811.15771-.09912.23852a3.96217,3.96217,0,0,0-.144.46412c-.01929.07714-.04126.15234-.05591.2312A3.98077,3.98077,0,0,0,28,64v80a4,4,0,0,0,8,0V69.55005l43.87524,14.625A59.981,59.981,0,0,0,104.272,175.09814a91.80574,91.80574,0,0,0-53.39062,38.71631,3.99985,3.99985,0,1,0,6.70117,4.36914,84.02266,84.02266,0,0,1,140.83447,0,3.99985,3.99985,0,1,0,6.70117-4.36914A91.80619,91.80619,0,0,0,151.728,175.09814a59.981,59.981,0,0,0,24.39673-90.92309l49.14038-16.38013a4.00037,4.00037,0,0,0,0-7.58984ZM180,120A52,52,0,1,1,87.92993,86.85986l38.80493,12.93506a4.00487,4.00487,0,0,0,2.53028,0l38.80493-12.93506A51.85133,51.85133,0,0,1,180,120ZM168.00659,78.44775l-.01294.0044L128,91.7832,44.64893,64,128,36.2168,211.35107,64Z"/>
                </svg>
            </div>
            <div class="modal-Gi-header-title"><h4>General information</h4></div>
            </div>
            <hr/>
            <div class="info-container">
            <ul class="info-list">
                <li><b>academic Titles:</b> ${hit.person.academicTitles.join(', ')}</li>
                <li><b>given Name:</b> ${hit.person.givenName}</li>
                <li><b>family Name:</b> ${hit.person.familyName}</li>
                <li><b>formerFamilyName:</b> ${hit.person.formerFamilyName}</li>
                <li><b>academicTitleFollowing:</b> ${hit.person.academicTitleFollowing}</li>
                <li><b>studId:</b> ${hit.person.studId}</li>
                <li><b>stPersonNr:</b> ${hit.person.stPersonNr}</li>
                <li><b>birthDate:</b> ${hit.person.birthDate}</li>
                <li><b>nationality:</b> ${hit.person.nationality?.text}</li>
                <li><b>nationality Secondary:</b> ${hit.person.nationalitySecondary?.text}</li>
                <li><b>gender:</b> ${hit.person.gender?.text}</li>
                <li><b>social SecurityNr:</b> ${hit.person.socialSecurityNr}</li>
                <li><b>ssPIN:</b> ${hit.person.bpk}</li>
                <li><b>personal Status:</b> ${hit.person.personalStatus?.text}</li>
                <li><b>student Status:</b> ${hit.person.studentStatus?.text}</li>
                <li><b>tuitionStatus:</b> ${hit.person.tuitionStatus}</li>
                <li><b>immatriculation Date:</b> ${hit.person.immatriculationDate}</li>
                <li><b>immatriculationSemester:</b> ${hit.person.immatriculationSemester}</li>
                <li><b>exmatriculation Status:</b> ${hit.person.exmatriculationStatus?.text}</li>
                <li><b>exmatriculation Date:</b> ${hit.person.exmatriculationDate}</li>
                <li><b>admission Qualification Type:</b> ${hit.person.admissionQualificationType?.text}</li>
                <li><b>school Certificate Date:</b> ${hit.person.schoolCertificateDate}</li>
                <li><b>note:</b> ${hit.person.note}</li>

                <!--<li><b>nationalities:</b> {hit.person.nationalities.map(n => n.text).join(', ')}</li>-->
                <!--<li><b>fullName:</b> {hit.person.fullName}</li>-->
                <!--<li><b>person:</b> {hit.person.person}</li>-->
                <!--<li><b>identNrObfuscated:</b> {hit.person.identNrObfuscated}</li>-->
                <!--<li><b>telephoneNumber:</b> {hit.person.telephoneNumber}</li>-->
                <!--<li><b>tuitionExemptionType:</b> {hit.person.tuitionExemptionType}</li>-->
                <!-- <li><b>studyLimitStartSemester:</b> hit.person.studyLimitStartSemester </li> -->
                <!--<li><b>studyLimitEndSemester:</b> {hit.person.studyLimitEndSemester}</li>-->
            </ul>
            </div>
            <br />
            <div class="modal-Si-header-container">
            <div class="modal-Si-header-svg">
                <svg width="32px" height="32px" version="1.1" id="Layer_2_1_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
                <g>
                <path d="M28.2,8.2H81c1.5,0,2.8-1.2,2.8-2.8S82.5,2.7,81,2.7H28.2c-6.1,0-11.1,4.5-11.8,10.4c-0.1,0.2-0.1,0.5-0.1,0.8v74.8
                c0,4.8,3.9,8.7,8.7,8.7h54.1c2,0,3.7-1.7,3.7-3.7V24.8c0-2-1.7-3.7-3.7-3.7H28.2c-3.5,0-6.5-3-6.5-6.5S24.7,8.2,28.2,8.2z
                M28.2,26.6h49.1v65.3H25c-1.8,0-3.2-1.4-3.2-3.2V24.7C23.6,25.9,25.8,26.6,28.2,26.6z"/>
                <path d="M62.7,80.6H37.3c-1.5,0-2.8,1.2-2.8,2.8s1.2,2.8,2.8,2.8h25.3c1.5,0,2.8-1.2,2.8-2.8S64.2,80.6,62.7,80.6z"/>
                <path d="M34.7,44.3h30.5c1.1,0,2-0.9,2-2v-6c0-1.1-0.9-2-2-2H34.7c-1.1,0-2,0.9-2,2v6C32.7,43.4,33.6,44.3,34.7,44.3z"/>
                </g>
                </svg>
            </div>
            <div class="modal-Si-header-title"><h4>Study information</h4></div>
            </div>
            <hr/>

                ${hit.person.studies.map(study => html`
                <li>
                    <ul>
                        <li><b>key:</b> ${study.key}</li>
                        <li><b>name:</b> ${study.name}</li>
                        <li><b>semester:</b> ${study.semester}</li>
                        <li><b>immatriculationDate:</b> ${study.immatriculationDate}</li>
                        <li><b>qualificationType:</b> ${study.qualificationType?.text}</li>
                        <li><b>qualificationDate:</b> ${study.qualificationDate}</li>
                        <li><b>qualificationState:</b> ${study.qualificationState?.text}</li>
                        <li><b>exmatriculationType:</b> ${study.exmatriculationType?.text}</li>
                        <li><b>exmatriculationDate:</b> ${study.exmatriculationDate}</li>
                        <li><b>curriculumVersion:</b> ${study.curriculumVersion}</li>

                        <!--<li><b>coUrl:</b> <a href="${study.coUrl}">${study.coUrl}</a></li>
                        <li><b>id:</b> ${study.id}</li>
                        <li><b>exmatriculationSemester:</b> ${study.exmatriculationSemester}</li>
                        <li><b>immatriculationSemester:</b> ${study.immatriculationSemester}</li>
                        <li><b>status:</b> ${study.status?.text}</li>
                        <li><b>type:</b> ${study.type}</li>
                        <li><b>additionalCertificates:</b> ${study.additionalCertificates.map(c => c.text).join(', ')}</li>-->
                    </ul>
                </li>
                `)}
            </br>
            <div class="modal-Ci-header-container">
            <div class="modal-Ci-header-svg">
                <svg width="32px" height="32px" version="1.1" id="Layer_2_1_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
                <g>
                <path d="M13.7,42.9h13c2.9,0,4.6-1.1,5.5-2c1.9-1.9,2.1-4,2.1-5.5l0-7.9l0.5-0.2h0.5l0.4-0.2c0.1,0,0.3-0.1,0.5-0.2
                c0.4-0.1,0.8-0.2,1.1-0.3c0.1-0.1,0.3-0.1,0.4-0.1l0.5-0.1c5.5-1.3,11.7-1.5,18.9-0.7c3.4,0.2,5.9,0.8,8.5,1.9l0,7.6
                c0,4.7,2.9,7.6,7.6,7.6h13c0.8,0,3.1,0,5.4-2l0.1-0.1c1.5-1.5,2.2-3.4,2-5.4v-7.9c0-2.6-0.8-4.9-2.6-7.4l-0.3-0.3
                c-2.2-2.8-5.2-4.9-10.1-7.1c-6.7-3.2-14.3-5.1-23.9-6l-0.5,0c-2.3-0.1-4.4-0.2-6.4-0.2c-8.8,0-17.5,1.5-25.8,4.4l-1.6,0.7
                c-3.6,1.5-8.1,3.3-11.8,6.7l-0.8,0.8c-2.6,2.7-3.8,5.8-3.6,9.1v4.6H6.1v2.8C6.1,40,9,42.9,13.7,42.9z M13.8,22.7l0.6-0.6
                c3-2.8,6.8-4.3,10.1-5.6l1.5-0.6c7.7-2.7,15.7-4,23.9-4c1.9,0,4,0.1,6.1,0.2l0.4,0c8.9,0.9,15.9,2.7,22.1,5.6
                c4.2,1.9,6.5,3.5,8.2,5.7l0.2,0.2c1,1.5,1.5,2.6,1.5,4v8l0,0.4c0,0.2,0.1,0.5-0.4,0.9c-0.5,0.5-1,0.6-1.7,0.6h-13
                c-1.6,0-2.1-0.5-2.1-2.1v-8c0-2.7-1.6-3.9-2.9-4.5l-0.5-0.2h-0.2c-3.1-1.3-6.1-2-9.9-2.2c-7.8-0.8-14.5-0.5-20.7,0.9l-0.5,0.1
                c-0.3,0.1-0.6,0.2-0.9,0.3c-0.2,0.1-0.5,0.2-0.6,0.2l-0.4,0.1l-0.2,0.1c-0.1,0-0.1,0-0.2,0.1c-0.3,0-0.7,0.1-1.1,0.2h-0.5l-0.6,0.3
                c-0.4,0.2-1,0.5-1.6,1.2c-1,1-1.5,2.2-1.5,3.7v8.2c0,0.8-0.1,1.2-0.5,1.6c-0.1,0.1-0.5,0.4-1.6,0.4h-13c-1.2,0-1.8-0.3-2-1.1v-8.6
                l0-0.1C11.6,25.9,12.3,24.2,13.8,22.7z"/>
                <path d="M98.4,85.5L87,52.8l0-0.1c-0.9-2.4-3.3-4-5.8-4H19.2c-2.5,0-4.9,1.6-5.9,4.1L1.6,85.5l0,0c-0.7,1.9-0.4,4.1,0.8,5.7
                c1.2,1.6,3,2.6,5,2.6h85.2c2,0,3.9-1,5.1-2.6C98.8,89.5,99.1,87.4,98.4,85.5z M93.1,87.9c-0.1,0.1-0.3,0.3-0.6,0.3H7.4
                c-0.1,0-0.3,0-0.5-0.2c-0.1-0.1-0.2-0.3-0.1-0.7l11.7-32.5c0.1-0.3,0.4-0.5,0.7-0.5h61.9c0.3,0,0.6,0.2,0.7,0.5l11.4,32.6
                C93.3,87.6,93.2,87.8,93.1,87.9z"/>
                <path d="M50,60.1c-6.3,0-11.4,5.1-11.4,11.4c0,6.4,5,11.4,11.4,11.4c6.2,0,11.4-5.2,11.4-11.4C61.4,65.2,56.3,60.1,50,60.1z
                M50,77.5c-3.3,0-5.9-2.6-5.9-5.9c0-3.2,2.7-5.9,5.9-5.9c3.2,0,5.9,2.7,5.9,5.9C55.9,74.7,53.2,77.5,50,77.5z"/>
                </g>
                </svg>
            </div>
                <div class="modal-Ci-header-title"><h4>Contact information</h4></div>
            </div>
            <hr/>
                <li><b>emailAddressUniversity:</b> ${hit.person.emailAddressUniversity}</li>
                <li><b>emailAddressConfirmed:</b> ${hit.person.emailAddressConfirmed}</li>
                <li><b>emailAddressTemporary:</b> ${hit.person.emailAddressTemporary}</li></br/>
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

                <!--<li><b>exmatriculationSemester:</b> ${hit.person.exmatriculationSemester}</li>
                <li><b>academicTitlePreceding:</b> ${hit.person.academicTitlePreceding}</li>
                <li><b>coUrl:</b> <a href="${hit.person.coUrl}">${hit.person.coUrl}</a></li>
                <li><b>syncTimestamp:</b> ${new Date(hit.person.syncTimestamp * 1000)}</li>-->
            </ul>
            <!--<h4>Applications</h4>-->
            <!--<ul>
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
            </ul>-->
        `;
    }
}
