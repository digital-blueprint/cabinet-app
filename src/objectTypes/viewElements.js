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
            <div style="white-space: pre-line">${value}</div>
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
 * @param date - a date object or an empty string
 */
export const dateTimeElement = (label, date) => {
    // Format the date using toLocaleString with de-DE locale
    const dateTimeString = !date || date === '' ? '-' : date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false
    });

    return html`
        <fieldset>
            <label>${label}</label>
            ${dateTimeString}
        </fieldset>
    `;
};

export const enumElement = (label, value = "", items = {}) => {
    return html`
        <fieldset>
            <label>${label}</label>
            ${Array.isArray(value)
                ? html`<ul>${value.map(v => html`<li>${items[v] || v}</li>`)}</ul>`
                : items[value] || value}
        </fieldset>
    `;
};
