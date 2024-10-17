import {html} from 'lit';

/**
 *
 * @param label
 * @param value - the string to display
 */
export const stringElement = (label, value = "") => {
    return html`
        <fieldset>
            <label>${label}</label>
            ${value}
        </fieldset>
    `;
};

/**
 *
 * @param label
 * @param value - YYYY-MM-DD (iso8601)
 */
export const dateElement = (label, value = "") => {
    return html`
        <fieldset>
            <label>${label}</label>
            ${value}
        </fieldset>
    `;
};

/**
 *
 * @param label
 * @param value
 */
export const dateTimeElement = (label, value = "") => {
    return html`
        <fieldset>
            <label>${label}</label>
            ${value}
        </fieldset>
    `;
};

export const enumElement = (label, value = "", items = {}) => {
    return html`
        <fieldset>
            <label>${label}</label>
            ${items[value]}
    `;
};
