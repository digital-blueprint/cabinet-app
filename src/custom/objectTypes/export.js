import {PersonHit} from './schema.js';
import {formatDate} from '../../utils.js';

/**
 * Generate a PDF document for a person hit.
 * The data needs to be kept in sync with the view element.
 * @param {import('i18next').i18n} i18n
 * @param {PersonHit} hit
 * @param {boolean} withInternalData - Whether to include internal notes etc. in the PDF export.
 * @returns {Promise<File>}
 */
export async function generateExportPersonPdf(i18n, hit, withInternalData = false) {
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
            [
                {
                    content: i18n.t('custom:person.export.table-title', {
                        personName: hit.person.person,
                    }),
                    colSpan: 2,
                },
            ],
        ],
        body: [
            [i18n.t('custom:person.export.sync-date-label'), syncDate],
            [i18n.t('custom:person.export.export-date-label'), exportDate],
        ],
    });

    let body = [
        [
            i18n.t('custom:person.academic-titles'),
            displayValue(hit.person.academicTitles.join(', ')),
        ],
        [i18n.t('custom:person.given-name'), displayValue(hit.person.givenName)],
        [i18n.t('custom:person.family-name'), displayValue(hit.person.familyName)],
        [i18n.t('custom:person.former-family-name'), displayValue(hit.person.formerFamilyName)],
        [
            i18n.t('custom:person.academic-title-following'),
            displayValue(hit.person.academicTitleFollowing),
        ],
        [i18n.t('custom:person.stud-id'), displayValue(hit.person.studId)],
        [i18n.t('custom:person.st-PersonNr'), displayValue(hit.person.stPersonNr)],
        [i18n.t('custom:person.birth-date'), formatDate(hit.person.birthDate)],
        [
            i18n.t('custom:person.nationalities'),
            displayValue(hit.person.nationalities.map((n) => n.text).join(', ')),
        ],
        [i18n.t('custom:person.gender'), displayValue(selectTranslation(hit.person.gender))],
        [i18n.t('custom:person.social-SecurityNr'), displayValue(hit.person.socialSecurityNr)],
        [i18n.t('custom:person.ssPIN'), displayValue(hit.person.bpk)],
        [
            i18n.t('custom:person.personal-Status'),
            displayValue(selectTranslation(hit.person.personalStatus)),
        ],
        [
            i18n.t('custom:person.student-Status'),
            displayValue(selectTranslation(hit.person.studentStatus)),
        ],
        [i18n.t('custom:person.tuitionStatus'), displayValue(hit.person.tuitionStatus)],
        [i18n.t('custom:person.immatriculation-date'), formatDate(hit.person.immatriculationDate)],
        [
            i18n.t('custom:person.immatriculationSemester'),
            displayValue(hit.person.immatriculationSemester),
        ],
        [
            i18n.t('custom:person.exmatriculation-GI'),
            `${displayValue(selectTranslation(hit.person.exmatriculationStatus))} ${formatDate(hit.person.exmatriculationDate)}`,
        ],
        [
            i18n.t('custom:person.admission-Qualification-Type'),
            displayValue(selectTranslation(hit.person.admissionQualificationType)),
        ],
        [
            i18n.t('custom:person.school-Certificate-Date'),
            formatDate(hit.person.schoolCertificateDate),
        ],
    ];

    if (withInternalData) {
        body.push([i18n.t('custom:person.note'), displayValue(hit.person.note)]);
    }

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('custom:person.General-information'), colSpan: 2}]],
        body: body,
    });

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('custom:person.Study-information')}]],
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
                    [i18n.t('custom:person.semester'), displayValue(study.semester)],
                    [i18n.t('custom:person.status'), displayValue(selectTranslation(study.status))],
                    [
                        i18n.t('custom:person.immatriculation-date'),
                        formatDate(study.immatriculationDate),
                    ],
                    [
                        i18n.t('custom:person.qualification-study'),
                        `${displayValue(selectTranslation(study.qualificationType))} ${formatDate(study.qualificationDate)} ${selectTranslation(study.qualificationState)}`,
                    ],
                    [
                        i18n.t('custom:person.exmatriculation'),
                        `${displayValue(selectTranslation(study.exmatriculationType))} ${formatDate(study.exmatriculationDate)}`,
                    ],
                    [
                        i18n.t('custom:person.curriculum-version'),
                        displayValue(study.curriculumVersion),
                    ],
                ],
            });
        });

    autoTable(doc, {
        showHead: 'firstPage',
        head: [[{content: i18n.t('custom:person.Contact-information'), colSpan: 2}]],
        body: [
            [
                i18n.t('custom:person.emailAddressUniversity'),
                displayValue(hit.person.emailAddressUniversity),
            ],
            [
                i18n.t('custom:person.emailAddressConfirmed'),
                displayValue(hit.person.emailAddressConfirmed),
            ],
            [
                i18n.t('custom:person.emailAddressTemporary'),
                displayValue(hit.person.emailAddressTemporary),
            ],
        ],
    });

    autoTable(doc, {
        showHead: 'firstPage',
        headStyles: {fillColor: subFillColor, textColor: subTextColor},
        head: [[{content: i18n.t('custom:person.homeAddress.heading'), colSpan: 2}]],
        margin: {left: subLeftMargin},
        body: [
            [i18n.t('custom:person.homeAddress.note'), displayValue(hit.person.homeAddress?.note)],
            [
                i18n.t('custom:person.homeAddress.street'),
                displayValue(hit.person.homeAddress?.street),
            ],
            [
                i18n.t('custom:person.homeAddress.place'),
                displayValue(hit.person.homeAddress?.place),
            ],
            [
                i18n.t('custom:person.homeAddress.region'),
                displayValue(hit.person.homeAddress?.region),
            ],
            [
                i18n.t('custom:person.homeAddress.postCode'),
                displayValue(hit.person.homeAddress?.postCode),
            ],
            [
                i18n.t('custom:person.homeAddress.country'),
                displayValue(selectTranslation(hit.person.homeAddress?.country)),
            ],
            [
                i18n.t('custom:person.homeAddress.telephoneNumber'),
                displayValue(hit.person.homeAddress?.telephoneNumber),
            ],
        ],
    });

    autoTable(doc, {
        showHead: 'firstPage',
        headStyles: {fillColor: subFillColor, textColor: subTextColor},
        head: [[{content: i18n.t('custom:person.studyAddress.heading'), colSpan: 2}]],
        margin: {left: subLeftMargin},
        body: [
            [
                i18n.t('custom:person.studyAddress.note'),
                displayValue(hit.person.studyAddress?.note),
            ],
            [
                i18n.t('custom:person.studyAddress.street'),
                displayValue(hit.person.studyAddress?.street),
            ],
            [
                i18n.t('custom:person.studyAddress.place'),
                displayValue(hit.person.studyAddress?.place),
            ],
            [
                i18n.t('custom:person.studyAddress.region'),
                displayValue(hit.person.studyAddress?.region),
            ],
            [
                i18n.t('custom:person.studyAddress.postCode'),
                displayValue(hit.person.studyAddress?.postCode),
            ],
            [
                i18n.t('custom:person.studyAddress.country'),
                displayValue(selectTranslation(hit.person.studyAddress?.country)),
            ],
            [
                i18n.t('custom:person.studyAddress.telephoneNumber'),
                displayValue(hit.person.studyAddress?.telephoneNumber),
            ],
        ],
    });

    const filename = `${hit.person.familyName}_${hit.person.givenName}_${hit.person.studId}.pdf`;
    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], filename, {type: 'application/pdf'});
}
