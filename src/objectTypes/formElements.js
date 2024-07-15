import {html} from 'lit';

export const stringElement = (name, data = "", isRequired = false) => {
    return html`
        <fieldset>
            <legend>${name}</legend>
            <input type="text" id="about" name="${name}" value="${data}" required>
            <label for="about">${name}</label>
        </fieldset>
    `;
};