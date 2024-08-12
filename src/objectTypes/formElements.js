import {html} from 'lit';

const sanitizeForHtmlId = (str) => {
    return str
        .replace(/[^a-z0-9]/gi, '-')  // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, '')      // Remove leading and trailing hyphens
        .replace(/^[0-9]/, 'id-$&')   // Prepend 'id-' if the string starts with a number
        .toLowerCase();               // Convert to lowercase
};

export const getAdditionalTypes = () => {
    return {
        'BirthCertificate': 'Birth Certificate',
        'DriversLicence': 'Drivers Licence',
        'Passport': 'Passport',
        'PersonalLicence': 'Personal Licence',
    };
};

/**
 *
 * @param name
 * @param label
 * @param value - the string to display
 * @param isRequired
 * @param rows
 */
export const stringElement = (name, label, value = "", isRequired = false, rows = 1) => {
    const id = sanitizeForHtmlId(name);
    return html`
        <fieldset>
            <legend>${label}</legend>
            ${rows > 1
                ? html`<textarea 
                    id="form-input-${id}" 
                    name="${name}" 
                    rows="${rows}"
                    ?required=${isRequired}
                  >${value}</textarea>`
                : html`<input 
                    type="text" 
                    id="form-input-${id}" 
                    name="${name}" 
                    value="${value}"
                    ?required=${isRequired}
                  >`
            }
            <label for="form-input-${name}">${label}</label>
        </fieldset>
    `;
};

/**
 *
 * @param name
 * @param label
 * @param value - YYYY-MM-DD (iso8601)
 * @param isRequired
 */
export const dateElement = (name, label, value = "", isRequired = false) => {
    const id = sanitizeForHtmlId(name);
    return html`
        <fieldset>
            <legend>${label}</legend>
            <input
                type="date"
                id="form-input-${id}"
                name="${name}"
                value="${value}"
                ?required=${isRequired} />
            <label for="form-input-${name}">${label}</label>
        </fieldset>
    `;
};

export const enumElement = (name, label, value = "", items = {}, isRequired = false) => {
    const id = sanitizeForHtmlId(name);
    return html`
        <fieldset>
            <legend>${label}</legend>
            <select
                id="form-input-${id}"
                name="${name}"
                ?required=${isRequired}>
                ${Object.keys(items).map((key) => html`
                    <option value="${key}" ?selected=${key === value}>${items[key]}</option>
                `)}
            </select>
            <label for="form-input-${name}">${label}</label>
        </fieldset>
    `;
};
