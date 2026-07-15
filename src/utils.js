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

export function formatDate(value, defaultText = '-') {
    if (!value) return defaultText;
    const date = new Date(value);
    return isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          });
}

// TODO: Do we need a prefix?
export const BLOB_PREFIX = 'document-';
