import {css} from 'lit';

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
