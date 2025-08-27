function getDefaultSemester() {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    currentYear = currentYear % 100;
    let currentMonth = currentDate.getMonth();
    let currentSeason;
    if (currentMonth >= 2 && currentMonth <= 8) {
        currentSeason = 'S';
    } else {
        currentSeason = 'W';
    }
    return currentYear.toString() + currentSeason;
}

export function getSemesters() {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    currentYear = currentYear % 100;
    let nextYear = currentYear + 1;
    let previousYear = currentYear - 1;
    let currentMonth = currentDate.getMonth();
    let currentSeason;
    if (currentMonth >= 2 && currentMonth <= 8) {
        currentSeason = 'S';
    } else {
        currentSeason = 'W';
    }

    let currentSemester = currentYear.toString() + currentSeason;

    let nextSemester;

    const semesters = {};

    if (currentSeason === 'S') {
        nextSemester = currentYear.toString() + 'W';
        semesters[nextSemester] = nextSemester;
        semesters[currentSemester] = currentSemester;
    } else {
        nextSemester = nextYear.toString() + 'S';
        semesters[nextSemester] = nextSemester;
        semesters[currentSemester] = currentSemester;
        let previousSemester = currentYear.toString() + 'S';
        semesters[previousSemester] = previousSemester;
    }

    for (let year = previousYear; year >= 20; year--) {
        let winterSemester = year + 'W';
        semesters[winterSemester] = winterSemester;
        let summerSemester = year + 'S';
        semesters[summerSemester] = summerSemester;
    }

    return semesters;
}

export const DEFAULT_FILE_COMMON = {
    '@type': 'DocumentFile',
    file: {
        base: {
            additionalType: {
                key: '',
                text: '',
            },
            groupId: null,
            comment: null,
            isPartOf: [],
            studyField: {
                key: '',
                text: '',
            },
            subjectOf: null,
            semester: getDefaultSemester(),
        },
    },
};
