/**
 * Returns a function that replaces DOM children elements with a specified replacement element.
 * @param {HTMLElement} replacementElement - The element to replace the target children with.
 */
export const preactRefReplaceChildren = (replacementElement) => {
    return (el) => {
        if (el && !replacementElement.parentNode) {
            el.replaceChildren(replacementElement);
        }
    };
};

export const pascalToKebab = (str) => {
    // Replace capital letters with hyphen followed by the lowercase equivalent
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
};

export const dataURLtoFile = (dataURL, filename) => {
    // Extract the MIME type and base64 data
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);

    // Convert base64 to binary
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    // Create and return the File object
    return new File([u8arr], filename, {type: mime});
};

/**
 * Return highlighted text markup for a given field if exists.
 * @param {object} hit - hits object from Typesense
 * @param {string} fieldName - hit field we want to highlight
 * @returns {DocumentFragment}
 */
export function renderFieldWithHighlight(hit, fieldName) {
    const htmlContent = getNestedProperty(hit['_highlightResult'], fieldName + '.value');
    const realValue = getNestedProperty(hit, fieldName) ?? '';
    if (htmlContent !== null) {
        const template = document.createElement('template');
        template.innerHTML = htmlContent;
        return template.content;
    } else {
        const fragment = document.createDocumentFragment();
        const textNode = document.createTextNode(realValue);
        fragment.appendChild(textNode);
        return fragment;
    }
}

/**
 * Search through an object and returns the value of a nested property given by a path string.
 * @param {object} obj - the object to seach in
 * @param {string} path - the path to the property, separated by dots
 * @returns {string|null} - the value of the property or null if not found
 */
export function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj) ?? null;
}

export function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          });
}

/**
 * Create a comparator function from a Typesense sort_by spec string.
 * For example: "sortKey:asc,sortKey2:asc,sortKey3:desc"
 *
 * The comparator operates directly on plain document objects (dot-path navigation).
 * @param {string} sortSpec - Typesense sort_by string
 * @returns {function(object, object): number} - comparator suitable for Array.prototype.sort
 */
export function createTypesenseSortFunction(sortSpec) {
    const sortFields = sortSpec.split(',').map((part) => {
        const colonIdx = part.lastIndexOf(':');
        const field = part.slice(0, colonIdx);
        const direction = part.slice(colonIdx + 1);
        return {field, ascending: direction.toLowerCase() === 'asc'};
    });

    const getNestedValue = (obj, path) => {
        return path
            .split('.')
            .reduce((current, key) => (current != null ? current[key] : undefined), obj);
    };

    return (a, b) => {
        for (const {field, ascending} of sortFields) {
            const valueA = getNestedValue(a, field);
            const valueB = getNestedValue(b, field);

            if (valueA === valueB) continue;

            let result;
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                result = valueA.localeCompare(valueB);
            } else {
                result = valueA < valueB ? -1 : 1;
            }

            return ascending ? result : -result;
        }
        return 0;
    };
}

export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
