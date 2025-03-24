import {css} from 'lit';

export const getNationalityItems = () => {
    return {
        ALB: 'Albanian',
        AND: 'Andorran',
        AUT: 'Austrian',
        BLR: 'Belarusian',
        BEL: 'Belgian',
        BIH: 'Bosnian',
        BGR: 'Bulgarian',
        HRV: 'Croatian',
        CYP: 'Cypriot',
        CZE: 'Czech',
        DNK: 'Danish',
        EST: 'Estonian',
        FIN: 'Finnish',
        FRA: 'French',
        DEU: 'German',
        GRC: 'Greek',
        HUN: 'Hungarian',
        ISL: 'Icelandic',
        IRL: 'Irish',
        ITA: 'Italian',
        LVA: 'Latvian',
        LIE: 'Liechtensteiner',
        LTU: 'Lithuanian',
        LUX: 'Luxembourgish',
        MLT: 'Maltese',
        MDA: 'Moldovan',
        MCO: 'Monégasque',
        MNE: 'Montenegrin',
        NLD: 'Dutch',
        MKD: 'North Macedonian',
        NOR: 'Norwegian',
        POL: 'Polish',
        PRT: 'Portuguese',
        ROU: 'Romanian',
        RUS: 'Russian',
        SMR: 'Sammarinese',
        SRB: 'Serbian',
        SVK: 'Slovak',
        SVN: 'Slovenian',
        ESP: 'Spanish',
        SWE: 'Swedish',
        CHE: 'Swiss',
        UKR: 'Ukrainian',
        GBR: 'British',
        VAT: 'Vatican',
    };
};

export const getFieldsetCSS = () => {
    // language=css
    return css`
        fieldset {
            border: none;
            margin: 15px 0;
            padding: 0;
        }

        fieldset label {
            font-weight: bold;
            display: block;
        }

        fieldset input,
        fieldset select,
        fieldset textarea {
            width: 95%;
        }
    `;
};
