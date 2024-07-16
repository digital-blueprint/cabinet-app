import {html} from 'lit';

const sanitizeForHtmlId = (str) => {
    return str
        .replace(/[^a-z0-9]/gi, '-')  // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, '')      // Remove leading and trailing hyphens
        .replace(/^[0-9]/, 'id-$&')   // Prepend 'id-' if the string starts with a number
        .toLowerCase();               // Convert to lowercase
};

export const stringElement = (name, label, data = "", isRequired = false, rows = 1) => {
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
                  >${data}</textarea>`
                : html`<input 
                    type="text" 
                    id="form-input-${id}" 
                    name="${name}" 
                    value="${data}"
                    ?required=${isRequired}
                  >`
            }
            <label for="form-input-${name}">${label}</label>
        </fieldset>
    `;
};