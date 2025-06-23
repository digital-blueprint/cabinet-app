// See
// https://en.wikipedia.org/wiki/Machine-readable_passport#Nationality_/_Citizenship_codes
// for details. This is for passports only basically. If other documents use
// different codes, we need to adjust things.

/**
 * Maps ISO 3166-1 alpha-3 country codes to ISO 3166-1 alpha-2 country codes.
 */
const alpha3ToAlpha2 = {
    AFG: 'AF',
    ALA: 'AX',
    ALB: 'AL',
    DZA: 'DZ',
    ASM: 'AS',
    AND: 'AD',
    AGO: 'AO',
    AIA: 'AI',
    ATA: 'AQ',
    ATG: 'AG',
    ARG: 'AR',
    ARM: 'AM',
    ABW: 'AW',
    AUS: 'AU',
    AUT: 'AT',
    AZE: 'AZ',
    BHS: 'BS',
    BHR: 'BH',
    BGD: 'BD',
    BRB: 'BB',
    BLR: 'BY',
    BEL: 'BE',
    BLZ: 'BZ',
    BEN: 'BJ',
    BMU: 'BM',
    BTN: 'BT',
    BOL: 'BO',
    BES: 'BQ',
    BIH: 'BA',
    BWA: 'BW',
    BVT: 'BV',
    BRA: 'BR',
    IOT: 'IO',
    BRN: 'BN',
    BGR: 'BG',
    BFA: 'BF',
    BDI: 'BI',
    KHM: 'KH',
    CMR: 'CM',
    CAN: 'CA',
    CPV: 'CV',
    CYM: 'KY',
    CAF: 'CF',
    TCD: 'TD',
    CHL: 'CL',
    CHN: 'CN',
    CXR: 'CX',
    CCK: 'CC',
    COL: 'CO',
    COM: 'KM',
    COG: 'CG',
    COD: 'CD',
    COK: 'CK',
    CRI: 'CR',
    CIV: 'CI',
    HRV: 'HR',
    CUB: 'CU',
    CUW: 'CW',
    CYP: 'CY',
    CZE: 'CZ',
    DNK: 'DK',
    DJI: 'DJ',
    DMA: 'DM',
    DOM: 'DO',
    ECU: 'EC',
    EGY: 'EG',
    SLV: 'SV',
    GNQ: 'GQ',
    ERI: 'ER',
    EST: 'EE',
    ETH: 'ET',
    FLK: 'FK',
    FRO: 'FO',
    FJI: 'FJ',
    FIN: 'FI',
    FRA: 'FR',
    GUF: 'GF',
    PYF: 'PF',
    ATF: 'TF',
    GAB: 'GA',
    GMB: 'GM',
    GEO: 'GE',
    DEU: 'DE',
    GHA: 'GH',
    GIB: 'GI',
    GRC: 'GR',
    GRL: 'GL',
    GRD: 'GD',
    GLP: 'GP',
    GUM: 'GU',
    GTM: 'GT',
    GGY: 'GG',
    GIN: 'GN',
    GNB: 'GW',
    GUY: 'GY',
    HTI: 'HT',
    HMD: 'HM',
    VAT: 'VA',
    HND: 'HN',
    HKG: 'HK',
    HUN: 'HU',
    ISL: 'IS',
    IND: 'IN',
    IDN: 'ID',
    IRN: 'IR',
    IRQ: 'IQ',
    IRL: 'IE',
    IMN: 'IM',
    ISR: 'IL',
    ITA: 'IT',
    JAM: 'JM',
    JPN: 'JP',
    JEY: 'JE',
    JOR: 'JO',
    KAZ: 'KZ',
    KEN: 'KE',
    KIR: 'KI',
    PRK: 'KP',
    KOR: 'KR',
    XKX: 'XK',
    KWT: 'KW',
    KGZ: 'KG',
    LAO: 'LA',
    LVA: 'LV',
    LBN: 'LB',
    LSO: 'LS',
    LBR: 'LR',
    LBY: 'LY',
    LIE: 'LI',
    LTU: 'LT',
    LUX: 'LU',
    MAC: 'MO',
    MKD: 'MK',
    MDG: 'MG',
    MWI: 'MW',
    MYS: 'MY',
    MDV: 'MV',
    MLI: 'ML',
    MLT: 'MT',
    MHL: 'MH',
    MTQ: 'MQ',
    MRT: 'MR',
    MUS: 'MU',
    MYT: 'YT',
    MEX: 'MX',
    FSM: 'FM',
    MDA: 'MD',
    MCO: 'MC',
    MNG: 'MN',
    MNE: 'ME',
    MSR: 'MS',
    MAR: 'MA',
    MOZ: 'MZ',
    MMR: 'MM',
    NAM: 'NA',
    NRU: 'NR',
    NPL: 'NP',
    NLD: 'NL',
    NCL: 'NC',
    NZL: 'NZ',
    NIC: 'NI',
    NER: 'NE',
    NGA: 'NG',
    NIU: 'NU',
    NFK: 'NF',
    MNP: 'MP',
    NOR: 'NO',
    OMN: 'OM',
    PAK: 'PK',
    PLW: 'PW',
    PSE: 'PS',
    PAN: 'PA',
    PNG: 'PG',
    PRY: 'PY',
    PER: 'PE',
    PHL: 'PH',
    PCN: 'PN',
    POL: 'PL',
    PRT: 'PT',
    PRI: 'PR',
    QAT: 'QA',
    REU: 'RE',
    ROU: 'RO',
    RUS: 'RU',
    RWA: 'RW',
    BLM: 'BL',
    SHN: 'SH',
    KNA: 'KN',
    LCA: 'LC',
    MAF: 'MF',
    SPM: 'PM',
    VCT: 'VC',
    WSM: 'WS',
    SMR: 'SM',
    STP: 'ST',
    SAU: 'SA',
    SEN: 'SN',
    SRB: 'RS',
    SYC: 'SC',
    SLE: 'SL',
    SGP: 'SG',
    SXM: 'SX',
    SVK: 'SK',
    SVN: 'SI',
    SLB: 'SB',
    SOM: 'SO',
    ZAF: 'ZA',
    SGS: 'GS',
    SSD: 'SS',
    ESP: 'ES',
    LKA: 'LK',
    SDN: 'SD',
    SUR: 'SR',
    SJM: 'SJ',
    SWZ: 'SZ',
    SWE: 'SE',
    CHE: 'CH',
    SYR: 'SY',
    TWN: 'TW',
    TJK: 'TJ',
    TZA: 'TZ',
    THA: 'TH',
    TLS: 'TL',
    TGO: 'TG',
    TKL: 'TK',
    TON: 'TO',
    TTO: 'TT',
    TUN: 'TN',
    TUR: 'TR',
    TKM: 'TM',
    TCA: 'TC',
    TUV: 'TV',
    UGA: 'UG',
    UKR: 'UA',
    ARE: 'AE',
    GBR: 'GB',
    USA: 'US',
    UMI: 'UM',
    URY: 'UY',
    UZB: 'UZ',
    VUT: 'VU',
    VEN: 'VE',
    VNM: 'VN',
    VGB: 'VG',
    VIR: 'VI',
    WLF: 'WF',
    ESH: 'EH',
    YEM: 'YE',
    ZMB: 'ZM',
    ZWE: 'ZW',
};

// https://en.wikipedia.org/wiki/Machine-readable_passport#Nationality_/_Citizenship_codes
const specialCodes = {
    // Legacy codes to proper ISO codes
    BAH: 'BHS', // Bahamas
    D: 'DEU', // Germany
    ZIM: 'ZWE', // Zimbabwe
};

const nonIsoCodesDisplayNames = {
    EUE: {
        en: 'European Union',
        de: 'Europäische Union',
    },
    GBD: {
        en: 'British Overseas Territories Citizen',
        de: 'Britischer Bürger der Überseegebiete',
    },
    GBN: {
        en: 'British National (Overseas)',
        de: 'Britischer Staatsangehöriger (Übersee)',
    },
    GBO: {
        en: 'British Overseas Citizen',
        de: 'Britischer Überseebürger',
    },
    GBP: {
        en: 'British Protected Person',
        de: 'Britische Schutzperson',
    },
    GBS: {
        en: 'British Subject',
        de: 'Britischer Untertan',
    },
    RKS: {
        en: 'Kosovo',
        de: 'Kosovo',
    },
    UNA: {
        en: 'UN Specialized Agency',
        de: 'UN-Sonderorganisation',
    },
    UNK: {
        en: 'Kosovo (UNMIK Travel Document)',
        de: 'Kosovo (UNMIK-Reisedokument)',
    },
    UNO: {
        en: 'United Nations Organization',
        de: 'Organisation der Vereinten Nationen',
    },
    XBA: {
        en: 'African Development Bank',
        de: 'Afrikanische Entwicklungsbank',
    },
    XIM: {
        en: 'African Export–Import Bank',
        de: 'Afrikanische Export-Import-Bank',
    },
    XCC: {
        en: 'Caribbean Community',
        de: 'Karibische Gemeinschaft',
    },
    XCO: {
        en: 'Common Market for Eastern and Southern Africa',
        de: 'Gemeinsamer Markt für Ost- und Südafrika',
    },
    XEC: {
        en: 'Economic Community of West African States',
        de: 'Wirtschaftsgemeinschaft Westafrikanischer Staaten',
    },
    XPO: {
        en: 'International Criminal Police Organization (INTERPOL)',
        de: 'Internationale Kriminalpolizeiorganisation (INTERPOL)',
    },
    XOM: {
        en: 'Sovereign Military Order of Malta',
        de: 'Souveräner Malteserorden',
    },
    XXA: {
        en: 'Stateless Person',
        de: 'Staatenlose Person',
    },
    XXB: {
        en: 'Refugee (1951 Convention)',
        de: 'Flüchtling (Konvention von 1951)',
    },
    XXC: {
        en: 'Refugee (Other)',
        de: 'Flüchtling (Sonstige)',
    },
    XXX: {
        en: 'Unspecified Nationality',
        de: 'Unbestimmte Staatsangehörigkeit',
    },
    NSK: {
        en: 'Neue Slowenische Kunst',
        de: 'Neue Slowenische Kunst',
    },
    WSA: {
        en: 'World Service Authority',
        de: 'World Service Authority',
    },
    XCT: {
        en: 'Turkish Republic of Northern Cyprus',
        de: 'Türkische Republik Nordzypern',
    },
};

const unknownCode = {
    en: 'Unknown Nationality Code',
    de: 'Unbekannter Staatsangehörigkeitscode',
};

const legacyCode = {
    en: 'Legacy Nationality Code',
    de: 'Veralteter Staatsangehörigkeitscode',
};

/**
 * Returns the display name for a given citizenship code in the specified language.
 * The code is a three-letter ISO 3166-1 alpha-3 code, or a special code for non-ISO countries.
 * @param {string} code - The citizenship code to look up.
 * @param {string} [lang] - The language code for localization (default is 'en').
 * @returns {string} The localized display name for the citizenship code.
 */
export function getNationalityDisplayName(code, lang = 'en') {
    code = code.toUpperCase();
    let isLegacyCode = false;

    if (nonIsoCodesDisplayNames[code]) {
        return nonIsoCodesDisplayNames[code][lang] || nonIsoCodesDisplayNames[code].en;
    }

    // Map from old to new codes if necessary
    if (specialCodes[code]) {
        code = specialCodes[code];
        isLegacyCode = true;
    }

    // Intl.DisplayNames only takes ISO 3166-1 alpha-2 codes, so we have to convert
    if (alpha3ToAlpha2[code]) {
        code = alpha3ToAlpha2[code];
    } else {
        return unknownCode[lang] || unknownCode.en;
    }

    let legacySuffix = isLegacyCode ? ` (${legacyCode[lang] || legacyCode.en})` : '';
    const displayNames = new Intl.DisplayNames([lang], {type: 'region'});
    return displayNames.of(code) + legacySuffix;
}

/**
 * Retrieves all nationality codes we know about.
 * @returns {string[]} An array containing all nationality codes.
 */
export function getAllNationalityCodes() {
    return Object.keys(alpha3ToAlpha2).concat(
        Object.keys(specialCodes),
        Object.keys(nonIsoCodesDisplayNames),
    );
}
