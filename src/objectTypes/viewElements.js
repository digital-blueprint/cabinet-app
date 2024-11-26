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
 * @param date - a date object or an empty string
 */
export const dateElement = (label, date) => {
    const dateString = !date || date === '' ? '-' : date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return html`
        <fieldset>
            <label>${label}</label>
            ${dateString}
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
