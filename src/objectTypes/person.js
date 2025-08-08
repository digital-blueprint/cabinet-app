import {css, html} from 'lit';
import {BaseObject, BaseFormElement, BaseHitElement, BaseViewElement} from '../baseObject.js';
import {renderFieldWithHighlight} from '../utils';
import {formatDate} from '../utils.js';
import {MiniSpinner, Icon} from '@dbp-toolkit/common';
import {send} from '@dbp-toolkit/common/notification';
import {Notification} from '@dbp-toolkit/notification';
import {getPersonHit, PersonHit} from './schema.js';
import {CabinetApi} from '../api.js';

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

/**
 * Wait for a window to close
 * @param {Window} windowRef
 * @returns {Promise<void>}
 */
function waitForWindowClose(windowRef) {
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            if (windowRef.closed) {
                clearInterval(timer);
                resolve();
            }
        }, 500);
    });
}

class CabinetFormElement extends BaseFormElement {
    render() {
        console.log('-- Render CabinetFormElement --');
        let hit = getPersonHit(this.data);

        return html`
            <form>
                <h2>Person Form</h2>
                lang: ${this.lang}
                <br />
                <fieldset>
                    <legend>Firstname</legend>
                    <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value="${hit.person.givenName}"
                        required />
                    <label for="firstname">Firstname</label>
                </fieldset>

                <fieldset>
                    <legend>Lastname</legend>
                    <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value="${hit.person.familyName}"
                        required />
                    <label for="lastname">Lastname</label>
                </fieldset>

                <button class="button is-primary" type="submit">Submit</button>
            </form>
        `;
    }
}

class CabinetHitElement extends BaseHitElement {
    static get styles() {
        return [
            ...super.styles,
            // language=css
            css`
                :host {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                h2 {
                    color: #222120;
                }

                .ais-Hits-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    align-items: center;
                    padding: 10px 5px;
                    margin-bottom: calc(7px + 1vh);
                    background-color: var(--dbp-primary-surface);
                }

                .hit-person-info-header {
                    display: flex;
                    align-items: center;
                    font-size: 18px;
                    font-weight: bold;
                    color: white;
                }

                .hit-person-info-header .person-name,
                .person-birthdate {
                    margin-right: 10px;
                    color: white;
                    font-size: 1em;
                    font-weight: 600;
                }

                .ais-Hits-header ::selection {
                    background: var(--dbp-on-primary-surface);
                    color: var(--dbp-primary-surface);
                }

                .hit-right-wrapper {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                }

                .person-id,
                .person-birthdate {
                    color: white;
                    gap: 0.5em;
                    margin: 0;
                    font-size: 1em;
                }

                .right-column {
                    display: flex;
                    align-items: center;
                    padding-right: 0.5em;
                    padding-bottom: 0.5em;
                }

                .column-icon {
                    width: 25px;
                    height: 25px;
                    background-repeat: no-repeat;
                    background-size: contain;
                    background-position-x: right;
                    color: #ffffff;
                }

                .ais-Hits-content {
                    gap: 20px;
                    display: flex;
                    flex-direction: column;
                    word-break: normal;
                    flex-grow: 1;
                    justify-content: space-between;
                }

                .hit-person-content-item1 {
                    align-self: start;
                    color: var(--dbp-content);
                    padding-bottom: 1em;
                }

                .study-entry {
                    display: flex;
                    margin-bottom: 4px;
                }

                .study-icon {
                    margin-right: 6px;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .count {
                    padding-top: 1em;
                }

                .hit-person-row {
                    display: flex;
                    align-items: center;
                    justify-content: end;
                }

                .hit-person-last-modify-content {
                    flex: 1;
                    color: var(--dbp-content);
                }

                .hits-person-footer {
                    display: grid;
                    grid-template-columns: repeat(3, auto);
                    gap: 5px;
                    align-items: end;
                }

                .sr-only {
                    display: none;
                }

                @media (max-width: 768px) {
                    .hit-person-info-header {
                        display: flex;
                        align-items: center;
                        flex-wrap: wrap;
                    }

                    .right-column {
                        order: 0;
                    }

                    .person-name {
                        order: 1;
                    }

                    .person-birthdate {
                        order: 2;
                        flex-basis: 100%;
                        font-weight: normal;
                    }

                    .hit-right-wrapper {
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                        height: 100%;
                        align-items: end;
                    }

                    .person-id {
                        display: inline-flex;
                        align-items: center;
                        margin-right: 0;
                    }

                    .hit-person-row {
                        display: grid;
                        grid-template-columns: 1fr;
                        grid-template-rows: auto auto;
                    }

                    .hits-person-footer {
                        justify-content: normal;
                    }
                }

                @media (min-width: 769px) and (max-width: 1099px) {
                    .ais-Hits-header {
                        align-items: normal;
                    }

                    .hit-right-wrapper {
                        align-items: end;
                    }

                    .hit-person-info-header {
                        display: grid;
                        grid-template-columns: auto auto;
                        grid-template-rows: auto auto;
                    }
                    .right-column {
                        grid-column: 1;
                        grid-row: 1;
                    }

                    .person-name {
                        grid-column: 1;
                        grid-row: 1;
                        padding-left: 2em;
                    }

                    .person-birthdate {
                        grid-column: 1;
                        grid-row: 2;
                    }

                    .hit-person-row {
                        display: grid;
                        grid-template-columns: 1fr;
                        grid-template-rows: auto auto;
                    }

                    .person-id {
                        display: inline-flex;
                        align-items: end;
                        margin-right: 0;
                    }

                    .hits-person-footer {
                        justify-content: normal;
                    }
                }

                @media (min-width: 380px) and (max-width: 489px) {
                    .hits-person-footer {
                        display: grid;
                        grid-template-columns: auto auto;
                        grid-template-rows: auto auto;
                        gap: 0.5em;
                        align-items: center;
                    }

                    .hits-person-footer button:nth-child(1) {
                        grid-column: 1 / span 2;
                        grid-row: 1;
                    }

                    .hits-person-footer button:nth-child(2) {
                        grid-column: 1;
                        grid-row: 2;
                    }

                    .hits-person-footer button:nth-child(3) {
                        grid-column: 2;
                        grid-row: 2;
                    }
                }
            `,
        ];
    }

    render() {
        let hit = getPersonHit(this.data);
        const i18n = this._i18n;
        const studies = hit.person.studies || [];
        const sortedStudies = studies.sort((a, b) => {
            const dateA = a.immatriculationDate
                ? new Date(a.immatriculationDate).getTime()
                : Infinity;
            const dateB = b.immatriculationDate
                ? new Date(b.immatriculationDate).getTime()
                : Infinity;
            return dateB - dateA;
        });
        const maxStudies = 3;
        const displayedStudies = studies.slice(0, maxStudies);
        const extraCount = sortedStudies.length - maxStudies;
        const focusButtonLabel = this.data.isFiltered
            ? i18n.t('unselect-button-name')
            : i18n.t('focus-button-name');
        return html`
           
            <header class="ais-Hits-header" tabindex="0" @keydown=${(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // no scrolling with space
                    this.dispatchEvent(
                        new CustomEvent('DbpCabinetDocumentView', {
                            detail: {hit: hit},
                            bubbles: true,
                            composed: true,
                        }),
                    );
                }
            }}>
                <div class="hit-person-info-header">
                    <div class="right-column">
                        <dbp-icon
                            class="column-icon"
                            name="user"
                            aria-hidden="true"
                            <!--  aria-label="Person hit box symbol"}-->
                            title="Person hit box symbol"></dbp-icon>
                    </div>
                    <h2 class="person-name" aria-label="${i18n.t('full-family-name')} ${hit.person.familyName},${hit.person.givenName}">
                        <!-- familyName: ${hit.person.familyName}-->
                        ${renderFieldWithHighlight(hit, 'person.familyName')},
                        <!-- givenName: ${hit.person.givenName} -->
                        ${renderFieldWithHighlight(hit, 'person.givenName')}
                    </h2>
                    <h3 class="person-birthdate" aria-label="${i18n.t('birth-date')} ${hit.person.birthDateDe}">
                        <!-- birthDate: ${hit.person.birthDateDe}-->
                        ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
                    </h3>
                </div>
                </div>
                <div class="hit-right-wrapper">
                    <h3 class="person-id" aria-label="${i18n.t('st-PersonNr')} ${hit.person.studId}">
                        <!-- studId: ${hit.person.studId}-->
                        <span>${renderFieldWithHighlight(hit, 'person.studId')}</span>
                        |
                        <span>${renderFieldWithHighlight(hit, 'person.stPersonNr')}</span>
                    </h3>
                </div>
            </header>
            <main class="ais-Hits-content">
                <div class="hit-person-content-item1">
                    ${
                        studies.length > 0
                            ? html`
                                  ${displayedStudies.map(
                                      (study) => html`
                                      <div class="study-entry">
                                          <dbp-icon
                                              name="chevron-right-circle"
                                              class="study-icon"
                                              aria-hidden="true"
                                              <!--  aria-label="Study icon"-->
                                              title="Study icon"></dbp-icon>
                                          <span>${study.name} (${study.status.text})</span>
                                      </div>
                                  `,
                                  )}
                                  ${extraCount > 0
                                      ? html`
                                            <span>${extraCount}&nbsp;${i18n.t('person-hit')}</span>
                                        `
                                      : ''}
                              `
                            : html`
                                  — —
                              `
                    }
                </div>
            </main>

            <div class="hit-person-row">
                <footer class="hits-person-footer">
                    <button
                        class="button"
                        aria-label="${i18n.t('buttons.add.documents')}: ${hit.person.familyName},${hit.person.givenName}"
                        @click=${() => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetDocumentAdd', {
                                    detail: {hit: hit},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}>
                        ${i18n.t('buttons.add.documents')}
                    </button>
                    <button
                        class="button"
                        aria-label=" ${focusButtonLabel}: ${hit.person.familyName},${hit.person.givenName}""
                        @click="${(event) => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetFilterPerson', {
                                    detail: {person: hit.person.person},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}">
                        ${focusButtonLabel}
                    </button>
                    <button
                        class="button is-secondary"
                        aria-label=" ${i18n.t('buttons.view')}: ${hit.person.familyName},${hit.person.givenName}"
                        @click=${() => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetDocumentView', {
                                    detail: {hit: hit},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}>
                        ${i18n.t('buttons.view')}
                    </button>
                </footer>
            </div>
        `;
    }
}

/**
 * Generate a PDF document for a person hit.
 * The data meeds to be kept in sync with the view element.
 * @param {import('i18next').i18n} i18n
 * @param {PersonHit} hit
 * @param {boolean} withInternalData - Whether to include internal notes etc. in the PDF export.
 */
async function exportPersonPdf(i18n, hit, withInternalData = false) {
    let jsPDF = (await import('jspdf')).jsPDF;
    let autoTable = (await import('jspdf-autotable')).autoTable;

    const doc = new jsPDF();

    let subFillColor = 220;
    let subTextColor = 30;
    let subLeftMargin = 18;

    const displayValue = (value) => {
        return value === undefined || value === null || value === '' ? '-' : value;
    };

    let formatter = Intl.DateTimeFormat('de', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    let syncDate = formatter.format(new Date(hit.person.syncTimestamp * 1000));
    let exportDate = formatter.format(new Date());

    autoTable(doc, {
        showHead: 'firstPage',
        head: [
            [{content: i18n.t('export.table-title', {personName: hit.person.person}), colSpan: 2}],
        ],
        body: [
            [i18n.t('export.sync-date-label'), syncDate],
            [i18n.t('export.export-date-label'), exportDate],
        ],
    });

    let body = [
        [i18n.t('academic-titles'), displayValue(hit.person.academicTitles.join(', '))],
        [i18n.t('given-name'), displayValue(hit.person.givenName)],
        [i18n.t('family-name'), displayValue(hit.person.familyName)],
        [i18n.t('former-family-name'), displayValue(hit.person.formerFamilyName)],
        [i18n.t('academic-title-following'), displayValue(hit.person.academicTitleFollowing)],
        [i18n.t('stud-id'), displayValue(hit.person.studId)],
        [i18n.t('st-PersonNr'), displayValue(hit.person.stPersonNr)],
        [i18n.t('birth-date'), formatDate(hit.person.birthDate)],
        [
            i18n.t('nationalities'),
            displayValue(hit.person.nationalities.map((n) => n.text).join(', ')),
        ],
        [i18n.t('gender'), displayValue(hit.person.gender?.text)],
        [i18n.t('social-SecurityNr'), displayValue(hit.person.socialSecurityNr)],
        [i18n.t('ssPIN'), displayValue(hit.person.bpk)],
        [i18n.t('personal-Status'), displayValue(hit.person.personalStatus?.text)],
        [i18n.t('student-Status'), displayValue(hit.person.studentStatus?.text)],
        [i18n.t('tuitionStatus'), displayValue(hit.person.tuitionStatus)],
        [i18n.t('immatriculation-Date'), formatDate(hit.person.immatriculationDate)],
        [i18n.t('immatriculationSemester'), displayValue(hit.person.immatriculationSemester)],
        [
            i18n.t('exmatriculation-GI'),
            `${displayValue(hit.person.exmatriculationStatus?.text)} ${formatDate(hit.person.exmatriculationDate)}`,
        ],
        [
            i18n.t('admission-Qualification-Type'),
            displayValue(hit.person.admissionQualificationType?.text),
        ],
        [i18n.t('school-Certificate-Date'), formatDate(hit.person.schoolCertificateDate)],
    ];

    if (withInternalData) {
        body.push([i18n.t('note'), displayValue(hit.person.note)]);
    }

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('General-information'), colSpan: 2}]],
        body: body,
    });

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('Study-information')}]],
    });

    hit.person.studies
        .slice()
        .sort((a, b) => {
            const dateA = a.immatriculationDate
                ? new Date(a.immatriculationDate).getTime()
                : Infinity;
            const dateB = b.immatriculationDate
                ? new Date(b.immatriculationDate).getTime()
                : Infinity;
            return dateB - dateA;
        })
        .forEach((study) => {
            autoTable(doc, {
                showHead: 'firstPage',
                headStyles: {fillColor: subFillColor, textColor: subTextColor},
                margin: {left: subLeftMargin},
                head: [[{content: displayValue(study.name), colSpan: 2}]],
                body: [
                    [i18n.t('semester'), displayValue(study.semester)],
                    [i18n.t('status'), displayValue(study.status?.text)],
                    [i18n.t('immatriculation-date'), formatDate(study.immatriculationDate)],
                    [
                        i18n.t('qualification-study'),
                        `${displayValue(study.qualificationType?.text)} ${formatDate(study.qualificationDate)} ${study.qualificationState?.text}`,
                    ],
                    [
                        i18n.t('exmatriculation'),
                        `${displayValue(study.exmatriculationType?.text)} ${formatDate(study.exmatriculationDate)}`,
                    ],
                    [i18n.t('curriculum-version'), displayValue(study.curriculumVersion)],
                ],
            });
        });

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('Contact-information'), colSpan: 2}]],
        body: [
            [i18n.t('emailAddressUniversity'), displayValue(hit.person.emailAddressUniversity)],
            [i18n.t('emailAddressConfirmed'), displayValue(hit.person.emailAddressConfirmed)],
            [i18n.t('emailAddressTemporary'), displayValue(hit.person.emailAddressTemporary)],
        ],
    });

    autoTable(doc, {
        showHead: 'firstPage',
        headStyles: {fillColor: subFillColor, textColor: subTextColor},
        head: [[{content: i18n.t('homeAddress.heading'), colSpan: 2}]],
        margin: {left: subLeftMargin},
        body: [
            [i18n.t('homeAddress.note'), displayValue(hit.person.homeAddress?.note)],
            [i18n.t('homeAddress.street'), displayValue(hit.person.homeAddress?.street)],
            [i18n.t('homeAddress.place'), displayValue(hit.person.homeAddress?.place)],
            [i18n.t('homeAddress.region'), displayValue(hit.person.homeAddress?.region)],
            [i18n.t('homeAddress.postCode'), displayValue(hit.person.homeAddress?.postCode)],
            [i18n.t('homeAddress.country'), displayValue(hit.person.homeAddress?.country?.text)],
            [
                i18n.t('homeAddress.telephoneNumber'),
                displayValue(hit.person.homeAddress?.telephoneNumber),
            ],
        ],
    });

    autoTable(doc, {
        showHead: 'firstPage',
        headStyles: {fillColor: subFillColor, textColor: subTextColor},
        head: [[{content: i18n.t('studyAddress.heading'), colSpan: 2}]],
        margin: {left: subLeftMargin},
        body: [
            [i18n.t('studyAddress.note'), displayValue(hit.person.studyAddress?.note)],
            [i18n.t('studyAddress.street'), displayValue(hit.person.studyAddress?.street)],
            [i18n.t('studyAddress.place'), displayValue(hit.person.studyAddress?.place)],
            [i18n.t('studyAddress.region'), displayValue(hit.person.studyAddress?.region)],
            [i18n.t('studyAddress.postCode'), displayValue(hit.person.studyAddress?.postCode)],
            [i18n.t('studyAddress.country'), displayValue(hit.person.studyAddress?.country?.text)],
            [
                i18n.t('studyAddress.telephoneNumber'),
                displayValue(hit.person.studyAddress?.telephoneNumber),
            ],
        ],
    });

    const filename = `${encodeURIComponent(hit.person.familyName)}_${encodeURIComponent(hit.person.givenName)}_${encodeURIComponent(hit.person.studId)}.pdf`;
    doc.save(filename);
}

class CabinetViewElement extends BaseViewElement {
    constructor() {
        super();
        this._syncing = false;
    }

    static get properties() {
        return {
            ...super.properties,
            _syncing: {type: Boolean, state: true},
        };
    }

    static get scopedElements() {
        return {
            ...super.scopedElements,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-icon': Icon,
            'dbp-notification': Notification,
        };
    }

    static get styles() {
        return [
            ...super.styles,
            // language=css
            css`
                .modal-Gi-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .modal-Gi-header-svg {
                    margin-right: 0.5rem;
                }

                .modal-Gi-header-svg svg {
                    fill: var(--dbp-content);
                }

                .modal-Gi-header-title h4 {
                    margin: 0;
                }

                .info-container {
                    display: flex;
                    justify-content: flex-start;
                    gap: 20px;
                    width: 100%;
                }

                .info-column {
                    flex: 1;
                }

                .info-list {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .info-row b {
                    text-align: left;
                    font-weight: bold;
                    flex: 0 0 40%;
                    hyphens: auto;
                    word-break: break-word;
                    overflow-wrap: break-word;
                    white-space: normal;
                    text-decoration: none;
                }
                .info-row abbr {
                    text-decoration: none;
                }
                .info-row span {
                    flex: 1;
                    text-align: left;
                    word-wrap: break-word;
                    word-break: break-word;
                    white-space: normal;
                    padding-left: 3em;
                    hyphens: auto;
                }

                .modal-Si-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .modal-Si-header-svg {
                    margin-right: 0.5rem;
                }

                .modal-Si-header-svg svg {
                    fill: var(--dbp-content);
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

                .modal-Ci-header-svg svg {
                    fill: var(--dbp-content);
                }

                .modal-Ci-header-title h3 {
                    margin: 0;
                    font-size: 1.17em;
                    font-weight: bold;
                }

                .study-info {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                }

                .study-key-group {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .study-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .study-row b {
                    flex: 1;
                    text-align: left;
                }

                .study-row span {
                    flex: 2;
                    text-align: start;
                }

                .Address-flex-item {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                }

                .address-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    list-style-type: none;
                    padding: 0;
                }

                .address-info-item {
                    grid-column: 2;
                }

                .address-info li {
                    margin-bottom: 5px;
                }

                .Ci-flex-info {
                    list-style-type: none;
                    padding: 0;
                    margin: 0;
                }

                .Ci-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }

                .Ci-item b {
                    flex: 1;
                    text-align: left;
                }

                .Ci-item span {
                    flex: 2;
                    text-align: start;
                }

                .header-button-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding-bottom: 0.5em;
                    margin-bottom: 1.7em;
                    position: sticky;
                    top: 0;
                    background-color: var(--dbp-background);
                }

                .edit-tu-button {
                    overflow: hidden;
                    background-color: var(--dbp-background);
                    text-decoration: none;
                }

                .links {
                    border-bottom-style: solid;
                    border-color: var(--dbp-content);
                    padding: 0px;
                    transition:
                        background-color 0.15s,
                        color 0.15s;
                    color: var(--dbp-content);
                    cursor: pointer;
                    text-decoration: none;
                    border-bottom: var(--dbp-border);
                }
                @media (max-width: 768px) {
                    .info-container {
                        flex-direction: column;
                    }

                    .info-row {
                        flex-direction: column;
                    }
                    .info-row span {
                        padding-left: 0;
                    }

                    .header-button-container {
                        align-items: flex-start;
                        flex-direction: column;
                    }

                    .study-key-group {
                        flex-direction: column;
                    }

                    .study-row {
                        flex-direction: column;
                    }

                    .Ci-item {
                        flex-direction: column;
                    }

                    .address-info {
                        display: inline;
                    }
                }

                @media (min-width: 769px) and (max-width: 1099px) {
                    .info-container {
                        flex-direction: column;
                    }

                    .Ci-item span {
                        padding-left: 0.5em;
                    }
                }
            `,
        ];
    }

    async _onSync() {
        this._syncing = true;
        try {
            let api = new CabinetApi(this.entryPointUrl, this.auth.token);
            this.data = await api.syncTypesenseDocument(this.data);
            send({
                summary: this._i18n.t('sync.notification.success.title'),
                body: this._i18n.t('sync.notification.success.body'),
                type: 'success',
                targetNotificationId: 'dbp-modal-notification-person',
                replaceId: '-',
                timeout: 3,
            });
        } catch (error) {
            console.error('Error during sync:', error);
            send({
                summary: this._i18n.t('sync.notification.error.title'),
                body: this._i18n.t('sync.notification.error.body', {error: error.message}),
                type: 'danger',
                targetNotificationId: 'dbp-modal-notification-person',
                replaceId: '-',
            });
        } finally {
            this._syncing = false;
        }
    }

    async _onEdit(event) {
        event.preventDefault();

        const url = event.currentTarget.getAttribute('href');
        const win = window.open(url, '_blank');
        await waitForWindowClose(win);
        await this._onSync();
    }

    render() {
        let hit = getPersonHit(this.data);
        const i18n = this._i18n;
        const displayValue = (value) => {
            return value === undefined || value === null || value === '' ? '-' : value;
        };

        return html`
        <dbp-notification
            id="dbp-modal-notification-person"
            inline
            lang="${this.lang}"></dbp-notification>

        <div class="header-button-container">
        <div class="last-sync-info">
        ${i18n.t('sync.status-label')}:&nbsp;${Intl.DateTimeFormat('de', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(new Date(hit.person.syncTimestamp * 1000))}
        </div>
        <div class="sync-tu-button">
            ${
                this._syncing
                    ? html`
                          <dbp-mini-spinner></dbp-mini-spinner>
                      `
                    : html`
                          <a href="#" @click=${this._onSync}>
                              <dbp-icon
                                  title="${i18n.t('sync.button-title')}"
                                  aria-label="${i18n.t('sync.button-title')}"
                                  name="cloud-sync"></dbp-icon>
                          </a>
                      `
            }
        </div>
        <div class="edit-tu-button">
            <a href="${hit.person.coUrl}" @click=${this._onEdit}>
                <dbp-icon  title='${i18n.t('Edit-student-data')}'
                aria-label='${i18n.t('Edit-student-data')}'
                name='link'>
                </dbp-icon>
                ${i18n.t('Edit-student-data')}
            </a>
        </div>
        <div class="export-pdf-button">
            <a href="#" @click="${() => {
                exportPersonPdf(i18n, hit);
                return false;
            }}">
                <dbp-icon title='${i18n.t('export.button-label')}'
                name='download'>
                </dbp-icon>
                ${i18n.t('export.button-label')}
            </a>
        </div>
        </div>
            <div class="modal-Gi-header-container">
                <div class="modal-Gi-header-svg">
                    <svg fill="#000000" width="32px" height="32px" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg">
                        <path d="M225.26514,60.20508l-96-32a4.00487,4.00487,0,0,0-2.53028,0l-96,32c-.05713.019-.10815.04809-.16406.06958-.08545.033-.16821.06811-.251.10644a4.04126,4.04126,0,0,0-.415.22535c-.06714.04174-.13575.08007-.20044.12548a3.99,3.99,0,0,0-.47632.39307c-.02027.01953-.0437.0354-.06348.05542a3.97787,3.97787,0,0,0-.44556.53979c-.04077.0586-.07373.12183-.11132.18262a3.99741,3.99741,0,0,0-.23487.43262c-.03613.07837-.06811.15771-.09912.23852a3.96217,3.96217,0,0,0-.144.46412c-.01929.07714-.04126.15234-.05591.2312A3.98077,3.98077,0,0,0,28,64v80a4,4,0,0,0,8,0V69.55005l43.87524,14.625A59.981,59.981,0,0,0,104.272,175.09814a91.80574,91.80574,0,0,0-53.39062,38.71631,3.99985,3.99985,0,1,0,6.70117,4.36914,84.02266,84.02266,0,0,1,140.83447,0,3.99985,3.99985,0,1,0,6.70117-4.36914A91.80619,91.80619,0,0,0,151.728,175.09814a59.981,59.981,0,0,0,24.39673-90.92309l49.14038-16.38013a4.00037,4.00037,0,0,0,0-7.58984ZM180,120A52,52,0,1,1,87.92993,86.85986l38.80493,12.93506a4.00487,4.00487,0,0,0,2.53028,0l38.80493-12.93506A51.85133,51.85133,0,0,1,180,120ZM168.00659,78.44775l-.01294.0044L128,91.7832,44.64893,64,128,36.2168,211.35107,64Z"/>
                    </svg>
                </div>
                <div class="modal-Gi-header-title">
                    <h4>${i18n.t('General-information')}</h4>
                </div>
            </div>
            <hr/>
            <div class="info-container">
                <div class="info-column">
                    <ul class="info-list">
                        <li class="info-row"><b>${i18n.t('academic-titles')}</b><span> ${displayValue(hit.person.academicTitles.join(', '))}</span></li>
                        <li class="info-row"><b>${i18n.t('given-name')}</b><span> ${displayValue(hit.person.givenName)}</span></li>
                        <li class="info-row"><b>${i18n.t('family-name')}</b><span> ${displayValue(hit.person.familyName)}</span></li>
                        <li class="info-row"><b>${i18n.t('former-family-name')}</b><span> ${displayValue(hit.person.formerFamilyName)}</span></li>
                        <li class="info-row"><b>${i18n.t('academic-title-following')}</b><span> ${displayValue(hit.person.academicTitleFollowing)}</span></li>
                        <li class="info-row"><b>${i18n.t('stud-id')}</b><span> ${displayValue(hit.person.studId)}</span></li>
                        <li class="info-row"><b>${i18n.t('st-PersonNr')}</b><span> ${displayValue(hit.person.stPersonNr)} </span></li>
                        <li class="info-row"><b>${i18n.t('birth-date')}</b><span> ${formatDate(hit.person.birthDate)}</span></li>
                        <li class="info-row"><b>${i18n.t('nationalities')}</b><span> ${displayValue(hit.person.nationalities.map((n) => n.text).join(', '))}</span></li>
                        <li class="info-row"><b>${i18n.t('gender')}</b><span> ${displayValue(hit.person.gender?.text)}</span></li>
                        <li class="info-row"><b>${i18n.t('social-SecurityNr')}</b><span> ${displayValue(hit.person.socialSecurityNr)}</span></li>
                    </ul>
                </div>
                <div class="info-column">
                    <ul class="info-list">
                        <li class="info-row"><b>${i18n.t('ssPIN')}</b><span> ${displayValue(hit.person.bpk)}</span></li>
                        <li class="info-row"><b>${i18n.t('personal-Status')}</b><span> ${displayValue(hit.person.personalStatus?.text)}</span></li>
                        <li class="info-row"><b>${i18n.t('student-Status')}</b><span> ${displayValue(hit.person.studentStatus?.text)}</span></li>
                        <li class="info-row"><b>${i18n.t('tuitionStatus')}</b><span> ${displayValue(hit.person.tuitionStatus)}</span></li>
                        <li class="info-row"><b>${i18n.t('immatriculation-Date')}</b><span> ${formatDate(hit.person.immatriculationDate)}</span></li>
                        <li class="info-row"><b>${i18n.t('immatriculationSemester')}</b><span> ${displayValue(hit.person.immatriculationSemester)}</span></li>
                        <li class="info-row"><b>${i18n.t('exmatriculation-GI')}</b><span> ${displayValue(hit.person.exmatriculationStatus?.text)} ${formatDate(hit.person.exmatriculationDate)}</span></li>
                        <li class="info-row"><b>${i18n.t('admission-Qualification-Type')}</b><span> ${displayValue(hit.person.admissionQualificationType?.text)}</span></li>
                        <li class="info-row"><b>${i18n.t('school-Certificate-Date')}</b><span> ${formatDate(hit.person.schoolCertificateDate)}</span></li>
                        <li class="info-row"><b>${i18n.t('note')}</b><span> ${displayValue(hit.person.note)}</span></li>


                        <!--<li><b>nationality:</b> ${hit.person.nationality?.text}</li>-->
                        <!--<li><b>nationality Secondary:</b> ${hit.person.nationalitySecondary?.text}</li>-->
                        <!--<li><b>fullName:</b> {hit.person.fullName}</li>-->
                        <!--<li><b>person:</b> {hit.person.person}</li>-->
                        <!--<li><b>identNrObfuscated:</b> {hit.person.identNrObfuscated}</li>-->
                        <!--<li><b>telephoneNumber:</b> {hit.person.telephoneNumber}</li>-->
                        <!--<li><b>tuitionExemptionType:</b> {hit.person.tuitionExemptionType}</li>-->
                        <!-- <li><b>studyLimitStartSemester:</b> hit.person.studyLimitStartSemester </li> -->
                        <!--<li><b>studyLimitEndSemester:</b> {hit.person.studyLimitEndSemester}</li>-->
                    </ul>
                </div>
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
                <div class="modal-Si-header-title">
                    <h4>${i18n.t('Study-information')}</h4>
                </div>
            </div>
            <hr/>
                ${hit.person.studies
                    .slice()
                    .sort((a, b) => {
                        const dateA = a.immatriculationDate
                            ? new Date(a.immatriculationDate).getTime()
                            : Infinity;
                        const dateB = b.immatriculationDate
                            ? new Date(b.immatriculationDate).getTime()
                            : Infinity;
                        return dateB - dateA;
                    })
                    .map(
                        (study) => html`
                <li>
                    <ul class="study-info">
                        <div class="study-key-group">
                            <li class="study-row"><b><span> ${displayValue(study.name)}</span></b></li>
                        </div>
                        <li class="study-row"><b>${i18n.t('semester')}</b><span>${displayValue(study.semester)}</span></li>
                        <li class="study-row"><b>${i18n.t('status')}</b><span> ${displayValue(study.status?.text)}</span></li>
                        <li class="study-row"><b>${i18n.t('immatriculation-date')}</b><span> ${formatDate(study.immatriculationDate)}</span></li>
                        <li class="study-row"><b>${i18n.t('qualification-study')}</b><span> ${displayValue(study.qualificationType?.text)} ${formatDate(study.qualificationDate)} ${study.qualificationState?.text}</span></li>
                        <li class="study-row"><b>${i18n.t('exmatriculation')}</b><span> ${displayValue(study.exmatriculationType?.text)} ${formatDate(study.exmatriculationDate)}</span></li>
                        <li class="study-row"><b>${i18n.t('curriculum-version')}</b><span> ${displayValue(study.curriculumVersion)}</span></li>
                        </br>
                        </br>
                        <!--<li><b>coUrl:</b> <a href="${study.coUrl}">${study.coUrl}</a></li>
                        <li><b>id:</b> ${study.id}</li>
                        <li><b>exmatriculationSemester</b> ${study.exmatriculationSemester}</li>
                        <li><b>immatriculationSemester</b> ${study.immatriculationSemester}</li>
                        <li><b>type</b> ${study.type}</li>
                        <li><b>additionalCertificates</b> ${study.additionalCertificates.map((c) => c.text).join(', ')}</li>-->
                    </ul>
                </li>
                `,
                    )}
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
                <div class="modal-Ci-header-title"><h4>${i18n.t('Contact-information')}</h4></div>
            </div>
            <hr/>
            <ul class="Ci-flex-info">
                <li class="Ci-item"><b>${i18n.t('emailAddressUniversity')}</b><span>${displayValue(hit.person.emailAddressUniversity)}</span></li>
                <li class="Ci-item"><b>${i18n.t('emailAddressConfirmed')}</b><span>${displayValue(hit.person.emailAddressConfirmed)}</span></li>
                <li class="Ci-item"><b>${i18n.t('emailAddressTemporary')}</b><span>${displayValue(hit.person.emailAddressTemporary)}</span></li>
            </ul>
                </br/>
                <li class="Address-flex-item"><b>${i18n.t('homeAddress.heading')}</li></b>
                    <ul class="address-info">
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.note)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.street)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.place)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.region)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.postCode)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.country?.text)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.telephoneNumber)}</li>
                    </ul>

                </br>
                <li class="Address-flex-item"><b>${i18n.t('studyAddress.heading')} </li></b>
                    <ul class="address-info">
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.note)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.street)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.place)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.region)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.postCode)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.country?.text)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.telephoneNumber)}</li>
                    </ul>
                </li>

                <!--<li><b>exmatriculationSemester:</b> ${hit.person.exmatriculationSemester}</li>
                <li><b>academicTitlePreceding</b> ${hit.person.academicTitlePreceding}</li>
                <li><b>coUrl</b> <a href="${hit.person.coUrl}">${hit.person.coUrl}</a></li>-->
            </ul>
            <!--<h4>Applications</h4>-->
            <!--<ul>
                ${hit.person.applications.map(
                    (application) => html`
                        <li>
                            <ul>
                                <li>
                                    <b>id</b>
                                    ${application.id}
                                </li>
                                <li>
                                    <b>studyId</b>
                                    ${application.studyId}
                                </li>
                                <li>
                                    <b>studyKey</b>
                                    ${application.studyKey}
                                </li>
                                <li>
                                    <b>studyName</b>
                                    ${application.studyName}
                                </li>
                                <li>
                                    <b>studyType</b>
                                    ${application.studyType}
                                </li>
                                <li>
                                    <b>startSemester</b>
                                    ${application.startSemester}
                                </li>
                                <li>
                                    <b>qualificationCertificateDate</b>
                                    ${application.qualificationCertificateDate}
                                </li>
                                <li>
                                    <b>qualificationIssuingCountry</b>
                                    ${application.qualificationIssuingCountry?.text}
                                </li>
                                <li>
                                    <b>qualificationType</b>
                                    ${application.qualificationType?.text}
                                </li>
                            </ul>
                        </li>
                    `,
                )}
            </ul>-->
        `;
    }
}
