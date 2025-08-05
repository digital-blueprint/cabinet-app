import * as commonUtils from '@dbp-toolkit/common/utils';
import {name as pkgName} from './../package.json';

/**
 * Returns a function that replaces a DOM element with a specified replacement element.
 * @param {HTMLElement} replacementElement - The element to replace the target element with.
 */
export const preactRefReplaceElement = (replacementElement) => {
    return (el) => {
        if (el && el.parentNode && !replacementElement.parentNode) {
            el.parentNode.replaceChild(replacementElement, el);
        }
    };
};

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
 * Same as renderFieldWithHighlight(), but in case the translated value doesn't match the real
 * value it returns the translated value without highlights.
 * @param {import('i18next').i18n} i18n
 * @param {string} i18nPrefix
 * @param {object} hit
 * @param {string} keyFieldName
 * @param {string} textFieldName
 * @returns {DocumentFragment}
 */
export function renderFieldWithHighlightOrTranslated(
    i18n,
    i18nPrefix,
    hit,
    keyFieldName,
    textFieldName,
) {
    const realKey = getNestedProperty(hit, keyFieldName) ?? '';
    const translated = i18n.t(i18nPrefix + realKey);
    const realValue = getNestedProperty(hit, textFieldName) ?? '';
    if (translated !== realValue) {
        const fragment = document.createDocumentFragment();
        const textNode = document.createTextNode(translated);
        fragment.appendChild(textNode);
        return fragment;
    } else {
        return renderFieldWithHighlight(hit, textFieldName);
    }
}

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

export function getIconSVGURL(name) {
    return commonUtils.getAssetURL(
        pkgName,
        '../../@digital-blueprint/cabinet-app/icon/' + encodeURI(name) + '.svg',
    );
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

export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
