import * as commonUtils from '@dbp-toolkit/common/utils';
import {name as pkgName} from './../package.json';

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
    return new File([u8arr], filename, { type: mime });
};

/**
 * Return highlighted text markup for a given field if exists.
 * @param {object} hit - hits object from Typesense
 * @param {string} fieldName - hit field we want to highlight
 * @returns {DocumentFragment}
 */
export function renderFieldWithHighlight(hit, fieldName) {
    const fieldNameValue = fieldName + '.value';
    const htmlContent = getNestedProperty(hit['_highlightResult'], fieldNameValue) ? getNestedProperty(hit['_highlightResult'], fieldNameValue) : getNestedProperty(hit, fieldName);
    const template = document.createElement('template');
    template.innerHTML = htmlContent;

    return template.content;
}

/**
 * Search trough an object and returns the value of a nested property given by a path string.
 * @param {object} obj - the object to seach in
 * @param {string} path - the path to the property, separated by dots
 * @returns {string|null} - the value of the property or null if not found
 */
export function getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

export function getIconSVGURL(name) {
    return commonUtils.getAssetURL(pkgName, '../../@digital-blueprint/cabinet-app/icon/' + encodeURI(name) + '.svg');
}