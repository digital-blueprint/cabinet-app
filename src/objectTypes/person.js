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

                .wrapper {
                    border: 1px solid var(--dbp-content);
                    border-top-width: 0;
                }

                .wrapper2 {
                    padding: 10px;
                }

                h2 {
                    color: #222120;
                }

                .ais-Hits-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    align-items: center;
                    padding: 3px 10px;
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
                    top: 3px;
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
                    padding: 0.5em 0;
                }

                .study-entry {
                    display: flex;
                    margin-bottom: 0px;
                }

                .study-icon {
                    margin-right: 6px;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .count {
                    padding-top: 1em;
                }

                .spacing-top {
                    margin-top: 1.5em;
                }

                .border-top {
                    border-top-width: 1px;
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

                .dbp-button-icon {
                    font-size: 1.2em;
                    top: 0.2em;
                    margin-right: 2px;
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

                @media (max-width: 489px) {
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
                    .dbp-button-icon {
                        margin-right: 2px;
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

        const facetName = 'person.person';
        const state = this.searchHelper.state;
        const active = (state.facetsRefinements?.[facetName] || []).concat(
            state.disjunctiveFacetsRefinements?.[facetName] || [],
        );
        let isFocused = active.includes(hit.person.person);

        const maxStudies = 3;
        const displayedStudies = studies.slice(0, maxStudies);
        const extraCount = sortedStudies.length - maxStudies;
        const focusButtonLabel = isFocused
            ? i18n.t('unselect-button-name')
            : i18n.t('focus-button-name');

        const selectTranslation = (keyedText) => {
            if (!keyedText) return keyedText;
            return i18n.language === 'de' ? keyedText.text : keyedText.textEn;
        };

        let spacingTop = this.isFirstOfGroupOnPage && !this.isFirstOnPage;
        let borderTop = spacingTop || this.isFirstOnPage;
        return html`
           <div class="wrapper ${spacingTop ? 'spacing-top' : ''} ${borderTop ? 'border-top' : ''}">
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
                            title="Person hit box symbol"></dbp-icon>
                    </div>
                    <h2 class="person-name">
                        <!-- familyName: ${hit.person.familyName}-->
                        ${renderFieldWithHighlight(hit, 'person.familyName')},
                        <!-- givenName: ${hit.person.givenName} -->
                        ${renderFieldWithHighlight(hit, 'person.givenName')}
                    </h2>
                    <h3 class="person-birthdate">
                        <!-- birthDate: ${hit.person.birthDateDe}-->
                        ${renderFieldWithHighlight(hit, 'person.birthDateDe')}
                    </h3>
                </div>
                <div class="hit-right-wrapper">
                    <h3 class="person-id">
                        <!-- studId: ${hit.person.studId}-->
                        <span>${renderFieldWithHighlight(hit, 'person.studId')}</span>
                        |
                        <span>${renderFieldWithHighlight(hit, 'person.stPersonNr')}</span>
                    </h3>
                </div>
            </header>
               <div class="wrapper2">
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
                                                  title="Study icon"></dbp-icon>
                                              <span>
                                                  ${study.name} (${selectTranslation(study.status)})
                                              </span>
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
                        @click=${() => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetDocumentAdd', {
                                    detail: {hit: hit},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}><dbp-icon class="dbp-button-icon" name="plus" aria-hidden="true"></dbp-icon>
                        ${i18n.t('buttons.add.documents')}
                    </button>
                    <button
                        class="button"
                        @click="${(event) => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetFilterPerson', {
                                    detail: {person: hit.person.person},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}"><dbp-icon class="dbp-button-icon" name="${isFocused ? 'source_icons_eye-off' : 'source_icons_eye-empty'}"" aria-hidden="true"></dbp-icon>
                        ${focusButtonLabel}
                    </button>
                    <button
                        class="button is-secondary"
                        @click=${() => {
                            this.dispatchEvent(
                                new CustomEvent('DbpCabinetDocumentView', {
                                    detail: {hit: hit},
                                    bubbles: true,
                                    composed: true,
                                }),
                            );
                        }}><dbp-icon class="dbp-button-icon" name="keyword-research" aria-hidden="true"></dbp-icon>
                        ${i18n.t('buttons.view')}
                    </button>
                </footer>
            </div>
               </div>
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

    const selectTranslation = (keyedText) => {
        if (!keyedText) return keyedText;
        return i18n.language === 'de' ? keyedText.text : keyedText.textEn;
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
        [i18n.t('gender'), displayValue(selectTranslation(hit.person.gender))],
        [i18n.t('social-SecurityNr'), displayValue(hit.person.socialSecurityNr)],
        [i18n.t('ssPIN'), displayValue(hit.person.bpk)],
        [i18n.t('personal-Status'), displayValue(selectTranslation(hit.person.personalStatus))],
        [i18n.t('student-Status'), displayValue(selectTranslation(hit.person.studentStatus))],
        [i18n.t('tuitionStatus'), displayValue(hit.person.tuitionStatus)],
        [i18n.t('immatriculation-Date'), formatDate(hit.person.immatriculationDate)],
        [i18n.t('immatriculationSemester'), displayValue(hit.person.immatriculationSemester)],
        [
            i18n.t('exmatriculation-GI'),
            `${displayValue(selectTranslation(hit.person.exmatriculationStatus))} ${formatDate(hit.person.exmatriculationDate)}`,
        ],
        [
            i18n.t('admission-Qualification-Type'),
            displayValue(selectTranslation(hit.person.admissionQualificationType)),
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
                    [i18n.t('status'), displayValue(selectTranslation(study.status))],
                    [i18n.t('immatriculation-date'), formatDate(study.immatriculationDate)],
                    [
                        i18n.t('qualification-study'),
                        `${displayValue(selectTranslation(study.qualificationType))} ${formatDate(study.qualificationDate)} ${selectTranslation(study.qualificationState)}`,
                    ],
                    [
                        i18n.t('exmatriculation'),
                        `${displayValue(selectTranslation(study.exmatriculationType))} ${formatDate(study.exmatriculationDate)}`,
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
            [
                i18n.t('homeAddress.country'),
                displayValue(selectTranslation(hit.person.homeAddress?.country)),
            ],
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
            [
                i18n.t('studyAddress.country'),
                displayValue(selectTranslation(hit.person.studyAddress?.country)),
            ],
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
                .modal-Gi-header-container,
                .modal-Si-header-container,
                .modal-Ci-header-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                :is(.modal-Gi-header-svg, .modal-Si-header-svg, .modal-Ci-header-svg) {
                    margin-right: 0.5rem;
                    font-size: 1.4em;
                }

                :is(.modal-Gi-header-title, .modal-Si-header-title, .modal-Ci-header-title) h3 {
                    margin: 0;
                    font-size: 1.17em;
                    font-weight: 600;
                    padding-top: 0.2em;
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

                .info-row div {
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

                .study-row div {
                    flex: 1;
                    text-align: left;
                    font-weight: bold;
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

                .Address-flex-item {
                    font-weight: bold;
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

                .Ci-item div {
                    flex: 1;
                    text-align: left;
                    font-weight: bold;
                }

                .Ci-item span {
                    flex: 2;
                    text-align: start;
                }

                .header-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding-bottom: 0.5em;
                    margin-bottom: 1.7em;
                    position: sticky;
                    z-index: 1;
                    top: 0;
                    background-color: var(--dbp-background);
                }

                .last-sync-info {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .last-sync-title {
                    font-weight: 600;
                }

                .button-container {
                    display: flex;
                    margin-right: 0.5em;
                    gap: 5px;
                    justify-self: end;
                }

                .header-person-button {
                    overflow: hidden;
                    background-color: var(--dbp-secondary-surface);
                    color: var(--dbp-on-secondary-surface);
                    text-decoration: none;
                    border: 1px solid var(--dbp-secondary-surface-border-color);
                    border-radius: var(--dbp-border-radius);
                    cursor: pointer;
                    padding: calc(0.375em - 1px) 0.75em;
                    text-align: center;
                    font-size: inherit;
                    font-family: inherit;
                    transition:
                        0.15s,
                        color 0.15s;
                    font-weight: bolder;
                }

                @media (max-width: 1280px) {
                    .header-container {
                        flex-direction: column;
                        align-items: flex-start;
                        justify-content: center;
                        gap: 10px;
                    }
                }
                @media (min-width: 951px) and (max-width: 1280px) {
                    .info-container {
                        flex-direction: column;
                    }

                    .Ci-item span {
                        padding-left: 0.5em;
                    }

                    .button-container {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        width: 100%;
                    }

                    .button-container .header-person-button {
                        grid-row: 1 / -1;
                    }
                }
                @media (max-width: 950px) {
                    .info-container {
                        flex-direction: column;
                    }

                    .info-row {
                        flex-direction: column;
                    }

                    .info-row span {
                        padding-left: 0;
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

                    .button-container {
                        flex-direction: column;
                    }

                    .button-container .header-person-button {
                        display: grid;
                        grid-template-columns: 1fr minmax(auto, 1180px) 1fr;
                        grid-template-rows: auto;
                        white-space: nowrap;
                    }

                    .button-container .header-person-button a {
                        grid-column: 1 / -1;
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

        const selectTranslation = (keyedText) => {
            if (!keyedText) return keyedText;
            return i18n.language === 'de' ? keyedText.text : keyedText.textEn;
        };

        return html`
        <dbp-notification
            id="dbp-modal-notification-person"
            inline
            lang="${this.lang}"></dbp-notification>

        <div class="header-container">
        <div class="last-sync-info">
        <p class="last-sync-title">${i18n.t('sync.status-label')}:&nbsp;</p><div class="person-sync-date">${Intl.DateTimeFormat(
            'de',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            },
        ).format(new Date(hit.person.syncTimestamp * 1000))}
        </div>
        </div>
        <div class="button-container">   
        <div class="header-person-button">
            ${
                this._syncing
                    ? html`
                          <dbp-mini-spinner></dbp-mini-spinner>
                      `
                    : html`
                          <a href="#" @click=${this._onSync}>
                              <dbp-icon
                                  title="${i18n.t('sync.button-title')}"
                                  aria-hidden="true"
                                  name="reload"></dbp-icon>
                              ${i18n.t('sync.button-title')}
                          </a>
                      `
            }
        </div>
        <div class="header-person-button">
            <a href="${hit.person.coUrl}" @click=${this._onEdit}>
                <dbp-icon  title='${i18n.t('Edit-student-data')}'
                aria-hidden="true"
                name='pencil'>
                </dbp-icon>
                ${i18n.t('Edit-student-data')}
            </a>
        </div>
        <div class="header-person-button">
            <a href="#" @click="${() => {
                exportPersonPdf(i18n, hit);
                return false;
            }}">
                <dbp-icon title='${i18n.t('export.button-label')}'
                name='download' aria-hidden="true">
                </dbp-icon>
                ${i18n.t('export.button-label')}
            </a>
        </div>
        </div>
        </div>
            <div class="modal-Gi-header-container">
                <div class="modal-Gi-header-svg">
                    <dbp-icon name="graduation" aria-hidden="true"></dbp-icon>
                </div>
                <div class="modal-Gi-header-title">
                    <h3>${i18n.t('General-information')}</h3>
                </div>
            </div>
            <hr/>
            <div class="info-container">
                <div class="info-column">
                    <ul class="info-list">
                        <li class="info-row"><div>${i18n.t('academic-titles')}</div><span> ${displayValue(hit.person.academicTitles.join(', '))}</span></li>
                        <li class="info-row"><div>${i18n.t('given-name')}</div><span> ${displayValue(hit.person.givenName)}</span></li>
                        <li class="info-row"><div>${i18n.t('family-name')}</div><span> ${displayValue(hit.person.familyName)}</span></li>
                        <li class="info-row"><div>${i18n.t('former-family-name')}</div><span> ${displayValue(hit.person.formerFamilyName)}</span></li>
                        <li class="info-row"><div>${i18n.t('academic-title-following')}</div><span> ${displayValue(hit.person.academicTitleFollowing)}</span></li>
                        <li class="info-row"><div>${i18n.t('stud-id')}</div><span> ${displayValue(hit.person.studId)}</span></li>
                        <li class="info-row"><div>${i18n.t('st-PersonNr')}</div><span> ${displayValue(hit.person.stPersonNr)} </span></li>
                        <li class="info-row"><div>${i18n.t('birth-date')}</div><span> ${formatDate(hit.person.birthDate)}</span></li>
                        <li class="info-row"><div>${i18n.t('nationalities')}</div><span> ${displayValue(hit.person.nationalities.map((n) => selectTranslation(n)).join(', '))}</span></li>
                        <li class="info-row"><div>${i18n.t('gender')}</div><span> ${displayValue(selectTranslation(hit.person.gender))}</span></li>
                        <li class="info-row"><div>${i18n.t('social-SecurityNr')}</div><span> ${displayValue(hit.person.socialSecurityNr)}</span></li>
                    </ul>
                </div>
                <div class="info-column">
                    <ul class="info-list">
                        <li class="info-row"><div>${i18n.t('ssPIN')}</div><span> ${displayValue(hit.person.bpk)}</span></li>
                        <li class="info-row"><div>${i18n.t('personal-Status')}</div><span> ${displayValue(selectTranslation(hit.person.personalStatus))}</span></li>
                        <li class="info-row"><div>${i18n.t('student-Status')}</div><span> ${displayValue(selectTranslation(hit.person.studentStatus))}</span></li>
                        <li class="info-row"><div>${i18n.t('tuitionStatus')}</div><span> ${displayValue(hit.person.tuitionStatus)}</span></li>
                        <li class="info-row"><div>${i18n.t('immatriculation-Date')}</div><span> ${formatDate(hit.person.immatriculationDate)}</span></li>
                        <li class="info-row"><div>${i18n.t('immatriculationSemester')}</div><span> ${displayValue(hit.person.immatriculationSemester)}</span></li>
                        <li class="info-row"><div>${i18n.t('exmatriculation-GI')}</div><span> ${displayValue(selectTranslation(hit.person.exmatriculationStatus))} ${formatDate(hit.person.exmatriculationDate)}</span></li>
                        <li class="info-row"><div>${i18n.t('admission-Qualification-Type')}</div><span> ${displayValue(selectTranslation(hit.person.admissionQualificationType))}</span></li>
                        <li class="info-row"><div>${i18n.t('school-Certificate-Date')}</div><span> ${formatDate(hit.person.schoolCertificateDate)}</span></li>
                        <li class="info-row"><div>${i18n.t('note')}</div><span> ${displayValue(hit.person.note)}</span></li>


                        <!--<li><b>nationality:</b> ${selectTranslation(hit.person.nationality)}</li>-->
                        <!--<li><b>nationality Secondary:</b> ${selectTranslation(hit.person.nationalitySecondary)}</li>-->
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
                    <dbp-icon name="book" aria-hidden="true"></dbp-icon>
                </div>
                <div class="modal-Si-header-title">
                    <h3>${i18n.t('Study-information')}</h3>
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
                        <li class="study-row"><div>${i18n.t('semester')}</div><span>${displayValue(study.semester)}</span></li>
                        <li class="study-row"><div>${i18n.t('status')}</div><span> ${displayValue(selectTranslation(study.status))}</span></li>
                        <li class="study-row"><div>${i18n.t('immatriculation-date')}</div><span> ${formatDate(study.immatriculationDate)}</span></li>
                        <li class="study-row"><div>${i18n.t('qualification-study')}</div><span> ${displayValue(selectTranslation(study.qualificationType))} ${formatDate(study.qualificationDate)} ${selectTranslation(study.qualificationState)}</span></li>
                        <li class="study-row"><div>${i18n.t('exmatriculation')}</div><span> ${displayValue(selectTranslation(study.exmatriculationType))} ${formatDate(study.exmatriculationDate)}</span></li>
                        <li class="study-row"><div>${i18n.t('curriculum-version')}</div><span> ${displayValue(study.curriculumVersion)}</span></li>
                        </br>
                        </br>
                        <!--<li><b>coUrl:</b> <a href="${study.coUrl}">${study.coUrl}</a></li>
                        <li><b>id:</b> ${study.id}</li>
                        <li><b>exmatriculationSemester</b> ${study.exmatriculationSemester}</li>
                        <li><b>immatriculationSemester</b> ${study.immatriculationSemester}</li>
                        <li><b>type</b> ${study.type}</li>
                        <li><b>additionalCertificates</b> ${study.additionalCertificates.map((c) => selectTranslation(c)).join(', ')}</li>-->
                    </ul>
                </li>
                `,
                    )}
            </br>
            <div class="modal-Ci-header-container">
                <div class="modal-Ci-header-svg">
                    <dbp-icon name="phone" aria-hidden="true"></dbp-icon>
                </div>
                <div class="modal-Ci-header-title"><h3>${i18n.t('Contact-information')}</h3></div>
            </div>
            <hr/>
            <ul class="Ci-flex-info">
                <li class="Ci-item"><div>${i18n.t('emailAddressUniversity')}</div><span>${displayValue(hit.person.emailAddressUniversity)}</span></li>
                <li class="Ci-item"><div>${i18n.t('emailAddressConfirmed')}</div><span>${displayValue(hit.person.emailAddressConfirmed)}</span></li>
                <li class="Ci-item"><div>${i18n.t('emailAddressTemporary')}</div><span>${displayValue(hit.person.emailAddressTemporary)}</span></li>
            </ul>
                </br/>
                <li class="Address-flex-item"><div>${i18n.t('homeAddress.heading')}</li></div>
                    <ul class="address-info">
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.note)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.street)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.place)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.region)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.postCode)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(selectTranslation(hit.person.homeAddress?.country))}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.homeAddress?.telephoneNumber)}</li>
                    </ul>

                </br>
                <li class="Address-flex-item"><div>${i18n.t('studyAddress.heading')} </li></div>
                    <ul class="address-info">
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.note)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.street)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.place)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.region)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(hit.person.studyAddress?.postCode)}</li>
                        <li class="address-info-item"><b></b> ${displayValue(selectTranslation(hit.person.studyAddress?.country))}</li>
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
                                    ${selectTranslation(application.qualificationIssuingCountry)}
                                </li>
                                <li>
                                    <b>qualificationType</b>
                                    ${selectTranslation(application.qualificationType)}
                                </li>
                            </ul>
                        </li>
                    `,
                )}
            </ul>-->
        `;
    }
}
